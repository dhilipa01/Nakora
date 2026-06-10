package redirect

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

// Tests use a local httptest server — no external network.

func TestEmptyURLScoresZero(t *testing.T) {
	sig, err := New().Analyze(context.Background(), analyzer.Request{Domain: "example.com"})
	if err != nil {
		t.Fatalf("Analyze returned error: %v", err)
	}
	if sig.Score != 0 {
		t.Errorf("empty URL scored %.2f, want 0", sig.Score)
	}
}

func TestNoRedirectScoresZero(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	sig, err := New().Analyze(context.Background(),
		analyzer.Request{Domain: "127.0.0.1", URL: srv.URL})
	if err != nil {
		t.Fatalf("Analyze returned error: %v", err)
	}
	if sig.Score != 0 {
		t.Errorf("direct 200 scored %.2f, want 0 (details=%s)", sig.Score, sig.Details)
	}
}

func TestDeepRedirectChainScores(t *testing.T) {
	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// /0 → /1 → /2 → /3 → 200
		var n int
		fmt.Sscanf(r.URL.Path, "/%d", &n)
		if n < 3 {
			http.Redirect(w, r, fmt.Sprintf("%s/%d", srv.URL, n+1), http.StatusFound)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	sig, err := New().Analyze(context.Background(),
		analyzer.Request{Domain: "127.0.0.1", URL: srv.URL + "/0"})
	if err != nil {
		t.Fatalf("Analyze returned error: %v", err)
	}
	if sig.Score < 0.35 {
		t.Errorf("3-hop chain scored %.2f, want >= 0.35 (details=%s)", sig.Score, sig.Details)
	}
}

func TestRedirectLoopIsBounded(t *testing.T) {
	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, srv.URL+r.URL.Path, http.StatusFound) // infinite loop
	}))
	defer srv.Close()

	chain, err := New().followChain(context.Background(), srv.URL+"/loop")
	if err != nil {
		t.Fatalf("followChain returned error: %v", err)
	}
	if len(chain) > maxHops+1 {
		t.Errorf("chain length %d exceeds maxHops bound %d", len(chain), maxHops+1)
	}
}

func TestRelativeRedirectResolved(t *testing.T) {
	var srv *httptest.Server
	srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/start" {
			w.Header().Set("Location", "/end") // relative
			w.WriteHeader(http.StatusFound)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	chain, err := New().followChain(context.Background(), srv.URL+"/start")
	if err != nil {
		t.Fatalf("followChain returned error: %v", err)
	}
	if len(chain) != 2 || !strings.HasSuffix(chain[1], "/end") {
		t.Errorf("relative redirect not resolved, chain=%v", chain)
	}
}

func TestUnreachableHostDegradesGracefully(t *testing.T) {
	sig, err := New().Analyze(context.Background(),
		analyzer.Request{Domain: "invalid.localdomain", URL: "http://127.0.0.1:1/x"})
	if err != nil {
		t.Fatalf("Analyze returned error: %v", err)
	}
	if sig.Score < 0 || sig.Score > 1 {
		t.Errorf("score %.2f out of [0,1]", sig.Score)
	}
}

func TestTld(t *testing.T) {
	cases := map[string]string{
		"example.com":     "com",
		"a.b.example.org": "org",
		"localhost":       "localhost",
	}
	for in, want := range cases {
		if got := tld(in); got != want {
			t.Errorf("tld(%q) = %q, want %q", in, got, want)
		}
	}
}

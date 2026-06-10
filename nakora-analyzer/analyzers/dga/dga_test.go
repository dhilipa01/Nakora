package dga

import (
	"context"
	"math"
	"testing"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

func score(t *testing.T, domain string) float64 {
	t.Helper()
	sig, err := New().Analyze(context.Background(), analyzer.Request{Domain: domain})
	if err != nil {
		t.Fatalf("Analyze(%q) returned error: %v", domain, err)
	}
	return sig.Score
}

func TestKnownDgaDomainsScoreHigh(t *testing.T) {
	// Real Conficker/Cryptolocker-style generated labels
	dgaDomains := []string{
		"xjkdpqmzvbtrwn.com",
		"qhxnrvwjpkdmtzb.net",
		"gfkjsdhbvncmxlqw.org",
	}
	for _, d := range dgaDomains {
		if s := score(t, d); s < 0.70 {
			t.Errorf("DGA domain %q scored %.2f, want >= 0.70", d, s)
		}
	}
}

func TestBenignDomainsScoreLow(t *testing.T) {
	benign := []string{
		"google.com",
		"github.com",
		"wikipedia.org",
		"amazon.in",
	}
	for _, d := range benign {
		if s := score(t, d); s > 0.30 {
			t.Errorf("benign domain %q scored %.2f, want <= 0.30", d, s)
		}
	}
}

func TestEdgeCaseInputsDoNotPanic(t *testing.T) {
	edge := []string{
		"",
		".",
		"...",
		"com",
		"xn--nxasmq6b.xn--o3cw4h", // IDN punycode
		"a.b",
		"trailing.dot.example.com.",
	}
	for _, d := range edge {
		sig, err := New().Analyze(context.Background(), analyzer.Request{Domain: d})
		if err != nil {
			t.Errorf("Analyze(%q) returned error: %v", d, err)
		}
		if sig.Score < 0 || sig.Score > 1 {
			t.Errorf("Analyze(%q) score %.2f out of [0,1]", d, sig.Score)
		}
	}
}

func TestShannonEntropy(t *testing.T) {
	if e := shannonEntropy(""); e != 0 {
		t.Errorf("entropy of empty string = %.2f, want 0", e)
	}
	if e := shannonEntropy("aaaa"); e != 0 {
		t.Errorf("entropy of uniform string = %.2f, want 0", e)
	}
	// "abcd" — 4 distinct chars, uniform → exactly 2 bits
	if e := shannonEntropy("abcd"); math.Abs(e-2.0) > 1e-9 {
		t.Errorf("entropy of abcd = %.4f, want 2.0", e)
	}
}

func TestConsonantRatio(t *testing.T) {
	if r := consonantRatio(""); r != 0 {
		t.Errorf("consonantRatio of empty = %.2f, want 0", r)
	}
	if r := consonantRatio("bcdfg"); r != 1.0 {
		t.Errorf("consonantRatio of all-consonant = %.2f, want 1.0", r)
	}
	if r := consonantRatio("aeiou"); r != 0 {
		t.Errorf("consonantRatio of all-vowel = %.2f, want 0", r)
	}
}

func TestRegisteredLabel(t *testing.T) {
	cases := map[string]string{
		"www.example.com":  "example",
		"example.com":      "example",
		"example.com.":     "example",
		"localhost":        "localhost",
		"a.b.c.d.evil.com": "evil",
	}
	for in, want := range cases {
		if got := registeredLabel(in); got != want {
			t.Errorf("registeredLabel(%q) = %q, want %q", in, got, want)
		}
	}
}

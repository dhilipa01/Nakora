package redirect

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

const (
	maxHops        = 8
	requestTimeout = 5 * time.Second
)

// shortURLHosts are known URL-shortening services.
var shortURLHosts = map[string]bool{
	"bit.ly": true, "t.co": true, "tinyurl.com": true, "goo.gl": true,
	"ow.ly": true, "buff.ly": true, "rebrand.ly": true, "short.io": true,
	"bl.ink": true, "cutt.ly": true, "tiny.cc": true, "is.gd": true,
}

type Analyzer struct {
	client *http.Client
}

func New() *Analyzer {
	// Non-following client — we manually follow to count hops.
	client := &http.Client{
		Timeout: requestTimeout,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	return &Analyzer{client: client}
}

func (a *Analyzer) Name() string { return "redirect_chain" }

func (a *Analyzer) Analyze(ctx context.Context, req analyzer.Request) (analyzer.Signal, error) {
	if req.URL == "" {
		return analyzer.Signal{Name: a.Name(), Score: 0, Confidence: 0.5}, nil
	}

	chain, err := a.followChain(ctx, req.URL)
	if err != nil {
		return analyzer.Signal{Name: a.Name(), Score: 0.3, Confidence: 0.4,
			Details: "chain follow error: " + err.Error()}, nil
	}

	hops := len(chain) - 1
	usesShortener := false
	crossesTLD := false
	finalDomain := ""

	if len(chain) > 0 {
		if u, err := url.Parse(chain[len(chain)-1]); err == nil {
			finalDomain = u.Hostname()
		}
	}
	initialDomain := req.Domain

	for _, hop := range chain {
		if u, err := url.Parse(hop); err == nil {
			host := u.Hostname()
			if shortURLHosts[host] {
				usesShortener = true
			}
			// TLD change mid-chain is suspicious
			if finalDomain != "" && host != "" && tld(host) != tld(initialDomain) {
				crossesTLD = true
			}
		}
	}

	score := 0.0
	details := fmt.Sprintf("hops=%d", hops)

	switch {
	case hops >= 5 && usesShortener:
		score = 0.85
		details += " | deep chain through shortener"
	case hops >= 4 && crossesTLD:
		score = 0.80
		details += " | TLD change in redirect chain"
	case hops >= maxHops:
		score = 0.75
		details += " | max hop limit reached"
	case usesShortener:
		score = 0.45
		details += " | URL shortener detected"
	case hops >= 3:
		score = 0.35
		details += " | multiple redirects"
	}

	return analyzer.Signal{
		Name:       a.Name(),
		Score:      score,
		Confidence: 0.75,
		Details:    details,
	}, nil
}

func (a *Analyzer) followChain(ctx context.Context, rawURL string) ([]string, error) {
	chain := []string{rawURL}
	current := rawURL

	for i := 0; i < maxHops; i++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodHead, current, nil)
		if err != nil {
			break
		}
		req.Header.Set("User-Agent", "nakora-analyzer/1.0")

		resp, err := a.client.Do(req)
		if err != nil {
			break
		}
		resp.Body.Close()

		if resp.StatusCode < 300 || resp.StatusCode >= 400 {
			break
		}

		location := resp.Header.Get("Location")
		if location == "" {
			break
		}

		// Resolve relative redirects
		if !strings.HasPrefix(location, "http") {
			base, err := url.Parse(current)
			if err != nil {
				break
			}
			loc, err := url.Parse(location)
			if err != nil {
				break
			}
			location = base.ResolveReference(loc).String()
		}

		chain = append(chain, location)
		current = location
	}

	return chain, nil
}

func tld(host string) string {
	parts := strings.Split(host, ".")
	if len(parts) >= 2 {
		return parts[len(parts)-1]
	}
	return host
}

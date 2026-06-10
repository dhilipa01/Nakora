package homoglyph

import (
	"context"
	"strings"
	"testing"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

func run(t *testing.T, domain string) analyzer.Signal {
	t.Helper()
	sig, err := New().Analyze(context.Background(), analyzer.Request{Domain: domain})
	if err != nil {
		t.Fatalf("Analyze(%q) returned error: %v", domain, err)
	}
	return sig
}

func TestCyrillicHomoglyphTargetingBrand(t *testing.T) {
	// "раураl.com" — Cyrillic а/р/у mapped to Latin → "paypal"
	sig := run(t, "раураl.com")
	if sig.Score < 0.85 {
		t.Errorf("cyrillic paypal homoglyph scored %.2f, want >= 0.85", sig.Score)
	}
	if !strings.Contains(sig.Details, "paypal") {
		t.Errorf("details %q should name the targeted brand", sig.Details)
	}
}

func TestPunycodeDomain(t *testing.T) {
	sig := run(t, "xn--pypal-4ve.com")
	if sig.Score < 0.50 {
		t.Errorf("punycode domain scored %.2f, want >= 0.50", sig.Score)
	}
}

func TestAsciiBrandImpersonation(t *testing.T) {
	sig := run(t, "paypal-secure-login.com")
	if sig.Score < 0.50 {
		t.Errorf("ASCII brand impersonation scored %.2f, want >= 0.50", sig.Score)
	}
}

func TestLegitimateBrandDomainNotFlagged(t *testing.T) {
	// Exact brand domain is excluded by the asciiVersion != brand+".com" guard
	sig := run(t, "paypal.com")
	if sig.Score != 0 {
		t.Errorf("paypal.com scored %.2f, want 0", sig.Score)
	}
}

func TestBenignAsciiDomain(t *testing.T) {
	sig := run(t, "example.org")
	if sig.Score != 0 {
		t.Errorf("example.org scored %.2f, want 0", sig.Score)
	}
}

func TestEdgeCaseInputsDoNotPanic(t *testing.T) {
	edge := []string{
		"",
		".",
		"xn--",
		strings.Repeat("a", 1000) + ".com",
		"�.com",            // replacement char
		"‮moc.lapyap",      // RTL override
		"мой-сайт.рф",           // full Cyrillic domain, no brand
	}
	for _, d := range edge {
		sig := run(t, d)
		if sig.Score < 0 || sig.Score > 1 {
			t.Errorf("Analyze(%q) score %.2f out of [0,1]", d, sig.Score)
		}
	}
}

func TestConfidenceBands(t *testing.T) {
	cases := map[float64]float64{0.95: 0.90, 0.60: 0.75, 0.10: 0.50}
	for score, want := range cases {
		if got := confidenceFor(score); got != want {
			t.Errorf("confidenceFor(%.2f) = %.2f, want %.2f", score, got, want)
		}
	}
}

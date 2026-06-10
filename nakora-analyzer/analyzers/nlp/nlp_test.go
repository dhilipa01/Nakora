package nlp

import (
	"context"
	"strings"
	"testing"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

func run(t *testing.T, domain, url string) analyzer.Signal {
	t.Helper()
	sig, err := New().Analyze(context.Background(), analyzer.Request{Domain: domain, URL: url})
	if err != nil {
		t.Fatalf("Analyze(%q, %q) returned error: %v", domain, url, err)
	}
	return sig
}

func TestSuspiciousKeywordScores(t *testing.T) {
	sig := run(t, "secure-paypal-login.com", "")
	if sig.Score == 0 {
		t.Error("keyword-laden domain scored 0, want > 0")
	}
	if !strings.Contains(sig.Details, "keyword") {
		t.Errorf("details %q should mention keyword flag", sig.Details)
	}
}

func TestBenignDomainScoresZero(t *testing.T) {
	if sig := run(t, "example.org", "https://example.org/about"); sig.Score != 0 {
		t.Errorf("example.org scored %.2f, want 0", sig.Score)
	}
}

func TestMixedScriptDetected(t *testing.T) {
	// Latin "paypal" with Cyrillic а
	sig := run(t, "pаypal.com", "")
	if !strings.Contains(sig.Details, "mixed Unicode scripts") {
		t.Errorf("mixed-script domain not flagged, details=%q", sig.Details)
	}
}

func TestScoreDampenedToAuxiliaryWeight(t *testing.T) {
	// Stack every signal: keyword + hyphens + depth + encoding + mixed script + long URL.
	// Raw sum caps at 1.0, then ×0.6 — auxiliary ceiling. Spec: nlp is low-weight (§10).
	longURL := "https://x.com/%2F%40" + strings.Repeat("a", 160)
	sig := run(t, "secure-vеrify-account-update.x.y.z.example.com", longURL)
	if sig.Score > 0.6 {
		t.Errorf("nlp score %.2f exceeds auxiliary ceiling 0.6", sig.Score)
	}
	if sig.Score == 0 {
		t.Error("fully-stacked signals scored 0")
	}
}

func TestConfidenceIsDeliberatelyLow(t *testing.T) {
	if sig := run(t, "example.org", ""); sig.Confidence != 0.55 {
		t.Errorf("confidence %.2f, want 0.55 (spec: auxiliary signal)", sig.Confidence)
	}
}

func TestEdgeCaseInputsDoNotPanic(t *testing.T) {
	for _, d := range []string{"", ".", "---", strings.Repeat("a.", 50) + "com"} {
		sig := run(t, d, "")
		if sig.Score < 0 || sig.Score > 1 {
			t.Errorf("Analyze(%q) score %.2f out of [0,1]", d, sig.Score)
		}
	}
}

func TestHasMixedScripts(t *testing.T) {
	cases := map[string]bool{
		"paypal.com":  false,
		"пример.рф":   false, // pure Cyrillic — not mixed
		"pаypal.com":  true,  // Latin + Cyrillic а
		"":            false,
		"12345.com":   false,
	}
	for in, want := range cases {
		if got := hasMixedScripts(in); got != want {
			t.Errorf("hasMixedScripts(%q) = %v, want %v", in, got, want)
		}
	}
}

package nlp

import (
	"context"
	"fmt"
	"strings"
	"unicode"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

// suspiciousPatterns are regex-like string patterns common in phishing domains.
var suspiciousPatterns = []string{
	"secure-", "-secure", "login-", "-login", "verify-", "-verify",
	"account-", "-account", "update-", "-update", "confirm-", "-confirm",
	"banking", "payement", "passwd", "password", "signin", "sign-in",
	"webscr", "cmd=", "dispatch=", "support-", "-support",
}

// legitimateWordlist — very small set. Phase 2: replace with proper NLP model.
var legitimateWordlist = map[string]bool{
	"com": true, "net": true, "org": true, "io": true, "co": true,
	"app": true, "api": true, "www": true, "mail": true, "shop": true,
	"blog": true, "news": true, "help": true, "docs": true, "dev": true,
}

type Analyzer struct{}

func New() *Analyzer { return &Analyzer{} }

func (a *Analyzer) Name() string { return "nlp_irregularity" }

func (a *Analyzer) Analyze(_ context.Context, req analyzer.Request) (analyzer.Signal, error) {
	domain := strings.ToLower(req.Domain)
	url := strings.ToLower(req.URL)

	score := 0.0
	var flags []string

	// Check suspicious keyword patterns in domain
	for _, p := range suspiciousPatterns {
		if strings.Contains(domain, p) {
			score += 0.20
			flags = append(flags, "keyword: "+p)
			break // one match sufficient
		}
	}

	// Excessive hyphens — phishing domains often use them to mimic subdomains
	hyphens := strings.Count(domain, "-")
	if hyphens >= 3 {
		score += 0.15
		flags = append(flags, fmt.Sprintf("hyphens=%d", hyphens))
	}

	// Excessive subdomains (depth > 3)
	labels := strings.Split(domain, ".")
	if len(labels) > 4 {
		score += 0.20
		flags = append(flags, fmt.Sprintf("subdomain_depth=%d", len(labels)-1))
	}

	// URL path contains encoded characters — common in phishing redirect chains
	if strings.Contains(url, "%2F") || strings.Contains(url, "%40") ||
		strings.Contains(url, "%3A") || strings.Contains(url, "%2E") {
		score += 0.15
		flags = append(flags, "excessive URL encoding")
	}

	// Mixed script detection (Latin + Cyrillic chars in same label)
	if hasMixedScripts(domain) {
		score += 0.30
		flags = append(flags, "mixed Unicode scripts")
	}

	// Long path with no recognizable structure
	if len(url) > 150 {
		score += 0.10
		flags = append(flags, fmt.Sprintf("url_length=%d", len(url)))
	}

	if score > 1.0 {
		score = 1.0
	}

	// Low weight — auxiliary signal only (high FP risk per CLAUDE.md §10)
	score *= 0.6

	details := strings.Join(flags, " | ")

	return analyzer.Signal{
		Name:       a.Name(),
		Score:      score,
		Confidence: 0.55, // deliberately low — auxiliary signal
		Details:    details,
	}, nil
}

func hasMixedScripts(s string) bool {
	hasLatin := false
	hasCyrillic := false
	for _, r := range s {
		switch {
		case unicode.Is(unicode.Latin, r):
			hasLatin = true
		case unicode.Is(unicode.Cyrillic, r):
			hasCyrillic = true
		}
		if hasLatin && hasCyrillic {
			return true
		}
	}
	return false
}

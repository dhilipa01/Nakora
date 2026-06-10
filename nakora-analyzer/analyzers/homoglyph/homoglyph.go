package homoglyph

import (
	"context"
	"strings"
	"unicode"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
	"golang.org/x/text/unicode/norm"
)

// confusable maps visually similar Unicode chars to their ASCII equivalents.
var confusable = map[rune]rune{
	// Cyrillic
	'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x',
	'у': 'y', 'і': 'i', 'ѕ': 's', 'ј': 'j', 'ԁ': 'd', 'ԛ': 'q', 'һ': 'h',
	// Greek
	'ο': 'o', 'ρ': 'p', 'ν': 'v', 'μ': 'u', 'α': 'a', 'β': 'b',
	'ι': 'i', 'κ': 'k', 'τ': 't',
	// Latin extended
	'ı': 'i', 'ĺ': 'l', 'ļ': 'l', 'ľ': 'l',
}

// highValueBrands targeted frequently by homoglyph phishing.
var highValueBrands = []string{
	"paypal", "amazon", "google", "apple", "microsoft", "netflix",
	"facebook", "instagram", "twitter", "linkedin", "bankofamerica",
	"wellsfargo", "chase", "hsbc", "barclays", "steam", "discord",
}

type Analyzer struct{}

func New() *Analyzer { return &Analyzer{} }

func (a *Analyzer) Name() string { return "homoglyph" }

func (a *Analyzer) Analyze(_ context.Context, req analyzer.Request) (analyzer.Signal, error) {
	domain := strings.ToLower(req.Domain)

	// Normalize to NFC, then check for non-ASCII in label
	normalized := norm.NFC.String(domain)
	hasNonASCII := false
	for _, r := range normalized {
		if r > unicode.MaxASCII {
			hasNonASCII = true
			break
		}
	}

	// Convert confusables to ASCII equivalent
	var mapped strings.Builder
	for _, r := range normalized {
		if ascii, ok := confusable[r]; ok {
			mapped.WriteRune(ascii)
			hasNonASCII = true
		} else {
			mapped.WriteRune(r)
		}
	}
	asciiVersion := mapped.String()

	// Punycode xn-- prefix is a hard signal
	isPunycode := strings.Contains(domain, "xn--")

	// Check if mapped domain targets a known brand.
	// Exclusion compares the ORIGINAL domain: a homoglyph spoof that maps to
	// exactly "brand.com" is the strongest signal, not a legitimate domain.
	brandMatch := ""
	for _, brand := range highValueBrands {
		if strings.Contains(asciiVersion, brand) && normalized != brand+".com" {
			brandMatch = brand
			break
		}
	}

	score := 0.0
	details := ""

	switch {
	case isPunycode && brandMatch != "":
		score = 0.95
		details = "punycode domain targeting brand: " + brandMatch
	case isPunycode:
		score = 0.55
		details = "punycode/IDN domain"
	case hasNonASCII && brandMatch != "":
		score = 0.90
		details = "unicode homoglyph targeting brand: " + brandMatch
	case hasNonASCII:
		score = 0.45
		details = "non-ASCII characters in domain"
	case brandMatch != "":
		// ASCII brand impersonation (e.g. paypa1.com)
		score = 0.60
		details = "possible brand impersonation: " + brandMatch
	}

	return analyzer.Signal{
		Name:       a.Name(),
		Score:      score,
		Confidence: confidenceFor(score),
		Details:    details,
	}, nil
}

func confidenceFor(score float64) float64 {
	if score >= 0.85 {
		return 0.90
	}
	if score >= 0.50 {
		return 0.75
	}
	return 0.50
}

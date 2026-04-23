package dga

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

type Analyzer struct{}

func New() *Analyzer { return &Analyzer{} }

func (a *Analyzer) Name() string { return "dga_entropy" }

func (a *Analyzer) Analyze(_ context.Context, req analyzer.Request) (analyzer.Signal, error) {
	label := registeredLabel(req.Domain)

	entropy := shannonEntropy(label)
	consRatio := consonantRatio(label)
	length := len(label)

	entropyHigh := entropy > 3.5
	consonantHigh := consRatio > 0.72
	lengthSuspicious := length > 12

	flags := 0
	if entropyHigh {
		flags++
	}
	if consonantHigh {
		flags++
	}
	if lengthSuspicious {
		flags++
	}

	score := 0.0
	details := ""

	switch flags {
	case 3:
		score = 0.88
		details = "high entropy + consonant ratio + length — likely DGA"
	case 2:
		if entropyHigh && consonantHigh {
			score = 0.72
			details = "high entropy + consonant ratio"
		} else {
			score = 0.55
			details = "two DGA indicators"
		}
	case 1:
		score = 0.25
		details = "one DGA indicator"
	}

	if score > 0 {
		details += fmt.Sprintf(" | entropy=%.2f consonants=%.2f len=%d", entropy, consRatio, length)
	}

	return analyzer.Signal{
		Name:       a.Name(),
		Score:      score,
		Confidence: 0.80,
		Details:    details,
	}, nil
}

func shannonEntropy(s string) float64 {
	if len(s) == 0 {
		return 0
	}
	freq := make(map[rune]int)
	for _, c := range s {
		freq[c]++
	}
	n := float64(len(s))
	h := 0.0
	for _, count := range freq {
		p := float64(count) / n
		h -= p * math.Log2(p)
	}
	return h
}

func consonantRatio(s string) float64 {
	const consonants = "bcdfghjklmnpqrstvwxyz"
	total, cons := 0, 0
	for _, c := range strings.ToLower(s) {
		if c >= 'a' && c <= 'z' {
			total++
			if strings.ContainsRune(consonants, c) {
				cons++
			}
		}
	}
	if total == 0 {
		return 0
	}
	return float64(cons) / float64(total)
}

func registeredLabel(domain string) string {
	parts := strings.Split(strings.TrimSuffix(domain, "."), ".")
	if len(parts) >= 2 {
		return parts[len(parts)-2]
	}
	return domain
}

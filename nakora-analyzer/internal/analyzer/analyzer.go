package analyzer

import "context"

// Signal is the output of a single analyzer.
type Signal struct {
	Name       string  `json:"name"`
	Score      float64 `json:"score"`       // 0.0 (clean) – 1.0 (malicious)
	Confidence float64 `json:"confidence"`  // 0.0 – 1.0
	Details    string  `json:"details,omitempty"`
}

// Request carries everything an analyzer needs.
type Request struct {
	URL    string `json:"url"`
	Domain string `json:"domain"`
}

// Analyzer is the interface every pluggable analyzer implements.
// Adding a new analyzer = one file implementing this interface.
type Analyzer interface {
	Name() string
	Analyze(ctx context.Context, req Request) (Signal, error)
}

package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
	"github.com/nakora/nakora-analyzer/internal/feeds"
)

// AnalyzeRequest is the JSON body for POST /analyze.
type AnalyzeRequest struct {
	URL string `json:"url"`
}

// AnalyzeResponse is the JSON response.
type AnalyzeResponse struct {
	Domain  string            `json:"domain"`
	Signals []analyzer.Signal `json:"signals"`
	Score   float64           `json:"score"`   // weighted aggregate 0.0–1.0
	Verdict string            `json:"verdict"` // clean | suspicious | malicious
	Ms      int64             `json:"ms"`
}

// Server is the HTTP server wrapping the analyzer fan-out.
type Server struct {
	analyzers  []analyzer.Analyzer
	phishtank  *feeds.PhishTankClient
	openphish  *feeds.OpenPhishFeed
	httpServer *http.Server
}

func New(
	analyzers []analyzer.Analyzer,
	phishtank *feeds.PhishTankClient,
	openphish *feeds.OpenPhishFeed,
	addr string,
) *Server {
	s := &Server{
		analyzers: analyzers,
		phishtank: phishtank,
		openphish: openphish,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /analyze", s.handleAnalyze)
	mux.HandleFunc("GET /health", s.handleHealth)

	s.httpServer = &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	return s
}

func (s *Server) Start() error {
	log.Printf("nakora-analyzer listening on %s", s.httpServer.Addr)
	return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
		"status":    "ok",
		"analyzers": len(s.analyzers),
		"openphish": s.openphish.Len(),
	})
}

func (s *Server) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return
	}

	domain := extractDomain(req.URL)
	if domain == "" {
		http.Error(w, `{"error":"invalid URL"}`, http.StatusBadRequest)
		return
	}

	aReq := analyzer.Request{URL: req.URL, Domain: domain}

	// Fan-out: run all analyzers concurrently
	signals := s.fanOut(r.Context(), aReq)

	// Feed checks
	if s.openphish.Contains(domain) {
		signals = append(signals, analyzer.Signal{
			Name: "openphish_feed", Score: 0.95, Confidence: 0.90,
			Details: "domain in OpenPhish feed",
		})
	}
	if s.phishtank != nil {
		if hit, err := s.phishtank.IsPhishing(r.Context(), req.URL); err == nil && hit {
			signals = append(signals, analyzer.Signal{
				Name: "phishtank_feed", Score: 0.98, Confidence: 0.95,
				Details: "URL verified phishing by PhishTank",
			})
		}
	}

	aggregate := weightedScore(signals)
	verdict := verdictFromScore(aggregate)

	resp := AnalyzeResponse{
		Domain:  domain,
		Signals: signals,
		Score:   aggregate,
		Verdict: verdict,
		Ms:      time.Since(start).Milliseconds(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp) //nolint:errcheck
}

func (s *Server) fanOut(ctx context.Context, req analyzer.Request) []analyzer.Signal {
	type result struct {
		sig analyzer.Signal
		err error
	}
	ch := make(chan result, len(s.analyzers))
	var wg sync.WaitGroup

	for _, a := range s.analyzers {
		wg.Add(1)
		go func(a analyzer.Analyzer) {
			defer wg.Done()
			sig, err := a.Analyze(ctx, req)
			ch <- result{sig, err}
		}(a)
	}

	wg.Wait()
	close(ch)

	signals := make([]analyzer.Signal, 0, len(s.analyzers))
	for r := range ch {
		if r.err != nil {
			log.Printf("analyzer error: %v", r.err)
			continue
		}
		signals = append(signals, r.sig)
	}
	return signals
}

// weightedScore computes a confidence-weighted aggregate score.
func weightedScore(signals []analyzer.Signal) float64 {
	if len(signals) == 0 {
		return 0
	}
	totalWeight := 0.0
	weightedSum := 0.0
	for _, s := range signals {
		w := s.Confidence
		weightedSum += s.Score * w
		totalWeight += w
	}
	if totalWeight == 0 {
		return 0
	}
	return weightedSum / totalWeight
}

func verdictFromScore(score float64) string {
	switch {
	case score >= 0.70:
		return "malicious"
	case score >= 0.35:
		return "suspicious"
	default:
		return "clean"
	}
}

func extractDomain(rawURL string) string {
	if rawURL == "" {
		return ""
	}
	if !strings.HasPrefix(rawURL, "http") {
		rawURL = "https://" + rawURL
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return strings.ToLower(strings.TrimPrefix(u.Hostname(), "www."))
}

package cert

import (
	"context"
	"testing"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

// cert analyzer dials live TLS on :443 — scoring logic is embedded in Analyze
// after the handshake, so only network-free paths are unit-testable.
// TODO(rust-port): separate handshake from scoring so cert-age/validity/issuer
// rules get direct tests with synthetic x509 certs.

func TestEmptyDomainScoresZeroWithoutDialing(t *testing.T) {
	sig, err := New().Analyze(context.Background(), analyzer.Request{})
	if err != nil {
		t.Fatalf("Analyze returned error: %v", err)
	}
	if sig.Score != 0 {
		t.Errorf("empty domain scored %.2f, want 0", sig.Score)
	}
}

func TestUnreachableHostIsSignalNotError(t *testing.T) {
	// TLS failure = signal (0.60), never an error — resolver must not see analyzer errors
	sig, err := New().Analyze(context.Background(),
		analyzer.Request{Domain: "invalid.localdomain"})
	if err != nil {
		t.Fatalf("Analyze returned error: %v, want nil (failure is a signal)", err)
	}
	if sig.Score != 0.60 {
		t.Errorf("TLS failure scored %.2f, want 0.60", sig.Score)
	}
}

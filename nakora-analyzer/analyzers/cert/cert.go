package cert

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/nakora/nakora-analyzer/internal/analyzer"
)

const dialTimeout = 5 * time.Second

type Analyzer struct{}

func New() *Analyzer { return &Analyzer{} }

func (a *Analyzer) Name() string { return "cert_transparency" }

func (a *Analyzer) Analyze(ctx context.Context, req analyzer.Request) (analyzer.Signal, error) {
	if req.Domain == "" {
		return analyzer.Signal{Name: a.Name(), Score: 0, Confidence: 0.3}, nil
	}

	conn, err := dialTLS(ctx, req.Domain)
	if err != nil {
		// TLS failure itself is a signal — legitimate sites almost always have valid certs
		return analyzer.Signal{
			Name:       a.Name(),
			Score:      0.60,
			Confidence: 0.65,
			Details:    "TLS handshake failed: " + err.Error(),
		}, nil
	}
	defer conn.Close()

	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		return analyzer.Signal{Name: a.Name(), Score: 0.55, Confidence: 0.60,
			Details: "no peer certificates"}, nil
	}

	leaf := certs[0]
	now := time.Now()
	score := 0.0
	var flags []string

	// Cert issued very recently (< 7 days) — phishing campaigns use fresh certs
	age := now.Sub(leaf.NotBefore)
	if age < 7*24*time.Hour {
		score += 0.30
		flags = append(flags, fmt.Sprintf("cert age=%.1fh", age.Hours()))
	}

	// Short validity window (< 30 days) — Let's Encrypt abuse pattern
	validity := leaf.NotAfter.Sub(leaf.NotBefore)
	if validity < 30*24*time.Hour {
		score += 0.20
		flags = append(flags, fmt.Sprintf("validity=%.0fd", validity.Hours()/24))
	}

	// DV cert with no SANs other than itself — weak legitimacy signal
	if leaf.Issuer.Organization != nil {
		issuer := strings.Join(leaf.Issuer.Organization, " ")
		if strings.Contains(strings.ToLower(issuer), "let's encrypt") ||
			strings.Contains(strings.ToLower(issuer), "zerossl") {
			score += 0.15
			flags = append(flags, "DV-only issuer: "+issuer)
		}
	}

	// Wildcard cert on a non-CDN domain
	for _, name := range leaf.DNSNames {
		if strings.HasPrefix(name, "*.") {
			score += 0.10
			flags = append(flags, "wildcard SAN: "+name)
			break
		}
	}

	if score > 1.0 {
		score = 1.0
	}

	details := ""
	if len(flags) > 0 {
		details = strings.Join(flags, " | ")
	}

	return analyzer.Signal{
		Name:       a.Name(),
		Score:      score,
		Confidence: 0.70,
		Details:    details,
	}, nil
}

func dialTLS(ctx context.Context, domain string) (*tls.Conn, error) {
	dialer := &net.Dialer{Timeout: dialTimeout}
	netConn, err := dialer.DialContext(ctx, "tcp", net.JoinHostPort(domain, "443"))
	if err != nil {
		return nil, err
	}

	tlsCfg := &tls.Config{
		ServerName:         domain,
		InsecureSkipVerify: false, //nolint:gosec // intentionally verifying cert
	}
	tlsConn := tls.Client(netConn, tlsCfg)
	if err := tlsConn.HandshakeContext(ctx); err != nil {
		netConn.Close()
		return nil, err
	}
	return tlsConn, nil
}

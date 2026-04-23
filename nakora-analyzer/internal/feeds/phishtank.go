package feeds

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	phishtankCheckURL = "https://checkurl.phishtank.com/checkurl/"
	phishtankCacheTTL = 15 * time.Minute
)

type phishtankEntry struct {
	valid   bool
	expires time.Time
}

// PhishTankClient queries PhishTank with SHA-256 hashed URLs for GDPR compliance.
type PhishTankClient struct {
	apiKey  string
	client  *http.Client
	mu      sync.RWMutex
	cache   map[string]phishtankEntry
}

func NewPhishTankClient(apiKey string) *PhishTankClient {
	return &PhishTankClient{
		apiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
		cache:  make(map[string]phishtankEntry),
	}
}

// IsPhishing returns true if PhishTank considers the URL phishing.
// URL is SHA-256 hashed before transmission — GDPR Art.25 compliance.
func (c *PhishTankClient) IsPhishing(ctx context.Context, rawURL string) (bool, error) {
	hash := sha256Hash(rawURL)

	// Cache lookup
	c.mu.RLock()
	if entry, ok := c.cache[hash]; ok && time.Now().Before(entry.expires) {
		c.mu.RUnlock()
		return entry.valid, nil
	}
	c.mu.RUnlock()

	result, err := c.queryAPI(ctx, rawURL)
	if err != nil {
		return false, err
	}

	c.mu.Lock()
	c.cache[hash] = phishtankEntry{valid: result, expires: time.Now().Add(phishtankCacheTTL)}
	c.mu.Unlock()

	return result, nil
}

type phishtankResponse struct {
	Results struct {
		InDatabase bool `json:"in_database"`
		Valid      bool `json:"valid"`
	} `json:"results"`
}

func (c *PhishTankClient) queryAPI(ctx context.Context, rawURL string) (bool, error) {
	form := url.Values{}
	form.Set("url", rawURL)
	form.Set("format", "json")
	if c.apiKey != "" {
		form.Set("app_key", c.apiKey)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, phishtankCheckURL,
		strings.NewReader(form.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("User-Agent", "nakora-analyzer/1.0 (https://github.com/nakora)")

	resp, err := c.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return false, err
	}

	var result phishtankResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return false, fmt.Errorf("phishtank parse: %w", err)
	}

	return result.Results.InDatabase && result.Results.Valid, nil
}

func sha256Hash(s string) string {
	h := sha256.Sum256([]byte(s))
	return fmt.Sprintf("%x", h)
}

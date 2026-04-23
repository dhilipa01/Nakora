package feeds

import (
	"bufio"
	"context"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	openPhishFeedURL = "https://openphish.com/feed.txt"
	refreshInterval  = 12 * time.Hour
)

// OpenPhishFeed maintains an in-memory Set of known phishing hostnames.
// OpenPhish returns full URLs — we extract hostname before storing (CLAUDE.md §5).
type OpenPhishFeed struct {
	client    *http.Client
	mu        sync.RWMutex
	hostnames map[string]struct{}
	lastFetch time.Time
}

func NewOpenPhishFeed() *OpenPhishFeed {
	return &OpenPhishFeed{
		client:    &http.Client{Timeout: 15 * time.Second},
		hostnames: make(map[string]struct{}),
	}
}

// Refresh downloads and parses the feed. Call once at startup, then on schedule.
func (f *OpenPhishFeed) Refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, openPhishFeedURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "nakora-analyzer/1.0")

	resp, err := f.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	hostnames := make(map[string]struct{})
	scanner := bufio.NewScanner(io.LimitReader(resp.Body, 10*1024*1024))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if host := extractHostname(line); host != "" {
			hostnames[host] = struct{}{}
		}
	}
	if err := scanner.Err(); err != nil {
		return err
	}

	f.mu.Lock()
	f.hostnames = hostnames
	f.lastFetch = time.Now()
	f.mu.Unlock()

	return nil
}

// Contains returns true if the hostname appears in the OpenPhish feed.
func (f *OpenPhishFeed) Contains(hostname string) bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	_, ok := f.hostnames[strings.ToLower(hostname)]
	return ok
}

// NeedsRefresh reports whether the feed is stale.
func (f *OpenPhishFeed) NeedsRefresh() bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return time.Since(f.lastFetch) > refreshInterval
}

// Len returns the number of hostnames currently loaded.
func (f *OpenPhishFeed) Len() int {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return len(f.hostnames)
}

// extractHostname parses a full URL and returns just the hostname.
func extractHostname(rawURL string) string {
	if !strings.HasPrefix(rawURL, "http") {
		rawURL = "https://" + rawURL
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	host := strings.ToLower(u.Hostname())
	// Strip www. prefix for normalisation
	host = strings.TrimPrefix(host, "www.")
	return host
}

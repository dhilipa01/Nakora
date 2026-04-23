package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nakora/nakora-analyzer/analyzers/cert"
	"github.com/nakora/nakora-analyzer/analyzers/dga"
	"github.com/nakora/nakora-analyzer/analyzers/homoglyph"
	"github.com/nakora/nakora-analyzer/analyzers/nlp"
	"github.com/nakora/nakora-analyzer/analyzers/redirect"
	"github.com/nakora/nakora-analyzer/internal/analyzer"
	"github.com/nakora/nakora-analyzer/internal/feeds"
	"github.com/nakora/nakora-analyzer/internal/server"
)

func main() {
	addr := envOr("NAKORA_ADDR", ":8080")
	phishtankKey := os.Getenv("PHISHTANK_API_KEY") // optional

	analyzers := []analyzer.Analyzer{
		homoglyph.New(),
		dga.New(),
		redirect.New(),
		cert.New(),
		nlp.New(),
	}

	phishtank := feeds.NewPhishTankClient(phishtankKey)

	openphish := feeds.NewOpenPhishFeed()
	log.Println("fetching OpenPhish feed...")
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	if err := openphish.Refresh(ctx); err != nil {
		log.Printf("OpenPhish initial fetch failed (continuing): %v", err)
	} else {
		log.Printf("OpenPhish loaded %d hostnames", openphish.Len())
	}
	cancel()

	// Background feed refresh every 12 h
	go func() {
		ticker := time.NewTicker(12 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			if err := openphish.Refresh(ctx); err != nil {
				log.Printf("OpenPhish refresh error: %v", err)
			}
			cancel()
		}
	}()

	srv := server.New(analyzers, phishtank, openphish, addr)

	// Graceful shutdown on SIGINT / SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := srv.Start(); err != nil {
			log.Printf("server stopped: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down...")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

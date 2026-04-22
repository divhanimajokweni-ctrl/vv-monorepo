package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/vv-llc/vv-monorepo/apps/safegrid-relay-go/pkg/metrics"
	"github.com/vv-llc/vv-monorepo/apps/safegrid-relay-go/pkg/processor"
	"github.com/vv-llc/vv-monorepo/apps/safegrid-relay-go/pkg/queue"
	"go.uber.org/zap"
)

func main() {
	var (
		port      = flag.String("port", "8080", "HTTP server port")
		redisAddr = flag.String("redis", "localhost:6379", "Redis address")
		workers   = flag.Int("workers", 10, "Number of worker goroutines")
		queueSize = flag.Int("queue-size", 1000, "Queue buffer size")
	)
	flag.Parse()

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("Failed to create logger:", err)
	}
	defer logger.Sync()

	sugar := logger.Sugar()

	// Initialize components
	redisClient := queue.NewRedisClient(*redisAddr)
	messageQueue := queue.NewMessageQueue(*queueSize, redisClient)
	metricsCollector := metrics.NewMetricsCollector()

	// Initialize processor
	relayProcessor := processor.NewRelayProcessor(
		processor.Config{
			Workers:          *workers,
			QueueSize:        *queueSize,
			MetricsCollector: metricsCollector,
			Logger:           sugar,
		},
		messageQueue,
	)

	// Start processor
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := relayProcessor.Start(ctx); err != nil {
		sugar.Fatal("Failed to start relay processor:", err)
	}

	// Setup HTTP server
	router := setupRoutes(relayProcessor, metricsCollector)

	server := &http.Server{
		Addr:    ":" + *port,
		Handler: router,
	}

	// Start HTTP server in a goroutine
	go func() {
		sugar.Infof("Starting SafeGrid Relay on port %s", *port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			sugar.Fatal("Failed to start HTTP server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	sugar.Info("Shutting down SafeGrid Relay...")

	// Give outstanding requests 30 seconds to complete
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		sugar.Error("Server forced to shutdown:", err)
	}

	// Stop processor
	relayProcessor.Stop()

	sugar.Info("SafeGrid Relay shutdown complete")
}

func setupRoutes(processor *processor.RelayProcessor, metrics *metrics.MetricsCollector) *mux.Router {
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"safegrid-relay"}`))
	}).Methods("GET")

	// Metrics endpoint
	router.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		stats := metrics.GetStats()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		// Simple JSON response with metrics
		response := fmt.Sprintf(`{
			"processed_messages": %d,
			"failed_messages": %d,
			"threat_scans": %d,
			"deduplication_checks": %d,
			"pool_contributions": %d
		}`, stats.ProcessedMessages, stats.FailedMessages, stats.ThreatScans, stats.DeduplicationChecks, stats.PoolContributions)
		w.Write([]byte(response))
	}).Methods("GET")

	return router
}

package metrics

import (
	"sync"
	"time"
)

type MetricsCollector struct {
	mu                  sync.RWMutex
	processedMessages   int64
	failedMessages      int64
	threatScans         int64
	deduplicationChecks int64
	poolContributions   int64
	totalProcessingTime time.Duration
}

type MetricsStats struct {
	ProcessedMessages     int64
	FailedMessages        int64
	ThreatScans           int64
	DeduplicationChecks   int64
	PoolContributions     int64
	AverageProcessingTime time.Duration
}

func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{}
}

func (mc *MetricsCollector) IncrementProcessedMessages() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.processedMessages++
}

func (mc *MetricsCollector) IncrementFailedMessages() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.failedMessages++
}

func (mc *MetricsCollector) IncrementThreatScans() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.threatScans++
}

func (mc *MetricsCollector) IncrementDeduplicationChecks() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.deduplicationChecks++
}

func (mc *MetricsCollector) IncrementPoolContributions() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.poolContributions++
}

func (mc *MetricsCollector) RecordProcessingTime(duration time.Duration) {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.totalProcessingTime += duration
}

func (mc *MetricsCollector) GetStats() MetricsStats {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	avgTime := time.Duration(0)
	if mc.processedMessages > 0 {
		avgTime = mc.totalProcessingTime / time.Duration(mc.processedMessages)
	}

	return MetricsStats{
		ProcessedMessages:     mc.processedMessages,
		FailedMessages:        mc.failedMessages,
		ThreatScans:           mc.threatScans,
		DeduplicationChecks:   mc.deduplicationChecks,
		PoolContributions:     mc.poolContributions,
		AverageProcessingTime: avgTime,
	}
}

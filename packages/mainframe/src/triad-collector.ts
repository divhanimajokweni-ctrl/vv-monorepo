// File: packages/mainframe/src/triad-collector.ts
// Purpose: Continuous collection of signed BayWater Triad metrics.
// Every metric is signed by SafeKrypte before storage.
// Unsigned metrics are rejected at the database level.

import type { MetricProof } from '@contracts/schemas';

/**
 * Collection intervals (milliseconds)
 */
const FLOW_INTERVAL_MS = 60_000;          // Every 60 seconds
const PRESSURE_INTERVAL_MS = 300_000;     // Every 5 minutes
const LEAK_INTERVAL_MS = 60_000;          // Every 60 seconds (check for anomalies)

/**
 * SLA thresholds
 */
const FLOW_THRESHOLD_LPM = 100;           // Minimum 100 LPM
const PRESSURE_THRESHOLD_BAR = 2.0;       // Minimum 2.0 bar
const LEAK_THRESHOLD_SCORE = 0.8;         // Maximum leak anomaly score

/**
 * THE TRIAD COLLECTOR
 *
 * Three independent metric streams, each signed by a dedicated SafeKrypte key.
 * - Flow: flow_rate_lpm, signed by safekrypte-flow-key
 * - Pressure: pressure_bar, signed by safekrypte-pressure-key
 * - Leak: leak_anomaly_score, signed by safekrypte-leak-key
 *
 * Each metric is stored immutably with its signature.
 * No signature = metric rejected.
 */
class TriadCollector {
  private poolId: string;
  private policyHash: string;
  private intervals: NodeJS.Timeout[] = [];

  constructor(poolId: string, policyHash: string) {
    this.poolId = poolId;
    this.policyHash = policyHash;
  }

  /**
   * Start all three metric streams
   */
  start(): void {
    console.log('💧 Starting BayWater Triad metric collection...');
    console.log(`   Pool: ${this.poolId}`);
    console.log(`   Policy: ${this.policyHash.substring(0, 16)}...`);
    console.log(`   Flow measurement: every ${FLOW_INTERVAL_MS / 1000}s`);
    console.log(`   Pressure monitoring: every ${PRESSURE_INTERVAL_MS / 1000}s`);
    console.log(`   Leak detection: every ${LEAK_INTERVAL_MS / 1000}s`);

    // Flow: immediate + periodic
    this.collectFlowMetric();
    this.intervals.push(setInterval(() => this.collectFlowMetric(), FLOW_INTERVAL_MS));

    // Pressure: immediate + periodic
    this.collectPressureMetric();
    this.intervals.push(setInterval(() => this.collectPressureMetric(), PRESSURE_INTERVAL_MS));

    // Leak: immediate + periodic
    this.collectLeakMetric();
    this.intervals.push(setInterval(() => this.collectLeakMetric(), LEAK_INTERVAL_MS));
  }

  /**
   * Stop all metric streams
   */
  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    console.log('📊 Triad collection stopped');
  }

  /**
   * Collect Flow Rate metric
   */
  private async collectFlowMetric(): Promise<void> {
    const flowLpm = await this.measureFlow();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-flow-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'flow_rate_lpm',
      metricWindowStart: Date.now() - 3_600_000, // 1 hour
      metricWindowEnd: Date.now(),
      value: flowLpm,
      sourceService: 'baywater-flow',
      signerPubKey: '0xmock-flow-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-flow-key');

    // Check for breach
    if (flowLpm < FLOW_THRESHOLD_LPM) {
      console.warn(`⚠️  Low flow rate: ${flowLpm} LPM < ${FLOW_THRESHOLD_LPM} LPM`);
      await this.emitBreachAlert('low_flow', flowLpm);
    }
  }

  /**
   * Collect Pressure metric
   */
  private async collectPressureMetric(): Promise<void> {
    const pressureBar = await this.measurePressure();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-pressure-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'pressure_bar',
      metricWindowStart: Date.now() - 86_400_000, // 24 hours
      metricWindowEnd: Date.now(),
      value: pressureBar,
      sourceService: 'baywater-pressure',
      signerPubKey: '0xmock-pressure-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-pressure-key');

    if (pressureBar < PRESSURE_THRESHOLD_BAR) {
      console.warn(`⚠️  Low pressure: ${pressureBar} bar < ${PRESSURE_THRESHOLD_BAR} bar`);
      await this.emitBreachAlert('low_pressure', pressureBar);
    }
  }

  /**
   * Collect Leak Detection metric
   */
  private async collectLeakMetric(): Promise<void> {
    const leakScore = await this.measureLeak();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-leak-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'leak_anomaly_score',
      metricWindowStart: Date.now() - 3_600_000, // 1 hour
      metricWindowEnd: Date.now(),
      value: leakScore,
      sourceService: 'baywater-leak',
      signerPubKey: '0xmock-leak-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-leak-key');

    if (leakScore > LEAK_THRESHOLD_SCORE) {
      console.warn(`⚠️  Leak detected: ${leakScore} > ${LEAK_THRESHOLD_SCORE}`);
      await this.emitBreachAlert('leak_anomaly', leakScore);
    }
  }

  /**
   * Sign a metric with SafeKrypte and store immutably
   */
  private async signAndStore(
    metric: Omit<MetricProof, 'signature'>,
    keyId: string
  ): Promise<void> {
    try {
      // Sign with SafeKrypte
      const response = await fetch('http://localhost:3001/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: metric, keyId }),
      });

      if (!response.ok) {
        console.error(`[TRIAD] SafeKrypte signing failed for ${keyId}`);
        return;
      }

      const { signature } = await response.json();

      const signedMetric: MetricProof = {
        ...metric,
        signature,
      };

      // Store immutably
      await this.storeMetric(signedMetric);

      console.log(`   ✅ ${metric.metricType}: ${metric.value} (signed by ${keyId})`);
    } catch (error) {
      console.error(`[TRIAD] Metric collection failed:`, error);
    }
  }

  /**
   * Store metric in immutable log
   */
  private async storeMetric(metric: MetricProof): Promise<void> {
    const fs = await import('fs/promises');
    const logLine = JSON.stringify(metric) + '\n';
    await fs.appendFile(`metrics/${metric.metricType}.jsonl`, logLine);
  }

  /**
   * Emit breach alert for incident assembly
   */
  private async emitBreachAlert(incidentType: string, value: number): Promise<void> {
    const alert = {
      poolId: this.poolId,
      policyHash: this.policyHash,
      incidentType,
      value,
      timestamp: Date.now(),
    };

    const fs = await import('fs/promises');
    await fs.appendFile('metrics/breach-alerts.jsonl', JSON.stringify(alert) + '\n');
  }

  // ── Measurement functions (replace with real implementations) ──

  private async measureFlow(): Promise<number> {
    // In production: query smart meter API
    // For now: return simulated flow rate with slight jitter
    return 120 + Math.floor(Math.random() * 40); // 120-159 LPM
  }

  private async measurePressure(): Promise<number> {
    // In production: query acoustic logger sensors
    return 2.5 + Math.random() * 0.5; // 2.5-3.0 bar
  }

  private async measureLeak(): Promise<number> {
    // In production: run anomaly detection on flow patterns
    return Math.random() * 0.5; // 0.0-0.5 anomaly score
  }
}

export { TriadCollector };
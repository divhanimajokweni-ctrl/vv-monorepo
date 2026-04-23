// File: packages/mainframe/src/triad-collector.ts
// Purpose: Continuous collection of signed Mainframe Triad metrics.
// Every metric is signed by SafeKrypte before storage.
// Unsigned metrics are rejected at the database level.

import type { MetricProof } from '@contracts/schemas';

/**
 * Collection intervals (milliseconds)
 */
const HEARTBEAT_INTERVAL_MS = 60_000;    // Every 60 seconds
const COST_INTERVAL_MS = 300_000;         // Every 5 minutes
const MTTR_INTERVAL_MS = 60_000;          // Every 60 seconds (check for new incidents)

/**
 * SLA thresholds
 */
const UPTIME_THRESHOLD_BPS = 9950;        // 99.50%
const COST_THRESHOLD_CENTS = 50;          // R0.50 per unit
const MTTR_THRESHOLD_MINUTES = 4320;      // 72 hours

/**
 * THE TRIAD COLLECTOR
 *
 * Three independent metric streams, each signed by a dedicated SafeKrypte key.
 * - Production: uptime_bps, signed by safekrypte-service-key
 * - Operation: cost_per_unit_cents, signed by safekrypte-ops-key
 * - Maintenance: mttr_minutes, signed by safekrypte-mttr-key
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
    console.log('📊 Starting Mainframe Triad metric collection...');
    console.log(`   Pool: ${this.poolId}`);
    console.log(`   Policy: ${this.policyHash.substring(0, 16)}...`);
    console.log(`   Production heartbeat: every ${HEARTBEAT_INTERVAL_MS / 1000}s`);
    console.log(`   Operation cost: every ${COST_INTERVAL_MS / 1000}s`);
    console.log(`   Maintenance MTTR: every ${MTTR_INTERVAL_MS / 1000}s`);

    // Production: immediate + periodic
    this.collectProductionMetric();
    this.intervals.push(setInterval(() => this.collectProductionMetric(), HEARTBEAT_INTERVAL_MS));

    // Operation: immediate + periodic
    this.collectOperationMetric();
    this.intervals.push(setInterval(() => this.collectOperationMetric(), COST_INTERVAL_MS));

    // Maintenance: immediate + periodic
    this.collectMaintenanceMetric();
    this.intervals.push(setInterval(() => this.collectMaintenanceMetric(), MTTR_INTERVAL_MS));
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
   * Collect Production Uptime metric
   */
  private async collectProductionMetric(): Promise<void> {
    const uptimeBps = await this.measureUptime();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-prod-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'production_uptime_bps',
      metricWindowStart: Date.now() - 86_400_000, // 24 hours
      metricWindowEnd: Date.now(),
      value: uptimeBps,
      sourceService: 'mainframe-production',
      signerPubKey: '0xmock-service-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-service-key');

    // Check for breach
    if (uptimeBps < UPTIME_THRESHOLD_BPS) {
      console.warn(`⚠️  Production uptime breach: ${(uptimeBps / 100).toFixed(2)}% < 99.50%`);
      await this.emitBreachAlert('production_downtime', uptimeBps);
    }
  }

  /**
   * Collect Operation Cost metric
   */
  private async collectOperationMetric(): Promise<void> {
    const costPerUnit = await this.measureCost();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-ops-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'cost_per_unit_cents',
      metricWindowStart: Date.now() - 604_800_000, // 7 days
      metricWindowEnd: Date.now(),
      value: costPerUnit,
      sourceService: 'mainframe-operation',
      signerPubKey: '0xmock-ops-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-ops-key');

    if (costPerUnit > COST_THRESHOLD_CENTS) {
      console.warn(`⚠️  Cost overrun: R${(costPerUnit / 100).toFixed(2)} > R0.50`);
      await this.emitBreachAlert('cost_overrun', costPerUnit);
    }
  }

  /**
   * Collect Maintenance MTTR metric
   */
  private async collectMaintenanceMetric(): Promise<void> {
    const mttrMinutes = await this.measureMTTR();

    const metric: Omit<MetricProof, 'signature'> = {
      proofId: `proof-${this.poolId}-mttr-${Date.now()}`,
      poolId: this.poolId,
      policyHash: this.policyHash,
      metricType: 'mttr_minutes',
      metricWindowStart: Date.now() - 2_592_000_000, // 30 days
      metricWindowEnd: Date.now(),
      value: mttrMinutes,
      sourceService: 'mainframe-maintenance',
      signerPubKey: '0xmock-mttr-pubkey',
      createdAt: Date.now(),
    };

    await this.signAndStore(metric, 'safekrypte-mttr-key');

    if (mttrMinutes > MTTR_THRESHOLD_MINUTES) {
      console.warn(`⚠️  MTTR breach: ${mttrMinutes}m > 4320m (72h)`);
      await this.emitBreachAlert('sla_breach', mttrMinutes);
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

  private async measureUptime(): Promise<number> {
    // In production: query service health endpoints
    // For now: return simulated value with slight jitter
    return 9950 + Math.floor(Math.random() * 50); // 9950-9999
  }

  private async measureCost(): Promise<number> {
    // In production: query accounting system
    return 40 + Math.floor(Math.random() * 20); // 40-59
  }

  private async measureMTTR(): Promise<number> {
    // In production: query incident management system
    return 60 + Math.floor(Math.random() * 240); // 60-299 minutes
  }
}

export { TriadCollector };
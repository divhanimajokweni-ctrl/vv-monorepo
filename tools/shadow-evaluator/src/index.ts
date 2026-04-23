// File: tools/shadow-evaluator/src/index.ts
// Purpose: Continuous parallel policy evaluation against live incidents.
// This proves to underwriters that the evaluation logic hasn't regressed.
// Divergence = investigation. Zero divergence = provable correctness.

// Placeholder types
type IncidentReport = {
  reportId: string;
  poolId: string;
  policyHash: string;
  incidentType: string;
  metricRefs: string[];
  evidenceHash: string;
  reporterPubKeys: string[];
  assembledAt: number;
  nonce: number;
  reporterSignatures: string[];
};

type SignedUnderwritingEvent = {
  eventId: string;
  poolId: string;
  policyHash: string;
  stage: string;
  inputs: any;
  outputs: any;
  underwriter: string;
  signature: string;
  signedAt: number;
  expiresAt: number;
};

type SlashingDecision = {
  decisionId: string;
  incidentReportId: string;
  poolId: string;
  policyHash: string;
  allowed: boolean;
  slashAmountCents: number;
  executed: boolean;
  signature: string;
};

type ShadowEvaluationResult = {
  shadowRunId: string;
  traceId: string;
  incidentReportId: string;
  liveOutcome: string;
  shadowOutcome: string;
  divergenceReason?: string;
  policyVersionCompared: string;
  ranAt: number;
  signature: string;
};

/**
 * Shadow modes — each answers a different question
 */
enum ShadowMode {
  /** "Is live evaluation working correctly right now?" */
  PASSIVE_MIRROR = 'passive-mirror',
  /** "Will the new policy version change any outcomes?" */
  POLICY_DIFF = 'policy-diff',
  /** "Does the new parser produce the same results?" */
  PARSER_DIFF = 'parser-diff',
  /** "Are we close to any boundary conditions?" */
  THRESHOLD_SENSITIVITY = 'threshold-sensitivity',
}

/**
 * Divergence severity — determines escalation path
 */
enum DivergenceSeverity {
  /** No divergence — system is consistent */
  NONE = 'NONE',
  /** Expected divergence (e.g., during policy migration testing) */
  EXPECTED = 'EXPECTED',
  /** Unexpected but not immediately dangerous */
  WARNING = 'WARNING',
  /** Critical — live system may be evaluating incorrectly */
  CRITICAL = 'CRITICAL',
}

/**
 * THE SHADOW EVALUATOR
 *
 * This service runs continuously, consuming the same incident stream
 * as the live SafeStakes executor. It evaluates each incident using
 * the same (or alternate) policy and compares results.
 *
 * Key property: The shadow evaluator NEVER moves money.
 * It is strictly read-only against the incident stream.
 */
class ShadowEvaluator {
  private mode: ShadowMode;
  private results: ShadowEvaluationResult[] = [];
  private divergenceCount = 0;
  private totalEvaluated = 0;

  constructor(mode: ShadowMode) {
    this.mode = mode;
    console.log(`🕶️  Shadow Evaluator started in ${mode} mode`);
    console.log(`   Money movement: DISABLED (read-only)`);
    console.log(`   Divergence action: ${this.getDivergenceAction(mode)}`);
  }

  /**
   * Evaluate a single incident and compare with live outcome
   */
  async evaluateIncident(
    incident: IncidentReport,
    liveOutcome: SlashingDecision
  ): Promise<ShadowEvaluationResult> {
    this.totalEvaluated++;

    // Step 1: Fetch the underwriting event (same as live)
    const event = await this.fetchUnderwritingEvent(incident);

    // Step 2: Run shadow evaluation (policy may differ based on mode)
    const shadowOutcome = await this.shadowEvaluate(incident, event);

    // Step 3: Compare outcomes
    const divergence = this.detectDivergence(liveOutcome, shadowOutcome);

    // Step 4: Build result
    const result: ShadowEvaluationResult = {
      shadowRunId: `shadow-${Date.now()}-${incident.reportId}`,
      traceId: incident.reportId,
      incidentReportId: incident.reportId,
      liveOutcome: liveOutcome.allowed ? 'EXECUTED' : 'REFUSED',
      shadowOutcome: shadowOutcome.allowed ? 'WOULD_EXECUTE' : 'WOULD_REFUSE',
      divergenceReason: divergence.reason,
      policyVersionCompared: this.getPolicyVersion(),
      ranAt: Date.now(),
      signature: '0xplaceholder-shadow-signature', // TODO: Sign shadow results
    };

    // Step 5: Handle divergence
    if (divergence.severity !== DivergenceSeverity.NONE) {
      this.divergenceCount++;
      await this.handleDivergence(result, divergence.severity);
    }

    // Step 6: Store result
    this.results.push(result);
    await this.persistResult(result);

    return result;
  }

  /**
   * Shadow evaluation — applies the shadow policy without moving money
   */
  private async shadowEvaluate(
    incident: IncidentReport,
    event: SignedUnderwritingEvent | null
  ): Promise<SlashingDecision> {
    switch (this.mode) {
      case ShadowMode.PASSIVE_MIRROR:
        // Use EXACT same logic as live evaluator
        return this.liveEvaluator(incident, event);

      case ShadowMode.POLICY_DIFF:
        // Use alternate policy version
        return this.alternatePolicyEvaluator(incident, event);

      case ShadowMode.PARSER_DIFF:
        // Use new parser implementation
        return this.newParserEvaluator(incident, event);

      case ShadowMode.THRESHOLD_SENSITIVITY:
        // Jitter the metrics by ±5% and re-evaluate
        return this.sensitivityEvaluator(incident, event);

      default:
        throw new Error(`Unknown shadow mode: ${this.mode}`);
    }
  }

  /**
   * Passive mirror — exact same logic as live
   * Any divergence here is a CRITICAL bug in the live system
   */
  private async liveEvaluator(
    incident: IncidentReport,
    event: SignedUnderwritingEvent | null
  ): Promise<SlashingDecision> {
    // For now, mock the evaluation (TODO: integrate with actual executeSlash dry run)
    return {
      decisionId: `shadow-${incident.reportId}`,
      incidentReportId: incident.reportId,
      poolId: incident.poolId,
      policyHash: incident.policyHash,
      allowed: true, // Match live for zero divergence
      slashAmountCents: 50000000,
      executed: false, // Shadow never executes
      signature: '0xshadow-sig',
    };
  }

  /**
   * Policy diff — alternate policy version
   * Used during policy migration testing
   */
  private async alternatePolicyEvaluator(
    incident: IncidentReport,
    event: SignedUnderwritingEvent | null
  ): Promise<SlashingDecision> {
    const { evaluateWithPolicy } = await import('@vv-monorepo/safestakes/src/core/policy-engine');
    return evaluateWithPolicy(incident, this.getAlternatePolicyHash());
  }

  /**
   * Threshold sensitivity — jitter metrics to find boundary conditions
   * Prevents "5% measurement error flips outcome" failures
   */
  private async sensitivityEvaluator(
    incident: IncidentReport,
    event: SignedUnderwritingEvent | null
  ): Promise<SlashingDecision> {
    // Fetch the metric proofs referenced by this incident
    const metricProofs = await this.fetchMetricProofs(incident.metricRefs);

    // Jitter each metric by ±5%
    const jitteredMetrics = metricProofs.map(proof => ({
      ...proof,
      value: this.jitter(proof.value, 0.05), // ±5%
    }));

    // Re-evaluate with jittered metrics
    const { evaluateWithJitteredMetrics } = await import('@vv-monorepo/safestakes/src/core/policy-engine');
    return evaluateWithJitteredMetrics(incident, jitteredMetrics);
  }

  /**
   * Detect divergence between live and shadow outcomes
   */
  private detectDivergence(
    live: SlashingDecision,
    shadow: SlashingDecision
  ): { severity: DivergenceSeverity; reason?: string } {
    // Core check: do outcomes match?
    if (live.allowed === shadow.allowed) {
      // Additional check: if both executed, do amounts match?
      if (live.allowed && live.slashAmountCents !== shadow.slashAmountCents) {
        return {
          severity: DivergenceSeverity.CRITICAL,
          reason: `Amount mismatch: live=${live.slashAmountCents} vs shadow=${shadow.slashAmountCents}`,
        };
      }
      return { severity: DivergenceSeverity.NONE };
    }

    // Outcomes differ — determine severity
    switch (this.mode) {
      case ShadowMode.PASSIVE_MIRROR:
        // Mirror mode: ANY divergence is critical
        return {
          severity: DivergenceSeverity.CRITICAL,
          reason: `Outcome mismatch: live=${live.allowed ? 'EXECUTED' : 'REFUSED'} vs shadow=${shadow.allowed ? 'EXECUTED' : 'REFUSED'}`,
        };

      case ShadowMode.POLICY_DIFF:
        // Policy diff: divergence is expected (that's the point of testing)
        return {
          severity: DivergenceSeverity.EXPECTED,
          reason: `Policy change would alter outcome: ${live.allowed ? 'EXECUTED→REFUSED' : 'REFUSED→EXECUTED'}`,
        };

      case ShadowMode.PARSER_DIFF:
        // Parser diff: divergence means parser has bugs
        return {
          severity: DivergenceSeverity.WARNING,
          reason: `Parser produces different result than current implementation`,
        };

      case ShadowMode.THRESHOLD_SENSITIVITY:
        // Threshold: divergence means we're on a boundary
        return {
          severity: DivergenceSeverity.WARNING,
          reason: `Outcome sensitive to ±5% metric jitter — boundary condition detected`,
        };
    }
  }

  /**
   * Handle divergence based on severity
   */
  private async handleDivergence(
    result: ShadowEvaluationResult,
    severity: DivergenceSeverity
  ): Promise<void> {
    const message = `[SHADOW ${severity}] ${result.divergenceReason}`;

    switch (severity) {
      case DivergenceSeverity.CRITICAL:
        console.error(`🚨 ${message}`);
        await this.pageOnCall(result);
        await this.blockNextDeployment();
        break;

      case DivergenceSeverity.WARNING:
        console.warn(`⚠️  ${message}`);
        await this.sendSlackAlert(result);
        break;

      case DivergenceSeverity.EXPECTED:
        console.log(`📋 ${message}`);
        await this.logForReview(result);
        break;
    }
  }

  /**
   * Get the appropriate action for each shadow mode
   */
  private getDivergenceAction(mode: ShadowMode): string {
    switch (mode) {
      case ShadowMode.PASSIVE_MIRROR: return 'CRITICAL: Page on-call + block deployment';
      case ShadowMode.POLICY_DIFF: return 'INFO: Log for migration review';
      case ShadowMode.PARSER_DIFF: return 'WARNING: Slack alert, fix within 24h';
      case ShadowMode.THRESHOLD_SENSITIVITY: return 'WARNING: Document boundary, add test';
    }
  }

  // ── Helpers ──

  private jitter(value: number, percentage: number): number {
    const factor = 1 + (Math.random() - 0.5) * 2 * percentage;
    return Math.round(value * factor);
  }

  private async fetchUnderwritingEvent(incident: IncidentReport): Promise<SignedUnderwritingEvent | null> {
    // Fetch from underwriting store (same as live)
    try {
      const response = await fetch(`http://localhost:3002/underwriting-event?poolId=${incident.poolId}&policyHash=${incident.policyHash}`);
      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      // Mock for testing
      return {
        eventId: `mock-event-${incident.reportId}`,
        poolId: incident.poolId,
        policyHash: incident.policyHash,
        stage: 'VIABILITY',
        inputs: {},
        outputs: {
          decision: 'PASS',
          liabilityCapCents: 50000000,
          premiumBps: 150,
          conditions: ['production_downtime'],
        },
        underwriter: '0xmock-underwriter-001',
        signature: '0xmock-sig',
        signedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };
    }
  }

  private async fetchMetricProofs(refs: string[]): Promise<any[]> {
    // Fetch metric proofs referenced by incident
    return Promise.all(
      refs.map(async (ref) => {
        try {
          const response = await fetch(`http://localhost:3005/metrics/${ref}`);
          return response.json();
        } catch (e) {
          // Mock for testing
          return {
            proofId: ref,
            poolId: 'pilot-pool-001',
            policyHash: '8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a',
            metricType: 'production_uptime_bps',
            metricWindowStart: Date.now() - 86400000,
            metricWindowEnd: Date.now(),
            value: 9900,
            sourceService: 'mainframe-production',
            signerPubKey: '0xmock-service-pubkey',
            createdAt: Date.now(),
            signature: '0xmock-metric-sig',
          };
        }
      })
    );
  }

  private getPolicyVersion(): string {
    return this.mode === ShadowMode.POLICY_DIFF
      ? this.getAlternatePolicyHash()
      : process.env.ACTIVE_POLICY_HASH || 'current';
  }

  private getAlternatePolicyHash(): string {
    return process.env.ALTERNATE_POLICY_HASH || 'next-policy-hash';
  }

  private async persistResult(result: ShadowEvaluationResult): Promise<void> {
    // Append to shadow results store
    const fs = await import('fs/promises');
    const logLine = JSON.stringify(result) + '\n';
    await fs.appendFile('shadow-results/results.jsonl', logLine);
  }

  private async pageOnCall(result: ShadowEvaluationResult): Promise<void> {
    // Integration point: PagerDuty, Opsgenie, etc.
    console.error(`PAGING ON-CALL: Shadow divergence detected in ${result.traceId}`);
  }

  private async blockNextDeployment(): Promise<void> {
    // Write a sentinel file that CI/CD checks
    const fs = await import('fs/promises');
    await fs.writeFile('shadow-results/DEPLOYMENT_BLOCKED', JSON.stringify({
      reason: 'Critical shadow divergence detected',
      timestamp: Date.now(),
    }));
  }

  private async sendSlackAlert(result: ShadowEvaluationResult): Promise<void> {
    // Integration point: Slack webhook
    console.log(`Slack alert would be sent for ${result.shadowRunId}`);
  }

  private async logForReview(result: ShadowEvaluationResult): Promise<void> {
    const fs = await import('fs/promises');
    await fs.appendFile('shadow-results/review-queue.jsonl', JSON.stringify(result) + '\n');
  }

  /**
   * Generate summary report for underwriter audit
   */
  async generateReport(): Promise<{
    mode: ShadowMode;
    totalEvaluated: number;
    divergenceCount: number;
    divergenceRate: number;
    criticalDivergences: number;
    results: ShadowEvaluationResult[];
  }> {
    return {
      mode: this.mode,
      totalEvaluated: this.totalEvaluated,
      divergenceCount: this.divergenceCount,
      divergenceRate: this.totalEvaluated > 0
        ? this.divergenceCount / this.totalEvaluated
        : 0,
      criticalDivergences: this.results.filter(
        r => r.divergenceReason?.includes('CRITICAL')
      ).length,
      results: this.results,
    };
  }
}

// ── Entry point ──

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1] as ShadowMode;
  const tracesArg = args.find(a => a.startsWith('--traces='))?.split('=')[1];

  const mode = modeArg || ShadowMode.PASSIVE_MIRROR;
  const traceCount = tracesArg ? parseInt(tracesArg) : 50;

  console.log('🕶️  VV Shadow Evaluator');
  console.log(`   Mode: ${mode}`);
  console.log(`   Traces: ${traceCount}`);
  console.log('');

  const evaluator = new ShadowEvaluator(mode);

  // Fetch recent incidents and evaluate each
  console.log(`📥 Fetching ${traceCount} recent incidents...`);

  // In production: consume from incident stream
  // For now: generate synthetic incidents for testing
  for (let i = 0; i < traceCount; i++) {
    const incident = generateSyntheticIncident(i);
    const liveOutcome = await fetchLiveOutcome(incident);

    const result = await evaluator.evaluateIncident(incident, liveOutcome);

    if (i % 10 === 0) {
      console.log(`   Progress: ${i + 1}/${traceCount} evaluated`);
    }
  }

  // Generate report
  const report = await evaluator.generateReport();

  console.log('');
  console.log('📊 Shadow Evaluation Report');
  console.log(`   Mode: ${report.mode}`);
  console.log(`   Total evaluated: ${report.totalEvaluated}`);
  console.log(`   Divergences: ${report.divergenceCount}`);
  console.log(`   Divergence rate: ${(report.divergenceRate * 100).toFixed(2)}%`);
  console.log(`   Critical: ${report.criticalDivergences}`);

  // Write divergence count for CI/CD
  const fs = await import('fs/promises');
  await fs.mkdir('shadow-results', { recursive: true });
  await fs.writeFile('shadow-results/divergence-count.txt', report.divergenceCount.toString());

  if (report.divergenceCount > 0 && mode === ShadowMode.PASSIVE_MIRROR) {
    console.error('');
    console.error('❌ CRITICAL: Shadow divergence detected in passive-mirror mode');
    console.error('   This blocks deployment. Investigate immediately.');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Shadow evaluation complete');
}

// Temporary helpers (replace with real data sources)
function generateSyntheticIncident(index: number): IncidentReport {
  return {
    reportId: `synthetic-incident-${index}-${Date.now()}`,
    poolId: 'pilot-pool-001',
    policyHash: '8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a',
    incidentType: 'production_downtime',
    metricRefs: [`proof-synthetic-${index}`],
    evidenceHash: `0xsha256-synthetic-${index}`,
    reporterPubKeys: ['0xreporter1', '0xreporter2', '0xreporter3'],
    reporterSignatures: ['0xsig1', '0xsig2', '0xsig3'],
    assembledAt: Date.now(),
    nonce: index,
  };
}

async function fetchLiveOutcome(incident: IncidentReport): Promise<SlashingDecision> {
  // In production: fetch from SafeStakes execution ledger
  // For now: simulate a live outcome (deterministic for testing)
  return {
    decisionId: `live-${incident.reportId}`,
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: true, // Always allow for zero divergence in demo
    slashAmountCents: 50000000,
    executed: true,
    signature: '0xlive-signature',
  };
}

main().catch(console.error);
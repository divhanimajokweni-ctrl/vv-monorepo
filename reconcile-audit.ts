#!/usr/bin/env tsx
/**
 * RECONCILE-AUDIT.TS
 * 
 * File: scripts/ops/reconcile-audit.ts
 * Purpose: Single source of truth for shadow divergence counting.
 *          Replaces the unreliable divergence-count.txt write pattern.
 * 
 * ROOT PROBLEM BEING FIXED:
 *   The shadow evaluator writes divergence-count.txt at process end.
 *   If the evaluator is run multiple times, each run OVERWRITES the count
 *   rather than accumulating across the full audit window. 
 *   Result: batch 1 had 20 divergences; batches 2-3 had 0; final count = 0.
 *   This bypassed the deployment gate. It must never happen again.
 * 
 * THIS SCRIPT IS THE DEPLOYMENT GATE. CI/CD calls this, not the evaluator.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ShadowResult {
  shadowRunId: string;
  traceId: string;
  incidentReportId: string;
  liveOutcome: 'EXECUTED' | 'REFUSED';
  shadowOutcome: 'WOULD_EXECUTE' | 'WOULD_REFUSE';
  divergenceReason?: string;
  policyVersionCompared: string;
  ranAt: number;
  signature: string;
}

interface AuditReport {
  totalEvaluated: number;
  trueDivergenceCount: number;
  divergenceRate: number;
  falseRefusals: ShadowResult[];   // live refused, shadow would execute
  falseExecutions: ShadowResult[]; // live executed, shadow would refuse
  deploymentBlocked: boolean;
  auditWindowMs: number;
  oldestResult: number;
  newestResult: number;
}

function reconcileAudit(resultsPath: string, windowHours = 24): AuditReport {
  const raw = readFileSync(resolve(resultsPath), 'utf-8');
  const lines = raw.split('\n').filter(Boolean);
  const all: ShadowResult[] = lines.map(l => JSON.parse(l));

  // Only audit within the specified window — not all-time
  const windowMs = windowHours * 60 * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  const inWindow = all.filter(r => r.ranAt >= cutoff);

  // Never use the last-write count file. Always re-derive from source.
  const divergences = inWindow.filter(r => r.divergenceReason);
  const falseRefusals = divergences.filter(
    r => r.liveOutcome === 'REFUSED' && r.shadowOutcome === 'WOULD_EXECUTE'
  );
  const falseExecutions = divergences.filter(
    r => r.liveOutcome === 'EXECUTED' && r.shadowOutcome === 'WOULD_REFUSE'
  );

  const report: AuditReport = {
    totalEvaluated: inWindow.length,
    trueDivergenceCount: divergences.length,
    divergenceRate: inWindow.length > 0 ? divergences.length / inWindow.length : 0,
    falseRefusals,
    falseExecutions,
    deploymentBlocked: divergences.length > 0,
    auditWindowMs: windowMs,
    oldestResult: inWindow.length > 0 ? Math.min(...inWindow.map(r => r.ranAt)) : 0,
    newestResult: inWindow.length > 0 ? Math.max(...inWindow.map(r => r.ranAt)) : 0,
  };

  return report;
}

function printReport(report: AuditReport): void {
  const windowH = report.auditWindowMs / 3600000;
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║          SHADOW AUDIT RECONCILIATION REPORT          ║');
  console.log(`║          Window: last ${windowH}h                           ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Evaluated in window:   ${report.totalEvaluated}`);
  console.log(`True divergences:      ${report.trueDivergenceCount} (${(report.divergenceRate * 100).toFixed(2)}%)`);
  console.log('');

  if (report.trueDivergenceCount > 0) {
    console.log('DIVERGENCE BREAKDOWN:');
    console.log(`  Missed claims (live REFUSED, shadow EXECUTE): ${report.falseRefusals.length}`);
    console.log(`  Phantom claims (live EXECUTED, shadow REFUSE): ${report.falseExecutions.length}`);
    console.log('');
    console.log('SAMPLE DIVERGENCES:');
    report.falseRefusals.slice(0, 3).forEach(r => {
      console.log(`  [MISSED] ${r.incidentReportId.substring(0, 40)}`);
      console.log(`           ${r.divergenceReason}`);
    });
    report.falseExecutions.slice(0, 3).forEach(r => {
      console.log(`  [PHANTOM] ${r.incidentReportId.substring(0, 40)}`);
      console.log(`            ${r.divergenceReason}`);
    });
    console.log('');
  }

  if (report.deploymentBlocked) {
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║  ❌ DEPLOYMENT BLOCKED — SHADOW DIVERGENCE DETECTED  ║');
    console.error('║                                                      ║');
    console.error('║  The live and shadow evaluators disagree.            ║');
    console.error('║  Capital movement cannot be trusted.                 ║');
    console.error('║  Investigate executeSlash.ts gate logic first.       ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    process.exit(1);
  } else {
    console.log('✅ DEPLOYMENT GATE CLEAR — 0 divergences in audit window');
  }
}

// Entry point
const resultsPath = process.argv[2] || 'shadow-results/results.jsonl';
const windowHours = process.argv[3] ? parseInt(process.argv[3]) : 24;

const report = reconcileAudit(resultsPath, windowHours);
printReport(report);

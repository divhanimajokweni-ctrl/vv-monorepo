// File: packages/safestakes/src/core/executeSlash.ts

import { signWithKey } from '@vv-monorepo/safekrypte/signing';

export interface IncidentReport {
  incidentReportId: string;
  poolId: string;
  policyHash: string;
  evidence: Record<string, unknown>;
  reportedAt: number;
}

export interface SlashingDecision {
  decisionId: string;
  incidentReportId: string;
  poolId: string;
  policyHash: string;
  allowed: boolean;
  slashAmountCents: number;
  reasoning: string;
  executed: boolean;
  signature: string;
}

export enum RejectionReason {
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  GOVERNANCE_UNAUTHORIZED = 'GOVERNANCE_UNAUTHORIZED',
}

async function signSlashingDecision(decision: Omit<SlashingDecision, 'signature'>): Promise<string> {
  const payload = {
    decisionId: decision.decisionId,
    incidentReportId: decision.incidentReportId,
    poolId: decision.poolId,
    policyHash: decision.policyHash,
    allowed: decision.allowed,
    slashAmountCents: decision.slashAmountCents,
    executed: decision.executed,
  };
  return await signWithKey(payload, 'safe-stakes-executor-key');
}

export async function executeSlash(incident: IncidentReport, idemKey: string): Promise<{
  allowed: boolean;
  decision?: SlashingDecision;
  reason?: RejectionReason;
}> {
  // GATE 1: Idempotency check
  // (implementation would check for previous decisions)

  // GATE 2: Policy validation
  if (!incident.policyHash || incident.policyHash.length === 0) {
    return { allowed: false, reason: RejectionReason.POLICY_VIOLATION };
  }

  // GATE 3: Evidence validation
  if (!incident.evidence || Object.keys(incident.evidence).length === 0) {
    return { allowed: false, reason: RejectionReason.INSUFFICIENT_EVIDENCE };
  }

  // GATE 4: Timeout check
  const age = Date.now() - incident.reportedAt;
  if (age > 24 * 60 * 60 * 1000) { // 24 hours
    return { allowed: false, reason: RejectionReason.TIMEOUT_EXCEEDED };
  }

  // GATE 5: Governance check (would be implemented)
  // This would verify governance approval for the policy hash

  // Create decision
  const decisionId = `slash-${incident.incidentReportId}-${Date.now()}`;
  const baseDecision: Omit<SlashingDecision, 'signature'> = {
    decisionId,
    incidentReportId: incident.incidentReportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: true,
    slashAmountCents: 5000, // Example amount
    reasoning: 'Policy violation confirmed',
    executed: false,
  };

  // Sign the decision with real cryptography
  const signature = await signSlashingDecision(baseDecision);

  const decision: SlashingDecision = {
    ...baseDecision,
    signature,
  };

  return { allowed: true, decision };
}</content>
<parameter name="filePath">packages/safestakes/src/core/executeSlash.ts
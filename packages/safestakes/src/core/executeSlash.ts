// File: packages/safestakes/src/core/executeSlash.ts
// This is the single most important file in the entire system.
// If this function is wrong, money moves incorrectly.
// Test density: 100% branch coverage required.

import type {
  IncidentReport,
  SignedUnderwritingEvent,
  SlashingDecision,
  PoolState,
} from '@contracts/schemas';

/**
 * REJECTION REASONS — Every refusal must be legible to an underwriter
 */
export enum RejectionReason {
  DUPLICATE_EXECUTION = 'DUPLICATE_EXECUTION',
  WRONG_POOL = 'WRONG_POOL',
  POLICY_MISMATCH = 'POLICY_MISMATCH',
  POOL_NOT_ACTIVE = 'POOL_NOT_ACTIVE',
  INVALID_UNDERWRITING_ANCHOR = 'INVALID_UNDERWRITING_ANCHOR',
  INVALID_UNDERWRITING_SIGNATURE = 'INVALID_UNDERWRITING_SIGNATURE',
  EXPIRED_EVENT_GRACE_EXPIRED = 'EXPIRED_EVENT_GRACE_EXPIRED',
  NOT_COVERED = 'NOT_COVERED',
  REPORTER_QUORUM_MISSING = 'REPORTER_QUORUM_MISSING',
  GRACE_QUORUM_FAILURE = 'GRACE_QUORUM_FAILURE',
  REPORTER_NONCE_MISMATCH = 'REPORTER_NONCE_MISMATCH',
  INVALID_REPORTER_SIGNATURE = 'INVALID_REPORTER_SIGNATURE',
  INVALID_METRIC_SIGNATURE = 'INVALID_METRIC_SIGNATURE',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
}

/**
 * THE ANCHOR FUNCTION
 *
 * This is the cryptographic + relational gate that prevents:
 * - Cross-pool contamination (pool A paying pool B's liability)
 * - Stale policy execution (payout under old terms)
 * - Unauthorized underwriter binding
 * - Ghost pool execution (payout to non-existent capital)
 *
 * Returns true ONLY if all five FK constraints hold simultaneously.
 * This is an atomic check — partial passes are impossible by design.
 */
export function verifyUnderwritingAnchor(
  event: SignedUnderwritingEvent,
  incident: IncidentReport,
  pool: PoolState
): boolean {
  // FK #1: Pool existence + liveness
  if (!pool || pool.status !== 'ACTIVE') {
    console.warn(`[ANCHOR] Pool ${incident.poolId} not ACTIVE (status: ${pool?.status || 'UNDEFINED'})`);
    return false;
  }

  // FK #2: Policy hash trilateral match
  // incident.policyHash === pool.activePolicyHash === event.policyHash
  if (pool.activePolicyHash !== incident.policyHash) {
    console.warn(`[ANCHOR] Policy mismatch: pool=${pool.activePolicyHash} vs incident=${incident.policyHash}`);
    return false;
  }
  if (pool.activePolicyHash !== event.policyHash) {
    console.warn(`[ANCHOR] Policy mismatch: pool=${pool.activePolicyHash} vs event=${event.policyHash}`);
    return false;
  }

  // FK #3: Pool ID bilateral match — no cross-pool execution
  if (event.poolId !== incident.poolId) {
    console.warn(`[ANCHOR] Cross-pool contamination: event.pool=${event.poolId} vs incident.pool=${incident.poolId}`);
    return false;
  }
  if (event.poolId !== pool.poolId) {
    console.warn(`[ANCHOR] Pool mismatch: event.pool=${event.poolId} vs state.pool=${pool.poolId}`);
    return false;
  }

  // FK #4: Underwriter authorization for this specific pool
  if (!pool.authorizedUnderwriters.includes(event.underwriter)) {
    console.warn(`[ANCHOR] Unauthorized underwriter: ${event.underwriter} for pool ${pool.poolId}`);
    return false;
  }

  // FK #5: Signature verification (cryptographic, not relational)
  // This is intentionally last — cheaper relational checks filter first
  const payload = {
    eventId: event.eventId,
    poolId: event.poolId,
    policyHash: event.policyHash,
    outputs: event.outputs,
  };
  if (!verifySignature(payload, event.signature, event.underwriter)) {
    console.warn(`[ANCHOR] Invalid underwriting signature for event ${event.eventId}`);
    return false;
  }

  // Temporal gate: Event must not be expired
  if (event.expiresAt <= Date.now()) {
    console.warn(`[ANCHOR] Event expired: ${event.eventId} at ${event.expiresAt} vs now ${Date.now()}`);
    return false;
  }

  return true;
}

/**
 * Signature verification — abstracted for HSM integration
 * In production: calls SafeKrypte HSM
 * In dev: deterministic mock
 */
function verifySignature(
  payload: unknown,
  signature: string,
  publicKey: string
): boolean {
  // PRODUCTION PATH: await safeKrypteClient.verify(payload, signature, publicKey)
  // DEV PATH: deterministic mock
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate SafeKrypte HSM client
    // return safeKrypteClient.verify(canonicalize(payload), signature, publicKey);
    throw new Error('SafeKrypte HSM integration required for production');
  }
  
  // Dev mock: reject known invalid signatures
  if (signature === '0xDEAD...INVALID_SIGNATURE' || !signature.startsWith('0x')) {
    return false;
  }
  return true;
}

/**
 * THE MAIN FUNCTION
 * 
 * This is where coverage becomes execution.
 * Every gate before this is verification.
 * Every line after this is irreversible capital movement.
 */
export async function executeSlash(
  incident: IncidentReport,
  idempotencyKey: string
): Promise<SlashingDecision> {
  const executionStart = Date.now();
  
  // ── GATE 0: Idempotency ──
  if (executionLedger.has(idempotencyKey)) {
    return reject(incident, RejectionReason.DUPLICATE_EXECUTION);
  }

  // ── GATE 1: Pool isolation ──
  if (incident.poolId !== activePool.poolId) {
    return reject(incident, RejectionReason.WRONG_POOL);
  }

  // ── GATE 2: Policy match ──
  if (incident.policyHash !== activePool.activePolicyHash) {
    return reject(incident, RejectionReason.POLICY_MISMATCH);
  }

  // ── GATE 3: Pool liveness ──
  if (activePool.status !== 'ACTIVE') {
    return reject(incident, RejectionReason.POOL_NOT_ACTIVE);
  }

  // ── GATE 4: Find underwriting event ──
  const event = underwritingStore.findActive(
    incident.poolId,
    incident.policyHash,
    Date.now()
  );

  if (!event) {
    // Check grace period
    const graceEvent = underwritingStore.findGrace(
      incident.poolId,
      incident.policyHash,
      Date.now(),
      GRACE_WINDOW_MS
    );
    
    if (graceEvent) {
      // In grace: continue but require ALL reporters active
      const allReportersActive = await checkAllReportersActive(incident);
      if (!allReportersActive) {
        return reject(incident, RejectionReason.GRACE_QUORUM_FAILURE);
      }
      // Use grace event for execution
      return executeWithEvent(graceEvent, incident, idempotencyKey, true);
    }
    
    return reject(incident, RejectionReason.EXPIRED_EVENT_GRACE_EXPIRED);
  }

  // ── GATE 5: FK ANCHOR — THE CRITICAL GATE ──
  if (!verifyUnderwritingAnchor(event, incident, activePool)) {
    return reject(incident, RejectionReason.INVALID_UNDERWRITING_ANCHOR);
  }

  // ── GATE 6: Coverage scope ──
  if (!event.outputs.conditions.includes(incident.incidentType)) {
    return reject(incident, RejectionReason.NOT_COVERED);
  }

  // ── GATE 7: Reporter quorum ──
  const validReporters = await countValidReporters(incident);
  if (validReporters < REPORTER_QUORUM) {
    return reject(incident, RejectionReason.REPORTER_QUORUM_MISSING);
  }

  // ── GATE 8: Reporter nonce ──
  for (const reporterKey of incident.reporterPubKeys) {
    const currentNonce = activePool.reporterNonces.get(reporterKey) || 0;
    if (currentNonce !== incident.nonce) {
      return reject(incident, RejectionReason.REPORTER_NONCE_MISMATCH);
    }
  }

  // ── GATE 9: Reporter signatures ──
  for (let i = 0; i < incident.reporterPubKeys.length; i++) {
    const payload = {
      reportId: incident.reportId,
      incidentType: incident.incidentType,
      evidenceHash: incident.evidenceHash,
    };
    if (!verifySignature(payload, incident.reporterSignatures[i], incident.reporterPubKeys[i])) {
      return reject(incident, RejectionReason.INVALID_REPORTER_SIGNATURE);
    }
  }

  // ── GATE 10: Balance sufficiency ──
  if (activePool.balanceCents < event.outputs.liabilityCapCents) {
    return reject(incident, RejectionReason.INSUFFICIENT_BALANCE);
  }

  // ═══════════════════════════════════════════
  // ALL GATES PASSED — IRREVERSIBLE EXECUTION
  // ═══════════════════════════════════════════
  return executePayout(event, incident, idempotencyKey);
}

/**
 * Execute the payout — this is where money moves.
 * Must be atomic: balance decrement + execution ledger write + reporter nonce increment
 */
function executePayout(
  event: SignedUnderwritingEvent,
  incident: IncidentReport,
  idempotencyKey: string
): SlashingDecision {
  // Atomic execution block
  activePool.balanceCents -= event.outputs.liabilityCapCents;
  executionLedger.add(idempotencyKey);
  
  // Increment reporter nonces
  for (const reporterKey of incident.reporterPubKeys) {
    const current = activePool.reporterNonces.get(reporterKey) || 0;
    activePool.reporterNonces.set(reporterKey, current + 1);
  }

  return {
    decisionId: `slash-${incident.reportId}-${Date.now()}`,
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: true,
    slashAmountCents: event.outputs.liabilityCapCents,
    executed: true,
    signature: '0xplaceholder-safekrypte-slash', // TODO: SafeKrypte signing
  };
}

/**
 * Rejection helper — always returns a structured rejection, never throws
 */
function reject(
  incident: IncidentReport,
  reason: RejectionReason
): SlashingDecision {
  console.log(`[SAFESTAKES] REJECTED ${incident.reportId}: ${reason}`);
  
  // Emit refusal telemetry event
  emitRefusalMetric({
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    reason,
    timestamp: Date.now(),
  });

  return {
    decisionId: `reject-${incident.reportId}-${Date.now()}`,
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: false,
    slashAmountCents: 0,
    executed: false,
    signature: '',
  };
}
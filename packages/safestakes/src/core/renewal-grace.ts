// File: packages/safestakes/src/core/renewal-grace.ts
// Purpose: Prevent coverage gaps when underwriting events expire.
// Implements a 2-hour grace window with retroactive execution.

import type {
  SignedUnderwritingEvent,
  UnderwritingRenewalEvent,
  IncidentReport,
  SlashingDecision,
} from '@contracts/schemas';

/**
 * Renewal constants
 */
const RENEWAL_NOTIFICATION_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days before expiry
const GRACE_WINDOW_MS = 2 * 60 * 60 * 1000;                // 2 hours after expiry
const GRACE_LIVENESS_CHECK_MS = 15 * 60 * 1000;             // Every 15 minutes during grace

/**
 * Pool coverage states
 */
enum CoverageState {
  /** Active underwriting event, normal operation */
  COVERED = 'COVERED',
  /** Within RENEWAL_NOTIFICATION_MS of expiry — underwriter notified */
  RENEWAL_PENDING = 'RENEWAL_PENDING',
  /** After expiry but within GRACE_WINDOW_MS — incidents queued */
  IN_GRACE = 'IN_GRACE',
  /** Grace window expired without renewal — no coverage */
  UNCOVERED = 'UNCOVERED',
}

/**
 * Queued incident during grace period
 */
interface QueuedIncident {
  incident: IncidentReport;
  queuedAt: number;
  idempotencyKey: string;
}

/**
 * THE RENEWAL STATE MACHINE
 *
 * Transitions:
 * COVERED → RENEWAL_PENDING (7 days before expiry)
 * RENEWAL_PENDING → COVERED (renewal signed)
 * RENEWAL_PENDING → IN_GRACE (expiry reached, no renewal yet)
 * IN_GRACE → COVERED (renewal signed during grace)
 * IN_GRACE → UNCOVERED (grace expired, no renewal)
 * UNCOVERED → COVERED (new underwriting event signed)
 */
class RenewalStateMachine {
  private coverageState: CoverageState = CoverageState.COVERED;
  private activeEvent: SignedUnderwritingEvent | null = null;
  private queuedIncidents: QueuedIncident[] = [];
  private renewalTimer: NodeJS.Timeout | null = null;
  private graceTimer: NodeJS.Timeout | null = null;

  constructor(private poolId: string, private policyHash: string) {}

  /**
   * Transition to new coverage state
   */
  async transition(newState: CoverageState, event?: SignedUnderwritingEvent): Promise<void> {
    const oldState = this.coverageState;
    this.coverageState = newState;

    if (event) {
      this.activeEvent = event;
    }

    console.log(`[RENEWAL] Pool ${this.poolId}: ${oldState} → ${newState}`);

    switch (newState) {
      case CoverageState.COVERED:
        await this.onCovered(event!);
        break;
      case CoverageState.RENEWAL_PENDING:
        await this.onRenewalPending();
        break;
      case CoverageState.IN_GRACE:
        await this.onGraceStart();
        break;
      case CoverageState.UNCOVERED:
        await this.onUncovered();
        break;
    }

    // Emit state change event
    await this.emitStateChange(oldState, newState);
  }

  /**
   * COVERED state — normal operation
   */
  private async onCovered(event: SignedUnderwritingEvent): Promise<void> {
    // Clear any grace-related timers
    this.clearTimers();

    // Process any queued incidents from grace period
    if (this.queuedIncidents.length > 0) {
      console.log(`[RENEWAL] Processing ${this.queuedIncidents.length} queued incidents`);
      for (const queued of this.queuedIncidents) {
        await this.executeQueuedIncident(queued);
      }
      this.queuedIncidents = [];
    }

    // Set renewal notification timer
    const notificationTime = event.expiresAt - RENEWAL_NOTIFICATION_MS;
    const delay = notificationTime - Date.now();

    if (delay > 0) {
      this.renewalTimer = setTimeout(() => {
        this.transition(CoverageState.RENEWAL_PENDING);
      }, delay);
    } else {
      // Already within notification window
      await this.transition(CoverageState.RENEWAL_PENDING);
    }
  }

  /**
   * RENEWAL_PENDING — notify underwriter
   */
  private async onRenewalPending(): Promise<void> {
    console.log(`[RENEWAL] Underwriter must renew within ${GRACE_WINDOW_MS / 3600000}h of expiry`);

    // Send notification to underwriter
    await this.notifyUnderwriter();

    // Set grace timer
    const graceStart = this.activeEvent?.expiresAt || Date.now();
    const delay = graceStart - Date.now();

    if (delay > 0) {
      this.graceTimer = setTimeout(() => {
        this.transition(CoverageState.IN_GRACE);
      }, delay);
    }
  }

  /**
   * IN_GRACE — queue incidents, require all reporters active
   */
  private async onGraceStart(): Promise<void> {
    console.log(`[RENEWAL] Grace period started — ${GRACE_WINDOW_MS / 60000}m remaining`);

    // Set grace expiry timer
    this.graceTimer = setTimeout(() => {
      this.transition(CoverageState.UNCOVERED);
    }, GRACE_WINDOW_MS);

    // Begin liveness checks
    this.startGraceLivenessChecks();
  }

  /**
   * UNCOVERED — return premium, reject all incidents
   */
  private async onUncovered(): Promise<void> {
    console.log(`[RENEWAL] Grace expired — pool is UNCOVERED`);

    // Reject all queued incidents
    for (const queued of this.queuedIncidents) {
      console.log(`[RENEWAL] Rejecting queued incident: ${queued.incident.reportId}`);
    }
    this.queuedIncidents = [];

    // Return proportional premium
    await this.returnPremium();

    // Notify governance
    await this.notifyGovernance();
  }

  /**
   * Queue an incident during grace period
   */
  async queueDuringGrace(incident: IncidentReport, idempotencyKey: string): Promise<SlashingDecision> {
    if (this.coverageState !== CoverageState.IN_GRACE) {
      throw new Error('Cannot queue incidents outside grace period');
    }

    // During grace, ALL reporters must be ACTIVE
    const allActive = await this.checkAllReportersActive(incident);
    if (!allActive) {
      return this.rejectIncident(incident, 'GRACE_QUORUM_FAILURE');
    }

    this.queuedIncidents.push({
      incident,
      queuedAt: Date.now(),
      idempotencyKey,
    });

    return {
      decisionId: `queued-${incident.reportId}-${Date.now()}`,
      incidentReportId: incident.reportId,
      poolId: this.poolId,
      policyHash: this.policyHash,
      allowed: false,
      slashAmountCents: 0,
      executed: false,
      signature: '',
    };
  }

  /**
   * Process renewal — underwriter signs new event
   */
  async processRenewal(renewal: UnderwritingRenewalEvent): Promise<boolean> {
    // Verify renewal signature
    const payload = {
      renewalId: renewal.renewalId,
      previousEventId: renewal.previousEventId,
      poolId: renewal.poolId,
      policyHash: renewal.policyHash,
      newEventId: renewal.newEventId,
    };

    const signatureValid = await this.verifyRenewalSignature(payload, renewal.signature);
    if (!signatureValid) {
      console.error(`[RENEWAL] Invalid renewal signature`);
      return false;
    }

    // Verify continuity: new event must reference old event
    if (renewal.previousEventId !== this.activeEvent?.eventId) {
      console.error(`[RENEWAL] Renewal does not reference current active event`);
      return false;
    }

    // Fetch new event
    const newEvent = await this.fetchEvent(renewal.newEventId);
    if (!newEvent) {
      console.error(`[RENEWAL] New event not found: ${renewal.newEventId}`);
      return false;
    }

    // Transition to COVERED with new event
    await this.transition(CoverageState.COVERED, newEvent);

    return true;
  }

  /**
   * Execute a previously queued incident (retroactive coverage)
   */
  private async executeQueuedIncident(queued: QueuedIncident): Promise<void> {
    console.log(`[RENEWAL] Retroactively executing: ${queued.incident.reportId}`);

    const { executeSlash } = await import('./executeSlash');
    await executeSlash(queued.incident, queued.idempotencyKey);
  }

  // ── Helpers ──

  private clearTimers(): void {
    if (this.renewalTimer) clearTimeout(this.renewalTimer);
    if (this.graceTimer) clearTimeout(this.graceTimer);
    this.renewalTimer = null;
    this.graceTimer = null;
  }

  private async notifyUnderwriter(): Promise<void> {
    const event = this.activeEvent;
    if (!event) return;
    console.log(`[RENEWAL] Notifying underwriter: ${event.underwriter}`);
    // Integration: email, webhook, Slack
  }

  private async notifyGovernance(): Promise<void> {
    console.log(`[RENEWAL] Notifying governance: pool ${this.poolId} is UNCOVERED`);
    // Integration: governance vote trigger
  }

  private async returnPremium(): Promise<void> {
    console.log(`[RENEWAL] Returning proportional premium for uncovered period`);
    // Calculate and execute premium return
  }

  private async checkAllReportersActive(incident: IncidentReport): Promise<boolean> {
    const response = await fetch(`http://localhost:3004/quorum-status?poolId=${this.poolId}`);
    const status = await response.json();
    return status.active >= incident.reporterPubKeys.length;
  }

  private async verifyRenewalSignature(payload: unknown, signature: string): Promise<boolean> {
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, signature }),
    });
    const result = await response.json();
    return result.valid;
  }

  private async fetchEvent(eventId: string): Promise<SignedUnderwritingEvent | null> {
    // Fetch from underwriting store
    return null; // Placeholder
  }

  private async emitStateChange(oldState: CoverageState, newState: CoverageState): Promise<void> {
    console.log(`[RENEWAL] State change event: ${this.poolId}: ${oldState} → ${newState}`);
    // Emit to audit log
  }

  private rejectIncident(incident: IncidentReport, reason: string): SlashingDecision {
    return {
      decisionId: `reject-${incident.reportId}-${Date.now()}`,
      incidentReportId: incident.reportId,
      poolId: this.poolId,
      policyHash: this.policyHash,
      allowed: false,
      slashAmountCents: 0,
      executed: false,
      signature: '',
    };
  }
}

export { RenewalStateMachine, CoverageState, GRACE_WINDOW_MS, RENEWAL_NOTIFICATION_MS };
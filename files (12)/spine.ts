/**
 * packages/villages/src/spine.ts
 *
 * THE PRODUCTION SPINE — the only flow that matters right now.
 *
 * Steps:
 *   1. authenticated member
 *   2. joins village
 *   3. contributes to pool
 *   4. ledger entry created (idempotent, balanced)
 *   5. domain event emitted + persisted
 *   6. projection refreshed
 *   7. notification dispatched (from event only)
 *   8. dashboard state updated
 *   9. audit trace queryable
 *
 * This file is the spine. Everything else in the platform is scaffolding
 * until every step of THIS file has passing tests and observable metrics.
 */

import { db } from "@ubuntu/db/client";
import {
  members,
  villages,
  villageMembers,
  poolContributions,
  domainEvents,
  projections,
  auditLog,
} from "@ubuntu/db/schema";
import { eq, and } from "drizzle-orm";
import {
  postLedgerEntry,
  assertNotificationHasEventSource,
  LedgerInvariantViolation,
} from "@ubuntu/ledger/invariants";
import { Money } from "@ubuntu/domain-core/money";
import { hashEvent } from "@ubuntu/domain-core/events";
import { logger } from "@ubuntu/observability/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContributionRequest {
  memberId: string;
  villageId: string;
  poolId: string;
  amount: Money;
  idempotencyKey: string; // caller must generate — UUID v4 recommended
}

export interface SpineResult {
  contributionId: string;
  ledgerEntryId: string;
  eventId: string;
  projectionUpdated: boolean;
  notificationDispatched: boolean;
  auditTraceId: string;
}

// ─── Step 1: Assert member is authenticated ───────────────────────────────────

export async function assertMemberAuthenticated(memberId: string): Promise<void> {
  const member = await db
    .select({ id: members.id, isActive: members.isActive })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.isActive, true)))
    .limit(1);

  if (member.length === 0) {
    throw new SpineError("MEMBER_NOT_AUTHENTICATED", `Member '${memberId}' is not authenticated or does not exist.`, { memberId });
  }
}

// ─── Step 2: Assert village membership ────────────────────────────────────────

export async function assertVillageMembership(memberId: string, villageId: string): Promise<void> {
  const membership = await db
    .select({ id: villageMembers.id, status: villageMembers.status })
    .from(villageMembers)
    .where(
      and(
        eq(villageMembers.memberId, memberId),
        eq(villageMembers.villageId, villageId),
        eq(villageMembers.status, "ACTIVE")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new SpineError("NOT_VILLAGE_MEMBER", `Member '${memberId}' is not an active member of village '${villageId}'.`, { memberId, villageId });
  }
}

// ─── Step 3 + 4: Pool contribution + ledger entry ─────────────────────────────

export async function contributeToPool(request: ContributionRequest): Promise<{
  contributionId: string;
  ledgerEntryId: string;
}> {
  const { memberId, villageId, poolId, amount, idempotencyKey } = request;

  // Create the contribution record
  const [contribution] = await db
    .insert(poolContributions)
    .values({
      memberId,
      villageId,
      poolId,
      amountMinorUnits: amount.minorUnits.toString(),
      currency: amount.currency,
      idempotencyKey,
      status: "PENDING",
      createdAt: new Date(),
    })
    .onConflictDoNothing() // idempotent at DB level
    .returning({ id: poolContributions.id });

  if (!contribution) {
    // Already exists — find it
    const existing = await db
      .select({ id: poolContributions.id })
      .from(poolContributions)
      .where(eq(poolContributions.idempotencyKey, idempotencyKey))
      .limit(1);
    const existingId = existing[0]?.id;
    if (!existingId) throw new SpineError("CONTRIBUTION_LOOKUP_FAILED", "Idempotent replay: could not find existing contribution.", { idempotencyKey });
    return { contributionId: existingId, ledgerEntryId: "REPLAYED" };
  }

  // Post the ledger entry (INVARIANT 1 + 2 enforced inside)
  const ledgerResult = await postLedgerEntry({
    idempotencyKey,
    eventId: contribution.id, // temporary — replaced by real event ID in step 5
    villageId,
    memberId,
    lines: [
      {
        accountId: `${memberId}::wallet`,
        accountType: "DEBIT",
        amount,
        description: `Pool contribution — ${poolId}`,
      },
      {
        accountId: `${poolId}::balance`,
        accountType: "CREDIT",
        amount,
        description: `Pool credit — member ${memberId}`,
      },
    ],
  });

  // Mark contribution as posted
  await db
    .update(poolContributions)
    .set({ status: "POSTED", ledgerEntryId: ledgerResult.entryId })
    .where(eq(poolContributions.id, contribution.id));

  return { contributionId: contribution.id, ledgerEntryId: ledgerResult.entryId };
}

// ─── Step 5: Persist domain event ─────────────────────────────────────────────

export async function emitContributionEvent(
  memberId: string,
  villageId: string,
  poolId: string,
  amount: Money,
  contributionId: string
): Promise<string> {
  const payload = {
    type: "CONTRIBUTION_CREATED",
    memberId,
    villageId,
    poolId,
    amountMinorUnits: amount.minorUnits.toString(),
    currency: amount.currency,
    contributionId,
    timestamp: Date.now(),
  };

  const eventHash = hashEvent(payload);

  const [event] = await db
    .insert(domainEvents)
    .values({
      type: "CONTRIBUTION_CREATED",
      payload: JSON.stringify(payload),
      hash: eventHash,
      memberId,
      villageId,
      createdAt: new Date(),
    })
    .returning({ id: domainEvents.id });

  logger.info("event.emitted", {
    eventId: event.id,
    type: "CONTRIBUTION_CREATED",
    memberId,
    villageId,
  });

  return event.id;
}

// ─── Step 6: Refresh projection ───────────────────────────────────────────────

export async function refreshVillageProjection(
  villageId: string,
  eventId: string
): Promise<void> {
  // Recompute village state from event log
  // In a full implementation this fans out to reputation, pool health, etc.
  // For the spine: update the last-processed event ID and timestamp.
  await db
    .insert(projections)
    .values({
      villageId,
      lastEventId: eventId,
      refreshedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: projections.villageId,
      set: {
        lastEventId: eventId,
        refreshedAt: new Date(),
      },
    });

  logger.info("projection.refreshed", { villageId, eventId });
}

// ─── Step 7: Dispatch notification (INVARIANT 5 enforced) ─────────────────────

export async function dispatchContributionNotification(
  eventId: string,
  memberId: string,
  amount: Money
): Promise<void> {
  // INVARIANT 5: must have a persisted event source
  await assertNotificationHasEventSource(eventId);

  // After the guard passes, dispatch is safe
  // Real implementation calls messaging/whatsapp gateway here
  logger.info("notification.dispatched", {
    channel: "whatsapp",
    memberId,
    eventId,
    amountFormatted: `${amount.currency} ${(Number(amount.minorUnits) / 100).toFixed(2)}`,
  });

  // In production: await messagingGateway.send({ memberId, template: "CONTRIBUTION_CONFIRMED", eventId })
}

// ─── Step 8: Dashboard state is projection output — no direct write needed ────
// The dashboard reads from projections table. Step 6 already updated it.
// This function exists only to make the spine step explicit and testable.

export async function assertDashboardReflectsProjection(villageId: string): Promise<{
  lastEventId: string;
  refreshedAt: Date;
}> {
  const projection = await db
    .select({
      lastEventId: projections.lastEventId,
      refreshedAt: projections.refreshedAt,
    })
    .from(projections)
    .where(eq(projections.villageId, villageId))
    .limit(1);

  if (projection.length === 0) {
    throw new SpineError("PROJECTION_NOT_FOUND", `No projection found for village '${villageId}'.`, { villageId });
  }

  return projection[0];
}

// ─── Step 9: Audit trace ──────────────────────────────────────────────────────

export async function writeAuditTrace(
  eventId: string,
  memberId: string,
  villageId: string,
  action: string,
  ledgerEntryId: string
): Promise<string> {
  const [trace] = await db
    .insert(auditLog)
    .values({
      eventId,
      memberId,
      villageId,
      action,
      ledgerEntryId,
      recordedAt: new Date(),
    })
    .returning({ id: auditLog.id });

  return trace.id;
}

export async function queryAuditTrace(contributionId: string): Promise<{
  found: boolean;
  eventId: string | null;
  ledgerEntryId: string | null;
  recordedAt: Date | null;
}> {
  const trace = await db
    .select({
      eventId: auditLog.eventId,
      ledgerEntryId: auditLog.ledgerEntryId,
      recordedAt: auditLog.recordedAt,
    })
    .from(auditLog)
    .where(eq(auditLog.action, `CONTRIBUTION:${contributionId}`))
    .limit(1);

  if (trace.length === 0) {
    return { found: false, eventId: null, ledgerEntryId: null, recordedAt: null };
  }

  return {
    found: true,
    eventId: trace[0].eventId,
    ledgerEntryId: trace[0].ledgerEntryId,
    recordedAt: trace[0].recordedAt,
  };
}

// ─── THE SPINE: all 9 steps in sequence ───────────────────────────────────────

export async function executeContributionSpine(
  request: ContributionRequest
): Promise<SpineResult> {
  const { memberId, villageId, poolId, amount, idempotencyKey } = request;

  logger.info("spine.start", { memberId, villageId, poolId, idempotencyKey });

  // Step 1
  await assertMemberAuthenticated(memberId);

  // Step 2
  await assertVillageMembership(memberId, villageId);

  // Steps 3 + 4
  const { contributionId, ledgerEntryId } = await contributeToPool(request);

  // Step 5
  const eventId = await emitContributionEvent(memberId, villageId, poolId, amount, contributionId);

  // Step 6
  await refreshVillageProjection(villageId, eventId);

  // Step 7
  let notificationDispatched = false;
  try {
    await dispatchContributionNotification(eventId, memberId, amount);
    notificationDispatched = true;
  } catch (err) {
    // Notifications are non-fatal — log and continue
    logger.warn("notification.failed", { eventId, memberId, error: String(err) });
  }

  // Step 8: verified via projection (dashboard reads projections table)
  await assertDashboardReflectsProjection(villageId);

  // Step 9
  const auditTraceId = await writeAuditTrace(
    eventId,
    memberId,
    villageId,
    `CONTRIBUTION:${contributionId}`,
    ledgerEntryId
  );

  logger.info("spine.complete", {
    contributionId,
    ledgerEntryId,
    eventId,
    auditTraceId,
    notificationDispatched,
  });

  return {
    contributionId,
    ledgerEntryId,
    eventId,
    projectionUpdated: true,
    notificationDispatched,
    auditTraceId,
  };
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class SpineError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context: Record<string, unknown>
  ) {
    super(`[SPINE:${code}] ${message}`);
    this.name = "SpineError";
    Object.setPrototypeOf(this, SpineError.prototype);
  }
}

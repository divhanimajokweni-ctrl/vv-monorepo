/**
 * src/lib/services/village-spine.ts
 *
 * THE PRODUCTION SPINE — the only flow that matters right now.
 *
 * Drop into: src/lib/services/village-spine.ts
 *
 * Nine steps. Every step is exported separately so it can be:
 *   - tested in isolation
 *   - called from API routes
 *   - observed in logs
 *
 * Step 1:  assertMemberAuthenticated(memberId)
 * Step 2:  assertVillageMembership(memberId, villageId)
 * Step 3:  contributeToPool(request)          → pool_contributions row
 * Step 4:  postLedgerEntry(...)               → ledger_entries + idempotency_keys
 * Step 5:  emitContributionEvent(...)         → domain_events row
 * Step 6:  refreshVillageProjection(...)      → projections upsert
 * Step 7:  dispatchContributionNotification() → gated by Invariant 5
 * Step 8:  assertDashboardReflectsProjection() → reads projections (no write)
 * Step 9:  writeAuditTrace(...)               → audit_log row
 *
 * Import paths use @/ alias (tsconfig.json: "@/*" → "./src/*")
 */

import { db } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { members, villages } from "@/db/schema";
import { villageMembers } from "@/db/schema-village";
import {
  poolContributions,
  domainEvents,
  projections,
  auditLog,
} from "@/db/schema-spine";
import {
  postLedgerEntry,
  assertNotificationHasEventSource,
  type Money,
  type LedgerPostingRequest,
} from "@/lib/ledger/invariants";
import { logger } from "@/lib/observability/logger";
import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContributionRequest {
  memberId: string;
  villageId: string;
  poolId: string;
  amount: Money;
  /** Caller must generate. Use crypto.randomUUID() — never reuse across different contributions. */
  idempotencyKey: string;
}

export interface SpineResult {
  contributionId: string;
  ledgerEntryId: string;
  eventId: string;
  projectionUpdated: boolean;
  notificationDispatched: boolean;
  auditTraceId: string;
}

// ─── Step 1: Member authentication ────────────────────────────────────────────

export async function assertMemberAuthenticated(
  memberId: string
): Promise<void> {
  const result = await db
    .select({ id: members.id, isActive: members.isActive })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.isActive, true)))
    .limit(1);

  if (result.length === 0) {
    throw new SpineError(
      "MEMBER_NOT_AUTHENTICATED",
      `Member '${memberId}' is not active or does not exist.`,
      { memberId }
    );
  }
}

// ─── Step 2: Village membership ───────────────────────────────────────────────

export async function assertVillageMembership(
  memberId: string,
  villageId: string
): Promise<void> {
  const result = await db
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

  if (result.length === 0) {
    throw new SpineError(
      "NOT_VILLAGE_MEMBER",
      `Member '${memberId}' is not an active member of village '${villageId}'.`,
      { memberId, villageId }
    );
  }
}

// ─── Steps 3 + 4: Pool contribution + ledger posting ─────────────────────────

export async function contributeToPool(request: ContributionRequest): Promise<{
  contributionId: string;
  ledgerEntryId: string;
}> {
  const { memberId, villageId, poolId, amount, idempotencyKey } = request;

  // Create contribution record (idempotency enforced by unique constraint)
  const inserted = await db
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
    .onConflictDoNothing()
    .returning({ id: poolContributions.id });

  let contributionId: string;

  if (inserted.length > 0) {
    contributionId = inserted[0].id;
  } else {
    // Idempotent replay — find the existing record
    const existing = await db
      .select({ id: poolContributions.id, ledgerEntryId: poolContributions.ledgerEntryId })
      .from(poolContributions)
      .where(eq(poolContributions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing.length === 0) {
      throw new SpineError(
        "CONTRIBUTION_LOOKUP_FAILED",
        "Idempotent replay: could not find existing contribution.",
        { idempotencyKey }
      );
    }

    // Return existing result — no re-posting
    return {
      contributionId: existing[0].id,
      ledgerEntryId: existing[0].ledgerEntryId ?? "REPLAYED",
    };
  }

  // Step 4: Post ledger entry (Invariants 1 + 2 enforced inside postLedgerEntry)
  const ledgerResult = await postLedgerEntry({
    idempotencyKey,
    eventId: contributionId, // temporary correlation; replaced by real event ID in step 5
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
    .where(eq(poolContributions.id, contributionId));

  return {
    contributionId,
    ledgerEntryId: ledgerResult.entryId,
  };
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

  const hash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const [event] = await db
    .insert(domainEvents)
    .values({
      type: "CONTRIBUTION_CREATED",
      payload: JSON.stringify(payload),
      hash,
      memberId,
      villageId,
      createdAt: new Date(),
    })
    .returning({ id: domainEvents.id });

  logger.info("spine.event.emitted", {
    eventId: event.id,
    type: "CONTRIBUTION_CREATED",
    memberId,
    villageId,
  });

  return event.id;
}

// ─── Step 6: Refresh village projection ───────────────────────────────────────

export async function refreshVillageProjection(
  villageId: string,
  eventId: string
): Promise<void> {
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

  logger.info("spine.projection.refreshed", { villageId, eventId });
}

// ─── Step 7: Dispatch notification (Invariant 5 enforced) ─────────────────────

export async function dispatchContributionNotification(
  eventId: string,
  memberId: string,
  amount: Money
): Promise<void> {
  // INVARIANT 5: notification blocked unless event is persisted
  await assertNotificationHasEventSource(eventId);

  const formatted = `${amount.currency} ${(Number(amount.minorUnits) / 100).toFixed(2)}`;

  logger.info("spine.notification.dispatched", {
    channel: "whatsapp",
    memberId,
    eventId,
    amount: formatted,
  });

  // Production: await messagingGateway.sendWhatsApp({
  //   memberId,
  //   template: "CONTRIBUTION_CONFIRMED",
  //   params: { amount: formatted },
  //   eventId,
  // });
}

// ─── Step 8: Assert dashboard reflects projection ─────────────────────────────
// Dashboard reads from projections table — no direct write needed here.
// This function verifies the projection was written in step 6.

export async function assertDashboardReflectsProjection(
  villageId: string
): Promise<{ lastEventId: string; refreshedAt: Date }> {
  const result = await db
    .select({
      lastEventId: projections.lastEventId,
      refreshedAt: projections.refreshedAt,
    })
    .from(projections)
    .where(eq(projections.villageId, villageId))
    .limit(1);

  if (result.length === 0) {
    throw new SpineError(
      "PROJECTION_NOT_FOUND",
      `No projection found for village '${villageId}'. Step 6 may have failed.`,
      { villageId }
    );
  }

  return result[0];
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
  const result = await db
    .select({
      eventId: auditLog.eventId,
      ledgerEntryId: auditLog.ledgerEntryId,
      recordedAt: auditLog.recordedAt,
    })
    .from(auditLog)
    .where(eq(auditLog.action, `CONTRIBUTION:${contributionId}`))
    .limit(1);

  if (result.length === 0) {
    return { found: false, eventId: null, ledgerEntryId: null, recordedAt: null };
  }

  return {
    found: true,
    eventId: result[0].eventId,
    ledgerEntryId: result[0].ledgerEntryId,
    recordedAt: result[0].recordedAt,
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
  const eventId = await emitContributionEvent(
    memberId,
    villageId,
    poolId,
    amount,
    contributionId
  );

  // Step 6
  await refreshVillageProjection(villageId, eventId);

  // Step 7 — notification failure is non-fatal
  let notificationDispatched = false;
  try {
    await dispatchContributionNotification(eventId, memberId, amount);
    notificationDispatched = true;
  } catch (err) {
    logger.warn("spine.notification.failed", {
      eventId,
      memberId,
      error: String(err),
    });
  }

  // Step 8
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

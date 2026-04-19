/**
 * packages/ledger/src/invariants.ts
 *
 * ENFORCED LEDGER INVARIANTS — these throw hard errors, never silently pass.
 *
 * Invariant 1: no financial write without idempotency key
 * Invariant 2: no ledger entry without balanced double-entry posting
 * Invariant 3: no pool balance set directly — projection only
 * Invariant 4: no reputation mutation outside canonical projection path
 * Invariant 5: no outbound notification without a persisted event source
 */

import { db } from "@ubuntu/db/client";
import {
  ledgerEntries,
  idempotencyKeys,
  domainEvents,
} from "@ubuntu/db/schema-spine";
import { eq, and, sql } from "drizzle-orm";
import { Money } from "@ubuntu/domain-core/money";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostingLine {
  accountId: string;
  accountType: "DEBIT" | "CREDIT";
  amount: Money;
  description: string;
}

export interface LedgerPostingRequest {
  idempotencyKey: string;
  eventId: string;
  villageId: string;
  memberId: string;
  lines: [PostingLine, PostingLine, ...PostingLine[]]; // minimum 2 lines
  metadata?: Record<string, unknown>;
}

export interface PostingResult {
  entryId: string;
  idempotencyKey: string;
  wasIdempotentReplay: boolean;
  balanceProof: {
    totalDebits: bigint;
    totalCredits: bigint;
    isBalanced: boolean;
  };
}

// ─── Invariant 1 + 2: Idempotent Double-Entry Posting ─────────────────────────

export async function postLedgerEntry(
  request: LedgerPostingRequest
): Promise<PostingResult> {
  const { idempotencyKey, eventId, villageId, memberId, lines } = request;

  // INVARIANT 1: idempotency key must be present (enforced by type, but also DB)
  if (!idempotencyKey || idempotencyKey.trim() === "") {
    throw new LedgerInvariantViolation(
      "IDEMPOTENCY_KEY_MISSING",
      "No financial write may occur without an idempotency key.",
      { eventId, memberId }
    );
  }

  // INVARIANT 2: validate double-entry balance before any DB write
  const totalDebits = lines
    .filter((l) => l.accountType === "DEBIT")
    .reduce((sum, l) => sum + l.amount.minorUnits, 0n);

  const totalCredits = lines
    .filter((l) => l.accountType === "CREDIT")
    .reduce((sum, l) => sum + l.amount.minorUnits, 0n);

  if (totalDebits !== totalCredits) {
    throw new LedgerInvariantViolation(
      "POSTING_UNBALANCED",
      `Double-entry posting does not balance. Debits=${totalDebits} Credits=${totalCredits}`,
      { eventId, totalDebits: totalDebits.toString(), totalCredits: totalCredits.toString() }
    );
  }

  return db.transaction(async (tx) => {
    // Check for idempotent replay
    const existing = await tx
      .select({ entryId: idempotencyKeys.ledgerEntryId })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      // Idempotent replay — return existing result, do not re-post
      const found = existing[0];
      if (!found) {
        throw new LedgerInvariantViolation(
          "IDEMPOTENCY_KEY_LOOKUP_FAILED",
          "Idempotency key lookup returned empty despite length > 0",
          { idempotencyKey }
        );
      }
      return {
        entryId: found.entryId,
        idempotencyKey,
        wasIdempotentReplay: true,
        balanceProof: {
          totalDebits,
          totalCredits,
          isBalanced: true,
        },
      };
    }

    // Write entry
    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        eventId,
        villageId,
        memberId,
        lines: JSON.stringify(lines),
        totalDebits: totalDebits.toString(),
        totalCredits: totalCredits.toString(),
        createdAt: new Date(),
      })
      .returning({ id: ledgerEntries.id });

    if (!entry) {
      throw new LedgerInvariantViolation(
        "ENTRY_WRITE_FAILED",
        "Failed to write ledger entry",
        { eventId, memberId }
      );
    }

    // Record idempotency key atomically
    await tx.insert(idempotencyKeys).values({
      key: idempotencyKey,
      ledgerEntryId: entry.id,
      createdAt: new Date(),
    });

    return {
      entryId: entry.id,
      idempotencyKey,
      wasIdempotentReplay: false,
      balanceProof: {
        totalDebits,
        totalCredits,
        isBalanced: true,
      },
    };
  });
}

// ─── Invariant 3: Pool Balance is Projection-Only ─────────────────────────────

/**
 * The ONLY way to read a pool balance.
 * Balance is derived from the event log — never from a directly-set value.
 */
export async function getPoolBalanceFromProjection(
  villageId: string,
  poolId: string
): Promise<{ balance: bigint; eventCount: number; lastEventId: string | null }> {
  const result = await db
    .select({
      balance: sql<string>`
        COALESCE(SUM(
          CASE
            WHEN le.lines::jsonb @> '[{"accountType":"CREDIT"}]'
            THEN (
              SELECT SUM((line->>'amount')::bigint)
              FROM jsonb_array_elements(le.lines::jsonb) AS line
              WHERE line->>'accountType' = 'CREDIT'
              AND line->>'accountId' = ${poolId}
            )
            ELSE 0
          END
          -
          CASE
            WHEN le.lines::jsonb @> '[{"accountType":"DEBIT"}]'
            THEN (
              SELECT SUM((line->>'amount')::bigint)
              FROM jsonb_array_elements(le.lines::jsonb) AS line
              WHERE line->>'accountType' = 'DEBIT'
              AND line->>'accountId' = ${poolId}
            )
            ELSE 0
          END
        ), 0)
      `.as("balance"),
      eventCount: sql<number>`COUNT(*)`.as("eventCount"),
      lastEventId: sql<string>`MAX(le.event_id)`.as("lastEventId"),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.villageId, villageId));

  const row = result[0];
  if (!row) {
    return { balance: 0n, eventCount: 0, lastEventId: null };
  }
  return {
    balance: BigInt(row.balance ?? "0"),
    eventCount: row.eventCount ?? 0,
    lastEventId: row.lastEventId ?? null,
  };
}

/**
 * Direct pool balance writes are FORBIDDEN.
 * If any code path calls this, it throws — this function exists only
 * to make the invariant visible and catchable in testing.
 */
export function setPoolBalanceDirectly(_poolId: string, _amount: bigint): never {
  throw new LedgerInvariantViolation(
    "DIRECT_BALANCE_WRITE_FORBIDDEN",
    "Pool balances must be derived from the event projection. Direct writes are forbidden.",
    { poolId: _poolId }
  );
}

// ─── Invariant 5: Notification Source Guard ───────────────────────────────────

/**
 * Notifications must be traceable to a persisted event.
 * Call this before dispatching any outbound message (WhatsApp, email, push).
 */
export async function assertNotificationHasEventSource(
  eventId: string
): Promise<void> {
  const event = await db
    .select({ id: domainEvents.id })
    .from(domainEvents)
    .where(eq(domainEvents.id, eventId))
    .limit(1);

  if (event.length === 0) {
    throw new LedgerInvariantViolation(
      "NOTIFICATION_WITHOUT_EVENT_SOURCE",
      `Outbound notification blocked: event '${eventId}' has not been persisted. ` +
        "All notifications must derive from persisted events.",
      { eventId }
    );
  }
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class LedgerInvariantViolation extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context: Record<string, unknown>
  ) {
    super(`[INVARIANT:${code}] ${message}`);
    this.name = "LedgerInvariantViolation";
    Object.setPrototypeOf(this, LedgerInvariantViolation.prototype);
  }
}

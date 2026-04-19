/**
 * src/lib/ledger/invariants.ts
 *
 * ENFORCED LEDGER INVARIANTS
 * Drop into: src/lib/ledger/invariants.ts
 *
 * Five hard guarantees. Each throws a typed LedgerInvariantViolation
 * with a machine-readable code — never silently passes.
 *
 * Invariant 1: no financial write without idempotency key
 * Invariant 2: no ledger entry without balanced double-entry posting
 * Invariant 3: no pool balance set directly — projection only
 * Invariant 4: no reputation mutation outside canonical projection path
 * Invariant 5: no outbound notification without a persisted event source
 *
 * Import paths use the repo's @/ alias (tsconfig.json: "@/*" → "./src/*")
 */

import { db } from "@/db/client";
import { sql, eq } from "drizzle-orm";
import {
  ledgerEntries,
  idempotencyKeys,
  domainEvents,
} from "@/db/schema-spine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Money {
  minorUnits: bigint; // always in smallest currency unit (cents / ngwee / etc.)
  currency: "ZAR" | "USD" | "KES" | "GHS";
}

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
  lines: [PostingLine, PostingLine, ...PostingLine[]]; // minimum 2 lines required by type
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

  // INVARIANT 1 — idempotency key required, non-empty
  if (!idempotencyKey || idempotencyKey.trim() === "") {
    throw new LedgerInvariantViolation(
      "IDEMPOTENCY_KEY_MISSING",
      "No financial write may occur without an idempotency key.",
      { eventId, memberId }
    );
  }

  // INVARIANT 2 — validate double-entry balance before any DB write
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
      {
        eventId,
        totalDebits: totalDebits.toString(),
        totalCredits: totalCredits.toString(),
      }
    );
  }

  // Both invariants pass — proceed inside a transaction
  return db.transaction(async (tx) => {
    // Check for idempotent replay (key already exists)
    const existing = await tx
      .select({ entryId: idempotencyKeys.ledgerEntryId })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, idempotencyKey))
      .limit(1);

    if (existing.length > 0 && existing[0].entryId) {
      return {
        entryId: existing[0].entryId,
        idempotencyKey,
        wasIdempotentReplay: true,
        balanceProof: { totalDebits, totalCredits, isBalanced: true },
      };
    }

    // Write the ledger entry
    const jsonSafeLines = lines.map((l) => ({
      ...l,
      amount: { ...l.amount, minorUnits: l.amount.minorUnits.toString() },
    }));

    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        eventId,
        villageId,
        memberId,
        lines: JSON.stringify(jsonSafeLines),
        totalDebits: totalDebits.toString(),
        totalCredits: totalCredits.toString(),
        createdAt: new Date(),
      })
      .returning({ id: ledgerEntries.id });

    // Record idempotency key atomically in same transaction
    await tx.insert(idempotencyKeys).values({
      key: idempotencyKey,
      ledgerEntryId: entry.id,
      createdAt: new Date(),
    });

    return {
      entryId: entry.id,
      idempotencyKey,
      wasIdempotentReplay: false,
      balanceProof: { totalDebits, totalCredits, isBalanced: true },
    };
  });
}

// ─── Invariant 3: Pool Balance is Projection-Only ─────────────────────────────

/**
 * The ONLY correct way to read a pool balance.
 * Derived from event log via ledger_entries — never from a directly-set column.
 */
export async function getPoolBalanceFromProjection(
  villageId: string,
  poolId: string
): Promise<{
  balance: bigint;
  entryCount: number;
  lastEntryId: string | null;
}> {
  const rows = await db.execute(sql`
    SELECT
      COALESCE(
        SUM(
          CASE WHEN credit_lines.amount IS NOT NULL THEN credit_lines.amount ELSE 0 END
          - CASE WHEN debit_lines.amount IS NOT NULL THEN debit_lines.amount ELSE 0 END
        ), 0
      )::bigint AS balance,
      COUNT(le.id)::int AS entry_count,
      MAX(le.id) AS last_entry_id
    FROM ledger_entries le
    LEFT JOIN LATERAL (
      SELECT SUM((line->>'amount')::bigint) AS amount
      FROM jsonb_array_elements(le.lines::jsonb) AS line
      WHERE line->>'accountType' = 'CREDIT'
        AND line->>'accountId' = ${poolId}
    ) credit_lines ON true
    LEFT JOIN LATERAL (
      SELECT SUM((line->>'amount')::bigint) AS amount
      FROM jsonb_array_elements(le.lines::jsonb) AS line
      WHERE line->>'accountType' = 'DEBIT'
        AND line->>'accountId' = ${poolId}
    ) debit_lines ON true
    WHERE le.village_id = ${villageId}
  `);

  const row = rows.rows[0] as {
    balance: string;
    entry_count: number;
    last_entry_id: string | null;
  };

  return {
    balance: BigInt(row.balance ?? "0"),
    entryCount: row.entry_count ?? 0,
    lastEntryId: row.last_entry_id ?? null,
  };
}

/**
 * Direct pool balance writes are FORBIDDEN.
 * This function exists to make the invariant explicit and catchable in tests.
 * Any code path that calls this function is a bug.
 */
export function setPoolBalanceDirectly(
  _poolId: string,
  _amount: bigint
): never {
  throw new LedgerInvariantViolation(
    "DIRECT_BALANCE_WRITE_FORBIDDEN",
    "Pool balances must be derived from the event projection. Direct writes are forbidden.",
    { poolId: _poolId }
  );
}

// ─── Invariant 4: Reputation mutation guard ───────────────────────────────────

/**
 * Call before any write to a member's ubuntu_score.
 * The score must only change as the output of the canonical projection pipeline,
 * triggered by a persisted domain event.
 */
export async function assertReputationMutationIsFromProjection(
  eventId: string,
  triggeredBy: "PROJECTION" | "DIRECT_WRITE"
): Promise<void> {
  if (triggeredBy === "DIRECT_WRITE") {
    throw new LedgerInvariantViolation(
      "REPUTATION_DIRECT_WRITE_FORBIDDEN",
      "Ubuntu Score must only be mutated by the canonical reputation projection pipeline. " +
        "Direct writes bypass event sourcing and break auditability.",
      { eventId }
    );
  }

  // Verify the triggering event actually exists
  await assertEventIsPersisted(eventId);
}

// ─── Invariant 5: Notification source guard ───────────────────────────────────

/**
 * Call before dispatching any outbound message (WhatsApp, email, push, webhook).
 * Every notification must be traceable to a persisted domain event.
 */
export async function assertNotificationHasEventSource(
  eventId: string
): Promise<void> {
  await assertEventIsPersisted(eventId);
}

// ─── Shared: event persistence check ─────────────────────────────────────────

async function assertEventIsPersisted(eventId: string): Promise<void> {
  const event = await db
    .select({ id: domainEvents.id })
    .from(domainEvents)
    .where(eq(domainEvents.id, eventId))
    .limit(1);

  if (event.length === 0) {
    throw new LedgerInvariantViolation(
      "EVENT_NOT_PERSISTED",
      `Operation blocked: event '${eventId}' has not been persisted to domain_events. ` +
        "All writes and outbound messages must derive from persisted events.",
      { eventId }
    );
  }
}

// ─── Error class ──────────────────────────────────────────────────────────────

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

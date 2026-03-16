/**
 * Ubuntu Pools — Phase 1: Journal Posting Engine
 *
 * Processes events and creates balanced double-entry journal entries.
 *
 * Governance Charter Compliance:
 *   - Every posting creates exactly balanced debit/credit pairs.
 *   - Balance is asserted before committing (DB function call).
 *   - All monetary values are integer minor units.
 *   - Journal entries are immutable once written.
 *   - Posting failures emit a 'ledger.transaction_failed' event.
 *   - Posting successes emit a 'ledger.transaction_posted' event.
 *   - No posting occurs without a valid posting rule.
 *   - Currency must match the account's currency.
 *
 * Double-Entry Rules:
 *   - Every transaction has at least one debit and one credit.
 *   - Total debits MUST equal total credits within a transaction_id.
 *   - Amounts are always positive integers (side determines direction).
 *
 * Failure Modes:
 *   - PostingRuleNotFoundError: no active rule for event type
 *   - AccountNotFoundError: debit or credit account doesn't exist
 *   - CurrencyMismatchError: payload currency ≠ account currency
 *   - AmountExtractionError: cannot extract amount from payload
 *   - BalanceAssertionError: debit total ≠ credit total (should never happen)
 *   - DuplicateTransactionError: transaction_id already exists
 */

import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Database } from "@/db/client";
import {
  events,
  ledgerAccounts,
  journalEntries,
  postingRules,
} from "@/db/schema";
import type { Event, LedgerAccount, PostingRule, NewJournalEntry } from "@/db/schema";
import type { EventEmitter } from "@/lib/events/emitter";

// =============================================================================
// ERROR TYPES
// =============================================================================

export class PostingError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly eventId: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PostingError";
  }
}

export class PostingRuleNotFoundError extends PostingError {
  constructor(eventType: string, eventId: string) {
    super(
      `No active posting rule found for event type '${eventType}'`,
      "RULE_NOT_FOUND",
      eventId
    );
    this.name = "PostingRuleNotFoundError";
  }
}

export class AccountNotFoundError extends PostingError {
  constructor(accountCode: string, eventId: string) {
    super(
      `Ledger account with code '${accountCode}' not found`,
      "ACCOUNT_NOT_FOUND",
      eventId
    );
    this.name = "AccountNotFoundError";
  }
}

export class CurrencyMismatchError extends PostingError {
  constructor(
    accountCode: string,
    accountCurrency: string,
    payloadCurrency: string,
    eventId: string
  ) {
    super(
      `Currency mismatch for account '${accountCode}': account is ${accountCurrency}, payload has ${payloadCurrency}`,
      "CURRENCY_MISMATCH",
      eventId
    );
    this.name = "CurrencyMismatchError";
  }
}

export class AmountExtractionError extends PostingError {
  constructor(path: string, payload: unknown, eventId: string) {
    super(
      `Cannot extract amount from payload at path '${path}'. Payload: ${JSON.stringify(payload)}`,
      "AMOUNT_EXTRACTION_FAILED",
      eventId
    );
    this.name = "AmountExtractionError";
  }
}

export class BalanceAssertionError extends PostingError {
  constructor(
    transactionId: string,
    debitTotal: number,
    creditTotal: number,
    eventId: string
  ) {
    super(
      `Balance assertion failed for transaction ${transactionId}: debits=${debitTotal}, credits=${creditTotal}`,
      "BALANCE_ASSERTION_FAILED",
      eventId
    );
    this.name = "BalanceAssertionError";
  }
}

export class DuplicateTransactionError extends PostingError {
  constructor(transactionId: string, eventId: string) {
    super(
      `Transaction ${transactionId} already exists in journal_entries`,
      "DUPLICATE_TRANSACTION",
      eventId
    );
    this.name = "DuplicateTransactionError";
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of a successful posting.
 */
export interface PostingResult {
  transactionId: string;
  eventId: string;
  postingRuleId: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number;
  currency: string;
  entryCount: number;
  postedAt: Date;
}

/**
 * A prepared journal entry before DB insert.
 */
interface PreparedEntry {
  accountId: string;
  accountCode: string;
  side: "debit" | "credit";
  amount: number;
  currency: string;
  description: string;
  sequenceNo: number;
}

// =============================================================================
// PAYLOAD PATH EXTRACTION
// =============================================================================

/**
 * Extracts a value from a nested object using a dot-notation path.
 *
 * Supports:
 *   - Simple paths: 'amount'
 *   - Nested paths: 'contribution.amount_cents'
 *   - JSONPath-style with leading $.: '$.amount' or '$.contribution.amount'
 *
 * @param payload - The event payload object
 * @param path - Dot-notation path to the value
 * @returns The extracted value, or undefined if not found
 */
export function extractFromPayload(
  payload: Record<string, unknown>,
  path: string
): unknown {
  // Strip leading '$.' if present (JSONPath style)
  const normalizedPath = path.startsWith("$.") ? path.slice(2) : path;

  const parts = normalizedPath.split(".");
  let current: unknown = payload;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Extracts and validates an amount (positive integer) from a payload.
 *
 * @param payload - The event payload
 * @param path - Path to the amount field
 * @param eventId - For error context
 * @returns The amount as a positive integer
 * @throws AmountExtractionError if extraction fails or value is invalid
 */
export function extractAmount(
  payload: Record<string, unknown>,
  path: string,
  eventId: string
): number {
  const raw = extractFromPayload(payload, path);

  if (raw === undefined || raw === null) {
    throw new AmountExtractionError(path, payload, eventId);
  }

  // Reject non-numeric types — string coercion is not permitted.
  // Monetary values MUST be explicit numbers in the payload (governance requirement).
  if (typeof raw !== "number") {
    throw new AmountExtractionError(path, payload, eventId);
  }

  const amount = raw;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AmountExtractionError(path, payload, eventId);
  }

  return amount;
}

/**
 * Extracts and validates a currency code from a payload.
 *
 * @param payload - The event payload
 * @param path - Path to the currency field
 * @param eventId - For error context
 * @returns The currency code (3 uppercase letters)
 * @throws AmountExtractionError if extraction fails or value is invalid
 */
export function extractCurrency(
  payload: Record<string, unknown>,
  path: string,
  eventId: string
): string {
  const raw = extractFromPayload(payload, path);

  if (typeof raw !== "string" || !/^[A-Z]{3}$/.test(raw)) {
    throw new AmountExtractionError(path, payload, eventId);
  }

  return raw;
}

// =============================================================================
// ACCOUNT CODE TEMPLATE RESOLUTION
// =============================================================================

/**
 * Resolves template variables in an account code.
 *
 * Supported templates:
 *   {entity_id}  → replaced with event.entityId
 *   {actor_id}   → replaced with event.actorId
 *
 * @param template - Account code template string
 * @param event - The event being processed
 * @returns Resolved account code
 */
export function resolveAccountCode(template: string, event: Event): string {
  return template
    .replace(/\{entity_id\}/g, event.entityId)
    .replace(/\{actor_id\}/g, event.actorId);
}

/**
 * Resolves template variables in a description template.
 *
 * Supported templates:
 *   {event_type}  → replaced with event.eventType
 *   {entity_id}   → replaced with event.entityId
 *   {actor_id}    → replaced with event.actorId
 *   {sequence_no} → replaced with event.sequenceNo
 *
 * @param template - Description template string
 * @param event - The event being processed
 * @returns Resolved description string
 */
export function resolveDescription(template: string, event: Event): string {
  return template
    .replace(/\{event_type\}/g, event.eventType)
    .replace(/\{entity_id\}/g, event.entityId)
    .replace(/\{actor_id\}/g, event.actorId)
    .replace(/\{sequence_no\}/g, String(event.sequenceNo));
}

// =============================================================================
// POSTING ENGINE
// =============================================================================

/**
 * PostingEngine: processes events and creates double-entry journal entries.
 *
 * Design principles:
 *   1. One posting rule per event type (active rules only).
 *   2. Debit and credit accounts must exist and have matching currency.
 *   3. Amount and currency extracted from event payload via configured paths.
 *   4. Balance is asserted before committing (DB-level assertion).
 *   5. Event status is transitioned to 'posted' or 'failed' after processing.
 *   6. Audit events are emitted for both success and failure.
 */
export class PostingEngine {
  constructor(
    private readonly db: Database,
    private readonly emitter: EventEmitter
  ) {}

  /**
   * Processes a single event: looks up the posting rule, creates journal entries,
   * asserts balance, and transitions the event status.
   *
   * @param eventId - UUID of the event to process
   * @returns PostingResult on success
   * @throws PostingError subclass on failure (event is marked 'failed')
   */
  async processEvent(eventId: string): Promise<PostingResult> {
    // Load the event
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new PostingError(
        `Event ${eventId} not found`,
        "UNKNOWN_ERROR",
        eventId
      );
    }

    if (event.status !== "pending") {
      throw new PostingError(
        `Event ${eventId} is in status '${event.status}', expected 'pending'`,
        "UNKNOWN_ERROR",
        eventId
      );
    }

    try {
      const result = await this.executePosting(event);

      // Transition event to 'posted'
      await this.emitter.transitionStatus(eventId, "posted");

      // Emit audit event
      await this.emitPostingSuccessEvent(event, result);

      return result;
    } catch (error) {
      // Transition event to 'failed'
      try {
        await this.emitter.transitionStatus(eventId, "failed");
      } catch {
        // If status transition fails, log but don't mask the original error
        console.error(
          `[PostingEngine] Failed to mark event ${eventId} as failed:`,
          error
        );
      }

      // Emit audit event for failure
      await this.emitPostingFailureEvent(event, error);

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Processes all pending events in order.
   * Returns results for each event (success or failure).
   *
   * @returns Array of results (success) and errors (failure)
   */
  async processPendingEvents(): Promise<{
    succeeded: PostingResult[];
    failed: Array<{ eventId: string; error: PostingError }>;
  }> {
    const pendingEvents = await this.db
      .select()
      .from(events)
      .where(eq(events.status, "pending"))
      .orderBy(events.occurredAt);

    const succeeded: PostingResult[] = [];
    const failed: Array<{ eventId: string; error: PostingError }> = [];

    for (const event of pendingEvents) {
      try {
        const result = await this.processEvent(event.id);
        succeeded.push(result);
      } catch (error) {
        if (error instanceof PostingError) {
          failed.push({ eventId: event.id, error });
        } else {
          failed.push({
            eventId: event.id,
            error: new PostingError(
              String(error),
              "UNKNOWN_ERROR",
              event.id,
              error
            ),
          });
        }
      }
    }

    return { succeeded, failed };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Core posting logic
  // ---------------------------------------------------------------------------

  /**
   * Executes the posting for a single event within a transaction.
   * Does NOT transition event status (caller handles that).
   */
  private async executePosting(event: Event): Promise<PostingResult> {
    return await this.db.transaction(async (tx) => {
      const txDb = tx as unknown as Database;

      // 1. Find active posting rule for this event type
      const rule = await this.findPostingRule(txDb, event.eventType, event.id);

      // 2. Resolve account codes (template substitution)
      const debitCode = resolveAccountCode(rule.debitAccountCode, event);
      const creditCode = resolveAccountCode(rule.creditAccountCode, event);

      // 3. Look up accounts
      const debitAccount = await this.findAccount(txDb, debitCode, event.id);
      const creditAccount = await this.findAccount(txDb, creditCode, event.id);

      // 4. Extract amount and currency from payload
      const payload = event.payload as Record<string, unknown>;
      const amount = extractAmount(payload, rule.amountPayloadPath, event.id);
      const currency = extractCurrency(
        payload,
        rule.currencyPayloadPath,
        event.id
      );

      // 5. Validate currency matches accounts
      if (debitAccount.currency !== currency) {
        throw new CurrencyMismatchError(
          debitCode,
          debitAccount.currency,
          currency,
          event.id
        );
      }
      if (creditAccount.currency !== currency) {
        throw new CurrencyMismatchError(
          creditCode,
          creditAccount.currency,
          currency,
          event.id
        );
      }

      // 6. Generate transaction ID
      const transactionId = randomUUID();

      // 7. Check for duplicate transaction (idempotency guard)
      const existingEntries = await txDb
        .select({ id: journalEntries.id })
        .from(journalEntries)
        .where(eq(journalEntries.transactionId, transactionId))
        .limit(1);

      if (existingEntries.length > 0) {
        throw new DuplicateTransactionError(transactionId, event.id);
      }

      // 8. Prepare journal entries
      const description = resolveDescription(
        rule.descriptionTemplate || `${event.eventType} — ${event.id}`,
        event
      );

      const preparedEntries: PreparedEntry[] = [
        {
          accountId: debitAccount.id,
          accountCode: debitCode,
          side: "debit",
          amount,
          currency,
          description,
          sequenceNo: 1,
        },
        {
          accountId: creditAccount.id,
          accountCode: creditCode,
          side: "credit",
          amount,
          currency,
          description,
          sequenceNo: 2,
        },
      ];

      // 9. Verify balance before insert (application-level assertion)
      const debitTotal = preparedEntries
        .filter((e) => e.side === "debit")
        .reduce((sum, e) => sum + e.amount, 0);
      const creditTotal = preparedEntries
        .filter((e) => e.side === "credit")
        .reduce((sum, e) => sum + e.amount, 0);

      if (debitTotal !== creditTotal) {
        throw new BalanceAssertionError(
          transactionId,
          debitTotal,
          creditTotal,
          event.id
        );
      }

      // 10. Insert journal entries
      const newEntries: NewJournalEntry[] = preparedEntries.map((entry) => ({
        transactionId,
        eventId: event.id,
        accountId: entry.accountId,
        side: entry.side,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        postedAt: new Date(),
        sequenceNo: entry.sequenceNo,
      }));

      await txDb.insert(journalEntries).values(newEntries);

      // 11. DB-level balance assertion (calls assert_transaction_balanced function)
      await txDb.execute(
        sql`SELECT assert_transaction_balanced(${transactionId}::uuid)`
      );

      return {
        transactionId,
        eventId: event.id,
        postingRuleId: rule.id,
        debitAccountCode: debitCode,
        creditAccountCode: creditCode,
        amount,
        currency,
        entryCount: newEntries.length,
        postedAt: new Date(),
      };
    });
  }

  /**
   * Finds the active posting rule for an event type.
   */
  private async findPostingRule(
    db: Database,
    eventType: string,
    eventId: string
  ): Promise<PostingRule> {
    const rules = await db
      .select()
      .from(postingRules)
      .where(
        and(
          eq(postingRules.eventType, eventType),
          eq(postingRules.isActive, true)
        )
      )
      .orderBy(postingRules.version)
      .limit(1);

    if (rules.length === 0) {
      throw new PostingRuleNotFoundError(eventType, eventId);
    }

    return rules[0];
  }

  /**
   * Finds a ledger account by its code.
   */
  private async findAccount(
    db: Database,
    code: string,
    eventId: string
  ): Promise<LedgerAccount> {
    const accounts = await db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.code, code))
      .limit(1);

    if (accounts.length === 0) {
      throw new AccountNotFoundError(code, eventId);
    }

    return accounts[0];
  }

  /**
   * Emits a 'ledger.transaction_posted' audit event.
   */
  private async emitPostingSuccessEvent(
    sourceEvent: Event,
    result: PostingResult
  ): Promise<void> {
    try {
      await this.emitter.emit({
        eventType: "ledger.transaction_posted",
        actorId: sourceEvent.actorId,
        entityId: result.transactionId,
        entityType: "ledger_transaction",
        payload: {
          transactionId: result.transactionId,
          sourceEventId: result.eventId,
          postingRuleId: result.postingRuleId,
          amount: result.amount,
          currency: result.currency,
          debitAccountCode: result.debitAccountCode,
          creditAccountCode: result.creditAccountCode,
          entryCount: result.entryCount,
        },
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      // Audit event failure is logged but does not fail the posting
      console.error(
        `[PostingEngine] Failed to emit posting success audit event for event ${sourceEvent.id}:`,
        error
      );
    }
  }

  /**
   * Emits a 'ledger.transaction_failed' audit event.
   */
  private async emitPostingFailureEvent(
    sourceEvent: Event,
    error: unknown
  ): Promise<void> {
    try {
      const postingError =
        error instanceof PostingError
          ? error
          : new PostingError(String(error), "UNKNOWN_ERROR", sourceEvent.id);

      await this.emitter.emit({
        eventType: "ledger.transaction_failed",
        actorId: sourceEvent.actorId,
        entityId: sourceEvent.id,
        entityType: "ledger_transaction",
        payload: {
          sourceEventId: sourceEvent.id,
          errorMessage: postingError.message,
          errorCode: postingError.errorCode,
          ...(process.env.NODE_ENV !== "production" && error instanceof Error
            ? { stackTrace: error.stack }
            : {}),
        },
        occurredAt: new Date().toISOString(),
      });
    } catch (auditError) {
      // Audit event failure is logged but does not mask the original error
      console.error(
        `[PostingEngine] Failed to emit posting failure audit event for event ${sourceEvent.id}:`,
        auditError
      );
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a PostingEngine instance.
 *
 * @param db - Drizzle database instance
 * @param emitter - EventEmitter instance
 * @returns PostingEngine
 */
export function createPostingEngine(
  db: Database,
  emitter: EventEmitter
): PostingEngine {
  return new PostingEngine(db, emitter);
}

/**
 * Ubuntu Pools — Phase 1: LedgerService
 *
 * High-level service for ledger account management and posting.
 * Combines PostingEngine and LedgerQueries into a unified interface.
 *
 * Governance Charter Compliance:
 *   - Account creation emits a 'ledger.account_opened' event.
 *   - Posting rule creation emits a 'ledger.posting_rule_created' event.
 *   - All writes are event-sourced (event first, then DB record).
 *   - No direct DB writes without a corresponding event.
 *   - All monetary values are integer minor units.
 *
 * Usage:
 *   const service = new LedgerService(db, eventService);
 *   const account = await service.openAccount({ ... });
 *   const result = await service.postEvent(eventId);
 */

import { eq } from "drizzle-orm";
// import type { Database } from "@ubuntu/db/client";
// import { ledgerAccounts, postingRules } from "@ubuntu/db/schema";
// import type {
//   LedgerAccount,
//   NewLedgerAccount,
//   PostingRule,
//   NewPostingRule,
// } from "@ubuntu/db/schema";
// import type { EventService } from "./event-service";
// import {
//   PostingEngine,
//   type PostingResult,
// } from "@ubuntu/ledger/posting-engine";
// import {
//   LedgerQueries,
//   type AccountBalance,
//   type TransactionSummary,
//   type JournalEntryWithContext,
// } from "@ubuntu/ledger/queries";

// Temporary type definitions
type Database = any;
type LedgerAccount = any;
type NewLedgerAccount = any;
type PostingRule = any;
type NewPostingRule = any;
type EventService = any;
type PostingResult = any;
type AccountBalance = any;
type TransactionSummary = any;
type JournalEntryWithContext = any;

// Temporary implementations
class PostingEngine {
  constructor(db: Database) {}
  async post(eventId: string, lines: unknown[]): Promise<PostingResult> {
    return { entryId: eventId, success: true };
  }
  async processEvent(eventId: string): Promise<void> {}
  async processPendingEvents(): Promise<{ succeeded: any[]; failed: { eventId: string; error: Error; }[] }> {
    return { succeeded: [], failed: [] };
  }
}

class LedgerQueries {
  constructor(db: Database) {}
  async getAccountByCode(code: string): Promise<any> { return null; }
  async getPostingRules(options?: any): Promise<any[]> { return []; }
  async getAccounts(filter?: any): Promise<any[]> { return []; }
  async getAccountBalance(accountId: string): Promise<AccountBalance> { return {} as any; }
  async getEntityBalances(entityId: string): Promise<any[]> { return []; }
  async getAccountHistory(accountId: string, options?: any): Promise<any[]> { return []; }
  async getTransactions(accountId: string): Promise<any[]> { return []; }
  async getTransaction(transactionId: string): Promise<any> { return null; }
  async findUnbalancedTransactions(): Promise<any[]> { return []; }
  async getEventStatusCounts(): Promise<{ posted: number; pending: number; failed: number; total: number }> {
    return { posted: 0, pending: 0, failed: 0, total: 0 };
  }
}

const ledgerAccounts = {} as any;
const postingRules = {} as any;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for opening a new ledger account.
 */
export interface OpenAccountInput {
  code: string;
  name: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  currency: string;
  entityId?: string;
  entityType?: string;
  /** The actor opening this account */
  actorId: string;
}

/**
 * Input for creating a new posting rule.
 */
export interface CreatePostingRuleInput {
  eventType: string;
  ruleName: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amountPayloadPath: string;
  currencyPayloadPath: string;
  descriptionTemplate?: string;
  /** The actor creating this rule */
  actorId: string;
}

// =============================================================================
// LEDGER SERVICE
// =============================================================================

/**
 * LedgerService: the application-level interface for ledger operations.
 *
 * Responsibilities:
 *   1. Open ledger accounts (event-sourced)
 *   2. Create posting rules (event-sourced)
 *   3. Process events through the posting engine
 *   4. Query balances and history
 *   5. Run integrity checks
 */
export class LedgerService {
  private readonly engine: PostingEngine;
  private readonly queries: LedgerQueries;

  constructor(
    private readonly db: Database,
    private readonly eventService: EventService
  ) {
    this.engine = new PostingEngine(db);
    this.queries = new LedgerQueries(db);
  }

  // ---------------------------------------------------------------------------
  // ACCOUNT MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Opens a new ledger account.
   *
   * Process:
   *   1. Emit 'ledger.account_opened' event.
   *   2. Insert ledger_accounts row referencing the event.
   *
   * @param input - Account creation input
   * @returns The created LedgerAccount
   * @throws If account code already exists or event emission fails
   */
  async openAccount(input: OpenAccountInput): Promise<LedgerAccount> {
    // Validate currency format
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new Error(
        `Invalid currency code '${input.currency}'. Must be 3 uppercase letters.`
      );
    }

    // Validate account code format
    if (!/^[A-Z0-9_-]+$/.test(input.code)) {
      throw new Error(
        `Invalid account code '${input.code}'. Must be uppercase alphanumeric with hyphens/underscores.`
      );
    }

    // Check for duplicate code
    const existing = await this.queries.getAccountByCode(input.code);
    if (existing) {
      throw new Error(
        `Ledger account with code '${input.code}' already exists (ID: ${existing.id})`
      );
    }

    // Emit the account_opened event
    // The entity_id for this event is a new UUID (the account's future ID)
    // We use a deterministic approach: emit event, then insert account with event ID
    const { event } = await this.eventService.emit({
      eventType: "ledger.account_opened",
      actorId: input.actorId,
      entityId: crypto.randomUUID(), // account's entity ID (will be the account ID)
      entityType: "ledger_account",
      payload: {
        accountCode: input.code,
        accountName: input.name,
        accountType: input.accountType,
        currency: input.currency,
        ...(input.entityId ? { entityId: input.entityId } : {}),
        ...(input.entityType ? { entityType: input.entityType } : {}),
      },
      occurredAt: new Date().toISOString(),
    });

    // Insert the ledger account, referencing the event
    const newAccount: NewLedgerAccount = {
      code: input.code,
      name: input.name,
      accountType: input.accountType,
      currency: input.currency,
      entityId: input.entityId ?? null,
      entityType: input.entityType ?? null,
      createdByEventId: event.id,
    };

    const [account] = await this.db
      .insert(ledgerAccounts)
      .values(newAccount)
      .returning();

    if (!account) {
      throw new Error(`Failed to insert ledger account for code '${input.code}'`);
    }

    // Transition the event to 'posted' (account creation is immediate)
    await this.eventService.transitionStatus(event.id, "posted");

    return account;
  }

  // ---------------------------------------------------------------------------
  // POSTING RULE MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Creates a new posting rule.
   *
   * Process:
   *   1. Emit 'ledger.posting_rule_created' event.
   *   2. Insert posting_rules row referencing the event.
   *
   * @param input - Posting rule creation input
   * @returns The created PostingRule
   */
  async createPostingRule(input: CreatePostingRuleInput): Promise<PostingRule> {
    // Determine version (increment if rule for this event type already exists)
    const existingRules = await this.queries.getPostingRules({
      eventType: input.eventType,
    });
    const maxVersion = existingRules.reduce(
      (max, r) => Math.max(max, r.version),
      0
    );
    const newVersion = maxVersion + 1;

    // Deactivate existing rules for this event type
    if (existingRules.length > 0) {
      for (const rule of existingRules.filter((r) => r.isActive)) {
        await this.db
          .update(postingRules)
          .set({ isActive: false })
          // Only update the is_active flag (non-identifying field)
          // This is permitted by the immutability trigger
          // (identifying fields: id, event_type, account codes, paths, version, created_at, created_by_event_id)
          // is_active is configuration state, not event data
          .where(eq(postingRules.id, rule.id));
      }
    }

    // Emit the posting_rule_created event
    const { event } = await this.eventService.emit({
      eventType: "ledger.posting_rule_created",
      actorId: input.actorId,
      entityId: crypto.randomUUID(),
      entityType: "posting_rule",
      payload: {
        targetEventType: input.eventType,
        ruleName: input.ruleName,
        debitAccountCode: input.debitAccountCode,
        creditAccountCode: input.creditAccountCode,
        amountPayloadPath: input.amountPayloadPath,
        currencyPayloadPath: input.currencyPayloadPath,
        descriptionTemplate: input.descriptionTemplate ?? "",
        version: newVersion,
      },
      occurredAt: new Date().toISOString(),
    });

    // Insert the posting rule
    const newRule: NewPostingRule = {
      eventType: input.eventType,
      ruleName: input.ruleName,
      debitAccountCode: input.debitAccountCode,
      creditAccountCode: input.creditAccountCode,
      amountPayloadPath: input.amountPayloadPath,
      currencyPayloadPath: input.currencyPayloadPath,
      descriptionTemplate: input.descriptionTemplate ?? "",
      isActive: true,
      createdByEventId: event.id,
      version: newVersion,
    };

    const [rule] = await this.db
      .insert(postingRules)
      .values(newRule)
      .returning();

    if (!rule) {
      throw new Error(`Failed to insert posting rule for event type '${input.eventType}'`);
    }

    // Transition the event to 'posted'
    await this.eventService.transitionStatus(event.id, "posted");

    return rule;
  }

  // ---------------------------------------------------------------------------
  // POSTING
  // ---------------------------------------------------------------------------

  /**
   * Processes a single pending event through the posting engine.
   *
   * @param eventId - UUID of the event to process
   * @returns PostingResult on success
   * @throws PostingError on failure
   */
  async postEvent(eventId: string): Promise<PostingResult> {
    return this.engine.processEvent(eventId);
  }

  /**
   * Processes all pending events.
   *
   * @returns Summary of succeeded and failed postings
   */
  async postAllPending(): Promise<{
    succeeded: PostingResult[];
    failed: Array<{ eventId: string; error: Error }>;
  }> {
    return this.engine.processPendingEvents();
  }

  // ---------------------------------------------------------------------------
  // QUERIES (delegated to LedgerQueries)
  // ---------------------------------------------------------------------------

  /** Gets all accounts, optionally filtered */
  async getAccounts(filter?: {
    entityId?: string;
    entityType?: string;
    currency?: string;
  }): Promise<LedgerAccount[]> {
    return this.queries.getAccounts(filter);
  }

  /** Gets account balance by ID */
  async getAccountBalance(accountId: string): Promise<AccountBalance | null> {
    return this.queries.getAccountBalance(accountId);
  }

  /** Gets all balances for an entity */
  async getEntityBalances(entityId: string): Promise<AccountBalance[]> {
    return this.queries.getEntityBalances(entityId);
  }

  /** Gets account transaction history */
  async getAccountHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; from?: Date; to?: Date }
  ): Promise<JournalEntryWithContext[]> {
    return this.queries.getAccountHistory(accountId, options);
  }

  /** Gets a transaction by ID */
  async getTransaction(
    transactionId: string
  ): Promise<TransactionSummary | null> {
    return this.queries.getTransaction(transactionId);
  }

  /** Finds unbalanced transactions (integrity check) */
  async findUnbalancedTransactions(): Promise<
    Array<{
      transactionId: string;
      eventId: string;
      currency: string;
      debitTotal: number;
      creditTotal: number;
      imbalance: number;
    }>
  > {
    return this.queries.findUnbalancedTransactions();
  }

  /** Gets event status counts (monitoring) */
  async getEventStatusCounts(): Promise<{
    pending: number;
    posted: number;
    failed: number;
    total: number;
  }> {
    return this.queries.getEventStatusCounts();
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a LedgerService instance.
 *
 * @param db - Drizzle database instance
 * @param eventService - EventService instance
 * @returns LedgerService
 */
export function createLedgerService(
  db: Database,
  eventService: EventService
): LedgerService {
  return new LedgerService(db, eventService);
}

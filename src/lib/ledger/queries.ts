/**
 * Ubuntu Pools — Phase 1: Ledger Query Utilities
 *
 * Read-only query functions for the double-entry ledger.
 *
 * Governance Charter Compliance:
 *   - All queries are read-only (SELECT only).
 *   - The journal_entries table is the source of truth.
 *   - Views (v_account_balances, v_transaction_balance_check) are derived.
 *   - All monetary values returned as numbers (integer minor units).
 *   - No mutations occur in this module.
 *
 * Usage:
 *   const queries = new LedgerQueries(db);
 *   const balance = await queries.getAccountBalance(accountId);
 *   const history = await queries.getAccountHistory(accountId, { limit: 50 });
 */

import { eq, and, desc, asc, gte, lte, sql, sum, count } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  ledgerAccounts,
  journalEntries,
  events,
  postingRules,
} from "@/db/schema";
import type { LedgerAccount, JournalEntry, Event } from "@/db/schema";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Account balance with metadata.
 */
export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  currency: string;
  entityId: string | null;
  entityType: string | null;
  /** Raw balance: debits - credits (can be negative) */
  rawBalance: number;
  /** Normal balance: positive = healthy for account type */
  normalBalance: number;
  entryCount: number;
  lastPostedAt: Date | null;
}

/**
 * A journal entry with its associated account and event details.
 */
export interface JournalEntryWithContext {
  entry: JournalEntry;
  account: Pick<LedgerAccount, "id" | "code" | "name" | "accountType" | "currency">;
  event: Pick<Event, "id" | "eventType" | "entityId" | "entityType" | "occurredAt">;
}

/**
 * Transaction summary: all entries for a transaction_id.
 */
export interface TransactionSummary {
  transactionId: string;
  eventId: string;
  currency: string;
  debitTotal: number;
  creditTotal: number;
  imbalance: number;
  entryCount: number;
  isBalanced: boolean;
  entries: JournalEntry[];
}

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Date range filter.
 */
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

// =============================================================================
// LEDGER QUERIES
// =============================================================================

/**
 * LedgerQueries: read-only query interface for the double-entry ledger.
 *
 * All methods are pure reads — no mutations.
 * The source of truth is always journal_entries.
 */
export class LedgerQueries {
  constructor(private readonly db: Database) {}

  // ---------------------------------------------------------------------------
  // ACCOUNT QUERIES
  // ---------------------------------------------------------------------------

  /**
   * Gets all ledger accounts, optionally filtered by entity.
   *
   * @param filter - Optional filter by entity_id and/or entity_type
   * @returns Array of ledger accounts
   */
  async getAccounts(filter?: {
    entityId?: string;
    entityType?: string;
    currency?: string;
    accountType?: string;
  }): Promise<LedgerAccount[]> {
    let query = this.db.select().from(ledgerAccounts).$dynamic();

    if (filter?.entityId) {
      query = query.where(eq(ledgerAccounts.entityId, filter.entityId));
    }
    if (filter?.entityType) {
      query = query.where(eq(ledgerAccounts.entityType, filter.entityType));
    }
    if (filter?.currency) {
      query = query.where(eq(ledgerAccounts.currency, filter.currency));
    }

    return await query.orderBy(asc(ledgerAccounts.code));
  }

  /**
   * Gets a single ledger account by ID.
   *
   * @param accountId - UUID of the account
   * @returns The account, or null if not found
   */
  async getAccountById(accountId: string): Promise<LedgerAccount | null> {
    const results = await this.db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.id, accountId))
      .limit(1);

    return results[0] ?? null;
  }

  /**
   * Gets a single ledger account by code.
   *
   * @param code - Account code (e.g. 'POOL-001-ASSET')
   * @returns The account, or null if not found
   */
  async getAccountByCode(code: string): Promise<LedgerAccount | null> {
    const results = await this.db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.code, code))
      .limit(1);

    return results[0] ?? null;
  }

  // ---------------------------------------------------------------------------
  // BALANCE QUERIES
  // ---------------------------------------------------------------------------

  /**
   * Computes the balance for a single account.
   *
   * Balance computation:
   *   - Debit-normal (asset, expense): balance = sum(debits) - sum(credits)
   *   - Credit-normal (liability, equity, revenue): balance = sum(credits) - sum(debits)
   *
   * @param accountId - UUID of the account
   * @returns AccountBalance, or null if account not found
   */
  async getAccountBalance(accountId: string): Promise<AccountBalance | null> {
    const account = await this.getAccountById(accountId);
    if (!account) return null;

    const result = await this.db
      .select({
        debitTotal: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntries.side} = 'debit' THEN ${journalEntries.amount} ELSE 0 END), 0)`,
        creditTotal: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntries.side} = 'credit' THEN ${journalEntries.amount} ELSE 0 END), 0)`,
        entryCount: count(journalEntries.id),
        lastPostedAt: sql<Date | null>`MAX(${journalEntries.postedAt})`,
      })
      .from(journalEntries)
      .where(eq(journalEntries.accountId, accountId));

    const row = result[0];
    const debitTotal = Number(row?.debitTotal ?? 0);
    const creditTotal = Number(row?.creditTotal ?? 0);
    const rawBalance = debitTotal - creditTotal;

    // Normalize balance based on account type
    const isDebitNormal =
      account.accountType === "asset" || account.accountType === "expense";
    const normalBalance = isDebitNormal ? rawBalance : -rawBalance;

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      currency: account.currency,
      entityId: account.entityId ?? null,
      entityType: account.entityType ?? null,
      rawBalance,
      normalBalance,
      entryCount: Number(row?.entryCount ?? 0),
      lastPostedAt: row?.lastPostedAt ?? null,
    };
  }

  /**
   * Computes balances for all accounts belonging to an entity.
   *
   * @param entityId - UUID of the entity
   * @returns Array of AccountBalance objects
   */
  async getEntityBalances(entityId: string): Promise<AccountBalance[]> {
    const accounts = await this.getAccounts({ entityId });
    const balances = await Promise.all(
      accounts.map((a) => this.getAccountBalance(a.id))
    );
    return balances.filter((b): b is AccountBalance => b !== null);
  }

  // ---------------------------------------------------------------------------
  // JOURNAL ENTRY QUERIES
  // ---------------------------------------------------------------------------

  /**
   * Gets journal entries for an account, ordered by posted_at.
   *
   * @param accountId - UUID of the account
   * @param options - Pagination and date range options
   * @returns Array of journal entries with context
   */
  async getAccountHistory(
    accountId: string,
    options?: PaginationOptions & DateRangeFilter
  ): Promise<JournalEntryWithContext[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let query = this.db
      .select({
        entry: journalEntries,
        account: {
          id: ledgerAccounts.id,
          code: ledgerAccounts.code,
          name: ledgerAccounts.name,
          accountType: ledgerAccounts.accountType,
          currency: ledgerAccounts.currency,
        },
        event: {
          id: events.id,
          eventType: events.eventType,
          entityId: events.entityId,
          entityType: events.entityType,
          occurredAt: events.occurredAt,
        },
      })
      .from(journalEntries)
      .innerJoin(ledgerAccounts, eq(journalEntries.accountId, ledgerAccounts.id))
      .innerJoin(events, eq(journalEntries.eventId, events.id))
      .where(eq(journalEntries.accountId, accountId))
      .$dynamic();

    if (options?.from) {
      query = query.where(gte(journalEntries.postedAt, options.from));
    }
    if (options?.to) {
      query = query.where(lte(journalEntries.postedAt, options.to));
    }

    const results = await query
      .orderBy(desc(journalEntries.postedAt))
      .limit(limit)
      .offset(offset);

    return results as JournalEntryWithContext[];
  }

  /**
   * Gets all journal entries for a transaction_id.
   *
   * @param transactionId - UUID of the transaction
   * @returns TransactionSummary with all entries
   */
  async getTransaction(
    transactionId: string
  ): Promise<TransactionSummary | null> {
    const entries = await this.db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.transactionId, transactionId))
      .orderBy(asc(journalEntries.sequenceNo));

    if (entries.length === 0) return null;

    const debitTotal = entries
      .filter((e) => e.side === "debit")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const creditTotal = entries
      .filter((e) => e.side === "credit")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      transactionId,
      eventId: entries[0].eventId,
      currency: entries[0].currency,
      debitTotal,
      creditTotal,
      imbalance: debitTotal - creditTotal,
      entryCount: entries.length,
      isBalanced: debitTotal === creditTotal,
      entries,
    };
  }

  // ---------------------------------------------------------------------------
  // INTEGRITY CHECKS
  // ---------------------------------------------------------------------------

  /**
   * Finds all unbalanced transactions.
   * In a correct system, this should always return an empty array.
   *
   * @returns Array of unbalanced transaction summaries
   */
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
    const results = await this.db.execute(sql`
      SELECT
        transaction_id,
        event_id,
        currency,
        SUM(CASE WHEN side = 'debit'  THEN amount ELSE 0 END) AS debit_total,
        SUM(CASE WHEN side = 'credit' THEN amount ELSE 0 END) AS credit_total,
        SUM(CASE WHEN side = 'debit'  THEN amount ELSE 0 END) -
        SUM(CASE WHEN side = 'credit' THEN amount ELSE 0 END) AS imbalance
      FROM journal_entries
      GROUP BY transaction_id, event_id, currency
      HAVING SUM(CASE WHEN side = 'debit'  THEN amount ELSE 0 END) <>
             SUM(CASE WHEN side = 'credit' THEN amount ELSE 0 END)
    `);

    return (results as Array<Record<string, unknown>>).map((row) => ({
      transactionId: String(row.transaction_id),
      eventId: String(row.event_id),
      currency: String(row.currency),
      debitTotal: Number(row.debit_total),
      creditTotal: Number(row.credit_total),
      imbalance: Number(row.imbalance),
    }));
  }

  /**
   * Gets a summary of the event log for an entity.
   *
   * @param entityId - UUID of the entity
   * @returns Event log summary
   */
  async getEntityEventLog(
    entityId: string,
    options?: PaginationOptions
  ): Promise<Event[]> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    return await this.db
      .select()
      .from(events)
      .where(eq(events.entityId, entityId))
      .orderBy(asc(events.sequenceNo))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Gets posting rules, optionally filtered by event type.
   *
   * @param filter - Optional filter
   * @returns Array of posting rules
   */
  async getPostingRules(filter?: {
    eventType?: string;
    isActive?: boolean;
  }): Promise<typeof postingRules.$inferSelect[]> {
    let query = this.db.select().from(postingRules).$dynamic();

    if (filter?.eventType) {
      query = query.where(eq(postingRules.eventType, filter.eventType));
    }
    if (filter?.isActive !== undefined) {
      query = query.where(eq(postingRules.isActive, filter.isActive));
    }

    return await query.orderBy(asc(postingRules.eventType), asc(postingRules.version));
  }

  /**
   * Counts events by status (for monitoring).
   *
   * @returns Object with counts per status
   */
  async getEventStatusCounts(): Promise<{
    pending: number;
    posted: number;
    failed: number;
    total: number;
  }> {
    const results = await this.db
      .select({
        status: events.status,
        count: count(events.id),
      })
      .from(events)
      .groupBy(events.status);

    const counts = { pending: 0, posted: 0, failed: 0, total: 0 };
    for (const row of results) {
      counts[row.status] = Number(row.count);
      counts.total += Number(row.count);
    }

    return counts;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a LedgerQueries instance.
 *
 * @param db - Drizzle database instance
 * @returns LedgerQueries
 */
export function createLedgerQueries(db: Database): LedgerQueries {
  return new LedgerQueries(db);
}

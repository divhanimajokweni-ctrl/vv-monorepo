import type { Database } from "@ubuntu/db/client";

export interface AccountBalance {
  accountId: string;
  balance: bigint;
}

export interface TransactionSummary {
  count: number;
  totalDebits: bigint;
  totalCredits: bigint;
}

export interface JournalEntryWithContext {
  id: string;
  accountId: string;
  description: string;
}

export class LedgerQueries {
  constructor(private db: Database) {}
  async getBalance(accountId: string): Promise<bigint> {
    return 0n;
  }
  async getTransactions(accountId: string): Promise<JournalEntryWithContext[]> {
    return [];
  }
}
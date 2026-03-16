import { computeEventHash, verifyHashChain, verifyEventHash, type EventHashInput, type HashResult } from "../events/hasher";
import { LedgerQueries } from "../ledger/queries";
import type { Database } from "@/db/client";

export interface EventSourcingConfig {
  db: Database;
}

export interface EventStore {
  id: string;
  eventType: string;
  actorId: string;
  entityId: string;
  entityType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  sequenceNo: number;
  hash: string;
  prevHash: string | null;
  status: "pending" | "posted" | "failed";
}

export class EventSourcingCore {
  private db: Database;
  private queries: LedgerQueries;

  constructor(config: EventSourcingConfig) {
    this.db = config.db;
    this.queries = new LedgerQueries(this.db);
  }

  getLedgerQueries(): LedgerQueries {
    return this.queries;
  }

  hashEvent(input: EventHashInput): HashResult {
    return computeEventHash(input);
  }

  verifyEvent(event: EventStore): boolean {
    return verifyEventHash({
      eventType: event.eventType,
      actorId: event.actorId,
      entityId: event.entityId,
      entityType: event.entityType,
      payload: event.payload,
      occurredAt: event.occurredAt.toISOString(),
      sequenceNo: event.sequenceNo,
      hash: event.hash,
      prevHash: event.prevHash,
    });
  }

  verifyChain(events: EventStore[]): { valid: boolean; errors: unknown[] } {
    const typedEvents = events.map((e) => ({
      eventType: e.eventType,
      actorId: e.actorId,
      entityId: e.entityId,
      entityType: e.entityType,
      payload: e.payload,
      occurredAt: e.occurredAt.toISOString(),
      sequenceNo: e.sequenceNo,
      hash: e.hash,
      prevHash: e.prevHash,
    }));

    const result = verifyHashChain(typedEvents);
    return {
      valid: result.valid,
      errors: result.errors,
    };
  }

  async getAccountBalance(accountId: string) {
    return this.queries.getAccountBalance(accountId);
  }

  async getAccountHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; from?: Date; to?: Date }
  ) {
    return this.queries.getAccountHistory(accountId, options);
  }

  async getTransaction(transactionId: string) {
    return this.queries.getTransaction(transactionId);
  }

  async getEntityEventLog(entityId: string, options?: { limit?: number; offset?: number }) {
    return this.queries.getEntityEventLog(entityId, options);
  }

  async getEventStatusCounts() {
    return this.queries.getEventStatusCounts();
  }

  async findUnbalancedTransactions() {
    return this.queries.findUnbalancedTransactions();
  }
}

let eventSourcingInstance: EventSourcingCore | null = null;

export function initializeEventSourcing(db: Database): EventSourcingCore {
  eventSourcingInstance = new EventSourcingCore({ db });
  return eventSourcingInstance;
}

export function getEventSourcing(): EventSourcingCore {
  if (!eventSourcingInstance) {
    throw new Error("EventSourcing not initialized. Call initializeEventSourcing() first.");
  }
  return eventSourcingInstance;
}

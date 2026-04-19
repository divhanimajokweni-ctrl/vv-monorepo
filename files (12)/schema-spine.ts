/**
 * packages/db/src/schema-spine.ts
 *
 * Drizzle ORM schema for all spine tables.
 * Import this alongside schema.ts in drizzle.config.ts
 */

import {
  pgTable,
  text,
  numeric,
  timestamptz,
  jsonb,
  check,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Idempotency keys (Invariant 1) ──────────────────────────────────────────

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  ledgerEntryId: text("ledger_entry_id").notNull(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

// ─── Ledger entries (Invariant 1 + 2) ────────────────────────────────────────

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    eventId: text("event_id").notNull(),
    villageId: text("village_id").notNull(),
    memberId: text("member_id").notNull(),
    lines: jsonb("lines").notNull(),
    totalDebits: numeric("total_debits", { precision: 20, scale: 0 }).notNull(),
    totalCredits: numeric("total_credits", { precision: 20, scale: 0 }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    balancedPostingCheck: check(
      "balanced_posting",
      sql`${table.totalDebits} = ${table.totalCredits}`
    ),
    villageIdx: index("idx_ledger_village_id").on(table.villageId),
    memberIdx: index("idx_ledger_member_id").on(table.memberId),
    eventIdx: index("idx_ledger_event_id").on(table.eventId),
  })
);

// ─── Pool contributions (spine step 3) ────────────────────────────────────────

export const poolContributions = pgTable(
  "pool_contributions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    memberId: text("member_id").notNull(),
    villageId: text("village_id").notNull(),
    poolId: text("pool_id").notNull(),
    amountMinorUnits: numeric("amount_minor_units", {
      precision: 20,
      scale: 0,
    }).notNull(),
    currency: text("currency").notNull().default("ZAR"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    ledgerEntryId: text("ledger_entry_id"),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    memberIdx: index("idx_contributions_member").on(table.memberId),
    villageIdx: index("idx_contributions_village").on(table.villageId),
    keyIdx: index("idx_contributions_key").on(table.idempotencyKey),
  })
);

// ─── Domain events (spine step 5 + Invariant 5) ──────────────────────────────

export const domainEvents = pgTable(
  "domain_events",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    hash: text("hash").notNull(),
    memberId: text("member_id"),
    villageId: text("village_id"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("idx_events_type").on(table.type),
    villageIdx: index("idx_events_village").on(table.villageId),
    createdIdx: index("idx_events_created").on(table.createdAt),
  })
);

// ─── Projections (spine step 6 + 8) ──────────────────────────────────────────

export const projections = pgTable("projections", {
  villageId: text("village_id").primaryKey(),
  lastEventId: text("last_event_id").notNull(),
  refreshedAt: timestamptz("refreshed_at").notNull().defaultNow(),
});

// ─── Audit log (spine step 9) ────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    eventId: text("event_id").notNull(),
    memberId: text("member_id").notNull(),
    villageId: text("village_id").notNull(),
    action: text("action").notNull(),
    ledgerEntryId: text("ledger_entry_id"),
    recordedAt: timestamptz("recorded_at").notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index("idx_audit_event").on(table.eventId),
    actionIdx: index("idx_audit_action").on(table.action),
    memberIdx: index("idx_audit_member").on(table.memberId),
  })
);

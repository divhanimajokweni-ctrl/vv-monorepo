/**
 * src/db/schema-spine.ts
 *
 * Drizzle ORM schema for all spine tables.
 *
 * Drop into: src/db/schema-spine.ts
 * Then add to drizzle.config.ts schema array:
 *   schema: ["./src/db/schema.ts", "./src/db/schema-spine.ts"]
 *
 * Uses @/ alias per tsconfig.json paths.
 */

import {
  pgTable,
  text,
  numeric,
  timestamp,
  jsonb,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Idempotency keys (Invariant 1) ──────────────────────────────────────────
// One row per financial operation.
// A duplicate key means the operation was already processed — do not re-post.

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    ledgerEntryId: text("ledger_entry_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

// ─── Ledger entries (Invariants 1 + 2) ────────────────────────────────────────
// DB-level CHECK enforces double-entry balance even if application logic is bypassed.

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
    totalCredits: numeric("total_credits", {
      precision: 20,
      scale: 0,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // INVARIANT 2: database-level balance enforcement
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
    idempotencyKey: text("idempotency_key").notNull(),
    ledgerEntryId: text("ledger_entry_id"),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idempotencyKeyUnique: uniqueIndex("idx_contributions_idempotency_key").on(
      table.idempotencyKey
    ),
    memberIdx: index("idx_contributions_member").on(table.memberId),
    villageIdx: index("idx_contributions_village").on(table.villageId),
  })
);

// ─── Domain events (spine step 5 + Invariants 4 + 5) ─────────────────────────
// ALL state changes produce a row here before any downstream action.
// Notifications and reputation mutations must trace back to a row here.

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    typeIdx: index("idx_events_type").on(table.type),
    villageIdx: index("idx_events_village").on(table.villageId),
    createdIdx: index("idx_events_created").on(table.createdAt),
  })
);

// ─── Projections (spine steps 6 + 8) ─────────────────────────────────────────
// One row per village. Dashboard reads from here.
// Pool balances are NEVER stored here — they are computed from ledger_entries.

export const projections = pgTable("projections", {
  villageId: text("village_id").primaryKey(),
  lastEventId: text("last_event_id").notNull(),
  refreshedAt: timestamp("refreshed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    eventIdx: index("idx_audit_event").on(table.eventId),
    actionIdx: index("idx_audit_action").on(table.action),
    memberIdx: index("idx_audit_member").on(table.memberId),
  })
);

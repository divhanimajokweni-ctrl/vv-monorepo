/**
 * Ubuntu Pools — Signed Contribution Events Schema
 * Hash-chained, cryptographically signed contribution records
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const contributionEvents = pgTable(
  "contribution_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    eventType: text("event_type").notNull(),
    impactValue: integer("impact_value").notNull(),
    signature: text("signature").notNull(),
    signerPublicKey: text("signer_public_key").notNull(),
    hash: text("hash").notNull(),
    prevHash: text("prev_hash"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    hashUnique: uniqueIndex("contribution_events_hash_unique").on(table.hash),
    userIdx: index("idx_contribution_events_user").on(table.userId),
  })
);

export type ContributionEvent = typeof contributionEvents.$inferSelect;
export type NewContributionEvent = typeof contributionEvents.$inferInsert;

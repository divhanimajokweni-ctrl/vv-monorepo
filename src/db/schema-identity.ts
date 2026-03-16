/**
 * Ubuntu Pools — User Identity Keys Schema
 * Stores Ed25519 public keys for zero-trust identity verification
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const userIdentityKeys = pgTable(
  "user_identity_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    publicKey: text("public_key").notNull(),
    algorithm: text("algorithm").notNull().default("ed25519"),
    deviceName: text("device_name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    revokedAt: timestamptz("revoked_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    publicKeyUnique: uniqueIndex("user_identity_keys_public_key_unique").on(table.publicKey),
    userIdx: index("idx_user_identity_keys_user").on(table.userId),
  })
);

export type UserIdentityKey = typeof userIdentityKeys.$inferSelect;
export type NewUserIdentityKey = typeof userIdentityKeys.$inferInsert;

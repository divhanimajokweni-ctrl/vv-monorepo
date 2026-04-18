// src/db/schema-safegrid.ts
import { pgTable, uuid, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const suppressionAlerts = pgTable("suppression_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // Clerk user ID
  tier: integer("tier").notNull(), // 1, 2, or 3
  category: varchar("category", { length: 50 }).notNull(),
  metadata: jsonb("metadata"), // Details of the anomaly
  stewardVouchId: uuid("steward_vouch_id"), // Nullable, filled if Tier 3 is triggered
  createdAt: timestamp("created_at").defaultNow(),
});

export type SuppressionAlert = typeof suppressionAlerts.$inferSelect;
export type NewSuppressionAlert = typeof suppressionAlerts.$inferInsert;
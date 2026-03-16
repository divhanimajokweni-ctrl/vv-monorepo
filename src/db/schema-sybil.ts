import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  index,
  unique,
  real,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const verificationLevelEnum = pgEnum("verification_level", [
  "level_0",
  "level_1",
  "level_2",
  "level_3",
]);

export const sybilVerdictEnum = pgEnum("sybil_verdict", [
  "trusted",
  "provisional",
  "suspicious",
  "blocked",
]);

export const sybilProfiles = pgTable(
  "sybil_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().unique(),
    verificationLevel: verificationLevelEnum("verification_level")
      .notNull()
      .default("level_0"),
    sybilScore: real("sybil_score").notNull().default(0),
    verdict: sybilVerdictEnum("verdict").notNull().default("blocked"),
    accountCreatedAt: timestamptz("account_created_at").notNull(),
    lastScoreGrowth: jsonb("last_score_growth"),
    deviceKeyCount: integer("device_key_count").notNull().default(0),
    sponsorUserId: text("sponsor_user_id"),
    inviteDepth: integer("invite_depth").notNull().default(0),
    economicActivityScore: real("economic_activity_score").notNull().default(0),
    diversityRatio: real("diversity_ratio").notNull().default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sybil_profiles_verdict_idx").on(table.verdict)]
);

export const sybilInvitations = pgTable(
  "sybil_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sponsorId: text("sponsor_id").notNull(),
    inviteeId: text("invitee_id"),
    inviteCode: text("invite_code").notNull().unique(),
    depth: integer("depth").notNull().default(0),
    status: text("status").notNull().default("pending"),
    villageId: text("village_id"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sybil_invitations_sponsor_idx").on(table.sponsorId)]
);

export const sybilVerificationEvents = pgTable(
  "sybil_verification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    fromLevel: verificationLevelEnum("from_level").notNull(),
    toLevel: verificationLevelEnum("to_level").notNull(),
    method: text("method").notNull(),
    evidence: jsonb("evidence"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("sybil_verification_events_user_idx").on(table.userId),
  ]
);

export const sybilScoreHistory = pgTable(
  "sybil_score_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    score: real("score").notNull(),
    delta: real("delta").notNull().default(0),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("sybil_score_history_user_date_uniq").on(table.userId, table.date),
    index("sybil_score_history_user_idx").on(table.userId),
  ]
);

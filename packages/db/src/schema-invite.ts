/**
 * Ubuntu Pools — Invite Chain Schema
 * Trust-based onboarding with invite chains
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const inviteTierEnum = pgEnum("invite_tier", [
  "novice",
  "contributor",
  "steward",
  "archivist",
]);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inviterId: uuid("inviter_id").notNull(),
    inviterVillageId: uuid("inviter_village_id").notNull(),
    inviteeEmail: text("invitee_email"),
    inviteeName: text("invitee_name"),
    inviteCode: text("invite_code").notNull().unique(),
    villageId: uuid("village_id").notNull(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    tier: inviteTierEnum("tier").notNull().default("novice"),
    maxUses: integer("max_uses").notNull().default(1),
    currentUses: integer("current_uses").notNull().default(0),
    expiresAt: timestamptz("expires_at"),
    acceptedAt: timestamptz("accepted_at"),
    inviterRiskShare: integer("inviter_risk_share").notNull().default(10),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    inviterIdx: index("idx_invites_inviter").on(table.inviterId),
    inviteCodeIdx: index("idx_invites_code").on(table.inviteCode),
    statusIdx: index("idx_invites_status").on(table.status),
    villageIdx: index("idx_invites_village").on(table.villageId),
  })
);

export const inviteRelationships = pgTable(
  "invite_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inviterId: uuid("inviter_id").notNull(),
    inviteeId: uuid("invitee_id").notNull(),
    inviteId: uuid("invite_id").notNull(),
    villageId: uuid("village_id").notNull(),
    trustLevel: integer("trust_level").notNull().default(100),
    riskShareActive: boolean("risk_share_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    inviterIdx: index("idx_invite_relationships_inviter").on(table.inviterId),
    inviteeIdx: index("idx_invite_relationships_invitee").on(table.inviteeId),
    villageIdx: index("idx_invite_relationships_village").on(table.villageId),
  })
);

export const invitePenalties = pgTable(
  "invite_penalties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inviterId: uuid("inviter_id").notNull(),
    inviteeId: uuid("invitee_id").notNull(),
    reason: text("reason").notNull(),
    penaltyPoints: integer("penalty_points").notNull().default(10),
    description: text("description"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    inviterIdx: index("idx_invite_penalties_inviter").on(table.inviterId),
    inviteeIdx: index("idx_invite_penalties_invitee").on(table.inviteeId),
  })
);

export const anchorInvitations = pgTable(
  "anchor_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anchorId: uuid("anchor_id").notNull(),
    anchorName: text("anchor_name").notNull(),
    anchorTitle: text("anchor_title"),
    villageId: uuid("village_id").notNull(),
    communityType: text("community_type").notNull(),
    inviteQuota: integer("invite_quota").notNull().default(50),
    currentInvites: integer("current_invites").notNull().default(0),
    status: text("status").notNull().default("active"),
    verifiedAt: timestamptz("verified_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    anchorIdx: index("idx_anchor_invitations_anchor").on(table.anchorId),
    villageIdx: index("idx_anchor_invitations_village").on(table.villageId),
  })
);

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;

export type InviteRelationship = typeof inviteRelationships.$inferSelect;
export type NewInviteRelationship = typeof inviteRelationships.$inferInsert;

export type InvitePenalty = typeof invitePenalties.$inferSelect;
export type NewInvitePenalty = typeof invitePenalties.$inferInsert;

export type AnchorInvitation = typeof anchorInvitations.$inferSelect;
export type NewAnchorInvitation = typeof anchorInvitations.$inferInsert;

export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];
export type InviteTier = (typeof inviteTierEnum.enumValues)[number];

/**
 * Ubuntu Pools — Village OS Schema
 * Programmable economic units with members, liquidity pools, governance, and more
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  bigint,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// =============================================================================
// ENUMS
// =============================================================================

export const villageRoleEnum = pgEnum("village_role", [
  "admin",
  "treasurer",
  "member",
]);

export const poolStatusEnum = pgEnum("pool_status", [
  "active",
  "completed",
  "cancelled",
]);

export const poolTypeEnum = pgEnum("pool_type", [
  "savings",
  "procurement",
  "investment",
  "insurance",
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending",
  "paid",
  "missed",
]);

export const procurementStatusEnum = pgEnum("procurement_status", [
  "proposed",
  "active",
  "completed",
  "cancelled",
]);

export const investmentStatusEnum = pgEnum("investment_status", [
  "proposed",
  "approved",
  "active",
  "completed",
  "defaulted",
]);

export const insuranceStatusEnum = pgEnum("insurance_status", [
  "active",
  "inactive",
  "claim_pending",
  "claim_approved",
  "claim_rejected",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "paid",
]);

// =============================================================================
// TABLE: villages
// =============================================================================

export const villages = pgTable(
  "villages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    founderId: uuid("founder_id"),
    villageScore: integer("village_score").notNull().default(500),
    liquidityPool: bigint("liquidity_pool", { mode: "number" }).notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    isPublic: boolean("is_public").notNull().default(true),
    settings: jsonb("settings").$type<{
      minContribution?: number;
      maxMembers?: number;
      votingPeriodDays?: number;
      quorumThreshold?: number;
      approvalThreshold?: number;
    }>().default({}),
    tags: text("tags").array().default([]),
    location: jsonb("location").$type<{
      country?: string;
      region?: string;
      coordinates?: { lat: number; lng: number };
    }>().default({}),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    founderIdx: index("idx_villages_founder").on(table.founderId),
    nameIdx: index("idx_villages_name").on(table.name),
    scoreIdx: index("idx_villages_score").on(table.villageScore),
  })
);

// =============================================================================
// TABLE: village_members
// =============================================================================

export const villageMembers = pgTable(
  "village_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: villageRoleEnum("role").notNull().default("member"),
    ubuntuScore: integer("ubuntu_score").notNull().default(0),
    reputationScore: integer("reputation_score").notNull().default(500),
    totalContributions: bigint("total_contributions", { mode: "number" }).notNull().default(0),
    pendingPayouts: bigint("pending_payouts", { mode: "number" }).notNull().default(0),
    governanceWeight: integer("governance_weight").notNull().default(1),
    joinedAt: timestamptz("joined_at").notNull().defaultNow(),
    lastActiveAt: timestamptz("last_active_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_village_members_village").on(table.villageId),
    userIdx: index("idx_village_members_user").on(table.userId),
    villageUserUnique: uniqueIndex("village_members_village_user_unique").on(
      table.villageId,
      table.userId
    ),
  })
);

// =============================================================================
// TABLE: liquidity_pools (ROSCA/rotating savings)
// =============================================================================

export const liquidityPools = pgTable(
  "liquidity_pools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    poolType: poolTypeEnum("pool_type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    totalFunds: bigint("total_funds", { mode: "number" }).notNull().default(0),
    contributionAmount: bigint("contribution_amount", { mode: "number" }).notNull(),
    cycleDuration: integer("cycle_duration").notNull().default(30),
    currentCycle: integer("current_cycle").notNull().default(1),
    totalCycles: integer("total_cycles").notNull(),
    memberCount: integer("member_count").notNull().default(0),
    status: poolStatusEnum("status").notNull().default("active"),
    payoutOrder: jsonb("payout_order").$type<Array<{
      userId: string;
      cycle: number;
      paidAt?: string;
    }>>().default([]),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_liquidity_pools_village").on(table.villageId),
    typeIdx: index("idx_liquidity_pools_type").on(table.poolType),
    statusIdx: index("idx_liquidity_pools_status").on(table.status),
  })
);

// =============================================================================
// TABLE: pool_contributions
// =============================================================================

export const poolContributions = pgTable(
  "pool_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => liquidityPools.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => villageMembers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    cycle: integer("cycle").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    status: contributionStatusEnum("status").notNull().default("pending"),
    paidAt: timestamptz("paid_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: index("idx_pool_contributions_pool").on(table.poolId),
    memberIdx: index("idx_pool_contributions_member").on(table.memberId),
    cycleIdx: index("idx_pool_contributions_cycle").on(table.cycle),
    statusIdx: index("idx_pool_contributions_status").on(table.status),
  })
);

// =============================================================================
// TABLE: procurement_events
// =============================================================================

export const procurementEvents = pgTable(
  "procurement_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    organizerId: uuid("organizer_id").notNull(),
    product: text("product").notNull(),
    description: text("description"),
    totalVolume: integer("total_volume").notNull(),
    individualPrice: bigint("individual_price", { mode: "number" }).notNull(),
    negotiatedPrice: bigint("negotiated_price", { mode: "number" }).notNull(),
    savingsPercent: integer("savings_percent").notNull().default(0),
    participantCount: integer("participant_count").notNull().default(0),
    minParticipants: integer("min_participants").notNull().default(1),
    deadline: timestamptz("deadline"),
    status: procurementStatusEnum("status").notNull().default("proposed"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_procurement_events_village").on(table.villageId),
    statusIdx: index("idx_procurement_events_status").on(table.status),
  })
);

// =============================================================================
// TABLE: procurement_participants
// =============================================================================

export const procurementParticipants = pgTable(
  "procurement_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => procurementEvents.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    committedAt: timestamptz("committed_at").notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index("idx_procurement_participants_event").on(table.eventId),
    userIdx: index("idx_procurement_participants_user").on(table.userId),
    eventUserUnique: uniqueIndex("procurement_participants_event_user_unique").on(
      table.eventId,
      table.userId
    ),
  })
);

// =============================================================================
// TABLE: investments
// =============================================================================

export const investments = pgTable(
  "investments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull(),
    description: text("description"),
    investmentAmount: bigint("investment_amount", { mode: "number" }).notNull(),
    expectedReturn: bigint("expected_return", { mode: "number" }).notNull(),
    actualReturn: bigint("actual_return", { mode: "number" }),
    returnRate: integer("return_rate"),
    proposalId: uuid("proposal_id"),
    investorCount: integer("investor_count").notNull().default(0),
    status: investmentStatusEnum("status").notNull().default("proposed"),
    startDate: timestamptz("start_date"),
    endDate: timestamptz("end_date"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_investments_village").on(table.villageId),
    statusIdx: index("idx_investments_status").on(table.status),
  })
);

// =============================================================================
// TABLE: investment_backers
// =============================================================================

export const investmentBackers = pgTable(
  "investment_backers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    expectedReturn: bigint("expected_return", { mode: "number" }).notNull(),
    paidAt: timestamptz("paid_at"),
    returnsReceived: bigint("returns_received", { mode: "number" }).notNull().default(0),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    investmentIdx: index("idx_investment_backers_investment").on(table.investmentId),
    userIdx: index("idx_investment_backers_user").on(table.userId),
  })
);

// =============================================================================
// TABLE: insurance_pools
// =============================================================================

export const insurancePools = pgTable(
  "insurance_pools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    coverageType: text("coverage_type").notNull(),
    description: text("description"),
    monthlyContribution: bigint("monthly_contribution", { mode: "number" }).notNull(),
    poolBalance: bigint("pool_balance", { mode: "number" }).notNull().default(0),
    coverageLimit: bigint("coverage_limit", { mode: "number" }),
    memberCount: integer("member_count").notNull().default(0),
    claimCount: integer("claim_count").notNull().default(0),
    status: insuranceStatusEnum("status").notNull().default("active"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_insurance_pools_village").on(table.villageId),
    typeIdx: index("idx_insurance_pools_type").on(table.coverageType),
    statusIdx: index("idx_insurance_pools_status").on(table.status),
  })
);

// =============================================================================
// TABLE: insurance_members
// =============================================================================

export const insuranceMembers = pgTable(
  "insurance_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => insurancePools.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => villageMembers.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    coverageStartDate: timestamptz("coverage_start_date").notNull().defaultNow(),
    totalContributions: bigint("total_contributions", { mode: "number" }).notNull().default(0),
    totalClaimsPaid: bigint("total_claims_paid", { mode: "number" }).notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: index("idx_insurance_members_pool").on(table.poolId),
    memberIdx: index("idx_insurance_members_member").on(table.memberId),
    poolMemberUnique: uniqueIndex("insurance_members_pool_member_unique").on(
      table.poolId,
      table.memberId
    ),
  })
);

// =============================================================================
// TABLE: insurance_claims
// =============================================================================

export const insuranceClaims = pgTable(
  "insurance_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => insurancePools.id, { onDelete: "cascade" }),
    claimantId: uuid("claimant_id").notNull(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => villageMembers.id, { onDelete: "cascade" }),
    claimAmount: bigint("claim_amount", { mode: "number" }).notNull(),
    approvedAmount: bigint("approved_amount", { mode: "number" }),
    reason: text("reason").notNull(),
    description: text("description"),
    status: claimStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamptz("reviewed_at"),
    paidAt: timestamptz("paid_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: index("idx_insurance_claims_pool").on(table.poolId),
    claimantIdx: index("idx_insurance_claims_claimant").on(table.claimantId),
    statusIdx: index("idx_insurance_claims_status").on(table.status),
  })
);

// =============================================================================
// TABLE: village_proposals
// =============================================================================

export const villageProposals = pgTable(
  "village_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    proposerId: uuid("proposer_id").notNull(),
    proposalType: text("proposal_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("draft"),
    quorumThreshold: integer("quorum_threshold").notNull().default(50),
    approvalThreshold: integer("approval_threshold").notNull().default(50),
    votingPeriodDays: integer("voting_period_days").notNull().default(7),
    votesFor: integer("votes_for").notNull().default(0),
    votesAgainst: integer("votes_against").notNull().default(0),
    totalWeight: integer("total_weight").notNull().default(0),
    votingPeriodStart: timestamptz("voting_period_start"),
    votingPeriodEnd: timestamptz("voting_period_end"),
    executedAt: timestamptz("executed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_village_proposals_village").on(table.villageId),
    proposerIdx: index("idx_village_proposals_proposer").on(table.proposerId),
    statusIdx: index("idx_village_proposals_status").on(table.status),
  })
);

// =============================================================================
// TABLE: village_votes
// =============================================================================

export const villageVotes = pgTable(
  "village_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => villageProposals.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id").notNull(),
    vote: text("vote").notNull(),
    weight: integer("weight").notNull().default(1),
    signature: text("signature"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    proposalIdx: index("idx_village_votes_proposal").on(table.proposalId),
    voterIdx: index("idx_village_votes_voter").on(table.voterId),
    proposalVoterUnique: uniqueIndex("village_votes_proposal_voter_unique").on(
      table.proposalId,
      table.voterId
    ),
  })
);

// =============================================================================
// TABLE: village_messages (simplified messaging)
// =============================================================================

export const villageMessages = pgTable(
  "village_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("general"),
    senderId: uuid("sender_id").notNull(),
    content: text("content").notNull(),
    isEncrypted: boolean("is_encrypted").notNull().default(false),
    eventReference: text("event_reference"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_village_messages_village").on(table.villageId),
    channelIdx: index("idx_village_messages_channel").on(table.channel),
    senderIdx: index("idx_village_messages_sender").on(table.senderId),
  })
);

// =============================================================================
// TABLE: village_relations (for economic graph)
// =============================================================================

export const villageRelations = pgTable(
  "village_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromVillageId: uuid("from_village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    toVillageId: uuid("to_village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    description: text("description"),
    tradeVolume: bigint("trade_volume", { mode: "number" }).notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    fromVillageIdx: index("idx_village_relations_from").on(table.fromVillageId),
    toVillageIdx: index("idx_village_relations_to").on(table.toVillageId),
    relationUnique: uniqueIndex("village_relations_unique").on(
      table.fromVillageId,
      table.toVillageId,
      table.relationType
    ),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Village = typeof villages.$inferSelect;
export type NewVillage = typeof villages.$inferInsert;

export type VillageMember = typeof villageMembers.$inferSelect;
export type NewVillageMember = typeof villageMembers.$inferInsert;

export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type NewLiquidityPool = typeof liquidityPools.$inferInsert;

export type PoolContribution = typeof poolContributions.$inferSelect;
export type NewPoolContribution = typeof poolContributions.$inferInsert;

export type ProcurementEvent = typeof procurementEvents.$inferSelect;
export type NewProcurementEvent = typeof procurementEvents.$inferInsert;

export type ProcurementParticipant = typeof procurementParticipants.$inferSelect;
export type NewProcurementParticipant = typeof procurementParticipants.$inferInsert;

export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;

export type InvestmentBacker = typeof investmentBackers.$inferSelect;
export type NewInvestmentBacker = typeof investmentBackers.$inferInsert;

export type InsurancePool = typeof insurancePools.$inferSelect;
export type NewInsurancePool = typeof insurancePools.$inferInsert;

export type InsuranceMember = typeof insuranceMembers.$inferSelect;
export type NewInsuranceMember = typeof insuranceMembers.$inferInsert;

export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type NewInsuranceClaim = typeof insuranceClaims.$inferInsert;

export type VillageProposal = typeof villageProposals.$inferSelect;
export type NewVillageProposal = typeof villageProposals.$inferInsert;

export type VillageVote = typeof villageVotes.$inferSelect;
export type NewVillageVote = typeof villageVotes.$inferInsert;

export type VillageMessage = typeof villageMessages.$inferSelect;
export type NewVillageMessage = typeof villageMessages.$inferInsert;

export type VillageRelation = typeof villageRelations.$inferSelect;
export type NewVillageRelation = typeof villageRelations.$inferInsert;

export type VillageRole = (typeof villageRoleEnum.enumValues)[number];
export type PoolStatus = (typeof poolStatusEnum.enumValues)[number];
export type PoolType = (typeof poolTypeEnum.enumValues)[number];
export type ContributionStatus = (typeof contributionStatusEnum.enumValues)[number];
export type ProcurementStatus = (typeof procurementStatusEnum.enumValues)[number];
export type InvestmentStatus = (typeof investmentStatusEnum.enumValues)[number];
export type InsuranceStatus = (typeof insuranceStatusEnum.enumValues)[number];
export type ClaimStatus = (typeof claimStatusEnum.enumValues)[number];

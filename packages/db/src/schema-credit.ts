/**
 * Ubuntu Pools — Credit Facilities Schema
 * Phased credit system with Pool Health gates and Ubuntu Score limits
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

export const creditPhaseEnum = pgEnum("credit_phase", [
  "phase1_formation",    // Capital formation, no lending
  "phase2_microcredit", // Controlled microcredit launch
  "phase3_scaling",     // Adaptive scaling via pool health
]);

export const creditStatusEnum = pgEnum("credit_status", [
  "pending",
  "approved",
  "active",
  "repaid",
  "defaulted",
  "rejected",
  "frozen",
]);

export const creditTypeEnum = pgEnum("credit_type", [
  "microcredit",     // Short-term, small principal (Phase 2)
  "standard",        // Medium-term (Phase 3)
  "extended",        // Long-term (Phase 3+)
]);

export const creditPoolConfig = pgTable(
  "credit_pool_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id").notNull(),
    currency: text("currency").notNull().default("USD"),
    
    // Phase gates
    currentPhase: creditPhaseEnum("current_phase").notNull().default("phase1_formation"),
    phase1BufferTarget: bigint("phase1_buffer_target", { mode: "number" }).notNull(),
    phase2Alpha: integer("phase2_alpha").notNull().default(5), // Credit coefficient (0.05)
    phase2MaxDurationDays: integer("phase2_max_duration_days").notNull().default(90),
    
    // Phase 3 scaling parameters
    beta: integer("beta").notNull().default(25), // Exposure multiplier (2.5x)
    gamma: integer("gamma").notNull().default(10), // Single member max % of exposure
    healthGateLow: integer("health_gate_low").notNull().default(70),  // Freeze threshold
    healthGateMedium: integer("health_gate_medium").notNull().default(85), // Scale threshold
    healthGateHigh: integer("health_gate_high").notNull().default(90), // Premium threshold
    
    // Pool health metrics (computed)
    totalPoolCapital: bigint("total_pool_capital", { mode: "number" }).notNull().default(0),
    safetyBuffer: bigint("safety_buffer", { mode: "number" }).notNull().default(0),
    activeCreditExposure: bigint("active_credit_exposure", { mode: "number" }).notNull().default(0),
    poolHealthScore: integer("pool_health_score").notNull().default(100),
    
    // Credit activation gates
    minContributionWindowDays: integer("min_contribution_window_days").notNull().default(90),
    creditActivated: boolean("credit_activated").notNull().default(false),
    creditActivationDate: timestamptz("credit_activation_date"),
    
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: uniqueIndex("credit_pool_config_pool_unique").on(table.poolId),
  })
);

export const memberCreditProfile = pgTable(
  "member_credit_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id").notNull(),
    poolId: uuid("pool_id").notNull(),
    currency: text("currency").notNull().default("USD"),
    
    // Ubuntu Score based fields
    ubuntuScore: integer("ubuntu_score").notNull().default(0),
    contributionBase: bigint("contribution_base", { mode: "number" }).notNull().default(0),
    membershipStartDate: timestamptz("membership_start_date").notNull(),
    contributionWindowDays: integer("contribution_window_days").notNull().default(0),
    
    // Credit limits
    creditLimit: bigint("credit_limit", { mode: "number" }).notNull().default(0),
    availableCredit: bigint("available_credit", { mode: "number" }).notNull().default(0),
    
    // Credit history summary
    totalBorrowed: bigint("total_borrowed", { mode: "number" }).notNull().default(0),
    totalRepaid: bigint("total_repaid", { mode: "number" }).notNull().default(0),
    activeLoansCount: integer("active_loans_count").notNull().default(0),
    onTimeRepaymentRate: integer("on_time_repayment_rate").notNull().default(100),
    
    // Score evolution tracking
    lastScoreDecayApplied: timestamptz("last_score_decay_applied"),
    categoryBreakdown: jsonb("category_breakdown").$type<Record<string, number>>().default({}),

    // Status
    creditEligible: boolean("credit_eligible").notNull().default(false),
    lastCreditCheck: timestamptz("last_credit_check"),
    
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    memberPoolIdx: uniqueIndex("member_credit_profile_member_pool_unique").on(table.memberId, table.poolId),
    memberIdx: index("idx_member_credit_profile_member").on(table.memberId),
  })
);

export const creditLoans = pgTable(
  "credit_loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: text("loan_id").notNull(),
    poolId: uuid("pool_id").notNull(),
    memberId: uuid("member_id").notNull(),
    creditType: creditTypeEnum("credit_type").notNull(),
    status: creditStatusEnum("status").notNull().default("pending"),
    
    // Loan terms
    principal: bigint("principal", { mode: "number" }).notNull(),
    interestRate: integer("interest_rate").notNull().default(0), // Basis points
    interestAmount: bigint("interest_amount", { mode: "number" }).notNull().default(0),
    totalDue: bigint("total_due", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("USD"),
    
    // Timing
    termDays: integer("term_days").notNull(),
    issuedAt: timestamptz("issued_at"),
    dueDate: timestamptz("due_date"),
    repaidAt: timestamptz("repaid_at"),
    
    // Repayment tracking
    amountPaid: bigint("amount_paid", { mode: "number" }).notNull().default(0),
    paymentSchedule: jsonb("payment_schedule").notNull().default([]),
    nextPaymentDate: timestamptz("next_payment_date"),
    nextPaymentAmount: bigint("next_payment_amount", { mode: "number" }),
    
    // Risk metrics
    ubuntuScoreAtIssuance: integer("ubuntu_score_at_issuance").notNull(),
    poolHealthAtIssuance: integer("pool_health_at_issuance").notNull(),
    
    // Phase tracking
    phaseAtIssuance: creditPhaseEnum("phase_at_issuance").notNull(),
    
    // Metadata
    purpose: text("purpose"),
    approvedByEventId: uuid("approved_by_event_id"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    loanIdUnique: uniqueIndex("credit_loans_loan_id_unique").on(table.loanId),
    memberIdx: index("idx_credit_loans_member").on(table.memberId),
    poolIdx: index("idx_credit_loans_pool").on(table.poolId),
    statusIdx: index("idx_credit_loans_status").on(table.status),
    memberPoolIdx: index("idx_credit_loans_member_pool").on(table.memberId, table.poolId),
  })
);

export const creditPayments = pgTable(
  "credit_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => creditLoans.id),
    memberId: uuid("member_id").notNull(),
    poolId: uuid("pool_id").notNull(),
    
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("USD"),
    paymentType: text("payment_type").notNull(), // "principal", "interest", "full"
    
    // Timing
    scheduledDate: timestamptz("scheduled_date"),
    paidAt: timestamptz("paid_at"),
    isOnTime: boolean("is_on_time"),
    
    // Event linkage
    eventId: uuid("event_id"),
    
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    loanIdx: index("idx_credit_payments_loan").on(table.loanId),
    memberIdx: index("idx_credit_payments_member").on(table.memberId),
  })
);

export const poolHealthHistory = pgTable(
  "pool_health_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poolId: uuid("pool_id").notNull(),
    
    // Health metrics snapshot
    poolHealthScore: integer("pool_health_score").notNull(),
    bufferRatio: integer("buffer_ratio").notNull(), // Safety buffer / exposure * 100
    capitalRatio: integer("capital_ratio").notNull(), // Capital / total liabilities
    defaultRate: integer("default_rate").notNull(), // Basis points
    
    // Components
    liquidityScore: integer("liquidity_score").notNull(),
    assetQualityScore: integer("asset_quality_score").notNull(),
    profitabilityScore: integer("profitability_score").notNull(),
    growthScore: integer("growth_score").notNull(),
    
    recordedAt: timestamptz("recorded_at").notNull().defaultNow(),
  },
  (table) => ({
    poolIdx: index("idx_pool_health_history_pool").on(table.poolId),
    recordedAtIdx: index("idx_pool_health_history_recorded").on(table.poolId, table.recordedAt),
  })
);

export const reputationAttestations = pgTable(
  "reputation_attestations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    voterId: uuid("voter_id").notNull(),
    receiverId: uuid("receiver_id").notNull(),
    rating: integer("rating").notNull(), // 1-5
    context: text("context"),
    signature: text("signature"),
    signerPublicKey: text("signer_public_key"),
    expiresAt: timestamptz("expires_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    voterIdx: index("idx_reputation_attestations_voter").on(table.voterId),
    receiverIdx: index("idx_reputation_attestations_receiver").on(table.receiverId),
  })
);

export type ReputationAttestation = typeof reputationAttestations.$inferSelect;
export type NewReputationAttestation = typeof reputationAttestations.$inferInsert;

export type CreditPoolConfig = typeof creditPoolConfig.$inferSelect;
export type NewCreditPoolConfig = typeof creditPoolConfig.$inferInsert;

export type MemberCreditProfile = typeof memberCreditProfile.$inferSelect;
export type NewMemberCreditProfile = typeof memberCreditProfile.$inferInsert;

export type CreditLoan = typeof creditLoans.$inferSelect;
export type NewCreditLoan = typeof creditLoans.$inferInsert;

export type CreditPayment = typeof creditPayments.$inferSelect;
export type NewCreditPayment = typeof creditPayments.$inferInsert;

export type PoolHealthHistory = typeof poolHealthHistory.$inferSelect;
export type NewPoolHealthHistory = typeof poolHealthHistory.$inferInsert;

export type CreditPhase = (typeof creditPhaseEnum.enumValues)[number];
export type CreditStatus = (typeof creditStatusEnum.enumValues)[number];
export type CreditType = (typeof creditTypeEnum.enumValues)[number];

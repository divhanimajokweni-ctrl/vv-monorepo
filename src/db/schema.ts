/**
 * Ubuntu Pools — Phase 1: Database Schema (Drizzle ORM)
 *
 * This file defines the TypeScript representation of the PostgreSQL schema.
 * It mirrors the SQL migration exactly — the SQL migration is authoritative.
 *
 * Governance Charter Compliance:
 *   - All tables are append-only (no delete/update helpers exported)
 *   - All monetary values are bigint (integer minor units)
 *   - All timestamps are timestamptz (UTC)
 *   - Foreign keys enforce referential integrity
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
  char,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Helper: timestamptz using drizzle's timestamp with timezone
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// =============================================================================
// ENUMS
// =============================================================================

/**
 * event_status: lifecycle of an event record.
 * - pending: emitted, not yet posted to ledger
 * - posted:  journal entries created successfully
 * - failed:  posting failed; event retained for audit
 */
export const eventStatusEnum = pgEnum("event_status", [
  "pending",
  "posted",
  "failed",
]);

/**
 * account_type: standard double-entry account classification.
 * Debit-normal: asset, expense
 * Credit-normal: liability, equity, revenue
 */
export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

/**
 * entry_side: which side of the double-entry equation.
 */
export const entrySideEnum = pgEnum("entry_side", ["debit", "credit"]);

// =============================================================================
// TABLE: events
// =============================================================================

/**
 * The immutable, append-only event log.
 *
 * Every state change in Ubuntu Pools MUST produce a row here.
 * The hash column is a deterministic SHA-256 of the canonical payload.
 * The prev_hash column chains events for tamper-evidence.
 *
 * IMMUTABILITY: Enforced by DB triggers (prevent_event_mutation).
 * Only status transitions are permitted after insert.
 */
export const events = pgTable(
  "events",
  {
    /** UUID primary key, DB-generated */
    id: uuid("id").defaultRandom().primaryKey(),

    /**
     * Namespaced event type string.
     * Convention: '<domain>.<action>' e.g. 'pool.created', 'member.joined'
     * DB constraint: must contain a dot.
     */
    eventType: text("event_type").notNull(),

    /**
     * UUID of the entity that caused this event.
     * Could be a user ID, system process ID, etc.
     * NOT a foreign key — actors may not be in this DB (non-custodial).
     */
    actorId: uuid("actor_id").notNull(),

    /**
     * UUID of the primary entity this event concerns.
     * e.g. pool ID, member ID, transaction ID
     */
    entityId: uuid("entity_id").notNull(),

    /**
     * String discriminator for entityId.
     * e.g. 'pool', 'member', 'contribution'
     */
    entityType: text("entity_type").notNull(),

    /**
     * Structured event data. Schema is validated at application layer.
     * All monetary values in payload MUST be integer minor units.
     */
    payload: jsonb("payload").notNull().default({}),

    /**
     * Wall-clock time of event emission (UTC).
     * Set by the application, not the DB, for deterministic hashing.
     */
    occurredAt: timestamptz("occurred_at").notNull().defaultNow(),

    /**
     * Monotonically increasing sequence number per entity.
     * Used for ordering and gap detection.
     * DB constraint: unique per (entity_id, sequence_no).
     */
    sequenceNo: bigint("sequence_no", { mode: "number" }).notNull(),

    /**
     * SHA-256 hash of the canonical event fields.
     * Computed deterministically from: event_type, actor_id, entity_id,
     * entity_type, payload (sorted keys), occurred_at, sequence_no, prev_hash.
     * DB constraint: unique (no two events can have the same hash).
     */
    hash: text("hash").notNull(),

    /**
     * Hash of the previous event for this entity.
     * NULL only for the first event (sequence_no = 1).
     * Forms a hash chain for tamper-evidence.
     */
    prevHash: text("prev_hash"),

    /**
     * Lifecycle state of this event.
     * Only transitions: pending → posted, pending → failed.
     */
    status: eventStatusEnum("status").notNull().default("pending"),
  },
  (table) => ({
    // Unique hash (deterministic hashing guarantees no duplicates)
    hashUnique: uniqueIndex("events_hash_unique").on(table.hash),

    // Unique sequence per entity
    entitySequenceUnique: uniqueIndex("events_entity_sequence_unique").on(
      table.entityId,
      table.sequenceNo
    ),

    // Fast lookup by entity
    entityIdx: index("idx_events_entity").on(table.entityId, table.sequenceNo),

    // Fast lookup by actor
    actorIdx: index("idx_events_actor").on(table.actorId, table.occurredAt),

    // Fast lookup by type
    typeIdx: index("idx_events_type").on(table.eventType, table.occurredAt),
  })
);

// =============================================================================
// TABLE: ledger_accounts
// =============================================================================

/**
 * Chart of accounts for the double-entry ledger.
 *
 * Accounts are created once and never deleted.
 * Each account is tied to the event that created it.
 *
 * IMMUTABILITY: Enforced by DB triggers (prevent_account_mutation).
 * Identifying fields (code, type, currency, entity) cannot be changed.
 */
export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    /** UUID primary key, DB-generated */
    id: uuid("id").defaultRandom().primaryKey(),

    /**
     * Human-readable account code.
     * Convention: '<ENTITY_TYPE>-<ENTITY_ID_PREFIX>-<ACCOUNT_TYPE>'
     * e.g. 'POOL-001-ASSET', 'SYSTEM-SUSPENSE-LIABILITY'
     * DB constraint: unique.
     */
    code: text("code").notNull(),

    /** Descriptive name for the account */
    name: text("name").notNull(),

    /** Standard double-entry account classification */
    accountType: accountTypeEnum("account_type").notNull(),

    /**
     * ISO 4217 currency code (3 uppercase letters).
     * e.g. 'USD', 'ZAR', 'KES'
     * DB constraint: must match ^[A-Z]{3}$
     */
    currency: char("currency", { length: 3 }).notNull(),

    /**
     * Optional: UUID of the entity this account belongs to.
     * e.g. pool ID, member ID
     * Must be paired with entity_type.
     */
    entityId: uuid("entity_id"),

    /**
     * String discriminator for entityId.
     * e.g. 'pool', 'member'
     * Must be paired with entity_id.
     */
    entityType: text("entity_type"),

    /** Immutable creation timestamp */
    createdAt: timestamptz("created_at").notNull().defaultNow(),

    /**
     * The event that caused this account to be opened.
     * Foreign key to events.id.
     */
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),
  },
  (table) => ({
    // Unique account code
    codeUnique: uniqueIndex("ledger_accounts_code_unique").on(table.code),

    // Lookup by entity
    entityIdx: index("idx_ledger_accounts_entity").on(
      table.entityId,
      table.entityType
    ),

    // Lookup by type
    typeIdx: index("idx_ledger_accounts_type").on(
      table.accountType,
      table.currency
    ),
  })
);

// =============================================================================
// TABLE: journal_entries
// =============================================================================

/**
 * The immutable double-entry ledger.
 *
 * Every financial movement is recorded as a pair of entries (debit + credit)
 * that MUST balance to zero within a transaction_id.
 *
 * Corrections are made via reversing entries (new rows), NEVER by mutation.
 *
 * IMMUTABILITY: Enforced by DB triggers (prevent_journal_mutation).
 * No UPDATE or DELETE is permitted under any circumstances.
 */
export const journalEntries = pgTable(
  "journal_entries",
  {
    /** UUID primary key, DB-generated */
    id: uuid("id").defaultRandom().primaryKey(),

    /**
     * Groups the debit/credit pair(s) for one economic event.
     * All entries with the same transaction_id MUST balance.
     * Generated by the posting engine (UUID v4).
     */
    transactionId: uuid("transaction_id").notNull(),

    /**
     * The event that caused this journal entry.
     * Foreign key to events.id.
     * An event may produce multiple journal entries (complex postings).
     */
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),

    /**
     * Which ledger account is affected.
     * Foreign key to ledger_accounts.id.
     */
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id),

    /**
     * Which side of the double-entry equation.
     * 'debit' or 'credit'
     */
    side: entrySideEnum("side").notNull(),

    /**
     * Amount in integer minor units.
     * MUST be strictly positive (> 0).
     * DB constraint: amount > 0
     */
    amount: bigint("amount", { mode: "number" }).notNull(),

    /**
     * ISO 4217 currency code.
     * MUST match the account's currency.
     * Validated at application layer before insert.
     */
    currency: char("currency", { length: 3 }).notNull(),

    /** Human-readable memo for this entry */
    description: text("description").notNull().default(""),

    /** When this entry was written to the ledger */
    postedAt: timestamptz("posted_at").notNull().defaultNow(),

    /** Ordering within a transaction */
    sequenceNo: integer("sequence_no").notNull(),
  },
  (table) => ({
    // Fast lookup by transaction (to verify balance)
    txnIdx: index("idx_journal_entries_txn").on(
      table.transactionId,
      table.sequenceNo
    ),

    // Fast lookup by event
    eventIdx: index("idx_journal_entries_event").on(table.eventId),

    // Account history (for balance calculation)
    accountIdx: index("idx_journal_entries_account").on(
      table.accountId,
      table.postedAt
    ),

    // Unique entry per account per transaction sequence
    txnSeqUnique: uniqueIndex("journal_entries_txn_seq_unique").on(
      table.transactionId,
      table.accountId,
      table.sequenceNo
    ),
  })
);

// =============================================================================
// TABLE: posting_rules
// =============================================================================

/**
 * Configuration table mapping event types to ledger posting patterns.
 *
 * The posting engine reads this table to determine which accounts to
 * debit and credit when an event is processed.
 *
 * Account code templates support {entity_id} substitution.
 * Amount and currency are extracted from event.payload via JSONPath.
 */
export const postingRules = pgTable(
  "posting_rules",
  {
    /** UUID primary key, DB-generated */
    id: uuid("id").defaultRandom().primaryKey(),

    /**
     * The event type this rule applies to.
     * DB constraint: must be namespaced (contains a dot).
     */
    eventType: text("event_type").notNull(),

    /** Human-readable name for this rule */
    ruleName: text("rule_name").notNull(),

    /**
     * Account code to debit.
     * Supports {entity_id} template substitution.
     * e.g. 'POOL-{entity_id}-ASSET'
     */
    debitAccountCode: text("debit_account_code").notNull(),

    /**
     * Account code to credit.
     * Supports {entity_id} template substitution.
     */
    creditAccountCode: text("credit_account_code").notNull(),

    /**
     * JSONPath into event.payload to extract the amount (integer minor units).
     * e.g. '$.amount_minor' or '$.contribution.amount_cents'
     */
    amountPayloadPath: text("amount_payload_path").notNull(),

    /**
     * JSONPath into event.payload to extract the currency code.
     * e.g. '$.currency' or '$.contribution.currency'
     */
    currencyPayloadPath: text("currency_payload_path").notNull(),

    /**
     * Template for journal entry description.
     * Supports {event_type}, {entity_id}, {actor_id} substitution.
     */
    descriptionTemplate: text("description_template").notNull().default(""),

    /**
     * Whether this rule is active.
     * Inactive rules are not applied by the posting engine.
     * Note: this is configuration state, not event data — updates are allowed.
     */
    isActive: boolean("is_active").notNull().default(true),

    /** Immutable creation timestamp */
    createdAt: timestamptz("created_at").notNull().defaultNow(),

    /**
     * The event that created this rule.
     * Foreign key to events.id.
     */
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),

    /**
     * Version number. Incremented when a rule is superseded.
     * When a rule changes, a new row is inserted with version + 1,
     * and the old row's is_active is set to false.
     */
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    // Fast lookup by event type (for posting engine)
    eventTypeIdx: index("idx_posting_rules_event_type").on(table.eventType),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/** Inferred TypeScript types from schema */
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type LedgerAccount = typeof ledgerAccounts.$inferSelect;
export type NewLedgerAccount = typeof ledgerAccounts.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type PostingRule = typeof postingRules.$inferSelect;
export type NewPostingRule = typeof postingRules.$inferInsert;

export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type EntrySide = (typeof entrySideEnum.enumValues)[number];

// =============================================================================
// GOVERNANCE SCHEMA (Phase 3)
// =============================================================================

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "active",
  "executed",
  "rejected",
  "expired",
]);

export const voteTypeEnum = pgEnum("vote_type", [
  "approved",
  "rejected",
]);

export const voterTypeEnum = pgEnum("voter_type", [
  "member",
  "custodian",
  "governance",
]);

export const governanceConstitutions = pgTable(
  "governance_constitutions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    version: integer("version").notNull(),
    params: jsonb("params").notNull(),
    rules: jsonb("rules").notNull().default([]),
    effectiveFrom: timestamptz("effective_from").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),
  },
  (table) => ({
    versionUnique: uniqueIndex("governance_constitutions_version_unique").on(table.version),
  })
);

export const governanceProposals = pgTable(
  "governance_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalType: text("proposal_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    constitutionVersion: integer("constitution_version").notNull(),
    proposerId: uuid("proposer_id").notNull(),
    targetEntityId: uuid("target_entity_id"),
    targetEntityType: text("target_entity_type"),
    payload: jsonb("payload").notNull().default({}),
    status: proposalStatusEnum("status").notNull().default("draft"),
    quorumThreshold: integer("quorum_threshold").notNull(),
    approvalThreshold: integer("approval_threshold").notNull(),
    votingPeriodStart: timestamptz("voting_period_start").notNull().defaultNow(),
    votingPeriodEnd: timestamptz("voting_period_end").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),
    executedAt: timestamptz("executed_at"),
    executedByEventId: uuid("executed_by_event_id"),
  },
  (table) => ({
    statusIdx: index("idx_governance_proposals_status").on(table.status),
    proposerIdx: index("idx_governance_proposals_proposer").on(table.proposerId),
    constitutionIdx: index("idx_governance_proposals_constitution").on(table.constitutionVersion),
  })
);

export const governanceVotes = pgTable(
  "governance_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => governanceProposals.id),
    voterId: uuid("voter_id").notNull(),
    voterType: voterTypeEnum("voter_type").notNull(),
    vote: voteTypeEnum("vote").notNull(),
    weight: integer("weight").notNull().default(1),
    signature: text("signature"),
    signedAt: timestamptz("signed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),
  },
  (table) => ({
    proposalIdx: index("idx_governance_votes_proposal").on(table.proposalId),
    voterIdx: index("idx_governance_votes_voter").on(table.voterId),
    voterProposalUnique: uniqueIndex("governance_votes_unique_voter_proposal").on(
      table.proposalId,
      table.voterId
    ),
  })
);

export const governanceEnforcementRules = pgTable(
  "governance_enforcement_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    requiresApproval: boolean("requires_approval").notNull().default(true),
    quorumOverride: integer("quorum_override"),
    thresholdOverride: integer("threshold_override"),
    constitutionVersion: integer("constitution_version").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    createdByEventId: uuid("created_by_event_id")
      .notNull()
      .references(() => events.id),
  },
  (table) => ({
    actionActiveUnique: uniqueIndex("idx_governance_enforcement_rules_action").on(table.action, table.isActive),
  })
);

export type GovernanceConstitution = typeof governanceConstitutions.$inferSelect;
export type NewGovernanceConstitution = typeof governanceConstitutions.$inferInsert;

export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type NewGovernanceProposal = typeof governanceProposals.$inferInsert;

export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type NewGovernanceVote = typeof governanceVotes.$inferInsert;

export type GovernanceEnforcementRule = typeof governanceEnforcementRules.$inferSelect;
export type NewGovernanceEnforcementRule = typeof governanceEnforcementRules.$inferInsert;

export type ProposalStatus = (typeof proposalStatusEnum.enumValues)[number];
export type VoteType = (typeof voteTypeEnum.enumValues)[number];
export type VoterType = (typeof voterTypeEnum.enumValues)[number];

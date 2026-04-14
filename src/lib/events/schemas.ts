/**
 * Ubuntu Pools — Phase 1: Event Schemas & Zod Validators
 *
 * Defines the canonical event schema and all Phase 1 event types.
 *
 * Governance Charter Compliance:
 *   - All event payloads are validated server-side before emission.
 *   - Monetary values in payloads MUST be integer minor units (bigint/number).
 *   - Event types are namespaced strings (domain.action).
 *   - Schemas are the authoritative definition of what constitutes a valid event.
 *
 * Phase 1 Event Types (Ledger + Event Foundations only):
 *   - system.initialized       — system bootstrap event
 *   - ledger.account_opened    — a new ledger account was created
 *   - ledger.posting_rule_created — a new posting rule was registered
 *   - ledger.transaction_posted — a balanced journal transaction was posted
 *   - ledger.transaction_failed — a posting attempt failed
 *
 * Phase 2 Event Types (Non-Custodial Enforcement):
 *   - custody.intent_recorded    — an intent to act (non-custodial)
 *   - custody.authorization_signed — external signature verification recorded
 *   - custody.external_custody_linked — adapter registered for off-chain custody
 *
 * Phase 3 Event Types (Governance):
 *   - governance.proposal_created — a governance proposal
 *   - governance.proposal_approved — approval by a member
 *   - governance.proposal_rejected — rejection by a member
 *   - governance.proposal_executed — proposal passed and executed
 *   - governance.constitution_amended — constitution version changed
 *
 * Phase 4 Event Types (Trust):
 *   - trust.score_adjusted — trust score changed
 *   - trust.infraction_recorded — trust penalty applied
 *   - trust.appeal_filed — trust penalty appeal
 *   - trust.appeal_resolved — appeal outcome
 *
 * Phase 5 Event Types (Audit):
 *   - audit.chain_verified — hash chain integrity verified
 *   - audit.orphan_detected — orphaned event detected
 *   - audit.incident_created — compliance incident logged
 *   - audit.incident_resolved — incident resolved
 */

import { z } from "zod";

// =============================================================================
// PRIMITIVE VALIDATORS
// =============================================================================

/**
 * UUID validator — standard UUID v4 format.
 */
export const uuidSchema = z.string().uuid("Must be a valid UUID");

/**
 * ISO 4217 currency code — 3 uppercase letters.
 */
export const currencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 currency code (e.g. USD)");

/**
 * Minor unit amount — positive integer (no decimals, no negatives, no zero).
 * Represents the smallest unit of a currency (cents, pence, satoshis, etc.)
 */
export const minorUnitAmountSchema = z
  .number()
  .int()
  .positive();

/**
 * Namespaced event type — must contain exactly one dot.
 * e.g. 'pool.created', 'ledger.account_opened'
 */
export const eventTypeSchema = z
  .string()
  .min(3)
  .regex(
    /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_.]*$/,
    "Event type must be namespaced: '<domain>.<action>' (lowercase, underscores allowed)"
  );

/**
 * SHA-256 hex hash — 64 hex characters.
 */
export const sha256HashSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/, "Must be a valid SHA-256 hex hash");

// =============================================================================
// BASE EVENT SCHEMA
// =============================================================================

/**
 * BaseEventSchema: the canonical structure of every event in Ubuntu Pools.
 *
 * This schema is validated before any event is written to the event log.
 * The hash field is computed by the event emission library, not the caller.
 */
export const baseEventSchema = z.object({
  /** UUID primary key (DB-generated, omitted on input) */
  id: uuidSchema.optional(),

  /**
   * Namespaced event type.
   * Convention: '<domain>.<action>'
   */
  eventType: eventTypeSchema,

  /**
   * UUID of the entity that caused this event.
   * Must be a valid UUID — the actor must be identifiable.
   */
  actorId: uuidSchema,

  /**
   * UUID of the primary entity this event concerns.
   */
  entityId: uuidSchema,

  /**
   * String discriminator for entityId.
   * e.g. 'pool', 'member', 'contribution', 'system'
   */
  entityType: z
    .string()
    .min(1, "entityType must not be empty")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "entityType must be lowercase with underscores"
    ),

  /**
   * Structured event data.
   * Schema is specific to each event type (see below).
   */
  payload: z.record(z.string(), z.unknown()),

  /**
   * Wall-clock time of event emission (UTC).
   * Provided by the caller; used in deterministic hash computation.
   */
  occurredAt: z.iso.datetime(),

  /**
   * Monotonically increasing sequence number per entity.
   * Provided by the EventService after querying the current max.
   */
  sequenceNo: z.number().int().positive(),

  /**
   * SHA-256 hash of the canonical event fields.
   * Computed by the event emission library.
   */
  hash: sha256HashSchema,

  /**
   * Hash of the previous event for this entity.
   * NULL only for the first event (sequenceNo = 1).
   */
  prevHash: sha256HashSchema.nullable(),

  /** Lifecycle state */
  status: z.enum(["pending", "posted", "failed"]).default("pending"),
});

export type BaseEvent = z.infer<typeof baseEventSchema>;

/**
 * Input schema for creating a new event.
 * The caller provides: eventType, actorId, entityId, entityType, payload, occurredAt.
 * The EventService computes: sequenceNo, hash, prevHash, status.
 */
export const createEventInputSchema = baseEventSchema.pick({
  eventType: true,
  actorId: true,
  entityId: true,
  entityType: true,
  payload: true,
  occurredAt: true,
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// =============================================================================
// PHASE 1 EVENT PAYLOAD SCHEMAS
// =============================================================================

/**
 * system.initialized
 *
 * Emitted once when the system is bootstrapped.
 * Creates the system actor and initial ledger accounts.
 */
export const systemInitializedPayloadSchema = z.object({
  /** Human-readable description of the initialization */
  description: z.string().min(1),

  /** Version of the system being initialized */
  systemVersion: z.string().min(1),

  /** ISO 8601 timestamp of initialization */
  initializedAt: z.string().datetime({ offset: true }),
});

export type SystemInitializedPayload = z.infer<
  typeof systemInitializedPayloadSchema
>;

/**
 * ledger.account_opened
 *
 * Emitted when a new ledger account is created.
 * The posting engine uses this to register the account.
 */
export const ledgerAccountOpenedPayloadSchema = z.object({
  /** The account code being opened */
  accountCode: z
    .string()
    .min(1)
    .regex(/^[A-Z0-9_-]+$/, "Account code must be uppercase alphanumeric"),

  /** Human-readable account name */
  accountName: z.string().min(1),

  /** Account type */
  accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),

  /** ISO 4217 currency code */
  currency: currencySchema,

  /** Optional: entity this account belongs to */
  entityId: uuidSchema.optional(),

  /** Optional: entity type discriminator */
  entityType: z.string().optional(),
});

export type LedgerAccountOpenedPayload = z.infer<
  typeof ledgerAccountOpenedPayloadSchema
>;

/**
 * ledger.posting_rule_created
 *
 * Emitted when a new posting rule is registered.
 */
export const ledgerPostingRuleCreatedPayloadSchema = z.object({
  /** The event type this rule applies to */
  targetEventType: eventTypeSchema,

  /** Human-readable rule name */
  ruleName: z.string().min(1),

  /** Account code to debit (may contain {entity_id} template) */
  debitAccountCode: z.string().min(1),

  /** Account code to credit (may contain {entity_id} template) */
  creditAccountCode: z.string().min(1),

  /** JSONPath to amount in event payload */
  amountPayloadPath: z.string().min(1),

  /** JSONPath to currency in event payload */
  currencyPayloadPath: z.string().min(1),

  /** Description template */
  descriptionTemplate: z.string().default(""),

  /** Rule version */
  version: z.number().int().positive().default(1),
});

export type LedgerPostingRuleCreatedPayload = z.infer<
  typeof ledgerPostingRuleCreatedPayloadSchema
>;

/**
 * ledger.transaction_posted
 *
 * Emitted when a balanced journal transaction is successfully posted.
 * This event is the audit trail for every ledger posting.
 */
export const ledgerTransactionPostedPayloadSchema = z.object({
  /** The transaction ID grouping the journal entries */
  transactionId: uuidSchema,

  /** The event ID that triggered this posting */
  sourceEventId: uuidSchema,

  /** The posting rule ID that was applied */
  postingRuleId: uuidSchema,

  /** Total amount posted (integer minor units) */
  amount: minorUnitAmountSchema,

  /** Currency of the transaction */
  currency: currencySchema,

  /** Account code that was debited */
  debitAccountCode: z.string().min(1),

  /** Account code that was credited */
  creditAccountCode: z.string().min(1),

  /** Number of journal entries created */
  entryCount: z.number().int().positive(),
});

export type LedgerTransactionPostedPayload = z.infer<
  typeof ledgerTransactionPostedPayloadSchema
>;

/**
 * ledger.transaction_failed
 *
 * Emitted when a posting attempt fails.
 * The source event is marked as 'failed' in the event log.
 * This event is the audit trail for posting failures.
 */
export const ledgerTransactionFailedPayloadSchema = z.object({
  /** The event ID that triggered the failed posting */
  sourceEventId: uuidSchema,

  /** The posting rule ID that was attempted (if found) */
  postingRuleId: uuidSchema.optional(),

  /** Human-readable error message */
  errorMessage: z.string().min(1),

  /** Error code for programmatic handling */
  errorCode: z.enum([
    "RULE_NOT_FOUND",
    "ACCOUNT_NOT_FOUND",
    "CURRENCY_MISMATCH",
    "AMOUNT_EXTRACTION_FAILED",
    "BALANCE_ASSERTION_FAILED",
    "DUPLICATE_TRANSACTION",
    "UNKNOWN_ERROR",
  ]),

  /** Stack trace (development only, omitted in production) */
  stackTrace: z.string().optional(),
});

export type LedgerTransactionFailedPayload = z.infer<
  typeof ledgerTransactionFailedPayloadSchema
>;

// =============================================================================
// PHASE 2 EVENT PAYLOAD SCHEMAS (Non-Custodial Enforcement)
// =============================================================================

export const custodyIntentRecordedPayloadSchema = z.object({
  intentType: z.enum([
    "transfer",
    "withdrawal",
    "deposit",
    "allocation",
    "distribution",
  ]),
  sourceEntityId: uuidSchema,
  sourceEntityType: z.string().min(1),
  destinationEntityId: uuidSchema.optional(),
  destinationEntityType: z.string().optional(),
  amount: minorUnitAmountSchema,
  currency: currencySchema,
  intentHash: sha256HashSchema,
  intentExpiresAt: z.iso.datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CustodyIntentRecordedPayload = z.infer<
  typeof custodyIntentRecordedPayloadSchema
>;

export const custodyAuthorizationSignedPayloadSchema = z.object({
  intentEventId: uuidSchema,
  signerId: uuidSchema,
  signerType: z.enum(["member", "custodian", "multisig"]),
  signature: z.string().min(1),
  signatureAlgorithm: z.enum(["ed25519", "secp256k1", "rsa4096"]),
  signedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().optional(),
});

export type CustodyAuthorizationSignedPayload = z.infer<
  typeof custodyAuthorizationSignedPayloadSchema
>;

export const custodyExternalCustodyLinkedPayloadSchema = z.object({
  adapterType: z.enum(["webhook", "callback", "multisig", "hsm"]),
  adapterEndpoint: z.string().url().optional(),
  adapterPublicKey: z.string().optional(),
  linkedEntityId: uuidSchema,
  linkedEntityType: z.string().min(1),
  isActive: z.boolean().default(true),
});

export type CustodyExternalCustodyLinkedPayload = z.infer<
  typeof custodyExternalCustodyLinkedPayloadSchema
>;

// =============================================================================
// PHASE 3 EVENT PAYLOAD SCHEMAS (Governance)
// =============================================================================

export const governanceProposalCreatedPayloadSchema = z.object({
  proposalType: z.enum([
    "parameter_change",
    "rule_amendment",
    "membership_change",
    "treasury_allocation",
    "constitution_amendment",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  constitutionVersion: z.number().int().positive(),
  votingPeriodEnd: z.iso.datetime(),
  quorumThreshold: z.number().min(0).max(1),
  approvalThreshold: z.number().min(0).max(1),
  proposerId: uuidSchema,
  targetEntityId: uuidSchema.optional(),
  targetEntityType: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type GovernanceProposalCreatedPayload = z.infer<
  typeof governanceProposalCreatedPayloadSchema
>;

export const governanceProposalApprovedPayloadSchema = z.object({
  proposalId: uuidSchema,
  voterId: uuidSchema,
  voterType: z.enum(["member", "custodian", "governance"]),
  voteWeight: z.number().int().positive().default(1),
  signature: z.string().optional(),
  signedAt: z.iso.datetime().optional(),
});

export type GovernanceProposalApprovedPayload = z.infer<
  typeof governanceProposalApprovedPayloadSchema
>;

export const governanceProposalRejectedPayloadSchema = z.object({
  proposalId: uuidSchema,
  voterId: uuidSchema,
  voterType: z.enum(["member", "custodian", "governance"]),
  rejectionReason: z.string().optional(),
});

export type GovernanceProposalRejectedPayload = z.infer<
  typeof governanceProposalRejectedPayloadSchema
>;

export const governanceProposalExecutedPayloadSchema = z.object({
  proposalId: uuidSchema,
  executedBy: uuidSchema,
  executionResult: z.enum(["success", "partial", "failed"]),
  executedAt: z.iso.datetime(),
  resultPayload: z.record(z.string(), z.unknown()).optional(),
});

export type GovernanceProposalExecutedPayload = z.infer<
  typeof governanceProposalExecutedPayloadSchema
>;

export const governanceConstitutionAmendedPayloadSchema = z.object({
  previousVersion: z.number().int().positive(),
  newVersion: z.number().int().positive(),
  amendmentType: z.enum(["parameter", "rule", "structure"]),
  changedFields: z.array(z.string()),
  approvedByProposalId: uuidSchema,
  effectiveAt: z.iso.datetime(),
});

export type GovernanceConstitutionAmendedPayload = z.infer<
  typeof governanceConstitutionAmendedPayloadSchema
>;

// =============================================================================
// PHASE 4 EVENT PAYLOAD SCHEMAS (Trust)
// =============================================================================

export const trustScoreAdjustedPayloadSchema = z.object({
  subjectId: uuidSchema,
  subjectType: z.enum(["member", "custodian", "adapter"]),
  previousScore: z.number().min(0).max(100),
  newScore: z.number().min(0).max(100),
  adjustmentReason: z.enum([
    "approval",
    "rejection",
    "infraction",
    "appeal_granted",
    "appeal_denied",
    "time_decay",
    "manual_adjustment",
  ]),
  reasonDetails: z.string().optional(),
  adjustedBy: uuidSchema,
});

export type TrustScoreAdjustedPayload = z.infer<
  typeof trustScoreAdjustedPayloadSchema
>;

export const trustInfractionRecordedPayloadSchema = z.object({
  subjectId: uuidSchema,
  subjectType: z.enum(["member", "custodian", "adapter"]),
  infractionType: z.enum([
    "unauthorized_attempt",
    "violation_of_rules",
    "failed_custody_duty",
    "misrepresentation",
    "collusion",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  penaltyPoints: z.number().int().min(0).max(100),
  description: z.string().min(1),
  evidenceEventIds: z.array(uuidSchema).optional(),
  recordedBy: uuidSchema,
});

export type TrustInfractionRecordedPayload = z.infer<
  typeof trustInfractionRecordedPayloadSchema
>;

export const trustAppealFiledPayloadSchema = z.object({
  appealId: uuidSchema,
  infractionId: uuidSchema,
  appellantId: uuidSchema,
  grounds: z.string().min(1),
  evidenceUrls: z.array(z.string().url()).optional(),
  filedAt: z.iso.datetime(),
});

export type TrustAppealFiledPayload = z.infer<typeof trustAppealFiledPayloadSchema>;

export const trustAppealResolvedPayloadSchema = z.object({
  appealId: uuidSchema,
  infractionId: uuidSchema,
  resolution: z.enum(["upheld", "overturned", "reduced"]),
  resolutionReason: z.string().min(1),
  resolvedBy: uuidSchema,
  resolvedAt: z.iso.datetime(),
  newPenaltyPoints: z.number().int().min(0).optional(),
});

export type TrustAppealResolvedPayload = z.infer<typeof trustAppealResolvedPayloadSchema>;

// =============================================================================
// PHASE 5 EVENT PAYLOAD SCHEMAS (Audit)
// =============================================================================

export const auditChainVerifiedPayloadSchema = z.object({
  entityId: uuidSchema,
  entityType: z.string().min(1),
  eventCount: z.number().int().positive(),
  firstEventHash: sha256HashSchema,
  lastEventHash: sha256HashSchema,
  verificationResult: z.enum(["valid", "invalid", "inconclusive"]),
  errors: z.array(z.object({
    sequenceNo: z.number().int(),
    errorType: z.string(),
    expected: z.string().optional(),
    actual: z.string().optional(),
  })).optional(),
  verifiedAt: z.iso.datetime(),
  verifiedBy: z.string().min(1),
});

export type AuditChainVerifiedPayload = z.infer<typeof auditChainVerifiedPayloadSchema>;

export const auditOrphanDetectedPayloadSchema = z.object({
  orphanEventId: uuidSchema,
  prevHash: sha256HashSchema.nullable(),
  expectedPrevHash: sha256HashSchema,
  detectedAt: z.iso.datetime(),
  detectedBy: z.string().min(1),
  resolution: z.enum(["linked", "rejected", "quarantined"]).optional(),
});

export type AuditOrphanDetectedPayload = z.infer<typeof auditOrphanDetectedPayloadSchema>;

export const auditIncidentCreatedPayloadSchema = z.object({
  incidentId: uuidSchema,
  severity: z.enum(["low", "medium", "high", "critical"]),
  incidentType: z.enum([
    "hash_mismatch",
    "orphan_event",
    "quorum_failure",
    "custody_breach",
    "trust_violation",
    "governance_violation",
    "data_integrity",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  relatedEventIds: z.array(uuidSchema).optional(),
  relatedEntityIds: z.array(uuidSchema).optional(),
  createdAt: z.iso.datetime(),
  assignee: z.string().optional(),
});

export type AuditIncidentCreatedPayload = z.infer<typeof auditIncidentCreatedPayloadSchema>;

export const auditIncidentResolvedPayloadSchema = z.object({
  incidentId: uuidSchema,
  resolution: z.enum(["resolved", "false_positive", "accepted_risk"]),
  resolutionNotes: z.string().min(1),
  resolvedBy: uuidSchema,
  resolvedAt: z.iso.datetime(),
});

export type AuditIncidentResolvedPayload = z.infer<typeof auditIncidentResolvedPayloadSchema>;

// =============================================================================
// PHASE 15 EVENT PAYLOAD SCHEMAS (Games)
// =============================================================================

export const gameSessionStartedPayloadSchema = z.object({
  gameId: z.enum(["ubuntu_monopoly", "pool_simulator", "credit_ladder", "the_commons", "market_maker"]),
  memberId: uuidSchema,
  isMultiplayer: z.boolean().default(false),
  villageId: uuidSchema.optional(),
});

export type GameSessionStartedPayload = z.infer<typeof gameSessionStartedPayloadSchema>;

export const gameSessionCompletedPayloadSchema = z.object({
  sessionId: uuidSchema,
  gameId: z.enum(["ubuntu_monopoly", "pool_simulator", "credit_ladder", "the_commons", "market_maker"]),
  memberId: uuidSchema,
  finalScore: z.number().int().min(0),
  durationMs: z.number().int().positive(),
  prestigeAwarded: z.number().int().min(0),
});

export type GameSessionCompletedPayload = z.infer<typeof gameSessionCompletedPayloadSchema>;

export const gameTelemetryEmittedPayloadSchema = z.object({
  sessionId: uuidSchema,
  memberId: uuidSchema,
  gameId: z.enum(["ubuntu_monopoly", "pool_simulator", "credit_ladder", "the_commons", "market_maker"]),
  signals: z.array(z.object({
    type: z.string().min(1),
    value: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
  })),
  consentGiven: z.boolean(),
});

export type GameTelemetryEmittedPayload = z.infer<typeof gameTelemetryEmittedPayloadSchema>;

export const gamePrestigeAwardedPayloadSchema = z.object({
  memberId: uuidSchema,
  gameId: z.enum(["ubuntu_monopoly", "pool_simulator", "credit_ladder", "the_commons", "market_maker"]),
  points: z.number().int().min(0),
  reason: z.string().min(1),
});

export type GamePrestigeAwardedPayload = z.infer<typeof gamePrestigeAwardedPayloadSchema>;

// =============================================================================
// TYPED EVENT SCHEMAS (full event with typed payload)
// =============================================================================

/**
 * Typed event schemas for each Phase 1 event type.
 * These combine the base event schema with the specific payload schema.
 */

export const systemInitializedEventSchema = baseEventSchema.extend({
  eventType: z.literal("system.initialized"),
  entityType: z.literal("system"),
  payload: systemInitializedPayloadSchema,
});

export const ledgerAccountOpenedEventSchema = baseEventSchema.extend({
  eventType: z.literal("ledger.account_opened"),
  entityType: z.literal("ledger_account"),
  payload: ledgerAccountOpenedPayloadSchema,
});

export const ledgerPostingRuleCreatedEventSchema = baseEventSchema.extend({
  eventType: z.literal("ledger.posting_rule_created"),
  entityType: z.literal("posting_rule"),
  payload: ledgerPostingRuleCreatedPayloadSchema,
});

export const ledgerTransactionPostedEventSchema = baseEventSchema.extend({
  eventType: z.literal("ledger.transaction_posted"),
  entityType: z.literal("ledger_transaction"),
  payload: ledgerTransactionPostedPayloadSchema,
});

export const ledgerTransactionFailedEventSchema = baseEventSchema.extend({
  eventType: z.literal("ledger.transaction_failed"),
  entityType: z.literal("ledger_transaction"),
  payload: ledgerTransactionFailedPayloadSchema,
});

// =============================================================================
// PHASE 2 TYPED EVENT SCHEMAS (Non-Custodial Enforcement)
// =============================================================================

export const custodyIntentRecordedEventSchema = baseEventSchema.extend({
  eventType: z.literal("custody.intent_recorded"),
  entityType: z.literal("intent"),
  payload: custodyIntentRecordedPayloadSchema,
});

export const custodyAuthorizationSignedEventSchema = baseEventSchema.extend({
  eventType: z.literal("custody.authorization_signed"),
  entityType: z.literal("authorization"),
  payload: custodyAuthorizationSignedPayloadSchema,
});

export const custodyExternalCustodyLinkedEventSchema = baseEventSchema.extend({
  eventType: z.literal("custody.external_custody_linked"),
  entityType: z.literal("custody_adapter"),
  payload: custodyExternalCustodyLinkedPayloadSchema,
});

// =============================================================================
// PHASE 3 TYPED EVENT SCHEMAS (Governance)
// =============================================================================

export const governanceProposalCreatedEventSchema = baseEventSchema.extend({
  eventType: z.literal("governance.proposal_created"),
  entityType: z.literal("proposal"),
  payload: governanceProposalCreatedPayloadSchema,
});

export const governanceProposalApprovedEventSchema = baseEventSchema.extend({
  eventType: z.literal("governance.proposal_approved"),
  entityType: z.literal("proposal_vote"),
  payload: governanceProposalApprovedPayloadSchema,
});

export const governanceProposalRejectedEventSchema = baseEventSchema.extend({
  eventType: z.literal("governance.proposal_rejected"),
  entityType: z.literal("proposal_vote"),
  payload: governanceProposalRejectedPayloadSchema,
});

export const governanceProposalExecutedEventSchema = baseEventSchema.extend({
  eventType: z.literal("governance.proposal_executed"),
  entityType: z.literal("proposal"),
  payload: governanceProposalExecutedPayloadSchema,
});

export const governanceConstitutionAmendedEventSchema = baseEventSchema.extend({
  eventType: z.literal("governance.constitution_amended"),
  entityType: z.literal("constitution"),
  payload: governanceConstitutionAmendedPayloadSchema,
});

// =============================================================================
// PHASE 4 TYPED EVENT SCHEMAS (Trust)
// =============================================================================

export const trustScoreAdjustedEventSchema = baseEventSchema.extend({
  eventType: z.literal("trust.score_adjusted"),
  entityType: z.literal("trust_record"),
  payload: trustScoreAdjustedPayloadSchema,
});

export const trustInfractionRecordedEventSchema = baseEventSchema.extend({
  eventType: z.literal("trust.infraction_recorded"),
  entityType: z.literal("infraction"),
  payload: trustInfractionRecordedPayloadSchema,
});

export const trustAppealFiledEventSchema = baseEventSchema.extend({
  eventType: z.literal("trust.appeal_filed"),
  entityType: z.literal("appeal"),
  payload: trustAppealFiledPayloadSchema,
});

export const trustAppealResolvedEventSchema = baseEventSchema.extend({
  eventType: z.literal("trust.appeal_resolved"),
  entityType: z.literal("appeal"),
  payload: trustAppealResolvedPayloadSchema,
});

// =============================================================================
// PHASE 5 TYPED EVENT SCHEMAS (Audit)
// =============================================================================

export const auditChainVerifiedEventSchema = baseEventSchema.extend({
  eventType: z.literal("audit.chain_verified"),
  entityType: z.literal("audit_verification"),
  payload: auditChainVerifiedPayloadSchema,
});

export const auditOrphanDetectedEventSchema = baseEventSchema.extend({
  eventType: z.literal("audit.orphan_detected"),
  entityType: z.literal("orphan_event"),
  payload: auditOrphanDetectedPayloadSchema,
});

export const auditIncidentCreatedEventSchema = baseEventSchema.extend({
  eventType: z.literal("audit.incident_created"),
  entityType: z.literal("incident"),
  payload: auditIncidentCreatedPayloadSchema,
});

export const auditIncidentResolvedEventSchema = baseEventSchema.extend({
  eventType: z.literal("audit.incident_resolved"),
  entityType: z.literal("incident"),
  payload: auditIncidentResolvedPayloadSchema,
});

// =============================================================================
// PHASE 15 TYPED EVENT SCHEMAS (Games)
// =============================================================================

export const gameSessionStartedEventSchema = baseEventSchema.extend({
  eventType: z.literal("game.session_started"),
  entityType: z.literal("game_session"),
  payload: gameSessionStartedPayloadSchema,
});

export const gameSessionCompletedEventSchema = baseEventSchema.extend({
  eventType: z.literal("game.session_completed"),
  entityType: z.literal("game_session"),
  payload: gameSessionCompletedPayloadSchema,
});

export const gameTelemetryEmittedEventSchema = baseEventSchema.extend({
  eventType: z.literal("game.telemetry_emitted"),
  entityType: z.literal("game_telemetry"),
  payload: gameTelemetryEmittedPayloadSchema,
});

export const gamePrestigeAwardedEventSchema = baseEventSchema.extend({
  eventType: z.literal("game.prestige_awarded"),
  entityType: z.literal("prestige_score"),
  payload: gamePrestigeAwardedPayloadSchema,
});

// =============================================================================
// DISCRIMINATED UNION: all Phase 1 events
// =============================================================================

/**
 * Phase1Event: discriminated union of all valid Phase 1 event types.
 * Used for exhaustive type checking in the posting engine.
 */
export const phase1EventSchema = z.discriminatedUnion("eventType", [
  systemInitializedEventSchema,
  ledgerAccountOpenedEventSchema,
  ledgerPostingRuleCreatedEventSchema,
  ledgerTransactionPostedEventSchema,
  ledgerTransactionFailedEventSchema,
]);

export type Phase1Event = z.infer<typeof phase1EventSchema>;

// =============================================================================
// DISCRIMINATED UNION: all Phase 2 events
// =============================================================================

export const phase2EventSchema = z.discriminatedUnion("eventType", [
  custodyIntentRecordedEventSchema,
  custodyAuthorizationSignedEventSchema,
  custodyExternalCustodyLinkedEventSchema,
]);

export type Phase2Event = z.infer<typeof phase2EventSchema>;

// =============================================================================
// DISCRIMINATED UNION: all Phase 3 events
// =============================================================================

export const phase3EventSchema = z.discriminatedUnion("eventType", [
  governanceProposalCreatedEventSchema,
  governanceProposalApprovedEventSchema,
  governanceProposalRejectedEventSchema,
  governanceProposalExecutedEventSchema,
  governanceConstitutionAmendedEventSchema,
]);

export type Phase3Event = z.infer<typeof phase3EventSchema>;

// =============================================================================
// DISCRIMINATED UNION: all Phase 4 events
// =============================================================================

export const phase4EventSchema = z.discriminatedUnion("eventType", [
  trustScoreAdjustedEventSchema,
  trustInfractionRecordedEventSchema,
  trustAppealFiledEventSchema,
  trustAppealResolvedEventSchema,
]);

export type Phase4Event = z.infer<typeof phase4EventSchema>;

// =============================================================================
// DISCRIMINATED UNION: all Phase 5 events
// =============================================================================

export const phase5EventSchema = z.discriminatedUnion("eventType", [
  auditChainVerifiedEventSchema,
  auditOrphanDetectedEventSchema,
  auditIncidentCreatedEventSchema,
  auditIncidentResolvedEventSchema,
]);

export type Phase5Event = z.infer<typeof phase5EventSchema>;

// =============================================================================
// DISCRIMINATED UNION: all Phase 15 events (Games)
// =============================================================================

export const phase15EventSchema = z.discriminatedUnion("eventType", [
  gameSessionStartedEventSchema,
  gameSessionCompletedEventSchema,
  gameTelemetryEmittedEventSchema,
  gamePrestigeAwardedEventSchema,
]);

export type Phase15Event = z.infer<typeof phase15EventSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

// Zod v4 safe parse result type (replaces z.SafeParseReturnType which was removed in v4)
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validates a raw event input before emission.
 * Returns a typed result with success/failure.
 */
export function validateEventInput(
  input: unknown
): SafeParseResult<CreateEventInput> {
  return createEventInputSchema.safeParse(input) as SafeParseResult<CreateEventInput>;
}

/**
 * Validates a complete event (including computed fields).
 * Used by the event log writer to verify integrity before insert.
 */
export function validateCompleteEvent(
  event: unknown
): SafeParseResult<BaseEvent> {
  return baseEventSchema.safeParse(event) as SafeParseResult<BaseEvent>;
}

/**
 * Validates a payload against a specific event type's schema.
 * Returns a typed result.
 */
export function validatePayloadForEventType(
  eventType: string,
  payload: unknown
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const schemaMap: Record<string, z.ZodSchema> = {
    // Phase 1
    "system.initialized": systemInitializedPayloadSchema,
    "ledger.account_opened": ledgerAccountOpenedPayloadSchema,
    "ledger.posting_rule_created": ledgerPostingRuleCreatedPayloadSchema,
    "ledger.transaction_posted": ledgerTransactionPostedPayloadSchema,
    "ledger.transaction_failed": ledgerTransactionFailedPayloadSchema,
    // Phase 2
    "custody.intent_recorded": custodyIntentRecordedPayloadSchema,
    "custody.authorization_signed": custodyAuthorizationSignedPayloadSchema,
    "custody.external_custody_linked": custodyExternalCustodyLinkedPayloadSchema,
    // Phase 3
    "governance.proposal_created": governanceProposalCreatedPayloadSchema,
    "governance.proposal_approved": governanceProposalApprovedPayloadSchema,
    "governance.proposal_rejected": governanceProposalRejectedPayloadSchema,
    "governance.proposal_executed": governanceProposalExecutedPayloadSchema,
    "governance.constitution_amended": governanceConstitutionAmendedPayloadSchema,
    // Phase 4
    "trust.score_adjusted": trustScoreAdjustedPayloadSchema,
    "trust.infraction_recorded": trustInfractionRecordedPayloadSchema,
    "trust.appeal_filed": trustAppealFiledPayloadSchema,
    "trust.appeal_resolved": trustAppealResolvedPayloadSchema,
    // Phase 5
    "audit.chain_verified": auditChainVerifiedPayloadSchema,
    "audit.orphan_detected": auditOrphanDetectedPayloadSchema,
    "audit.incident_created": auditIncidentCreatedPayloadSchema,
    "audit.incident_resolved": auditIncidentResolvedPayloadSchema,
    // Phase 15 (Games)
    "games.session_started": gameSessionStartedPayloadSchema,
    "games.session_completed": gameSessionCompletedPayloadSchema,
    "games.telemetry_emitted": gameTelemetryEmittedPayloadSchema,
    "games.prestige_awarded": gamePrestigeAwardedPayloadSchema,
  };

  const schema = schemaMap[eventType];
  if (!schema) {
    const result = z.record(z.string(), z.unknown()).safeParse(payload);
    return result;
  }

  return schema.safeParse(payload);
}

/**
 * Ubuntu Pools — Phase 3: Governance Module
 *
 * Exports all governance-related functionality.
 */

export {
  GovernanceRuleEngine,
  getConstitution,
  getLatestConstitution,
  registerConstitution,
  constitutionV1,
  defaultConstitutionParams,
  defaultConstitutionRules,
  evaluateQuorum,
  evaluateThreshold,
  validateProposalInput,
  registerMigration,
  migrateConstitution,
  governanceRuleEngine,
  type ConstitutionVersion,
  type ConstitutionParams,
  type GovernanceRule,
  type RuleEvaluationContext,
  type RuleEvaluationResult,
  type ValidationError,
  type QuorumResult,
  type ThresholdResult,
} from "./constitution";

export {
  ProposalService,
  createProposalService,
  validateProposal,
  validateVote,
  type ProposalStatus,
  type CreateProposalInput,
  type CastVoteInput,
  type ProposalDetails,
  type GovernanceDenial,
} from "../services/proposal-service";

export {
  GovernanceGate,
  createGovernanceGate,
  recordDenial,
  requiresGovernanceApproval,
  isGatedAction,
  GATED_ACTIONS,
  type GateAction,
  type GateContext,
  type GateResult,
  type ApprovalRequirement,
  type DenialEvent,
} from "./gate";

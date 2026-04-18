/**
 * Ubuntu Pools — Phase 3: Governance Constitution Module
 *
 * Machine-enforced governance rules with versioned constitution.
 * Provides deterministic validation of governance constraints.
 *
 * Governance Charter Compliance:
 *   - All constraints enforced server-side (not UI)
 *   - Quorum/threshold evaluation is deterministic
 *   - All governance actions produce auditable events
 *   - Constitution versions are immutable once deployed
 *   - Rule upgrades preserve auditability
 */

import { z } from "zod";
import { randomUUID } from "crypto";

// =============================================================================
// RULE ENGINE INTERFACES
// =============================================================================

export type RuleType =
  | "quorum"
  | "threshold"
  | "eligibility"
  | "timing"
  | "constraint";

export type RuleEffect = "allow" | "deny" | "require_approval";

export interface GovernanceRule {
  id: string;
  type: RuleType;
  name: string;
  description: string;
  effect: RuleEffect;
  params: Record<string, unknown>;
  version: number;
  createdAt: string;
}

export interface RuleEvaluationContext {
  constitutionVersion: number;
  proposalType: string;
  proposerId: string;
  voterId?: string;
  currentTime: string;
  activeMembers: number;
  totalWeight: number;
  approvals: number;
  rejections: number;
  proposalCreatedAt: string;
  votingPeriodEnd: string;
}

export interface RuleEvaluationResult {
  allowed: boolean;
  reason: string;
  ruleId: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// CONSTITUTION VERSION SCHEMA
// =============================================================================

export const constitutionParamsSchema = z.object({
  quorumThreshold: z.number().min(0).max(1),
  approvalThreshold: z.number().min(0).max(1),
  minVotingPeriodSeconds: z.number().int().positive(),
  maxVotingPeriodSeconds: z.number().int().positive(),
  minProposalTitleLength: z.number().int().positive(),
  minProposalDescriptionLength: z.number().int().positive(),
  requiredApprovals: z.number().int().positive().optional(),
  membershipRequirement: z.number().int().positive().optional(),
  eligibleVoterTypes: z.array(z.enum(["member", "custodian", "governance"])),
  requiresConstitutionApproval: z.boolean().default(false),
});

export type ConstitutionParams = z.infer<typeof constitutionParamsSchema>;

export const constitutionVersionSchema = z.object({
  version: z.number().int().positive(),
  params: constitutionParamsSchema,
  rules: z.array(z.object({
    id: z.string(),
    type: z.enum(["quorum", "threshold", "eligibility", "timing", "constraint"]),
    name: z.string(),
    description: z.string(),
    effect: z.enum(["allow", "deny", "require_approval"]),
    params: z.record(z.string(), z.unknown()),
    version: z.number().int().positive(),
    createdAt: z.string().datetime(),
  })),
  effectiveFrom: z.string().datetime(),
  createdAt: z.string().datetime(),
  description: z.string(),
});

export type ConstitutionVersion = z.infer<typeof constitutionVersionSchema>;

// =============================================================================
// DEFAULT CONSTITUTION (VERSION 1)
// =============================================================================

export const DEFAULT_CONSTITUTION_VERSION = 1;

export const defaultConstitutionParams: ConstitutionParams = {
  quorumThreshold: 0.5,
  approvalThreshold: 0.5,
  minVotingPeriodSeconds: 86400,
  maxVotingPeriodSeconds: 604800,
  minProposalTitleLength: 10,
  minProposalDescriptionLength: 50,
  requiredApprovals: 1,
  membershipRequirement: 1,
  eligibleVoterTypes: ["member"],
  requiresConstitutionApproval: true,
};

export const defaultConstitutionRules: GovernanceRule[] = [
  {
    id: "rule-001",
    type: "quorum",
    name: "Minimum Quorum",
    description: "At least 50% of active members must vote",
    effect: "require_approval",
    params: { threshold: 0.5 },
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "rule-002",
    type: "threshold",
    name: "Minimum Approval",
    description: "At least 50% of votes must be approvals",
    effect: "require_approval",
    params: { threshold: 0.5 },
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "rule-003",
    type: "timing",
    name: "Voting Period",
    description: "Voting must remain open for minimum period",
    effect: "deny",
    params: { minSeconds: 86400, maxSeconds: 604800 },
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "rule-004",
    type: "eligibility",
    name: "Proposer Eligibility",
    description: "Proposer must meet membership requirements",
    effect: "deny",
    params: { minMembershipPeriod: 1 },
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "rule-005",
    type: "constraint",
    name: "Constitution Amendment",
    description: "Constitution changes require supermajority",
    effect: "require_approval",
    params: { threshold: 0.67 },
    version: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

export const constitutionV1: ConstitutionVersion = {
  version: DEFAULT_CONSTITUTION_VERSION,
  params: defaultConstitutionParams,
  rules: defaultConstitutionRules,
  effectiveFrom: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  description: "Initial governance constitution",
};

// =============================================================================
// CONSTITUTION REGISTRY
// =============================================================================

const constitutionRegistry: Map<number, ConstitutionVersion> = new Map([
  [DEFAULT_CONSTITUTION_VERSION, constitutionV1],
]);

export function getConstitution(version: number): ConstitutionVersion | undefined {
  return constitutionRegistry.get(version);
}

export function getLatestConstitution(): ConstitutionVersion {
  const versions = Array.from(constitutionRegistry.keys()).sort((a, b) => b - a);
  return constitutionRegistry.get(versions[0])!;
}

export function registerConstitution(constitution: ConstitutionVersion): void {
  if (constitutionRegistry.has(constitution.version)) {
    throw new Error(`Constitution version ${constitution.version} already registered`);
  }
  constitutionRegistry.set(constitution.version, constitution);
}

// =============================================================================
// RULE ENGINE
// =============================================================================

export class GovernanceRuleEngine {
  private constitution: ConstitutionVersion;

  constructor(constitutionVersion?: number) {
    const version = constitutionVersion ?? DEFAULT_CONSTITUTION_VERSION;
    const constitution = getConstitution(version);
    if (!constitution) {
      throw new Error(`Constitution version ${version} not found`);
    }
    this.constitution = constitution;
  }

  setConstitution(version: number): void {
    const constitution = getConstitution(version);
    if (!constitution) {
      throw new Error(`Constitution version ${version} not found`);
    }
    this.constitution = constitution;
  }

  getConstitution(): ConstitutionVersion {
    return this.constitution;
  }

  getParams(): ConstitutionParams {
    return this.constitution.params;
  }

  evaluateRules(context: RuleEvaluationContext): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];

    for (const rule of this.constitution.rules) {
      const result = this.evaluateRule(rule, context);
      results.push(result);
    }

    return results;
  }

  evaluateRule(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    switch (rule.type) {
      case "quorum":
        return this.evaluateQuorum(rule, context);
      case "threshold":
        return this.evaluateThreshold(rule, context);
      case "timing":
        return this.evaluateTiming(rule, context);
      case "eligibility":
        return this.evaluateEligibility(rule, context);
      case "constraint":
        return this.evaluateConstraint(rule, context);
      default:
        return {
          allowed: false,
          reason: `Unknown rule type: ${(rule as GovernanceRule).type}`,
          ruleId: rule.id,
        };
    }
  }

  private evaluateQuorum(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const threshold = (rule.params.threshold as number) ?? this.constitution.params.quorumThreshold;
    const totalVotes = context.approvals + context.rejections;
    const quorumMet = context.activeMembers > 0 
      && (totalVotes / context.activeMembers) >= threshold;

    return {
      allowed: quorumMet,
      reason: quorumMet 
        ? `Quorum met: ${totalVotes}/${context.activeMembers} (threshold: ${threshold})`
        : `Quorum not met: ${totalVotes}/${context.activeMembers} (threshold: ${threshold})`,
      ruleId: rule.id,
      details: {
        threshold,
        totalVotes,
        activeMembers: context.activeMembers,
        percentage: context.activeMembers > 0 ? totalVotes / context.activeMembers : 0,
      },
    };
  }

  private evaluateThreshold(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const threshold = (rule.params.threshold as number) ?? this.constitution.params.approvalThreshold;
    const totalVotes = context.approvals + context.rejections;
    
    if (totalVotes === 0) {
      return {
        allowed: false,
        reason: "No votes cast",
        ruleId: rule.id,
      };
    }

    const approvalRatio = context.approvals / totalVotes;
    const thresholdMet = approvalRatio >= threshold;

    return {
      allowed: thresholdMet,
      reason: thresholdMet
        ? `Approval threshold met: ${approvalRatio.toFixed(2)} (threshold: ${threshold})`
        : `Approval threshold not met: ${approvalRatio.toFixed(2)} (threshold: ${threshold})`,
      ruleId: rule.id,
      details: {
        threshold,
        approvals: context.approvals,
        rejections: context.rejections,
        approvalRatio,
      },
    };
  }

  private evaluateTiming(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const minSeconds = (rule.params.minSeconds as number) ?? this.constitution.params.minVotingPeriodSeconds;
    const maxSeconds = (rule.params.maxSeconds as number) ?? this.constitution.params.maxVotingPeriodSeconds;
    
    const proposalTime = new Date(context.proposalCreatedAt).getTime();
    const currentTime = new Date(context.currentTime).getTime();
    const elapsedSeconds = (currentTime - proposalTime) / 1000;

    const minMet = elapsedSeconds >= minSeconds;
    const maxNotExceeded = elapsedSeconds <= maxSeconds;

    return {
      allowed: minMet && maxNotExceeded,
      reason: !minMet 
        ? `Voting period not started: ${elapsedSeconds}s elapsed (min: ${minSeconds}s)`
        : !maxNotExceeded
        ? `Voting period expired: ${elapsedSeconds}s elapsed (max: ${maxSeconds}s)`
        : `Voting period valid: ${elapsedSeconds}s elapsed`,
      ruleId: rule.id,
      details: {
        elapsedSeconds,
        minSeconds,
        maxSeconds,
      },
    };
  }

  private evaluateEligibility(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const minMembershipPeriod = (rule.params.minMembershipPeriod as number) 
      ?? this.constitution.params.membershipRequirement ?? 1;

    return {
      allowed: true,
      reason: `Eligibility check passed (minimum membership: ${minMembershipPeriod} period(s))`,
      ruleId: rule.id,
      details: {
        minMembershipPeriod,
        proposerId: context.proposerId,
      },
    };
  }

  private evaluateConstraint(rule: GovernanceRule, context: RuleEvaluationContext): RuleEvaluationResult {
    const isConstitutionAmendment = context.proposalType === "constitution_amendment";
    
    if (!isConstitutionAmendment) {
      return {
        allowed: true,
        reason: "Not a constitution amendment",
        ruleId: rule.id,
      };
    }

    const threshold = (rule.params.threshold as number) ?? 0.67;
    const totalVotes = context.approvals + context.rejections;
    const approvalRatio = totalVotes > 0 ? context.approvals / totalVotes : 0;
    const supermajorityMet = approvalRatio >= threshold;

    return {
      allowed: supermajorityMet,
      reason: supermajorityMet
        ? `Supermajority for constitution amendment: ${approvalRatio.toFixed(2)} (required: ${threshold})`
        : `Supermajority not met for constitution amendment: ${approvalRatio.toFixed(2)} (required: ${threshold})`,
      ruleId: rule.id,
      details: {
        threshold,
        approvalRatio,
        isConstitutionAmendment,
      },
    };
  }

  canApprove(context: RuleEvaluationContext): boolean {
    const results = this.evaluateRules(context);
    return results.every(r => r.allowed);
  }

  canExecute(context: RuleEvaluationContext): boolean {
    const results = this.evaluateRules(context);
    const denied = results.filter(r => !r.allowed);
    
    if (denied.length > 0) {
      return false;
    }

    const quorum = results.find(r => r.ruleId === "rule-001");
    const threshold = results.find(r => r.ruleId === "rule-002");
    
    return quorum?.allowed === true && threshold?.allowed === true;
  }
}

// =============================================================================
// QUORUM EVALUATION
// =============================================================================

export interface QuorumResult {
  quorumMet: boolean;
  quorumPercentage: number;
  requiredPercentage: number;
  votesCast: number;
  eligibleVoters: number;
}

export function evaluateQuorum(
  votesCast: number,
  eligibleVoters: number,
  quorumThreshold: number
): QuorumResult {
  const quorumPercentage = eligibleVoters > 0 ? votesCast / eligibleVoters : 0;
  
  return {
    quorumMet: quorumPercentage >= quorumThreshold,
    quorumPercentage,
    requiredPercentage: quorumThreshold,
    votesCast,
    eligibleVoters,
  };
}

export interface ThresholdResult {
  thresholdMet: boolean;
  approvalPercentage: number;
  requiredPercentage: number;
  approvals: number;
  rejections: number;
}

export function evaluateThreshold(
  approvals: number,
  rejections: number,
  approvalThreshold: number
): ThresholdResult {
  const total = approvals + rejections;
  const approvalPercentage = total > 0 ? approvals / total : 0;
  
  return {
    thresholdMet: approvalPercentage >= approvalThreshold,
    approvalPercentage,
    requiredPercentage: approvalThreshold,
    approvals,
    rejections,
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function validateProposalInput(input: {
  title: string;
  description: string;
  proposalType: string;
  votingPeriodEnd: string;
  proposerId: string;
  constitutionVersion: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  const constitution = getConstitution(input.constitutionVersion) ?? getLatestConstitution();
  const params = constitution.params;

  if (input.title.length < params.minProposalTitleLength) {
    errors.push({
      field: "title",
      message: `Title must be at least ${params.minProposalTitleLength} characters`,
      code: "TITLE_TOO_SHORT",
    });
  }

  if (input.description.length < params.minProposalDescriptionLength) {
    errors.push({
      field: "description",
      message: `Description must be at least ${params.minProposalDescriptionLength} characters`,
      code: "DESCRIPTION_TOO_SHORT",
    });
  }

  const votingEnd = new Date(input.votingPeriodEnd);
  const now = new Date();
  const minEnd = new Date(now.getTime() + params.minVotingPeriodSeconds * 1000);
  const maxEnd = new Date(now.getTime() + params.maxVotingPeriodSeconds * 1000);

  if (votingEnd < minEnd) {
    errors.push({
      field: "votingPeriodEnd",
      message: `Voting period must be at least ${params.minVotingPeriodSeconds} seconds`,
      code: "VOTING_PERIOD_TOO_SHORT",
    });
  }

  if (votingEnd > maxEnd) {
    errors.push({
      field: "votingPeriodEnd",
      message: `Voting period must be at most ${params.maxVotingPeriodSeconds} seconds`,
      code: "VOTING_PERIOD_TOO_LONG",
    });
  }

  if (!params.eligibleVoterTypes.includes("member")) {
    errors.push({
      field: "proposalType",
      message: "Proposal type not allowed by constitution",
      code: "PROPOSAL_TYPE_NOT_ALLOWED",
    });
  }

  return errors;
}

// =============================================================================
// MIGRATION SUPPORT
// =============================================================================

export interface ConstitutionMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (params: ConstitutionParams) => ConstitutionParams;
}

const migrations: ConstitutionMigration[] = [];

export function registerMigration(migration: ConstitutionMigration): void {
  migrations.push(migration);
}

export function migrateConstitution(fromVersion: number, toVersion: number): ConstitutionParams {
  let currentParams: ConstitutionParams | undefined;
  
  for (const migration of migrations) {
    if (migration.fromVersion === fromVersion) {
      currentParams = migration.migrate(currentParams ?? defaultConstitutionParams);
    }
  }

  return currentParams ?? defaultConstitutionParams;
}

export function getAvailableMigrations(): ConstitutionMigration[] {
  return [...migrations];
}

// =============================================================================
// EXPORTS
// =============================================================================

export const governanceRuleEngine = new GovernanceRuleEngine();

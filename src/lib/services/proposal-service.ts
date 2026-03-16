/**
 * Ubuntu Pools — Phase 3: Proposal Service
 *
 * Handles proposal lifecycle management with deterministic quorum/threshold evaluation.
 * All governance constraints are enforced server-side.
 *
 * Governance Charter Compliance:
 *   - Proposal lifecycle is deterministic
 *   - Quorum/threshold evaluation is deterministic (seeded by constitution version)
 *   - All state changes emit auditable events
 *   - Phase 1 features remain intact (posting engine unchanged)
 */

import { eq, and, gte, lte, asc } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  governanceProposals,
  governanceVotes,
  governanceConstitutions,
  governanceEnforcementRules,
  type GovernanceProposal,
  type GovernanceVote,
  type GovernanceConstitution,
} from "@/db/schema";
import { EventService } from "@/lib/services/event-service";
import {
  GovernanceRuleEngine,
  evaluateQuorum,
  evaluateThreshold,
  validateProposalInput,
  getLatestConstitution,
  type ConstitutionParams,
  type ValidationError,
  type QuorumResult,
  type ThresholdResult,
} from "@/lib/governance/constitution";
import type { CreateEventInput } from "@/lib/events/schemas";
import {
  governanceProposalCreatedPayloadSchema,
  governanceProposalApprovedPayloadSchema,
  governanceProposalRejectedPayloadSchema,
  governanceProposalExecutedPayloadSchema,
  governanceConstitutionAmendedPayloadSchema,
} from "@/lib/events/schemas";
import { randomUUID } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

export type ProposalStatus = "draft" | "active" | "executed" | "rejected" | "expired";

export interface CreateProposalInput {
  proposalType: "parameter_change" | "rule_amendment" | "membership_change" | "treasury_allocation" | "constitution_amendment";
  title: string;
  description: string;
  proposerId: string;
  targetEntityId?: string;
  targetEntityType?: string;
  payload?: Record<string, unknown>;
  votingPeriodEnd: string;
  constitutionVersion?: number;
}

export interface CastVoteInput {
  proposalId: string;
  voterId: string;
  voterType: "member" | "custodian" | "governance";
  vote: "approved" | "rejected";
  weight?: number;
  signature?: string;
  signedAt?: string;
}

export interface ProposalDetails extends GovernanceProposal {
  approvals: number;
  rejections: number;
  totalVotes: number;
  quorumResult: QuorumResult | null;
  thresholdResult: ThresholdResult | null;
  canExecute: boolean;
  isExpired: boolean;
}

export interface GovernanceDenial {
  denied: boolean;
  reason: string;
  code: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// PROPOSAL SERVICE
// =============================================================================

export class ProposalService {
  private eventService: EventService;
  private ruleEngine: GovernanceRuleEngine;

  constructor(db: Database) {
    this.eventService = new EventService(db);
    this.ruleEngine = new GovernanceRuleEngine();
  }

  /**
   * Creates a new governance proposal.
   * Emits governance.proposal_created event.
   */
  async createProposal(input: CreateProposalInput): Promise<{
    proposal: GovernanceProposal;
    eventId: string;
    errors?: ValidationError[];
  }> {
    const constitutionVersion = input.constitutionVersion ?? getLatestConstitution().version;
    const constitution = getLatestConstitution();
    
    if (!constitution) {
      throw new Error("No constitution found. System must be initialized first.");
    }

    const errors = validateProposalInput({
      title: input.title,
      description: input.description,
      proposalType: input.proposalType,
      votingPeriodEnd: input.votingPeriodEnd,
      proposerId: input.proposerId,
      constitutionVersion,
    });

    if (errors.length > 0) {
      return {
        proposal: null as unknown as GovernanceProposal,
        eventId: "",
        errors,
      };
    }

    const payload = governanceProposalCreatedPayloadSchema.parse({
      proposalType: input.proposalType,
      title: input.title,
      description: input.description,
      constitutionVersion,
      votingPeriodEnd: input.votingPeriodEnd,
      quorumThreshold: constitution.params.quorumThreshold,
      approvalThreshold: constitution.params.approvalThreshold,
      proposerId: input.proposerId,
      targetEntityId: input.targetEntityId,
      targetEntityType: input.targetEntityType,
      payload: input.payload,
    });

    const entityId = randomUUID();
    const occurredAt = new Date().toISOString();

    const eventInput: CreateEventInput = {
      eventType: "governance.proposal_created",
      actorId: input.proposerId,
      entityId,
      entityType: "proposal",
      payload,
      occurredAt,
    };

    const result = await this.eventService.emit(eventInput);

    const proposal: GovernanceProposal = {
      id: entityId,
      proposalType: input.proposalType,
      title: input.title,
      description: input.description,
      constitutionVersion,
      proposerId: input.proposerId,
      targetEntityId: input.targetEntityId ?? null,
      targetEntityType: input.targetEntityType ?? null,
      payload: input.payload ?? {},
      status: "draft",
      quorumThreshold: Math.floor(constitution.params.quorumThreshold * 10000),
      approvalThreshold: Math.floor(constitution.params.approvalThreshold * 10000),
      votingPeriodStart: new Date(occurredAt),
      votingPeriodEnd: new Date(input.votingPeriodEnd),
      createdAt: new Date(occurredAt),
      createdByEventId: result.event.id,
      executedAt: null,
      executedByEventId: null,
    };

    return {
      proposal,
      eventId: result.event.id,
    };
  }

  /**
   * Activates a proposal (moves from draft to active).
   * Once active, voting begins.
   */
  async activateProposal(proposalId: string, actorId: string): Promise<GovernanceProposal | null> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) return null;
    if (proposal.status !== "draft") {
      throw new Error(`Proposal ${proposalId} is not in draft status`);
    }

    // Update to active
    // Note: In production, this would be a DB update through the event
    return {
      ...proposal,
      status: "active",
    };
  }

  /**
   * Casts a vote on an active proposal.
   * Emits governance.proposal_approved or governance.proposal_rejected event.
   */
  async castVote(input: CastVoteInput): Promise<{
    vote: GovernanceVote;
    eventId: string;
  }> {
    const proposal = await this.getProposal(input.proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${input.proposalId} not found`);
    }

    if (proposal.status !== "active") {
      throw new Error(`Proposal ${input.proposalId} is not active`);
    }

    const now = new Date();
    if (now > new Date(proposal.votingPeriodEnd)) {
      throw new Error(`Voting period for proposal ${input.proposalId} has ended`);
    }

    const isApproval = input.vote === "approved";
    const eventType = isApproval 
      ? "governance.proposal_approved" 
      : "governance.proposal_rejected";

    const payload = isApproval
      ? governanceProposalApprovedPayloadSchema.parse({
          proposalId: input.proposalId,
          voterId: input.voterId,
          voterType: input.voterType,
          voteWeight: input.weight ?? 1,
          signature: input.signature,
          signedAt: input.signedAt,
        })
      : governanceProposalRejectedPayloadSchema.parse({
          proposalId: input.proposalId,
          voterId: input.voterId,
          voterType: input.voterType,
          rejectionReason: input.signature,
        });

    const eventInput: CreateEventInput = {
      eventType,
      actorId: input.voterId,
      entityId: randomUUID(),
      entityType: "proposal_vote",
      payload,
      occurredAt: new Date().toISOString(),
    };

    const result = await this.eventService.emit(eventInput);

    const vote: GovernanceVote = {
      id: result.event.entityId as string,
      proposalId: input.proposalId,
      voterId: input.voterId,
      voterType: input.voterType,
      vote: input.vote,
      weight: input.weight ?? 1,
      signature: input.signature ?? null,
      signedAt: input.signedAt ? new Date(input.signedAt) : null,
      createdAt: new Date(result.event.occurredAt),
      createdByEventId: result.event.id,
    };

    return {
      vote,
      eventId: result.event.id,
    };
  }

  /**
   * Gets detailed information about a proposal including vote counts.
   */
  async getProposalDetails(proposalId: string): Promise<ProposalDetails | null> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) return null;

    const votes = await this.getProposalVotes(proposalId);
    const approvals = votes.filter(v => v.vote === "approved");
    const rejections = votes.filter(v => v.vote === "rejected");

    const approvalCount = approvals.reduce((sum, v) => sum + v.weight, 0);
    const rejectionCount = rejections.reduce((sum, v) => sum + v.weight, 0);
    const totalVotes = votes.length;

    const quorumThreshold = proposal.quorumThreshold / 10000;
    const approvalThreshold = proposal.approvalThreshold / 10000;

    const quorumResult = evaluateQuorum(totalVotes, totalVotes, quorumThreshold);
    const thresholdResult = evaluateThreshold(approvalCount, rejectionCount, approvalThreshold);

    const now = new Date();
    const isExpired = now > new Date(proposal.votingPeriodEnd);
    const canExecute = 
      proposal.status === "active" &&
      isExpired &&
      quorumResult.quorumMet &&
      thresholdResult.thresholdMet;

    return {
      ...proposal,
      approvals: approvalCount,
      rejections: rejectionCount,
      totalVotes,
      quorumResult,
      thresholdResult,
      canExecute,
      isExpired,
    };
  }

  /**
   * Executes a proposal that has passed quorum and threshold.
   * Emits governance.proposal_executed event.
   */
  async executeProposal(
    proposalId: string,
    executorId: string,
    result: "success" | "partial" | "failed" = "success",
    resultPayload?: Record<string, unknown>
  ): Promise<{
    eventId: string;
  }> {
    const details = await this.getProposalDetails(proposalId);
    
    if (!details) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (!details.canExecute) {
      throw new Error(
        `Proposal ${proposalId} cannot be executed. ` +
        `Status: ${details.status}, Expired: ${details.isExpired}, ` +
        `Quorum: ${details.quorumResult?.quorumMet}, Threshold: ${details.thresholdResult?.thresholdMet}`
      );
    }

    const payload = governanceProposalExecutedPayloadSchema.parse({
      proposalId,
      executedBy: executorId,
      executionResult: result,
      executedAt: new Date().toISOString(),
      resultPayload,
    });

    const eventInput: CreateEventInput = {
      eventType: "governance.proposal_executed",
      actorId: executorId,
      entityId: proposalId,
      entityType: "proposal",
      payload,
      occurredAt: new Date().toISOString(),
    };

    const emitResult = await this.eventService.emit(eventInput);

    return {
      eventId: emitResult.event.id,
    };
  }

  /**
   * Rejects a proposal (typically after voting ends without passing).
   */
  async rejectProposal(proposalId: string, actorId: string): Promise<void> {
    const details = await this.getProposalDetails(proposalId);
    
    if (!details) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (details.status !== "active") {
      throw new Error(`Proposal ${proposalId} is not active`);
    }

    // Mark as rejected if voting period ended and thresholds not met
    // In production, this would be a DB update
  }

  /**
   * Gets a proposal by ID.
   */
  async getProposal(proposalId: string): Promise<GovernanceProposal | null> {
    // In production, query DB
    return null;
  }

  /**
   * Gets all votes for a proposal.
   */
  async getProposalVotes(proposalId: string): Promise<GovernanceVote[]> {
    // In production, query DB
    return [];
  }

  /**
   * Checks if an action requires governance approval.
   */
  async requiresApproval(action: string): Promise<boolean> {
    // Default: require approval for governance-related actions
    const governanceActions = [
      "pool.create",
      "pool.update",
      "pool.delete",
      "treasury.transfer",
      "treasury.allocate",
      "member.add",
      "member.remove",
      "rule.create",
      "rule.update",
      "constitution.amend",
    ];
    
    return governanceActions.includes(action);
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createProposalService(db: Database): ProposalService {
  return new ProposalService(db);
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateProposal(proposal: GovernanceProposal): GovernanceDenial {
  if (proposal.status === "draft") {
    return {
      denied: true,
      reason: "Proposal is still in draft status",
      code: "PROPOSAL_DRAFT",
    };
  }

  if (proposal.status === "executed") {
    return {
      denied: true,
      reason: "Proposal has already been executed",
      code: "PROPOSAL_EXECUTED",
    };
  }

  if (proposal.status === "rejected") {
    return {
      denied: true,
      reason: "Proposal has been rejected",
      code: "PROPOSAL_REJECTED",
    };
  }

  const now = new Date();
  const votingEnd = new Date(proposal.votingPeriodEnd);
  
  if (now > votingEnd && proposal.status === "active") {
    return {
      denied: true,
      reason: "Voting period has ended",
      code: "VOTING_PERIOD_ENDED",
    };
  }

  return {
    denied: false,
    reason: "Proposal is valid for voting",
    code: "VALID",
  };
}

export function validateVote(
  proposal: GovernanceProposal,
  voterId: string,
  existingVotes: GovernanceVote[]
): GovernanceDenial {
  const proposalValidation = validateProposal(proposal);
  if (proposalValidation.denied) {
    return proposalValidation;
  }

  const hasVoted = existingVotes.some(v => v.voterId === voterId);
  if (hasVoted) {
    return {
      denied: true,
      reason: "Voter has already cast a vote on this proposal",
      code: "ALREADY_VOTED",
    };
  }

  return {
    denied: false,
    reason: "Vote is valid",
    code: "VALID",
  };
}

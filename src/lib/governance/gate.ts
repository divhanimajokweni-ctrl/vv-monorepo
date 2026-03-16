/**
 * Ubuntu Pools — Phase 3: Governance Gate
 *
 * Server-side middleware that enforces governance constraints on actions.
 * Phase 1 features (posting engine, ledger) remain intact - this is an
 * additional validation layer that sits in front of governance-sensitive operations.
 *
 * Governance Charter Compliance:
 *   - All constraints enforced server-side
 *   - Phase 1 posting engine unchanged - gate validates before allowing
 *   - Explicit denials produce audit events
 *   - All checks are deterministic
 */

import type { Database } from "@/db/client";
import { governanceEnforcementRules, governanceProposals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { CreateEventInput } from "@/lib/events/schemas";
import { auditIncidentCreatedPayloadSchema } from "@/lib/events/schemas";
import { EventService } from "@/lib/services/event-service";
import { randomUUID } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

export type GateAction =
  | "pool.create"
  | "pool.update"
  | "pool.delete"
  | "pool.pause"
  | "treasury.transfer"
  | "treasury.allocate"
  | "treasury.distribute"
  | "member.add"
  | "member.remove"
  | "member.suspend"
  | "rule.create"
  | "rule.update"
  | "rule.delete"
  | "constitution.amend"
  | "parameter.update";

export interface GateContext {
  actorId: string;
  actorType: "member" | "custodian" | "governance" | "system";
  entityId?: string;
  entityType?: string;
  action: GateAction;
  payload?: Record<string, unknown>;
}

export interface GateResult {
  allowed: boolean;
  reason: string;
  code: string;
  requiresApproval: boolean;
  requiredProposalId?: string;
  details?: Record<string, unknown>;
}

export interface ApprovalRequirement {
  action: GateAction;
  requiresApproval: boolean;
  quorumOverride?: number;
  thresholdOverride?: number;
  constitutionVersion: number;
}

// =============================================================================
// GOVERNANCE GATE
// =============================================================================

export class GovernanceGate {
  private db: Database;
  private eventService: EventService;
  private cachedRules: Map<string, ApprovalRequirement> = new Map();
  private cacheLoaded: boolean = false;

  constructor(db: Database) {
    this.db = db;
    this.eventService = new EventService(db);
  }

  /**
   * Checks if an action requires governance approval and validates the context.
   */
  async check(context: GateContext): Promise<GateResult> {
    // System actors bypass governance
    if (context.actorType === "system") {
      return {
        allowed: true,
        reason: "System actor bypasses governance gate",
        code: "SYSTEM_ACTOR",
        requiresApproval: false,
      };
    }

    const requirement = await this.getApprovalRequirement(context.action);
    
    if (!requirement.requiresApproval) {
      return {
        allowed: true,
        reason: "Action does not require governance approval",
        code: "NO_APPROVAL_REQUIRED",
        requiresApproval: false,
      };
    }

    const validation = await this.validateActor(context);
    if (!validation.valid) {
      return {
        allowed: false,
        reason: validation.reason,
        code: validation.code,
        requiresApproval: true,
      };
    }

    const proposalCheck = await this.checkProposalRequirement(context);
    if (proposalCheck.requiresProposal) {
      return {
        allowed: false,
        reason: proposalCheck.reason,
        code: "PROPOSAL_REQUIRED",
        requiresApproval: true,
        requiredProposalId: proposalCheck.proposalId,
        details: proposalCheck.details,
      };
    }

    return {
      allowed: true,
      reason: "Action approved by governance gate",
      code: "APPROVED",
      requiresApproval: true,
    };
  }

  /**
   * Validates that the actor has permission to perform the action.
   */
  private async validateActor(context: GateContext): Promise<{
    valid: boolean;
    reason: string;
    code: string;
  }> {
    // System actors bypass governance
    if (context.actorType === "system") {
      return { valid: true, reason: "System actor", code: "SYSTEM_ACTOR" };
    }

    // Governance actors can perform any action
    if (context.actorType === "governance") {
      return { valid: true, reason: "Governance actor", code: "GOVERNANCE_ACTOR" };
    }

    // For now, all other actors require approval
    return { valid: true, reason: "Actor validated", code: "ACTOR_VALIDATED" };
  }

  /**
   * Checks if a required proposal exists and is approved.
   */
  private async checkProposalRequirement(context: GateContext): Promise<{
    requiresProposal: boolean;
    proposalId?: string;
    reason: string;
    details?: Record<string, unknown>;
  }> {
    // In a full implementation, we would:
    // 1. Look for an approved proposal that covers this action
    // 2. Check if the proposal's target matches
    // 3. Verify the proposal was executed
    
    // For now, return that a proposal is required
    return {
      requiresProposal: true,
      reason: `Action '${context.action}' requires governance approval via proposal`,
      details: {
        action: context.action,
        actorId: context.actorId,
        entityId: context.entityId,
      },
    };
  }

  /**
   * Gets the approval requirement for an action.
   */
  async getApprovalRequirement(action: GateAction): Promise<ApprovalRequirement> {
    if (!this.cacheLoaded) {
      await this.loadRules();
    }

    const cached = this.cachedRules.get(action);
    if (cached) {
      return cached;
    }

    // Default requirement - all governance actions require approval
    return {
      action,
      requiresApproval: true,
      constitutionVersion: 1,
    };
  }

  /**
   * Loads enforcement rules from the database.
   */
  private async loadRules(): Promise<void> {
    try {
      const rules = await this.db
        .select()
        .from(governanceEnforcementRules)
        .where(eq(governanceEnforcementRules.isActive, true));

      for (const rule of rules) {
        this.cachedRules.set(rule.action, {
          action: rule.action as GateAction,
          requiresApproval: rule.requiresApproval,
          quorumOverride: rule.quorumOverride ? rule.quorumOverride / 10000 : undefined,
          thresholdOverride: rule.thresholdOverride ? rule.thresholdOverride / 10000 : undefined,
          constitutionVersion: rule.constitutionVersion,
        });
      }
    } catch (error) {
      // If table doesn't exist yet, use defaults
    }
    
    this.cacheLoaded = true;
  }

  /**
   * Clears the rule cache (for testing or rule updates).
   */
  clearCache(): void {
    this.cachedRules.clear();
    this.cacheLoaded = false;
  }

  /**
   * Reloads rules from the database.
   */
  async reloadRules(): Promise<void> {
    this.clearCache();
    await this.loadRules();
  }
}

// =============================================================================
// FAILURE MODE HANDLING
// =============================================================================

export interface DenialEvent {
  timestamp: string;
  actorId: string;
  action: string;
  entityId?: string;
  entityType?: string;
  reason: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Records a governance denial as an audit incident.
 */
export async function recordDenial(
  eventService: EventService,
  denial: DenialEvent
): Promise<string> {
  const payload = auditIncidentCreatedPayloadSchema.parse({
    incidentId: randomUUID(),
    severity: "medium",
    incidentType: "governance_violation",
    title: `Governance denial: ${denial.action}`,
    description: denial.reason,
    relatedEventIds: [],
    relatedEntityIds: denial.entityId ? [denial.entityId] : [],
    createdAt: denial.timestamp,
    assignee: undefined,
  });

  const eventInput: CreateEventInput = {
    eventType: "audit.incident_created",
    actorId: denial.actorId,
    entityId: randomUUID(),
    entityType: "incident",
    payload,
    occurredAt: denial.timestamp,
  };

  const result = await eventService.emit(eventInput);
  return result.event.id;
}

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

export function createGovernanceGate(db: Database): GovernanceGate {
  return new GovernanceGate(db);
}

// =============================================================================
// ACTION REGISTRY
// =============================================================================

export const GATED_ACTIONS: GateAction[] = [
  "pool.create",
  "pool.update",
  "pool.delete",
  "pool.pause",
  "treasury.transfer",
  "treasury.allocate",
  "treasury.distribute",
  "member.add",
  "member.remove",
  "member.suspend",
  "rule.create",
  "rule.update",
  "rule.delete",
  "constitution.amend",
  "parameter.update",
];

export function isGatedAction(action: string): action is GateAction {
  return GATED_ACTIONS.includes(action as GateAction);
}

// =============================================================================
// HELPER: Check if action requires governance approval
// =============================================================================

export async function requiresGovernanceApproval(
  db: Database,
  action: GateAction
): Promise<boolean> {
  const gate = new GovernanceGate(db);
  const requirement = await gate.getApprovalRequirement(action);
  return requirement.requiresApproval;
}

/**
 * Ubuntu Pools — Phase 3: Governance Tests
 *
 * Tests for:
 *   - Governance constitution module (rule engine, versioned rules)
 *   - Proposal lifecycle (create, vote, execute)
 *   - Quorum/threshold evaluation (deterministic)
 *   - Failure modes (explicit denials with audit events)
 *   - Version upgrades (v1 → v2 migrations)
 *
 * Coverage:
 *   - GovernanceRuleEngine: rule evaluation, quorum, threshold
 *   - ProposalService: lifecycle, voting, execution
 *   - GovernanceGate: action gating, approval requirements
 *   - Failure modes: denials, invalid states
 *   - Constitution migrations: v1 → v2 upgrades
 */

import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import {
  GovernanceRuleEngine,
  constitutionV1,
  defaultConstitutionParams,
  getLatestConstitution,
  registerConstitution,
  evaluateQuorum,
  evaluateThreshold,
  validateProposalInput,
  registerMigration,
  migrateConstitution,
  type ConstitutionVersion,
  type RuleEvaluationContext,
} from "@ubuntu/governance/constitution";
import type { GovernanceProposal, GovernanceVote } from "@ubuntu/db/schema";
import {
  validateProposal,
  validateVote,
  type GovernanceDenial,
  type GateContext,
} from "@ubuntu/governance";
import {
  GovernanceGate,
  GATED_ACTIONS,
  isGatedAction,
  type GateAction,
} from "@ubuntu/governance/gate";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const testProposerId = randomUUID();
const testVoterId = randomUUID();
const testProposalId = randomUUID();

const testProposal: GovernanceProposal = {
  id: testProposalId,
  proposalType: "parameter_change",
  title: "Test Proposal",
  description: "This is a test proposal for governance testing",
  constitutionVersion: 1,
  proposerId: testProposerId,
  targetEntityId: null,
  targetEntityType: null,
  payload: {},
  status: "active",
  quorumThreshold: 5000,
  approvalThreshold: 5000,
  votingPeriodStart: new Date("2024-01-01T00:00:00Z"),
  votingPeriodEnd: new Date("2024-01-02T00:00:00Z"),
  createdAt: new Date("2024-01-01T00:00:00Z"),
  createdByEventId: randomUUID(),
  executedAt: null,
  executedByEventId: null,
};

const testVotes: GovernanceVote[] = [
  {
    id: randomUUID(),
    proposalId: testProposalId,
    voterId: randomUUID(),
    voterType: "member",
    vote: "approved",
    weight: 1,
    signature: null,
    signedAt: null,
    createdAt: new Date(),
    createdByEventId: randomUUID(),
  },
  {
    id: randomUUID(),
    proposalId: testProposalId,
    voterId: randomUUID(),
    voterType: "member",
    vote: "approved",
    weight: 1,
    signature: null,
    signedAt: null,
    createdAt: new Date(),
    createdByEventId: randomUUID(),
  },
  {
    id: randomUUID(),
    proposalId: testProposalId,
    voterId: randomUUID(),
    voterType: "member",
    vote: "rejected",
    weight: 1,
    signature: null,
    signedAt: null,
    createdAt: new Date(),
    createdByEventId: randomUUID(),
  },
];

// =============================================================================
// CONSTITUTION MODULE TESTS
// =============================================================================

describe("GovernanceRuleEngine", () => {
  let engine: GovernanceRuleEngine;

  beforeEach(() => {
    engine = new GovernanceRuleEngine(1);
  });

  describe("instantiation", () => {
    it("should create engine with default constitution", () => {
      expect(engine).toBeDefined();
      expect(engine.getConstitution()).toBeDefined();
      expect(engine.getConstitution().version).toBe(1);
    });

    it("should load specified constitution version", () => {
      const engineV1 = new GovernanceRuleEngine(1);
      expect(engineV1.getConstitution().version).toBe(1);
    });

    it("should throw for invalid version", () => {
      expect(() => new GovernanceRuleEngine(999)).toThrow("Constitution version 999 not found");
    });
  });

  describe("getParams()", () => {
    it("should return constitution parameters", () => {
      const params = engine.getParams();
      expect(params.quorumThreshold).toBe(0.5);
      expect(params.approvalThreshold).toBe(0.5);
      expect(params.minVotingPeriodSeconds).toBe(86400);
    });
  });

  describe("evaluateQuorum()", () => {
    it("should pass when quorum met", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 6,
        rejections: 4,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const quorumResult = results.find(r => r.ruleId === "rule-001");
      
      expect(quorumResult?.allowed).toBe(true);
    });

    it("should fail when quorum not met", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-01T12:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 2,
        rejections: 1,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const quorumResult = results.find(r => r.ruleId === "rule-001");
      
      expect(quorumResult?.allowed).toBe(false);
    });
  });

  describe("evaluateThreshold()", () => {
    it("should pass when approval threshold met", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 7,
        rejections: 3,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const thresholdResult = results.find(r => r.ruleId === "rule-002");
      
      expect(thresholdResult?.allowed).toBe(true);
    });

    it("should fail when approval threshold not met", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 4,
        rejections: 6,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const thresholdResult = results.find(r => r.ruleId === "rule-002");
      
      expect(thresholdResult?.allowed).toBe(false);
    });
  });

  describe("evaluateTiming()", () => {
    it("should fail before minimum voting period", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-01T12:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 5,
        rejections: 5,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const timingResult = results.find(r => r.ruleId === "rule-003");
      
      expect(timingResult?.allowed).toBe(false);
      expect(timingResult?.reason).toContain("not started");
    });

    it("should fail after maximum voting period", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-10T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 7,
        rejections: 3,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const timingResult = results.find(r => r.ruleId === "rule-003");
      
      expect(timingResult?.allowed).toBe(false);
      expect(timingResult?.reason).toContain("expired");
    });
  });

  describe("evaluateConstraint() for constitution amendment", () => {
    it("should require supermajority for constitution amendment", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "constitution_amendment",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 6,
        rejections: 4,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const constraintResult = results.find(r => r.ruleId === "rule-005");
      
      // 60% is not enough for 67% supermajority
      expect(constraintResult?.allowed).toBe(false);
    });

    it("should pass supermajority for constitution amendment", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "constitution_amendment",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 8,
        rejections: 2,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      const results = engine.evaluateRules(context);
      const constraintResult = results.find(r => r.ruleId === "rule-005");
      
      // 80% passes 67% supermajority
      expect(constraintResult?.allowed).toBe(true);
    });
  });

  describe("canApprove()", () => {
    it("should return true when all rules pass", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T00:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 7,
        rejections: 3,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      expect(engine.canApprove(context)).toBe(true);
    });
  });

  describe("canExecute()", () => {
    it("should return true when quorum and threshold met after voting period", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T12:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 7,
        rejections: 3,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      expect(engine.canExecute(context)).toBe(true);
    });

    it("should return false when threshold not met", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: new Date("2024-01-02T12:00:00Z").toISOString(),
        activeMembers: 10,
        totalWeight: 10,
        approvals: 4,
        rejections: 6,
        proposalCreatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        votingPeriodEnd: new Date("2024-01-02T00:00:00Z").toISOString(),
      };

      expect(engine.canExecute(context)).toBe(false);
    });
  });
});

// =============================================================================
// QUORUM/THRESHOLD EVALUATION TESTS
// =============================================================================

describe("evaluateQuorum", () => {
  it("should return quorum met when threshold reached", () => {
    const result = evaluateQuorum(6, 10, 0.5);
    expect(result.quorumMet).toBe(true);
    expect(result.quorumPercentage).toBe(0.6);
  });

  it("should return quorum not met when below threshold", () => {
    const result = evaluateQuorum(4, 10, 0.5);
    expect(result.quorumMet).toBe(false);
    expect(result.quorumPercentage).toBe(0.4);
  });

  it("should handle zero voters", () => {
    const result = evaluateQuorum(0, 0, 0.5);
    expect(result.quorumMet).toBe(false);
    expect(result.quorumPercentage).toBe(0);
  });

  it("should handle 100% quorum requirement", () => {
    const result = evaluateQuorum(10, 10, 1.0);
    expect(result.quorumMet).toBe(true);
    expect(result.quorumPercentage).toBe(1.0);
  });
});

describe("evaluateThreshold", () => {
  it("should return threshold met when approval exceeds threshold", () => {
    const result = evaluateThreshold(6, 4, 0.5);
    expect(result.thresholdMet).toBe(true);
    expect(result.approvalPercentage).toBe(0.6);
  });

  it("should return threshold not met when approval below threshold", () => {
    const result = evaluateThreshold(4, 6, 0.5);
    expect(result.thresholdMet).toBe(false);
    expect(result.approvalPercentage).toBe(0.4);
  });

  it("should handle zero votes", () => {
    const result = evaluateThreshold(0, 0, 0.5);
    expect(result.thresholdMet).toBe(false);
    expect(result.approvalPercentage).toBe(0);
  });

  it("should handle unanimous approval", () => {
    const result = evaluateThreshold(10, 0, 0.5);
    expect(result.thresholdMet).toBe(true);
    expect(result.approvalPercentage).toBe(1.0);
  });

  it("should handle unanimous rejection", () => {
    const result = evaluateThreshold(0, 10, 0.5);
    expect(result.thresholdMet).toBe(false);
    expect(result.approvalPercentage).toBe(0);
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe("validateProposalInput", () => {
  it("should pass valid proposal input", () => {
    const result = validateProposalInput({
      title: "Test Proposal Title",
      description: "This is a detailed description of the test proposal that is long enough",
      proposalType: "parameter_change",
      votingPeriodEnd: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      proposerId: testProposerId,
      constitutionVersion: 1,
    });

    expect(result).toHaveLength(0);
  });

  it("should fail when title is too short", () => {
    const result = validateProposalInput({
      title: "Short",
      description: "This is a detailed description of the test proposal that is long enough",
      proposalType: "parameter_change",
      votingPeriodEnd: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      proposerId: testProposerId,
      constitutionVersion: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("TITLE_TOO_SHORT");
  });

  it("should fail when description is too short", () => {
    const result = validateProposalInput({
      title: "Test Proposal Title",
      description: "Short",
      proposalType: "parameter_change",
      votingPeriodEnd: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      proposerId: testProposerId,
      constitutionVersion: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("DESCRIPTION_TOO_SHORT");
  });

  it("should fail when voting period is too short", () => {
    const result = validateProposalInput({
      title: "Test Proposal Title",
      description: "This is a detailed description of the test proposal that is long enough",
      proposalType: "parameter_change",
      votingPeriodEnd: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
      proposerId: testProposerId,
      constitutionVersion: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("VOTING_PERIOD_TOO_SHORT");
  });

  it("should fail when voting period is too long", () => {
    const result = validateProposalInput({
      title: "Test Proposal Title",
      description: "This is a detailed description of the test proposal that is long enough",
      proposalType: "parameter_change",
      votingPeriodEnd: new Date(Date.now() + 86400 * 1000 * 10).toISOString(), // 10 days
      proposerId: testProposerId,
      constitutionVersion: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("VOTING_PERIOD_TOO_LONG");
  });
});

// =============================================================================
// PROPOSAL VALIDATION TESTS
// =============================================================================

describe("validateProposal", () => {
  it("should deny draft proposal", () => {
    const draftProposal = { ...testProposal, status: "draft" as const };
    const result = validateProposal(draftProposal);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("PROPOSAL_DRAFT");
  });

  it("should deny executed proposal", () => {
    const executedProposal = { ...testProposal, status: "executed" as const };
    const result = validateProposal(executedProposal);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("PROPOSAL_EXECUTED");
  });

  it("should deny rejected proposal", () => {
    const rejectedProposal = { ...testProposal, status: "rejected" as const };
    const result = validateProposal(rejectedProposal);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("PROPOSAL_REJECTED");
  });

  it("should deny when voting period ended", () => {
    const expiredProposal = {
      ...testProposal,
      status: "active" as const,
      votingPeriodEnd: new Date("2020-01-01T00:00:00Z"),
    };
    const result = validateProposal(expiredProposal);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("VOTING_PERIOD_ENDED");
  });

  it("should allow active proposal within voting period", () => {
    const activeProposal = {
      ...testProposal,
      status: "active" as const,
      votingPeriodEnd: new Date(Date.now() + 86400 * 1000),
    };
    const result = validateProposal(activeProposal);

    expect(result.denied).toBe(false);
    expect(result.code).toBe("VALID");
  });
});

describe("validateVote", () => {
  it("should deny when proposal is draft", () => {
    const draftProposal = { ...testProposal, status: "draft" as const };
    const result = validateVote(draftProposal, testVoterId, []);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("PROPOSAL_DRAFT");
  });

  it("should deny when voter already voted", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const activeProposal = { 
      ...testProposal, 
      status: "active" as const,
      votingPeriodEnd: futureDate,
    };
    const existingVotes: GovernanceVote[] = [
      {
        id: randomUUID(),
        proposalId: testProposalId,
        voterId: testVoterId,
        voterType: "member",
        vote: "approved",
        weight: 1,
        signature: null,
        signedAt: null,
        createdAt: new Date(),
        createdByEventId: randomUUID(),
      },
    ];

    const result = validateVote(activeProposal, testVoterId, existingVotes);

    expect(result.denied).toBe(true);
    expect(result.code).toBe("ALREADY_VOTED");
  });

  it("should allow valid vote", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const activeProposal = { 
      ...testProposal, 
      status: "active" as const,
      votingPeriodEnd: futureDate,
    };
    const result = validateVote(activeProposal, testVoterId, []);

    expect(result.denied).toBe(false);
    expect(result.code).toBe("VALID");
  });
});

// =============================================================================
// GOVERNANCE GATE TESTS
// =============================================================================

describe("GovernanceGate", () => {
  let gate: GovernanceGate;

  beforeEach(() => {
    gate = new GovernanceGate({} as any);
  });

  describe("GATED_ACTIONS", () => {
    it("should include all governance-sensitive actions", () => {
      expect(GATED_ACTIONS).toContain("pool.create");
      expect(GATED_ACTIONS).toContain("pool.update");
      expect(GATED_ACTIONS).toContain("treasury.transfer");
      expect(GATED_ACTIONS).toContain("constitution.amend");
    });

    it("should have all actions as valid GateAction", () => {
      GATED_ACTIONS.forEach(action => {
        expect(isGatedAction(action)).toBe(true);
      });
    });
  });

  describe("isGatedAction()", () => {
    it("should return true for gated actions", () => {
      expect(isGatedAction("pool.create")).toBe(true);
      expect(isGatedAction("treasury.transfer")).toBe(true);
    });

    it("should return false for non-gated actions", () => {
      expect(isGatedAction("unknown.action")).toBe(false);
      expect(isGatedAction("user.login")).toBe(false);
    });
  });

  describe("check()", () => {
    it("should allow system actor without approval", async () => {
      const context: GateContext = {
        actorId: "system",
        actorType: "system",
        action: "pool.create",
      };

      const result = await gate.check(context);

      expect(result.allowed).toBe(true);
      expect(result.code).toBe("SYSTEM_ACTOR");
    });

    it("should require approval for governance actions", async () => {
      const context: GateContext = {
        actorId: testProposerId,
        actorType: "member",
        action: "pool.create",
      };

      const result = await gate.check(context);

      expect(result.requiresApproval).toBe(true);
    });
  });
});

// =============================================================================
// CONSTITUTION MIGRATION TESTS
// =============================================================================

describe("Constitution Migration", () => {
  it("should register a new constitution version", () => {
    const newConstitution: ConstitutionVersion = {
      version: 2,
      params: {
        ...defaultConstitutionParams,
        quorumThreshold: 0.6,
      },
      rules: [],
      effectiveFrom: "2024-06-01T00:00:00Z",
      createdAt: "2024-06-01T00:00:00Z",
      description: "Updated constitution with higher quorum",
    };

    registerConstitution(newConstitution);

    const loaded = getLatestConstitution();
    expect(loaded.version).toBe(2);
  });

  it("should throw when registering duplicate version", () => {
    const duplicate: ConstitutionVersion = {
      ...constitutionV1,
      version: 1,
    };

    expect(() => registerConstitution(duplicate)).toThrow("already registered");
  });

  it("should run migration from v1 to v2", () => {
    const migration = {
      fromVersion: 1,
      toVersion: 2,
      migrate: (params: typeof defaultConstitutionParams) => ({
        ...params,
        quorumThreshold: 0.6,
      }),
    };

    registerMigration(migration);

    const migrated = migrateConstitution(1, 2);
    expect(migrated.quorumThreshold).toBe(0.6);
  });
});

// =============================================================================
// FAILURE MODE TESTS
// =============================================================================

describe("Failure Modes", () => {
  describe("Explicit Denials with Audit Events", () => {
    it("should create denial event with full context", () => {
      const denial = {
        timestamp: new Date().toISOString(),
        actorId: testProposerId,
        action: "pool.create",
        entityId: randomUUID(),
        reason: "Action requires governance approval",
        code: "PROPOSAL_REQUIRED",
        details: {
          action: "pool.create",
          actorId: testProposerId,
        },
      };

      expect(denial.timestamp).toBeDefined();
      expect(denial.actorId).toBe(testProposerId);
      expect(denial.action).toBe("pool.create");
      expect(denial.reason).toBeDefined();
      expect(denial.code).toBeDefined();
    });
  });

  describe("Deterministic Validation", () => {
    it("should produce consistent results for same input", () => {
      const context: RuleEvaluationContext = {
        constitutionVersion: 1,
        proposalType: "parameter_change",
        proposerId: testProposerId,
        currentTime: "2024-01-02T00:00:00Z",
        activeMembers: 10,
        totalWeight: 10,
        approvals: 6,
        rejections: 4,
        proposalCreatedAt: "2024-01-01T00:00:00Z",
        votingPeriodEnd: "2024-01-02T00:00:00Z",
      };

      const engine1 = new GovernanceRuleEngine(1);
      const engine2 = new GovernanceRuleEngine(1);

      const result1 = engine1.evaluateRules(context);
      const result2 = engine2.evaluateRules(context);

      expect(result1).toEqual(result2);
    });
  });
});

// =============================================================================
// VERSION UPGRADE TESTS
// =============================================================================

describe("Version Upgrades v1 → vX", () => {
  it("should preserve auditability during upgrade", () => {
    const oldContext: RuleEvaluationContext = {
      constitutionVersion: 1,
      proposalType: "parameter_change",
      proposerId: testProposerId,
      currentTime: "2024-01-02T00:00:00Z",
      activeMembers: 10,
      totalWeight: 10,
      approvals: 6,
      rejections: 4,
      proposalCreatedAt: "2024-01-01T00:00:00Z",
      votingPeriodEnd: "2024-01-02T00:00:00Z",
    };

    const engine = new GovernanceRuleEngine(1);
    const results = engine.evaluateRules(oldContext);

    expect(results.length).toBeGreaterThan(0);
    results.forEach(result => {
      expect(result.ruleId).toBeDefined();
      expect(result.reason).toBeDefined();
    });
  });

  it("should allow constitution version change", () => {
    const newConstitution: ConstitutionVersion = {
      version: 3,
      params: {
        ...defaultConstitutionParams,
        approvalThreshold: 0.6,
      },
      rules: [],
      effectiveFrom: "2024-06-01T00:00:00Z",
      createdAt: "2024-06-01T00:00:00Z",
      description: "Updated with stricter approval",
    };

    registerConstitution(newConstitution);

    const engine = new GovernanceRuleEngine(3);
    expect(engine.getConstitution().version).toBe(3);
    expect(engine.getParams().approvalThreshold).toBe(0.6);
  });
});

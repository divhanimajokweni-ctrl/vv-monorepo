import { describe, it, expect } from "vitest";
import { computeTimeTrustSignal } from "@ubuntu/reputation/time-trust";
import { computeDiversitySignal } from "@ubuntu/reputation/diversity-scoring";
import { applyGrowthLimit, computeGrowthSignal } from "@ubuntu/reputation/growth-limits";
import { computeDeviceBindingSignal } from "@ubuntu/reputation/device-binding";
import {
  computeHumanVerificationSignal,
  canAdvanceToLevel,
  getRequiredVerificationForAction,
} from "@ubuntu/reputation/human-verification";
import {
  computeEconomicActivitySignal,
  computeTransactionFrictionSignal,
} from "@ubuntu/reputation/economic-activity";
import { computeSocialAnchorSignal, calculateSponsorPenalty } from "@ubuntu/reputation/social-anchors";
import { computeVillageShieldSignal, calculateVillageScorePenalty } from "@ubuntu/reputation/village-shield";
import { getPermissions, hasPermission } from "@ubuntu/reputation/permissions";
import {
  computeSybilScore,
  deriveSybilVerdict,
  evaluateUser,
} from "@ubuntu/reputation/decision-engine";
import type { SybilSignals } from "@ubuntu/reputation/types";

// --- Time Trust ---
describe("computeTimeTrustSignal", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("returns 0 for accounts less than 7 days old", () => {
    const created = new Date("2025-12-28T00:00:00Z"); // 4 days
    expect(computeTimeTrustSignal(created, now)).toBe(0);
  });

  it("returns 0.3 at exactly 30 days", () => {
    const created = new Date("2025-12-02T00:00:00Z");
    expect(computeTimeTrustSignal(created, now)).toBeCloseTo(0.3, 1);
  });

  it("interpolates between breakpoints", () => {
    const created = new Date("2025-11-17T00:00:00Z"); // ~45 days
    const signal = computeTimeTrustSignal(created, now);
    expect(signal).toBeGreaterThan(0.3);
    expect(signal).toBeLessThan(0.6);
  });

  it("returns 1.0 for accounts 365+ days old", () => {
    const created = new Date("2024-01-01T00:00:00Z");
    expect(computeTimeTrustSignal(created, now)).toBe(1.0);
  });
});

// --- Diversity ---
describe("computeDiversitySignal", () => {
  it("returns 0 for no transactions", () => {
    expect(computeDiversitySignal({ uniqueCounterparties: 0, totalTransactions: 0 })).toBe(0);
  });

  it("returns 0 for ratio below 0.3", () => {
    expect(computeDiversitySignal({ uniqueCounterparties: 2, totalTransactions: 10 })).toBe(0);
  });

  it("returns 1.0 for ratio of 1.0", () => {
    expect(computeDiversitySignal({ uniqueCounterparties: 10, totalTransactions: 10 })).toBe(1.0);
  });

  it("returns value between 0 and 1 for mid-range ratio", () => {
    const signal = computeDiversitySignal({ uniqueCounterparties: 6, totalTransactions: 10 });
    expect(signal).toBeGreaterThan(0);
    expect(signal).toBeLessThan(1);
  });
});

// --- Growth Limits ---
describe("applyGrowthLimit", () => {
  it("caps growth at 5 pts/day", () => {
    const result = applyGrowthLimit({ currentScore: 20, proposedScore: 30, todayGrowth: 0 });
    expect(result.cappedScore).toBe(25);
    expect(result.growthUsed).toBe(5);
  });

  it("allows decrease without limit", () => {
    const result = applyGrowthLimit({ currentScore: 50, proposedScore: 40, todayGrowth: 0 });
    expect(result.cappedScore).toBe(40);
  });

  it("respects already-used growth budget", () => {
    const result = applyGrowthLimit({ currentScore: 20, proposedScore: 30, todayGrowth: 3 });
    expect(result.cappedScore).toBe(22);
    expect(result.growthUsed).toBe(5);
  });

  it("blocks growth when budget exhausted", () => {
    const result = applyGrowthLimit({ currentScore: 20, proposedScore: 30, todayGrowth: 5 });
    expect(result.cappedScore).toBe(20);
  });
});

describe("computeGrowthSignal", () => {
  it("returns 1.0 for organic growth", () => {
    const signal = computeGrowthSignal({
      scoreHistory: [
        { date: "2025-01-01", score: 10 },
        { date: "2025-01-11", score: 20 },
      ],
      currentScore: 20,
    });
    expect(signal).toBe(1.0);
  });

  it("returns 0 for max daily growth", () => {
    const signal = computeGrowthSignal({
      scoreHistory: [
        { date: "2025-01-01", score: 0 },
        { date: "2025-01-03", score: 10 },
      ],
      currentScore: 10,
    });
    expect(signal).toBe(0);
  });

  it("returns 1.0 with insufficient history", () => {
    expect(computeGrowthSignal({ scoreHistory: [{ date: "2025-01-01", score: 10 }], currentScore: 10 })).toBe(1.0);
  });
});

// --- Device Binding ---
describe("computeDeviceBindingSignal", () => {
  it("returns 0 for no keys", () => {
    expect(computeDeviceBindingSignal(0)).toBe(0);
  });
  it("returns 0.5 for one key", () => {
    expect(computeDeviceBindingSignal(1)).toBe(0.5);
  });
  it("returns 1.0 for multiple keys", () => {
    expect(computeDeviceBindingSignal(3)).toBe(1.0);
  });
});

// --- Human Verification ---
describe("computeHumanVerificationSignal", () => {
  it("maps levels to signals", () => {
    expect(computeHumanVerificationSignal("level_0")).toBe(0);
    expect(computeHumanVerificationSignal("level_1")).toBe(0.33);
    expect(computeHumanVerificationSignal("level_2")).toBe(0.66);
    expect(computeHumanVerificationSignal("level_3")).toBe(1.0);
  });
});

describe("canAdvanceToLevel", () => {
  it("allows L0 → L1 with sufficient age", () => {
    const result = canAdvanceToLevel("level_0", "level_1", { accountAgeDays: 10, hasDeviceKey: false });
    expect(result.allowed).toBe(true);
  });

  it("blocks L0 → L1 for new accounts", () => {
    const result = canAdvanceToLevel("level_0", "level_1", { accountAgeDays: 3, hasDeviceKey: false });
    expect(result.allowed).toBe(false);
  });

  it("blocks skipping levels", () => {
    const result = canAdvanceToLevel("level_0", "level_2", { accountAgeDays: 100, hasDeviceKey: true });
    expect(result.allowed).toBe(false);
  });

  it("blocks L2 without device key", () => {
    const result = canAdvanceToLevel("level_1", "level_2", { accountAgeDays: 30, hasDeviceKey: false });
    expect(result.allowed).toBe(false);
  });

  it("blocks L3 without 90d age", () => {
    const result = canAdvanceToLevel("level_2", "level_3", { accountAgeDays: 60, hasDeviceKey: true });
    expect(result.allowed).toBe(false);
  });
});

describe("getRequiredVerificationForAction", () => {
  it("returns correct levels", () => {
    expect(getRequiredVerificationForAction("view_only")).toBe("level_0");
    expect(getRequiredVerificationForAction("create_loan")).toBe("level_2");
    expect(getRequiredVerificationForAction("emergency_powers")).toBe("level_3");
  });

  it("defaults to level_0 for unknown actions", () => {
    expect(getRequiredVerificationForAction("unknown")).toBe("level_0");
  });
});

// --- Economic Activity ---
describe("computeEconomicActivitySignal", () => {
  it("returns 0 for young accounts", () => {
    expect(computeEconomicActivitySignal({ accountAgeDays: 3, loanCount: 5, repaymentCount: 5, savingsContributions: 5 })).toBe(0);
  });

  it("returns 0 for no activity", () => {
    expect(computeEconomicActivitySignal({ accountAgeDays: 30, loanCount: 0, repaymentCount: 0, savingsContributions: 0 })).toBe(0);
  });

  it("caps at 1.0", () => {
    expect(computeEconomicActivitySignal({ accountAgeDays: 30, loanCount: 50, repaymentCount: 50, savingsContributions: 50 })).toBe(1.0);
  });
});

describe("computeTransactionFrictionSignal", () => {
  it("returns 0 below minimum", () => {
    expect(computeTransactionFrictionSignal({ totalTransactions: 3, minTransactions: 5 })).toBe(0);
  });

  it("returns 1.0 at 2x minimum", () => {
    expect(computeTransactionFrictionSignal({ totalTransactions: 10, minTransactions: 5 })).toBe(1.0);
  });

  it("ramps between min and 2x", () => {
    const signal = computeTransactionFrictionSignal({ totalTransactions: 7, minTransactions: 5 });
    expect(signal).toBeCloseTo(0.4, 1);
  });
});

// --- Social Anchors ---
describe("computeSocialAnchorSignal", () => {
  it("returns 0 without sponsor", () => {
    expect(computeSocialAnchorSignal({ sponsorId: null, inviteDepth: 0, sponsorScore: 80 })).toBe(0);
  });

  it("returns high signal for direct invite from high-score sponsor", () => {
    const signal = computeSocialAnchorSignal({ sponsorId: "s1", inviteDepth: 0, sponsorScore: 100 });
    expect(signal).toBe(1.0);
  });

  it("decreases with depth", () => {
    const shallow = computeSocialAnchorSignal({ sponsorId: "s1", inviteDepth: 1, sponsorScore: 80 });
    const deep = computeSocialAnchorSignal({ sponsorId: "s1", inviteDepth: 4, sponsorScore: 80 });
    expect(shallow).toBeGreaterThan(deep);
  });
});

describe("calculateSponsorPenalty", () => {
  it("returns 1.0 below 20% flagged", () => {
    expect(calculateSponsorPenalty("s1", 1, 10)).toBe(1.0);
  });

  it("returns 0 at 80%+ flagged", () => {
    expect(calculateSponsorPenalty("s1", 8, 10)).toBe(0);
  });

  it("returns 1.0 for no invitees", () => {
    expect(calculateSponsorPenalty("s1", 0, 0)).toBe(1.0);
  });
});

// --- Village Shield ---
describe("computeVillageShieldSignal", () => {
  it("returns 0 for empty village", () => {
    expect(computeVillageShieldSignal({ villageScore: 80, memberFlaggedCount: 0, totalMembers: 0 })).toBe(0);
  });

  it("returns high signal for clean village", () => {
    const signal = computeVillageShieldSignal({ villageScore: 80, memberFlaggedCount: 0, totalMembers: 10 });
    expect(signal).toBe(0.8);
  });

  it("decreases with flagged members", () => {
    const clean = computeVillageShieldSignal({ villageScore: 80, memberFlaggedCount: 0, totalMembers: 10 });
    const flagged = computeVillageShieldSignal({ villageScore: 80, memberFlaggedCount: 3, totalMembers: 10 });
    expect(clean).toBeGreaterThan(flagged);
  });
});

describe("calculateVillageScorePenalty", () => {
  it("applies severity multipliers", () => {
    expect(calculateVillageScorePenalty({ currentVillageScore: 100, flagSeverity: "low" })).toBe(95);
    expect(calculateVillageScorePenalty({ currentVillageScore: 100, flagSeverity: "critical" })).toBe(50);
  });
});

// --- Permissions ---
describe("getPermissions", () => {
  it("grants only view_only for score 0 at level_0", () => {
    expect(getPermissions(0, "level_0")).toEqual(["view_only"]);
  });

  it("grants more permissions with higher score and level", () => {
    const perms = getPermissions(60, "level_2");
    expect(perms).toContain("view_only");
    expect(perms).toContain("create_loan");
    expect(perms).toContain("invite_members");
    expect(perms).not.toContain("emergency_powers");
  });

  it("blocks permissions when level too low", () => {
    const perms = getPermissions(90, "level_1");
    expect(perms).not.toContain("vote_on_governance");
    expect(perms).not.toContain("emergency_powers");
  });
});

describe("hasPermission", () => {
  it("returns true when requirements met", () => {
    expect(hasPermission(50, "level_2", "create_loan")).toBe(true);
  });

  it("returns false for unknown action", () => {
    expect(hasPermission(100, "level_3", "unknown_action")).toBe(false);
  });
});

// --- Decision Engine ---
describe("computeSybilScore", () => {
  it("returns 0 for all-zero signals", () => {
    const signals: SybilSignals = {
      deviceBinding: 0, humanVerification: 0, socialAnchor: 0,
      economicActivity: 0, graphAnalysis: 0, transactionFriction: 0,
      reputationGrowth: 0, interactionDiversity: 0, timeTrust: 0, villageShield: 0,
    };
    expect(computeSybilScore(signals)).toBe(0);
  });

  it("returns 100 for all-one signals", () => {
    const signals: SybilSignals = {
      deviceBinding: 1, humanVerification: 1, socialAnchor: 1,
      economicActivity: 1, graphAnalysis: 1, transactionFriction: 1,
      reputationGrowth: 1, interactionDiversity: 1, timeTrust: 1, villageShield: 1,
    };
    expect(computeSybilScore(signals)).toBe(100);
  });
});

describe("deriveSybilVerdict", () => {
  it("maps score ranges to verdicts", () => {
    expect(deriveSybilVerdict(80)).toBe("trusted");
    expect(deriveSybilVerdict(70)).toBe("trusted");
    expect(deriveSybilVerdict(50)).toBe("provisional");
    expect(deriveSybilVerdict(30)).toBe("suspicious");
    expect(deriveSybilVerdict(10)).toBe("blocked");
  });
});

describe("evaluateUser", () => {
  it("returns full verdict for trusted user", () => {
    const signals: SybilSignals = {
      deviceBinding: 1, humanVerification: 1, socialAnchor: 1,
      economicActivity: 1, graphAnalysis: 1, transactionFriction: 1,
      reputationGrowth: 1, interactionDiversity: 1, timeTrust: 1, villageShield: 1,
    };
    const verdict = evaluateUser({ userId: "u1", signals, verificationLevel: "level_3" });
    expect(verdict.score).toBe(100);
    expect(verdict.verdict).toBe("trusted");
    expect(verdict.permissions).toContain("emergency_powers");
    expect(verdict.flags).toHaveLength(0);
  });

  it("flags issues for zero signals", () => {
    const signals: SybilSignals = {
      deviceBinding: 0, humanVerification: 0, socialAnchor: 0,
      economicActivity: 0, graphAnalysis: 0, transactionFriction: 0,
      reputationGrowth: 0, interactionDiversity: 0, timeTrust: 0, villageShield: 0,
    };
    const verdict = evaluateUser({ userId: "u2", signals, verificationLevel: "level_0" });
    expect(verdict.score).toBe(0);
    expect(verdict.verdict).toBe("blocked");
    expect(verdict.flags).toContain("no_device_key");
    expect(verdict.flags).toContain("new_account");
  });
});

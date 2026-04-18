import type { VerificationLevel } from "./types";

interface PermissionTier {
  minScore: number;
  minVerification: VerificationLevel;
}

const PERMISSION_TIERS: Record<string, PermissionTier> = {
  view_only: { minScore: 0, minVerification: "level_0" },
  basic_participation: { minScore: 10, minVerification: "level_1" },
  create_proposals: { minScore: 30, minVerification: "level_1" },
  vote_on_governance: { minScore: 40, minVerification: "level_2" },
  create_loan: { minScore: 50, minVerification: "level_2" },
  invite_members: { minScore: 60, minVerification: "level_2" },
  arbitrate_disputes: { minScore: 70, minVerification: "level_3" },
  emergency_powers: { minScore: 90, minVerification: "level_3" },
};

const LEVEL_ORDER: VerificationLevel[] = [
  "level_0",
  "level_1",
  "level_2",
  "level_3",
];

export function getPermissions(
  score: number,
  verificationLevel: VerificationLevel
): string[] {
  const levelIdx = LEVEL_ORDER.indexOf(verificationLevel);
  return Object.entries(PERMISSION_TIERS)
    .filter(([, tier]) => {
      return (
        score >= tier.minScore &&
        levelIdx >= LEVEL_ORDER.indexOf(tier.minVerification)
      );
    })
    .map(([action]) => action);
}

export function hasPermission(
  score: number,
  verificationLevel: VerificationLevel,
  action: string
): boolean {
  const tier = PERMISSION_TIERS[action];
  if (!tier) return false;

  const levelIdx = LEVEL_ORDER.indexOf(verificationLevel);
  const requiredIdx = LEVEL_ORDER.indexOf(tier.minVerification);

  return score >= tier.minScore && levelIdx >= requiredIdx;
}

export { PERMISSION_TIERS };

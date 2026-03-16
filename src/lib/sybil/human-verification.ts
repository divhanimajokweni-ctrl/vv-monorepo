import type { VerificationLevel } from "./types";

const LEVEL_SIGNALS: Record<VerificationLevel, number> = {
  level_0: 0,
  level_1: 0.33,
  level_2: 0.66,
  level_3: 1.0,
};

const LEVEL_ORDER: VerificationLevel[] = [
  "level_0",
  "level_1",
  "level_2",
  "level_3",
];

export function computeHumanVerificationSignal(
  level: VerificationLevel
): number {
  return LEVEL_SIGNALS[level];
}

export function canAdvanceToLevel(
  current: VerificationLevel,
  target: VerificationLevel,
  context: { accountAgeDays: number; hasDeviceKey: boolean }
): { allowed: boolean; reason?: string } {
  const currentIdx = LEVEL_ORDER.indexOf(current);
  const targetIdx = LEVEL_ORDER.indexOf(target);

  if (targetIdx <= currentIdx) {
    return { allowed: false, reason: "Target level must be higher than current" };
  }
  if (targetIdx !== currentIdx + 1) {
    return { allowed: false, reason: "Can only advance one level at a time" };
  }
  if (target === "level_1" && context.accountAgeDays < 7) {
    return { allowed: false, reason: "Account must be at least 7 days old" };
  }
  if (target === "level_2" && !context.hasDeviceKey) {
    return { allowed: false, reason: "Device key required for level 2" };
  }
  if (target === "level_3" && context.accountAgeDays < 90) {
    return { allowed: false, reason: "Account must be at least 90 days old for level 3" };
  }

  return { allowed: true };
}

export function getRequiredVerificationForAction(
  action: string
): VerificationLevel {
  const actionLevels: Record<string, VerificationLevel> = {
    view_only: "level_0",
    basic_participation: "level_1",
    create_proposals: "level_1",
    vote_on_governance: "level_2",
    create_loan: "level_2",
    invite_members: "level_2",
    arbitrate_disputes: "level_3",
    emergency_powers: "level_3",
  };
  return actionLevels[action] ?? "level_0";
}

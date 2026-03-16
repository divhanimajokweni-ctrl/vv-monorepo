import type { SybilSignals, SybilVerdict, SybilVerdictType, VerificationLevel } from "./types";
import { getPermissions } from "./permissions";

const SIGNAL_WEIGHTS: Record<keyof SybilSignals, number> = {
  deviceBinding: 0.1,
  humanVerification: 0.15,
  socialAnchor: 0.1,
  economicActivity: 0.15,
  graphAnalysis: 0.15,
  transactionFriction: 0.05,
  reputationGrowth: 0.05,
  interactionDiversity: 0.1,
  timeTrust: 0.1,
  villageShield: 0.05,
};

export function computeSybilScore(signals: SybilSignals): number {
  let score = 0;
  for (const [key, weight] of Object.entries(SIGNAL_WEIGHTS)) {
    score += signals[key as keyof SybilSignals] * weight;
  }
  return Math.round(score * 100);
}

export function deriveSybilVerdict(score: number): SybilVerdictType {
  if (score >= 70) return "trusted";
  if (score >= 40) return "provisional";
  if (score >= 20) return "suspicious";
  return "blocked";
}

export function evaluateUser(params: {
  userId: string;
  signals: SybilSignals;
  verificationLevel: VerificationLevel;
}): SybilVerdict {
  const { userId, signals, verificationLevel } = params;
  const score = computeSybilScore(signals);
  const verdict = deriveSybilVerdict(score);
  const permissions = getPermissions(score, verificationLevel);

  const flags: string[] = [];
  if (signals.deviceBinding === 0) flags.push("no_device_key");
  if (signals.timeTrust === 0) flags.push("new_account");
  if (signals.reputationGrowth === 0) flags.push("suspicious_growth");
  if (signals.interactionDiversity === 0) flags.push("low_diversity");
  if (signals.socialAnchor === 0) flags.push("no_sponsor");

  return { userId, score, verdict, signals, permissions, flags };
}

export { SIGNAL_WEIGHTS };

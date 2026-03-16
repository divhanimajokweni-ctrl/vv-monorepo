export function computeVillageShieldSignal(params: {
  villageScore: number;
  memberFlaggedCount: number;
  totalMembers: number;
}): number {
  const { villageScore, memberFlaggedCount, totalMembers } = params;

  if (totalMembers === 0) return 0;

  const flagRatio = memberFlaggedCount / totalMembers;
  const villageFactor = villageScore / 100;

  // High flag ratio reduces signal
  const cleanFactor = Math.max(0, 1 - flagRatio * 2);

  return villageFactor * cleanFactor;
}

export function calculateVillageScorePenalty(params: {
  currentVillageScore: number;
  flagSeverity: "low" | "medium" | "high" | "critical";
}): number {
  const { currentVillageScore, flagSeverity } = params;

  const multipliers: Record<string, number> = {
    low: 0.95,
    medium: 0.85,
    high: 0.7,
    critical: 0.5,
  };

  const multiplier = multipliers[flagSeverity] ?? 1.0;
  return Math.max(0, currentVillageScore * multiplier);
}

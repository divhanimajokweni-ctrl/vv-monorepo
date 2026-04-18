const MAX_DAILY_GROWTH = 5;

export function applyGrowthLimit(params: {
  currentScore: number;
  proposedScore: number;
  todayGrowth: number;
}): { cappedScore: number; growthUsed: number } {
  const { currentScore, proposedScore, todayGrowth } = params;
  const remainingBudget = Math.max(0, MAX_DAILY_GROWTH - todayGrowth);
  const rawGrowth = proposedScore - currentScore;

  if (rawGrowth <= 0) {
    return { cappedScore: proposedScore, growthUsed: todayGrowth };
  }

  const allowedGrowth = Math.min(rawGrowth, remainingBudget);
  const cappedScore = Math.min(currentScore + allowedGrowth, 100);

  return {
    cappedScore,
    growthUsed: todayGrowth + allowedGrowth,
  };
}

export function computeGrowthSignal(params: {
  scoreHistory: { date: string; score: number }[];
  currentScore: number;
}): number {
  const { scoreHistory, currentScore } = params;
  if (scoreHistory.length < 2) return 1.0;

  const sorted = [...scoreHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const oldest = sorted[0].score;
  const daySpan =
    (new Date(sorted[sorted.length - 1].date).getTime() -
      new Date(sorted[0].date).getTime()) /
    (1000 * 60 * 60 * 24);

  if (daySpan === 0) return 1.0;

  const totalGrowth = currentScore - oldest;
  const avgDailyGrowth = totalGrowth / daySpan;

  // Organic growth: <=2 pts/day is perfect, >=5 pts/day is suspicious
  if (avgDailyGrowth <= 2) return 1.0;
  if (avgDailyGrowth >= MAX_DAILY_GROWTH) return 0;
  return 1.0 - (avgDailyGrowth - 2) / 3;
}

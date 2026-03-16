/**
 * Ubuntu Pools — Trust Graph Weight Calculator
 * Pure functions for computing edge weights
 */

/**
 * Calculate frequency factor from interaction count.
 * Logarithmic scaling capped at 5.0.
 */
export function calculateFrequencyFactor(interactionCount: number): number {
  return Math.min(Math.log2(interactionCount + 1), 5.0);
}

/**
 * Calculate reputation multiplier from source trust score.
 * Clamped to [0.1, 2.0].
 */
export function calculateReputationMultiplier(sourceTrustScore: number): number {
  return Math.min(Math.max(sourceTrustScore / 100, 0.1), 2.0);
}

/**
 * Normalize transaction value against median.
 * Capped at 10.0.
 */
export function normalizeTransactionValue(value: number, median: number): number {
  if (median <= 0) return 0;
  return Math.min(value / median, 10.0);
}

/**
 * Calculate edge weight: W = T_norm × R × F
 */
export function calculateEdgeWeight(params: {
  transactionValue: number;
  reputationMultiplier: number;
  frequencyFactor: number;
}): number {
  return params.transactionValue * params.reputationMultiplier * params.frequencyFactor;
}

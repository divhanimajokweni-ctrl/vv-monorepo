/**
 * Ubuntu Pools — Verifiable Score Computation
 * Deterministic score derived from signed contribution events
 */

import { computeMerkleRoot } from "@ubuntu/ledger/merkle";

export interface ScoredContribution {
  hash: string;
  impactValue: number;
}

export function computeVerifiableScore(events: ScoredContribution[]): {
  score: number;
  inputHash: string;
} {
  if (events.length === 0) {
    return { score: 0, inputHash: "" };
  }

  const hashes = events.map((e) => e.hash);
  const inputHash = computeMerkleRoot(hashes);

  const totalImpact = events.reduce((sum, e) => sum + e.impactValue, 0);
  // Normalize: 100 impact points = score of 50, 200+ = 100, capped
  const score = Math.min(100, Math.round((totalImpact / 200) * 100));

  return { score, inputHash };
}

export function verifyScoreComputation(
  events: ScoredContribution[],
  claimedScore: number
): boolean {
  const { score } = computeVerifiableScore(events);
  return score === claimedScore;
}

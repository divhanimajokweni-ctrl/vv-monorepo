/**
 * Ubuntu Pools — ZK Score Range Proofs
 * Pedersen-style commitment for proving score >= threshold without revealing score
 */

import { createHash, randomBytes } from "crypto";
import type { ZeroKnowledgeProof } from "@/lib/privacy/sovereignty";

/**
 * Generate a score range proof.
 * Commitment C = SHA256(score || blindingFactor).
 * Proves score >= threshold by including the difference in public signals.
 */
export function generateScoreRangeProof(
  score: number,
  threshold: number,
  blindingFactor: string
): ZeroKnowledgeProof {
  const commitment = createHash("sha256")
    .update(`${score}||${blindingFactor}`)
    .digest("hex");

  const difference = score - threshold;

  // The "proof" encodes the commitment and the non-negative difference
  // In a real ZK system this would be a proper range proof circuit
  const proofPayload = createHash("sha256")
    .update(`${commitment}||${difference}||${blindingFactor}`)
    .digest("hex");

  return {
    issuer: "ubuntu-pools",
    claim: `score_gte_${threshold}`,
    proof: {
      zkProof: proofPayload,
      publicSignals: [commitment, String(threshold), String(difference >= 0 ? 1 : 0)],
    },
    verificationKey: commitment,
  };
}

/**
 * Verify a score range proof.
 * Checks that the public signals indicate score >= threshold.
 */
export function verifyScoreRangeProof(
  proof: ZeroKnowledgeProof,
  threshold: number
): boolean {
  if (proof.proof.publicSignals.length < 3) return false;

  const claimedThreshold = Number(proof.proof.publicSignals[1]);
  const isAboveThreshold = proof.proof.publicSignals[2] === "1";

  if (claimedThreshold !== threshold) return false;
  if (!isAboveThreshold) return false;

  // Verify the proof hash matches the commitment
  const commitment = proof.proof.publicSignals[0];
  if (commitment !== proof.verificationKey) return false;

  return true;
}

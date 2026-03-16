/**
 * Ubuntu Pools — Score Anti-Gaming Guards
 * Pure functions to detect and penalize score manipulation
 */

import { SignatureVerifier } from "@/lib/events/signature-verifier";

export interface TransactionRecord {
  fromId: string;
  toId: string;
  amount: number;
  timestamp: string;
}

export interface AttestationInput {
  rating: number; // 1-5
  voterScore: number; // 0-100
}

/**
 * Flags duplicate transactions: same users + same amount within 24h
 */
export function isUniqueTx(tx: TransactionRecord, recentTxs: TransactionRecord[]): boolean {
  const txTime = new Date(tx.timestamp).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  for (const recent of recentTxs) {
    if (
      recent.fromId === tx.fromId &&
      recent.toId === tx.toId &&
      recent.amount === tx.amount &&
      Math.abs(new Date(recent.timestamp).getTime() - txTime) < twentyFourHours
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Detects circular flow patterns (A→B→C→A) in a transaction graph.
 * Returns a penalty multiplier (1.0 = no penalty, 0.6 = circular detected).
 */
export function detectCircularFlow(transactions: TransactionRecord[]): {
  hasCircular: boolean;
  penalty: number;
} {
  const CIRCULAR_PENALTY = 0.6;

  // Build adjacency list
  const graph = new Map<string, Set<string>>();
  for (const tx of transactions) {
    if (!graph.has(tx.fromId)) graph.set(tx.fromId, new Set());
    graph.get(tx.fromId)!.add(tx.toId);
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = graph.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (inStack.has(neighbor)) return true;
        if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return { hasCircular: true, penalty: CIRCULAR_PENALTY };
      }
    }
  }

  return { hasCircular: false, penalty: 1.0 };
}

/**
 * Weights an attestation by voter credibility.
 * Low-score voters have diminished influence.
 */
export function weightAttestation(input: AttestationInput): number {
  const { rating, voterScore } = input;
  return rating * Math.log2(voterScore + 1);
}

/**
 * Verify a signed attestation using real Ed25519 verification.
 */
export function verifySignedAttestation(
  attestation: { voterId: string; receiverId: string; rating: number; context?: string },
  signature: string,
  publicKey: string
): { valid: boolean; error?: string } {
  const verifier = new SignatureVerifier();
  const result = verifier.verify({
    data: attestation as Record<string, unknown>,
    signature,
    algorithm: "ed25519" as const,
    publicKey,
  });
  return { valid: result.isValid, error: result.error };
}

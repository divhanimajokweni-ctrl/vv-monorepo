import { createHash } from "crypto";

/**
 * Merkle Tree for efficient partial verification of the event hash chain.
 *
 * Uses SHA-256 (consistent with the event hasher) to build a binary tree
 * over a list of event hashes. Enables O(log n) proof-of-inclusion and
 * periodic root snapshots for checkpoint-based auditing.
 */

export interface MerkleProof {
  /** The leaf hash being proved */
  leaf: string;
  /** Sibling hashes from leaf to root, with position indicators */
  siblings: Array<{ hash: string; position: "left" | "right" }>;
  /** The Merkle root */
  root: string;
}

export interface MerkleTree {
  root: string;
  leafCount: number;
  depth: number;
}

/**
 * Compute SHA-256 hex digest of a UTF-8 string.
 */
function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Combine two child hashes into a parent hash.
 * Concatenates left + right and hashes the result.
 */
function hashPair(left: string, right: string): string {
  return sha256(left + right);
}

/**
 * Build a complete Merkle tree from an array of leaf hashes.
 * Returns all levels (index 0 = leaves, last index = root).
 *
 * If a level has an odd number of nodes, the last node is
 * duplicated to make it even (standard Merkle tree padding).
 */
export function buildLevels(leaves: string[]): string[][] {
  if (leaves.length === 0) {
    return [];
  }

  const levels: string[][] = [[...leaves]];
  let current = [...leaves];

  while (current.length > 1) {
    if (current.length % 2 !== 0) {
      current.push(current[current.length - 1]);
    }

    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(hashPair(current[i], current[i + 1]));
    }

    levels.push(next);
    current = next;
  }

  return levels;
}

/**
 * Build a Merkle tree from an array of event hashes and return summary info.
 */
export function buildMerkleTree(eventHashes: string[]): MerkleTree {
  if (eventHashes.length === 0) {
    return { root: "", leafCount: 0, depth: 0 };
  }

  const levels = buildLevels(eventHashes);

  return {
    root: levels[levels.length - 1][0],
    leafCount: eventHashes.length,
    depth: levels.length - 1,
  };
}

/**
 * Compute the Merkle root from an array of event hashes.
 */
export function computeMerkleRoot(eventHashes: string[]): string {
  return buildMerkleTree(eventHashes).root;
}

/**
 * Generate a proof-of-inclusion for the leaf at `leafIndex`.
 */
export function generateProof(
  eventHashes: string[],
  leafIndex: number
): MerkleProof {
  if (eventHashes.length === 0) {
    throw new Error("Cannot generate proof for empty tree");
  }
  if (leafIndex < 0 || leafIndex >= eventHashes.length) {
    throw new Error(
      `Leaf index ${leafIndex} out of range [0, ${eventHashes.length - 1}]`
    );
  }

  const levels = buildLevels(eventHashes);
  const siblings: MerkleProof["siblings"] = [];
  let idx = leafIndex;

  for (let level = 0; level < levels.length - 1; level++) {
    let currentLevel = levels[level];

    // Pad odd levels (same as buildLevels)
    if (currentLevel.length % 2 !== 0) {
      currentLevel = [...currentLevel, currentLevel[currentLevel.length - 1]];
    }

    if (idx % 2 === 0) {
      siblings.push({ hash: currentLevel[idx + 1], position: "right" });
    } else {
      siblings.push({ hash: currentLevel[idx - 1], position: "left" });
    }

    idx = Math.floor(idx / 2);
  }

  return {
    leaf: eventHashes[leafIndex],
    siblings,
    root: levels[levels.length - 1][0],
  };
}

/**
 * Verify a Merkle proof: recompute the root from the leaf and siblings
 * and check it matches the claimed root.
 */
export function verifyProof(proof: MerkleProof): boolean {
  let current = proof.leaf;

  for (const sibling of proof.siblings) {
    if (sibling.position === "left") {
      current = hashPair(sibling.hash, current);
    } else {
      current = hashPair(current, sibling.hash);
    }
  }

  return current === proof.root;
}

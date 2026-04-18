import { describe, it, expect } from "vitest";
import {
  buildMerkleTree,
  computeMerkleRoot,
  generateProof,
  verifyProof,
  buildLevels,
} from "@ubuntu/ledger/merkle";
import { createHash } from "crypto";

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

// Simulate event hashes (64-char hex strings like the real hasher produces)
function fakeEventHash(n: number): string {
  return sha256(`event-${n}`);
}

describe("Merkle Tree", () => {
  describe("buildMerkleTree", () => {
    it("returns empty root for empty input", () => {
      const tree = buildMerkleTree([]);
      expect(tree.root).toBe("");
      expect(tree.leafCount).toBe(0);
      expect(tree.depth).toBe(0);
    });

    it("returns the leaf itself as root for a single element", () => {
      const hash = fakeEventHash(1);
      const tree = buildMerkleTree([hash]);
      expect(tree.root).toBe(hash);
      expect(tree.leafCount).toBe(1);
      expect(tree.depth).toBe(0);
    });

    it("computes correct root for two leaves", () => {
      const a = fakeEventHash(1);
      const b = fakeEventHash(2);
      const expectedRoot = sha256(a + b);
      const tree = buildMerkleTree([a, b]);
      expect(tree.root).toBe(expectedRoot);
      expect(tree.depth).toBe(1);
    });

    it("is deterministic", () => {
      const hashes = [1, 2, 3, 4, 5].map(fakeEventHash);
      const root1 = computeMerkleRoot(hashes);
      const root2 = computeMerkleRoot(hashes);
      expect(root1).toBe(root2);
    });

    it("produces different roots for different inputs", () => {
      const root1 = computeMerkleRoot([fakeEventHash(1), fakeEventHash(2)]);
      const root2 = computeMerkleRoot([fakeEventHash(3), fakeEventHash(4)]);
      expect(root1).not.toBe(root2);
    });

    it("produces different roots when order changes", () => {
      const a = fakeEventHash(1);
      const b = fakeEventHash(2);
      expect(computeMerkleRoot([a, b])).not.toBe(computeMerkleRoot([b, a]));
    });
  });

  describe("buildLevels", () => {
    it("returns empty array for no leaves", () => {
      expect(buildLevels([])).toEqual([]);
    });

    it("handles odd number of leaves by duplicating the last", () => {
      const hashes = [1, 2, 3].map(fakeEventHash);
      const levels = buildLevels(hashes);
      // Level 0: 3 leaves, padded to 4 for pairing
      expect(levels[0]).toHaveLength(3);
      // Level 1: 2 nodes
      expect(levels[1]).toHaveLength(2);
      // Level 2: root
      expect(levels[2]).toHaveLength(1);
    });

    it("builds correct depth for power-of-two leaves", () => {
      const hashes = [1, 2, 3, 4].map(fakeEventHash);
      const levels = buildLevels(hashes);
      expect(levels).toHaveLength(3); // leaves, intermediate, root
    });
  });

  describe("generateProof / verifyProof", () => {
    it("throws for empty tree", () => {
      expect(() => generateProof([], 0)).toThrow("empty tree");
    });

    it("throws for out-of-range index", () => {
      expect(() => generateProof([fakeEventHash(1)], 1)).toThrow("out of range");
      expect(() => generateProof([fakeEventHash(1)], -1)).toThrow("out of range");
    });

    it("generates valid proof for single-leaf tree", () => {
      const hashes = [fakeEventHash(1)];
      const proof = generateProof(hashes, 0);
      expect(proof.siblings).toHaveLength(0);
      expect(proof.root).toBe(hashes[0]);
      expect(verifyProof(proof)).toBe(true);
    });

    it("generates valid proof for two leaves", () => {
      const hashes = [fakeEventHash(1), fakeEventHash(2)];
      for (let i = 0; i < hashes.length; i++) {
        const proof = generateProof(hashes, i);
        expect(verifyProof(proof)).toBe(true);
        expect(proof.root).toBe(computeMerkleRoot(hashes));
      }
    });

    it("generates valid proofs for larger trees", () => {
      const sizes = [3, 4, 5, 8, 10, 16, 17];
      for (const size of sizes) {
        const hashes = Array.from({ length: size }, (_, i) => fakeEventHash(i));
        const root = computeMerkleRoot(hashes);
        for (let i = 0; i < size; i++) {
          const proof = generateProof(hashes, i);
          expect(proof.root).toBe(root);
          expect(verifyProof(proof)).toBe(true);
        }
      }
    });

    it("rejects proof with tampered leaf", () => {
      const hashes = [1, 2, 3, 4].map(fakeEventHash);
      const proof = generateProof(hashes, 1);
      proof.leaf = fakeEventHash(99);
      expect(verifyProof(proof)).toBe(false);
    });

    it("rejects proof with tampered sibling", () => {
      const hashes = [1, 2, 3, 4].map(fakeEventHash);
      const proof = generateProof(hashes, 0);
      proof.siblings[0].hash = fakeEventHash(99);
      expect(verifyProof(proof)).toBe(false);
    });

    it("rejects proof with tampered root", () => {
      const hashes = [1, 2, 3, 4].map(fakeEventHash);
      const proof = generateProof(hashes, 0);
      proof.root = fakeEventHash(99);
      expect(verifyProof(proof)).toBe(false);
    });
  });
});

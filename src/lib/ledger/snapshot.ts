import { computeMerkleRoot } from "./merkle";

/**
 * Ledger Snapshot Verification
 *
 * Periodic Merkle root snapshots over the event hash chain.
 * Enables checkpoint-based auditing: instead of replaying the full chain,
 * verify from the most recent trusted snapshot forward.
 */

export interface LedgerSnapshot {
  /** Unique snapshot identifier */
  id: string;
  /** Merkle root of event hashes in this window */
  merkleRoot: string;
  /** First event sequence number in this snapshot */
  fromSequence: number;
  /** Last event sequence number in this snapshot */
  toSequence: number;
  /** Number of events included */
  eventCount: number;
  /** Hash of the previous snapshot's merkleRoot (chain of snapshots) */
  prevSnapshotRoot: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
}

export interface SnapshotVerificationResult {
  valid: boolean;
  snapshotId: string;
  merkleRoot: string;
  recomputedRoot: string;
  errors: string[];
}

/**
 * Create a snapshot from a window of event hashes.
 */
export function createSnapshot(
  eventHashes: string[],
  fromSequence: number,
  toSequence: number,
  prevSnapshotRoot: string | null = null
): LedgerSnapshot {
  if (eventHashes.length === 0) {
    throw new Error("Cannot create snapshot from empty event list");
  }

  const expectedCount = toSequence - fromSequence + 1;
  if (eventHashes.length !== expectedCount) {
    throw new Error(
      `Event count mismatch: got ${eventHashes.length}, expected ${expectedCount} (sequences ${fromSequence}-${toSequence})`
    );
  }

  const merkleRoot = computeMerkleRoot(eventHashes);

  return {
    id: `snap-${fromSequence}-${toSequence}`,
    merkleRoot,
    fromSequence,
    toSequence,
    eventCount: eventHashes.length,
    prevSnapshotRoot,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verify a snapshot by recomputing the Merkle root from the current event hashes
 * and comparing against the stored root.
 */
export function verifySnapshot(
  snapshot: LedgerSnapshot,
  currentEventHashes: string[]
): SnapshotVerificationResult {
  const errors: string[] = [];

  if (currentEventHashes.length !== snapshot.eventCount) {
    errors.push(
      `Event count mismatch: snapshot has ${snapshot.eventCount}, provided ${currentEventHashes.length}`
    );
  }

  const recomputedRoot =
    currentEventHashes.length > 0
      ? computeMerkleRoot(currentEventHashes)
      : "";

  if (recomputedRoot !== snapshot.merkleRoot) {
    errors.push(
      `Merkle root mismatch: stored=${snapshot.merkleRoot}, recomputed=${recomputedRoot}`
    );
  }

  return {
    valid: errors.length === 0,
    snapshotId: snapshot.id,
    merkleRoot: snapshot.merkleRoot,
    recomputedRoot,
    errors,
  };
}

/**
 * Verify a chain of snapshots: each snapshot's prevSnapshotRoot must match
 * the previous snapshot's merkleRoot.
 */
export function verifySnapshotChain(
  snapshots: LedgerSnapshot[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (snapshots.length === 0) {
    return { valid: true, errors: [] };
  }

  if (snapshots[0].prevSnapshotRoot !== null) {
    errors.push(
      `First snapshot ${snapshots[0].id} has non-null prevSnapshotRoot`
    );
  }

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];

    if (curr.prevSnapshotRoot !== prev.merkleRoot) {
      errors.push(
        `Snapshot chain broken at ${curr.id}: expected prevSnapshotRoot=${prev.merkleRoot}, got ${curr.prevSnapshotRoot}`
      );
    }

    if (curr.fromSequence !== prev.toSequence + 1) {
      errors.push(
        `Sequence gap between ${prev.id} (to=${prev.toSequence}) and ${curr.id} (from=${curr.fromSequence})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

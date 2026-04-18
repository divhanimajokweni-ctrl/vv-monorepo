/**
 * Ubuntu Pools — Phase 1: Hasher Tests
 *
 * Tests for deterministic event hashing and hash chain verification.
 *
 * Coverage:
 *   - sortKeysRecursive: key ordering, nested objects, arrays, primitives
 *   - canonicalizeEvent: canonical JSON form
 *   - computeEventHash: determinism, uniqueness, required fields
 *   - verifyHashChain: valid chains, tampered events, sequence gaps
 *   - verifyEventHash: single event verification
 */

import { describe, it, expect } from "vitest";
import {
  sortKeysRecursive,
  canonicalizeEvent,
  computeEventHash,
  verifyHashChain,
  verifyEventHash,
  type EventHashInput,
} from "@ubuntu/domain-core/hasher";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const baseInput: EventHashInput = {
  eventType: "pool.created",
  actorId: "00000000-0000-0000-0000-000000000001",
  entityId: "00000000-0000-0000-0000-000000000002",
  entityType: "pool",
  payload: { name: "Test Pool", currency: "USD" },
  occurredAt: "2024-01-01T00:00:00.000Z",
  sequenceNo: 1,
  prevHash: null,
};

// =============================================================================
// sortKeysRecursive
// =============================================================================

describe("sortKeysRecursive", () => {
  it("sorts top-level object keys alphabetically", () => {
    const input = { z: 1, a: 2, m: 3 };
    const result = sortKeysRecursive(input) as Record<string, number>;
    expect(Object.keys(result)).toEqual(["a", "m", "z"]);
  });

  it("sorts nested object keys recursively", () => {
    const input = { z: { b: 1, a: 2 }, a: { d: 3, c: 4 } };
    const result = sortKeysRecursive(input) as Record<string, Record<string, number>>;
    expect(Object.keys(result)).toEqual(["a", "z"]);
    expect(Object.keys(result.a)).toEqual(["c", "d"]);
    expect(Object.keys(result.z)).toEqual(["a", "b"]);
  });

  it("preserves array order (arrays are not sorted)", () => {
    const input = { items: [3, 1, 2] };
    const result = sortKeysRecursive(input) as { items: number[] };
    expect(result.items).toEqual([3, 1, 2]);
  });

  it("sorts keys within array objects", () => {
    const input = { items: [{ z: 1, a: 2 }] };
    const result = sortKeysRecursive(input) as { items: Record<string, number>[] };
    expect(Object.keys(result.items[0])).toEqual(["a", "z"]);
  });

  it("handles null values", () => {
    expect(sortKeysRecursive(null)).toBeNull();
  });

  it("handles primitive values", () => {
    expect(sortKeysRecursive(42)).toBe(42);
    expect(sortKeysRecursive("hello")).toBe("hello");
    expect(sortKeysRecursive(true)).toBe(true);
  });

  it("handles empty objects", () => {
    expect(sortKeysRecursive({})).toEqual({});
  });

  it("handles empty arrays", () => {
    expect(sortKeysRecursive([])).toEqual([]);
  });
});

// =============================================================================
// canonicalizeEvent
// =============================================================================

describe("canonicalizeEvent", () => {
  it("produces a compact JSON string (no whitespace)", () => {
    const result = canonicalizeEvent(baseInput);
    expect(result).not.toContain("  ");
    expect(result).not.toContain("\n");
  });

  it("includes all required fields", () => {
    const result = canonicalizeEvent(baseInput);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("event_type");
    expect(parsed).toHaveProperty("actor_id");
    expect(parsed).toHaveProperty("entity_id");
    expect(parsed).toHaveProperty("entity_type");
    expect(parsed).toHaveProperty("payload");
    expect(parsed).toHaveProperty("occurred_at");
    expect(parsed).toHaveProperty("sequence_no");
    expect(parsed).toHaveProperty("prev_hash");
  });

  it("uses snake_case field names", () => {
    const result = canonicalizeEvent(baseInput);
    expect(result).toContain("event_type");
    expect(result).toContain("actor_id");
    expect(result).toContain("entity_id");
    expect(result).toContain("entity_type");
    expect(result).toContain("occurred_at");
    expect(result).toContain("sequence_no");
    expect(result).toContain("prev_hash");
  });

  it("uses empty string for null prevHash", () => {
    const result = canonicalizeEvent({ ...baseInput, prevHash: null });
    const parsed = JSON.parse(result);
    expect(parsed.prev_hash).toBe("");
  });

  it("uses actual prevHash when provided", () => {
    const hash = "a".repeat(64);
    const result = canonicalizeEvent({ ...baseInput, prevHash: hash });
    const parsed = JSON.parse(result);
    expect(parsed.prev_hash).toBe(hash);
  });

  it("sorts payload keys", () => {
    const input = {
      ...baseInput,
      payload: { z_field: "last", a_field: "first" },
    };
    const result = canonicalizeEvent(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.payload)).toEqual(["a_field", "z_field"]);
  });

  it("is deterministic — same input produces same output", () => {
    const result1 = canonicalizeEvent(baseInput);
    const result2 = canonicalizeEvent(baseInput);
    expect(result1).toBe(result2);
  });
});

// =============================================================================
// computeEventHash
// =============================================================================

describe("computeEventHash", () => {
  it("returns a 64-character hex string", () => {
    const { hash } = computeEventHash(baseInput);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input always produces same hash", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash(baseInput);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different event types", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      eventType: "pool.updated",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different actor IDs", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      actorId: "00000000-0000-0000-0000-000000000099",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different entity IDs", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      entityId: "00000000-0000-0000-0000-000000000099",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different payloads", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      payload: { name: "Different Pool" },
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different timestamps", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      occurredAt: "2024-01-02T00:00:00.000Z",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different sequence numbers", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      sequenceNo: 2,
    });
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different prevHash values", () => {
    const { hash: hash1 } = computeEventHash(baseInput);
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      prevHash: "b".repeat(64),
    });
    expect(hash1).not.toBe(hash2);
  });

  it("payload key order does NOT affect hash (keys are sorted)", () => {
    const { hash: hash1 } = computeEventHash({
      ...baseInput,
      payload: { a: 1, b: 2 },
    });
    const { hash: hash2 } = computeEventHash({
      ...baseInput,
      payload: { b: 2, a: 1 },
    });
    expect(hash1).toBe(hash2);
  });

  it("throws if eventType is missing", () => {
    expect(() =>
      computeEventHash({ ...baseInput, eventType: "" })
    ).toThrow("eventType is required");
  });

  it("throws if actorId is missing", () => {
    expect(() =>
      computeEventHash({ ...baseInput, actorId: "" })
    ).toThrow("actorId is required");
  });

  it("throws if sequenceNo is not positive", () => {
    expect(() =>
      computeEventHash({ ...baseInput, sequenceNo: 0 })
    ).toThrow("sequenceNo must be a positive integer");
  });

  it("returns the canonical input for debugging", () => {
    const { canonicalInput } = computeEventHash(baseInput);
    expect(typeof canonicalInput).toBe("string");
    expect(() => JSON.parse(canonicalInput)).not.toThrow();
  });
});

// =============================================================================
// verifyHashChain
// =============================================================================

describe("verifyHashChain", () => {
  /**
   * Builds a valid chain of N events for testing.
   */
  function buildChain(n: number) {
    const chain: Array<{
      id: string;
      eventType: string;
      actorId: string;
      entityId: string;
      entityType: string;
      payload: Record<string, unknown>;
      occurredAt: string;
      sequenceNo: number;
      hash: string;
      prevHash: string | null;
    }> = [];

    const entityId = "00000000-0000-0000-0000-000000000002";

    for (let i = 1; i <= n; i++) {
      const prevHash = i === 1 ? null : chain[i - 2].hash;
      const input: EventHashInput = {
        eventType: "pool.created",
        actorId: "00000000-0000-0000-0000-000000000001",
        entityId,
        entityType: "pool",
        payload: { seq: i },
        occurredAt: `2024-01-0${i}T00:00:00.000Z`,
        sequenceNo: i,
        prevHash,
      };
      const { hash } = computeEventHash(input);
      chain.push({
        id: `00000000-0000-0000-0000-00000000000${i}`,
        ...input,
        hash,
      });
    }

    return chain;
  }

  it("validates a correct single-event chain", () => {
    const chain = buildChain(1);
    const result = verifyHashChain(chain);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates a correct multi-event chain", () => {
    const chain = buildChain(5);
    const result = verifyHashChain(chain);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects a tampered event hash", () => {
    const chain = buildChain(3);
    // Tamper with the second event's hash
    chain[1] = { ...chain[1], hash: "f".repeat(64) };

    const result = verifyHashChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.errorType === "HASH_MISMATCH")).toBe(true);
  });

  it("detects a broken prev_hash link", () => {
    const chain = buildChain(3);
    // Break the chain: event 2's prevHash doesn't match event 1's hash
    chain[1] = { ...chain[1], prevHash: "0".repeat(64) };

    const result = verifyHashChain(chain);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.errorType === "PREV_HASH_MISMATCH" || e.errorType === "HASH_MISMATCH")
    ).toBe(true);
  });

  it("detects a sequence gap", () => {
    const chain = buildChain(3);
    // Create a gap: event 3 has sequenceNo 4 instead of 3
    chain[2] = { ...chain[2], sequenceNo: 4 };

    const result = verifyHashChain(chain);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.errorType === "SEQUENCE_GAP")).toBe(true);
  });

  it("detects first event with a prevHash", () => {
    const chain = buildChain(1);
    chain[0] = { ...chain[0], prevHash: "a".repeat(64) };

    const result = verifyHashChain(chain);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.errorType === "FIRST_EVENT_HAS_PREV_HASH" || e.errorType === "HASH_MISMATCH")
    ).toBe(true);
  });

  it("returns valid for empty chain", () => {
    const result = verifyHashChain([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// =============================================================================
// verifyEventHash
// =============================================================================

describe("verifyEventHash", () => {
  it("returns true for a valid event", () => {
    const { hash } = computeEventHash(baseInput);
    const result = verifyEventHash({ ...baseInput, hash });
    expect(result).toBe(true);
  });

  it("returns false for a tampered hash", () => {
    const result = verifyEventHash({
      ...baseInput,
      hash: "f".repeat(64),
    });
    expect(result).toBe(false);
  });

  it("returns false if payload is modified", () => {
    const { hash } = computeEventHash(baseInput);
    const result = verifyEventHash({
      ...baseInput,
      payload: { name: "Tampered" },
      hash,
    });
    expect(result).toBe(false);
  });
});

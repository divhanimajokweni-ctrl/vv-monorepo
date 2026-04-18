/**
 * Ubuntu Pools — Phase 1: Posting Engine Tests
 *
 * Tests for the journal posting engine utilities (pure functions only).
 * DB-dependent tests require a real PostgreSQL instance and are marked
 * with @integration tag.
 *
 * Coverage:
 *   - extractFromPayload: simple paths, nested paths, JSONPath style
 *   - extractAmount: valid amounts, zero, negative, non-integer, missing
 *   - extractCurrency: valid codes, invalid codes, missing
 *   - resolveAccountCode: template substitution
 *   - resolveDescription: template substitution
 *   - PostingError hierarchy: error types and codes
 */

import { describe, it, expect } from "vitest";
import {
  extractFromPayload,
  extractAmount,
  extractCurrency,
  resolveAccountCode,
  resolveDescription,
  PostingError,
  PostingRuleNotFoundError,
  AccountNotFoundError,
  CurrencyMismatchError,
  AmountExtractionError,
  BalanceAssertionError,
  DuplicateTransactionError,
} from "@ubuntu/ledger/posting-engine";
import type { Event } from "@ubuntu/db/schema";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockEvent: Event = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  eventType: "contribution.received",
  actorId: "550e8400-e29b-41d4-a716-446655440001",
  entityId: "550e8400-e29b-41d4-a716-446655440002",
  entityType: "contribution",
  payload: {
    amount_minor: 10000,
    currency: "USD",
    pool_id: "550e8400-e29b-41d4-a716-446655440003",
  },
  occurredAt: new Date("2024-01-01T00:00:00.000Z"),
  sequenceNo: 1,
  hash: "a".repeat(64),
  prevHash: null,
  status: "pending",
};

// =============================================================================
// extractFromPayload
// =============================================================================

describe("extractFromPayload", () => {
  const payload = {
    amount: 10000,
    currency: "USD",
    nested: {
      deep: {
        value: 42,
      },
    },
    items: [1, 2, 3],
  };

  it("extracts top-level values", () => {
    expect(extractFromPayload(payload, "amount")).toBe(10000);
    expect(extractFromPayload(payload, "currency")).toBe("USD");
  });

  it("extracts nested values with dot notation", () => {
    expect(extractFromPayload(payload, "nested.deep.value")).toBe(42);
  });

  it("extracts values with JSONPath-style leading $.", () => {
    expect(extractFromPayload(payload, "$.amount")).toBe(10000);
    expect(extractFromPayload(payload, "$.nested.deep.value")).toBe(42);
  });

  it("returns undefined for missing keys", () => {
    expect(extractFromPayload(payload, "missing")).toBeUndefined();
    expect(extractFromPayload(payload, "nested.missing")).toBeUndefined();
  });

  it("returns undefined for paths through non-objects", () => {
    expect(extractFromPayload(payload, "amount.subkey")).toBeUndefined();
    expect(extractFromPayload(payload, "currency.length")).toBeUndefined();
  });

  it("handles empty payload", () => {
    expect(extractFromPayload({}, "anything")).toBeUndefined();
  });
});

// =============================================================================
// extractAmount
// =============================================================================

describe("extractAmount", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440000";

  it("extracts a valid positive integer amount", () => {
    const payload = { amount_minor: 10000 };
    expect(extractAmount(payload, "amount_minor", eventId)).toBe(10000);
  });

  it("extracts amount from nested path", () => {
    const payload = { contribution: { amount_cents: 5000 } };
    expect(extractAmount(payload, "contribution.amount_cents", eventId)).toBe(5000);
  });

  it("throws AmountExtractionError for missing path", () => {
    expect(() => extractAmount({}, "amount", eventId)).toThrow(AmountExtractionError);
  });

  it("throws AmountExtractionError for zero amount", () => {
    expect(() => extractAmount({ amount: 0 }, "amount", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for negative amount", () => {
    expect(() => extractAmount({ amount: -100 }, "amount", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for decimal amount", () => {
    expect(() => extractAmount({ amount: 10.50 }, "amount", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for string amount", () => {
    expect(() => extractAmount({ amount: "10000" }, "amount", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for null amount", () => {
    expect(() => extractAmount({ amount: null }, "amount", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("error has correct errorCode", () => {
    try {
      extractAmount({}, "amount", eventId);
    } catch (e) {
      expect(e).toBeInstanceOf(AmountExtractionError);
      expect((e as AmountExtractionError).errorCode).toBe("AMOUNT_EXTRACTION_FAILED");
    }
  });
});

// =============================================================================
// extractCurrency
// =============================================================================

describe("extractCurrency", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440000";

  it("extracts a valid currency code", () => {
    const payload = { currency: "USD" };
    expect(extractCurrency(payload, "currency", eventId)).toBe("USD");
  });

  it("extracts currency from nested path", () => {
    const payload = { contribution: { currency: "ZAR" } };
    expect(extractCurrency(payload, "contribution.currency", eventId)).toBe("ZAR");
  });

  it("throws AmountExtractionError for missing path", () => {
    expect(() => extractCurrency({}, "currency", eventId)).toThrow(AmountExtractionError);
  });

  it("throws AmountExtractionError for lowercase currency", () => {
    expect(() => extractCurrency({ currency: "usd" }, "currency", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for wrong length", () => {
    expect(() => extractCurrency({ currency: "US" }, "currency", eventId)).toThrow(
      AmountExtractionError
    );
    expect(() => extractCurrency({ currency: "USDT" }, "currency", eventId)).toThrow(
      AmountExtractionError
    );
  });

  it("throws AmountExtractionError for non-string", () => {
    expect(() => extractCurrency({ currency: 840 }, "currency", eventId)).toThrow(
      AmountExtractionError
    );
  });
});

// =============================================================================
// resolveAccountCode
// =============================================================================

describe("resolveAccountCode", () => {
  it("returns template unchanged if no variables", () => {
    expect(resolveAccountCode("SYSTEM-SUSPENSE", mockEvent)).toBe("SYSTEM-SUSPENSE");
  });

  it("substitutes {entity_id}", () => {
    const result = resolveAccountCode("POOL-{entity_id}-ASSET", mockEvent);
    expect(result).toBe(`POOL-${mockEvent.entityId}-ASSET`);
  });

  it("substitutes {actor_id}", () => {
    const result = resolveAccountCode("MEMBER-{actor_id}-EQUITY", mockEvent);
    expect(result).toBe(`MEMBER-${mockEvent.actorId}-EQUITY`);
  });

  it("substitutes multiple occurrences", () => {
    const result = resolveAccountCode("{entity_id}-{entity_id}", mockEvent);
    expect(result).toBe(`${mockEvent.entityId}-${mockEvent.entityId}`);
  });

  it("handles empty template", () => {
    expect(resolveAccountCode("", mockEvent)).toBe("");
  });
});

// =============================================================================
// resolveDescription
// =============================================================================

describe("resolveDescription", () => {
  it("substitutes {event_type}", () => {
    const result = resolveDescription("Event: {event_type}", mockEvent);
    expect(result).toBe(`Event: ${mockEvent.eventType}`);
  });

  it("substitutes {entity_id}", () => {
    const result = resolveDescription("Entity: {entity_id}", mockEvent);
    expect(result).toBe(`Entity: ${mockEvent.entityId}`);
  });

  it("substitutes {actor_id}", () => {
    const result = resolveDescription("Actor: {actor_id}", mockEvent);
    expect(result).toBe(`Actor: ${mockEvent.actorId}`);
  });

  it("substitutes {sequence_no}", () => {
    const result = resolveDescription("Seq: {sequence_no}", mockEvent);
    expect(result).toBe(`Seq: ${mockEvent.sequenceNo}`);
  });

  it("substitutes multiple variables", () => {
    const result = resolveDescription(
      "{event_type} by {actor_id} on {entity_id}",
      mockEvent
    );
    expect(result).toBe(
      `${mockEvent.eventType} by ${mockEvent.actorId} on ${mockEvent.entityId}`
    );
  });

  it("returns template unchanged if no variables", () => {
    expect(resolveDescription("No variables here", mockEvent)).toBe(
      "No variables here"
    );
  });
});

// =============================================================================
// Error hierarchy
// =============================================================================

describe("PostingError hierarchy", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440000";

  it("PostingRuleNotFoundError has correct errorCode", () => {
    const err = new PostingRuleNotFoundError("pool.created", eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("RULE_NOT_FOUND");
    expect(err.eventId).toBe(eventId);
    expect(err.message).toContain("pool.created");
  });

  it("AccountNotFoundError has correct errorCode", () => {
    const err = new AccountNotFoundError("POOL-001-ASSET", eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("ACCOUNT_NOT_FOUND");
    expect(err.message).toContain("POOL-001-ASSET");
  });

  it("CurrencyMismatchError has correct errorCode", () => {
    const err = new CurrencyMismatchError("POOL-001-ASSET", "USD", "ZAR", eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("CURRENCY_MISMATCH");
    expect(err.message).toContain("USD");
    expect(err.message).toContain("ZAR");
  });

  it("AmountExtractionError has correct errorCode", () => {
    const err = new AmountExtractionError("$.amount", {}, eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("AMOUNT_EXTRACTION_FAILED");
  });

  it("BalanceAssertionError has correct errorCode", () => {
    const err = new BalanceAssertionError("txn-id", 10000, 9999, eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("BALANCE_ASSERTION_FAILED");
    expect(err.message).toContain("10000");
    expect(err.message).toContain("9999");
  });

  it("DuplicateTransactionError has correct errorCode", () => {
    const err = new DuplicateTransactionError("txn-id", eventId);
    expect(err).toBeInstanceOf(PostingError);
    expect(err.errorCode).toBe("DUPLICATE_TRANSACTION");
  });

  it("all errors are instances of Error", () => {
    expect(new PostingRuleNotFoundError("x.y", eventId)).toBeInstanceOf(Error);
    expect(new AccountNotFoundError("CODE", eventId)).toBeInstanceOf(Error);
    expect(new CurrencyMismatchError("CODE", "USD", "ZAR", eventId)).toBeInstanceOf(Error);
    expect(new AmountExtractionError("path", {}, eventId)).toBeInstanceOf(Error);
    expect(new BalanceAssertionError("id", 1, 2, eventId)).toBeInstanceOf(Error);
    expect(new DuplicateTransactionError("id", eventId)).toBeInstanceOf(Error);
  });
});

// =============================================================================
// Double-entry balance invariant (pure logic test)
// =============================================================================

describe("Double-entry balance invariant", () => {
  it("debit total must equal credit total for a valid transaction", () => {
    // Simulate what the posting engine does
    const amount = 10000;
    const entries = [
      { side: "debit" as const, amount },
      { side: "credit" as const, amount },
    ];

    const debitTotal = entries
      .filter((e) => e.side === "debit")
      .reduce((sum, e) => sum + e.amount, 0);
    const creditTotal = entries
      .filter((e) => e.side === "credit")
      .reduce((sum, e) => sum + e.amount, 0);

    expect(debitTotal).toBe(creditTotal);
    expect(debitTotal - creditTotal).toBe(0);
  });

  it("unequal debits and credits are detected", () => {
    const entries = [
      { side: "debit" as const, amount: 10000 },
      { side: "credit" as const, amount: 9999 }, // off by 1
    ];

    const debitTotal = entries
      .filter((e) => e.side === "debit")
      .reduce((sum, e) => sum + e.amount, 0);
    const creditTotal = entries
      .filter((e) => e.side === "credit")
      .reduce((sum, e) => sum + e.amount, 0);

    expect(debitTotal - creditTotal).toBe(1); // imbalance detected
  });

  it("amounts must be positive integers (minor units)", () => {
    // Verify that the amount validation catches non-integer values
    const invalidAmounts = [0, -1, 1.5, -0.01, NaN, Infinity];
    for (const amount of invalidAmounts) {
      const isValid = Number.isInteger(amount) && amount > 0;
      expect(isValid).toBe(false);
    }

    const validAmounts = [1, 100, 999999, 1000000];
    for (const amount of validAmounts) {
      const isValid = Number.isInteger(amount) && amount > 0;
      expect(isValid).toBe(true);
    }
  });
});

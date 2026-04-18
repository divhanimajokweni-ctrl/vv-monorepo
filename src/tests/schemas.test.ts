/**
 * Ubuntu Pools — Phase 1: Schema Validation Tests
 *
 * Tests for Zod validators and event schema validation.
 *
 * Coverage:
 *   - Primitive validators: uuid, currency, minorUnit, eventType, sha256
 *   - createEventInputSchema: valid inputs, invalid inputs
 *   - Payload schemas: each Phase 1 event type
 *   - validatePayloadForEventType: known and unknown event types
 */

import { describe, it, expect } from "vitest";
import {
  uuidSchema,
  currencySchema,
  minorUnitAmountSchema,
  eventTypeSchema,
  sha256HashSchema,
  createEventInputSchema,
  validateEventInput,
  validatePayloadForEventType,
  systemInitializedPayloadSchema,
  ledgerAccountOpenedPayloadSchema,
  ledgerPostingRuleCreatedPayloadSchema,
  ledgerTransactionPostedPayloadSchema,
  ledgerTransactionFailedPayloadSchema,
} from "@ubuntu/domain-core/schemas";

// =============================================================================
// PRIMITIVE VALIDATORS
// =============================================================================

describe("uuidSchema", () => {
  it("accepts valid UUID v4", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
    expect(uuidSchema.safeParse("12345").success).toBe(false);
  });
});

describe("currencySchema", () => {
  it("accepts valid ISO 4217 codes", () => {
    expect(currencySchema.safeParse("USD").success).toBe(true);
    expect(currencySchema.safeParse("ZAR").success).toBe(true);
    expect(currencySchema.safeParse("KES").success).toBe(true);
    expect(currencySchema.safeParse("BTC").success).toBe(true);
  });

  it("rejects lowercase codes", () => {
    expect(currencySchema.safeParse("usd").success).toBe(false);
    expect(currencySchema.safeParse("Usd").success).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(currencySchema.safeParse("US").success).toBe(false);
    expect(currencySchema.safeParse("USDT").success).toBe(false);
    expect(currencySchema.safeParse("").success).toBe(false);
  });

  it("rejects non-letter characters", () => {
    expect(currencySchema.safeParse("US1").success).toBe(false);
    expect(currencySchema.safeParse("U$D").success).toBe(false);
  });
});

describe("minorUnitAmountSchema", () => {
  it("accepts positive integers", () => {
    expect(minorUnitAmountSchema.safeParse(1).success).toBe(true);
    expect(minorUnitAmountSchema.safeParse(100).success).toBe(true);
    expect(minorUnitAmountSchema.safeParse(999999999).success).toBe(true);
  });

  it("rejects zero", () => {
    expect(minorUnitAmountSchema.safeParse(0).success).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(minorUnitAmountSchema.safeParse(-1).success).toBe(false);
    expect(minorUnitAmountSchema.safeParse(-100).success).toBe(false);
  });

  it("rejects decimals", () => {
    expect(minorUnitAmountSchema.safeParse(1.5).success).toBe(false);
    expect(minorUnitAmountSchema.safeParse(0.01).success).toBe(false);
  });

  it("rejects non-numbers", () => {
    expect(minorUnitAmountSchema.safeParse("100").success).toBe(false);
    expect(minorUnitAmountSchema.safeParse(null).success).toBe(false);
  });
});

describe("eventTypeSchema", () => {
  it("accepts valid namespaced event types", () => {
    expect(eventTypeSchema.safeParse("pool.created").success).toBe(true);
    expect(eventTypeSchema.safeParse("ledger.account_opened").success).toBe(true);
    expect(eventTypeSchema.safeParse("system.initialized").success).toBe(true);
    expect(eventTypeSchema.safeParse("member.joined").success).toBe(true);
  });

  it("rejects non-namespaced types (no dot)", () => {
    expect(eventTypeSchema.safeParse("poolcreated").success).toBe(false);
    expect(eventTypeSchema.safeParse("pool").success).toBe(false);
  });

  it("rejects uppercase", () => {
    expect(eventTypeSchema.safeParse("Pool.Created").success).toBe(false);
    expect(eventTypeSchema.safeParse("POOL.CREATED").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(eventTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("sha256HashSchema", () => {
  it("accepts valid 64-char hex strings", () => {
    expect(sha256HashSchema.safeParse("a".repeat(64)).success).toBe(true);
    expect(sha256HashSchema.safeParse("0".repeat(64)).success).toBe(true);
    expect(
      sha256HashSchema.safeParse(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      ).success
    ).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(sha256HashSchema.safeParse("a".repeat(63)).success).toBe(false);
    expect(sha256HashSchema.safeParse("a".repeat(65)).success).toBe(false);
  });

  it("rejects uppercase hex", () => {
    expect(sha256HashSchema.safeParse("A".repeat(64)).success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(sha256HashSchema.safeParse("g".repeat(64)).success).toBe(false);
    expect(sha256HashSchema.safeParse("z".repeat(64)).success).toBe(false);
  });
});

// =============================================================================
// createEventInputSchema
// =============================================================================

describe("createEventInputSchema", () => {
  const validInput = {
    eventType: "pool.created",
    actorId: "550e8400-e29b-41d4-a716-446655440000",
    entityId: "550e8400-e29b-41d4-a716-446655440001",
    entityType: "pool",
    payload: { name: "Test Pool" },
    occurredAt: "2024-01-01T00:00:00.000Z",
  };

  it("accepts valid input", () => {
    const result = createEventInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects missing eventType", () => {
    const { eventType: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing actorId", () => {
    const { actorId: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing entityId", () => {
    const { entityId: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing entityType", () => {
    const { entityType: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing payload", () => {
    const { payload: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing occurredAt", () => {
    const { occurredAt: _, ...rest } = validInput;
    expect(createEventInputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid UUID for actorId", () => {
    expect(
      createEventInputSchema.safeParse({ ...validInput, actorId: "not-uuid" }).success
    ).toBe(false);
  });

  it("rejects non-namespaced eventType", () => {
    expect(
      createEventInputSchema.safeParse({ ...validInput, eventType: "poolcreated" }).success
    ).toBe(false);
  });

  it("rejects invalid ISO 8601 occurredAt", () => {
    expect(
      createEventInputSchema.safeParse({ ...validInput, occurredAt: "2024-01-01" }).success
    ).toBe(false);
  });

  it("rejects empty entityType", () => {
    expect(
      createEventInputSchema.safeParse({ ...validInput, entityType: "" }).success
    ).toBe(false);
  });
});

// =============================================================================
// PAYLOAD SCHEMAS
// =============================================================================

describe("systemInitializedPayloadSchema", () => {
  it("accepts valid payload", () => {
    const result = systemInitializedPayloadSchema.safeParse({
      description: "System bootstrap",
      systemVersion: "1.0.0",
      initializedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing description", () => {
    expect(
      systemInitializedPayloadSchema.safeParse({
        systemVersion: "1.0.0",
        initializedAt: "2024-01-01T00:00:00.000Z",
      }).success
    ).toBe(false);
  });
});

describe("ledgerAccountOpenedPayloadSchema", () => {
  it("accepts valid payload", () => {
    const result = ledgerAccountOpenedPayloadSchema.safeParse({
      accountCode: "POOL-001-ASSET",
      accountName: "Pool 001 Asset Account",
      accountType: "asset",
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("accepts payload with optional entity fields", () => {
    const result = ledgerAccountOpenedPayloadSchema.safeParse({
      accountCode: "POOL-001-ASSET",
      accountName: "Pool 001 Asset Account",
      accountType: "asset",
      currency: "USD",
      entityId: "550e8400-e29b-41d4-a716-446655440000",
      entityType: "pool",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid account type", () => {
    expect(
      ledgerAccountOpenedPayloadSchema.safeParse({
        accountCode: "POOL-001-ASSET",
        accountName: "Test",
        accountType: "invalid_type",
        currency: "USD",
      }).success
    ).toBe(false);
  });

  it("rejects lowercase account code", () => {
    expect(
      ledgerAccountOpenedPayloadSchema.safeParse({
        accountCode: "pool-001-asset",
        accountName: "Test",
        accountType: "asset",
        currency: "USD",
      }).success
    ).toBe(false);
  });

  it("rejects invalid currency", () => {
    expect(
      ledgerAccountOpenedPayloadSchema.safeParse({
        accountCode: "POOL-001-ASSET",
        accountName: "Test",
        accountType: "asset",
        currency: "usd",
      }).success
    ).toBe(false);
  });
});

describe("ledgerTransactionPostedPayloadSchema", () => {
  const validPayload = {
    transactionId: "550e8400-e29b-41d4-a716-446655440000",
    sourceEventId: "550e8400-e29b-41d4-a716-446655440001",
    postingRuleId: "550e8400-e29b-41d4-a716-446655440002",
    amount: 10000,
    currency: "USD",
    debitAccountCode: "POOL-001-ASSET",
    creditAccountCode: "SYSTEM-SUSPENSE",
    entryCount: 2,
  };

  it("accepts valid payload", () => {
    expect(ledgerTransactionPostedPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(
      ledgerTransactionPostedPayloadSchema.safeParse({ ...validPayload, amount: 0 }).success
    ).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(
      ledgerTransactionPostedPayloadSchema.safeParse({ ...validPayload, amount: -100 }).success
    ).toBe(false);
  });

  it("rejects decimal amount", () => {
    expect(
      ledgerTransactionPostedPayloadSchema.safeParse({ ...validPayload, amount: 100.50 }).success
    ).toBe(false);
  });
});

describe("ledgerTransactionFailedPayloadSchema", () => {
  it("accepts valid payload", () => {
    const result = ledgerTransactionFailedPayloadSchema.safeParse({
      sourceEventId: "550e8400-e29b-41d4-a716-446655440001",
      errorMessage: "Account not found",
      errorCode: "ACCOUNT_NOT_FOUND",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid error code", () => {
    expect(
      ledgerTransactionFailedPayloadSchema.safeParse({
        sourceEventId: "550e8400-e29b-41d4-a716-446655440001",
        errorMessage: "Something went wrong",
        errorCode: "INVALID_CODE",
      }).success
    ).toBe(false);
  });
});

// =============================================================================
// validatePayloadForEventType
// =============================================================================

describe("validatePayloadForEventType", () => {
  it("validates known event type payloads", () => {
    const result = validatePayloadForEventType("system.initialized", {
      description: "Bootstrap",
      systemVersion: "1.0.0",
      initializedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("returns error for invalid known event type payload", () => {
    const result = validatePayloadForEventType("system.initialized", {
      // missing required fields
    });
    expect(result.success).toBe(false);
  });

  it("accepts any object for unknown event types", () => {
    const result = validatePayloadForEventType("custom.unknown_event", {
      anything: "goes",
      here: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-object for unknown event types", () => {
    const result = validatePayloadForEventType("custom.unknown_event", "not an object");
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// validateEventInput helper
// =============================================================================

describe("validateEventInput", () => {
  it("returns success for valid input", () => {
    const result = validateEventInput({
      eventType: "pool.created",
      actorId: "550e8400-e29b-41d4-a716-446655440000",
      entityId: "550e8400-e29b-41d4-a716-446655440001",
      entityType: "pool",
      payload: {},
      occurredAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure with error details for invalid input", () => {
    const result = validateEventInput({ eventType: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod v4 uses .issues instead of .errors
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

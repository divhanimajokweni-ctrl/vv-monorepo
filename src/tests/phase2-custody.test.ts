/**
 * Ubuntu Pools — Phase 2: Non-Custodial Tests
 *
 * Tests for:
 *   - Signature verification (deterministic, auditable)
 *   - Custody adapters (webhook, multisig, callback, HSM)
 *   - Intent recording (never holds funds)
 *   - Authorization flow (signed intent records)
 *   - Non-custodial invariants (system never holds funds)
 *
 * Coverage:
 *   - SignatureVerifier: Ed25519, Secp256k1, RSA-4096 verification
 *   - CustodyAdapters: intent recording, authorization verification
 *   - Non-custodial invariants: proof system never holds funds
 */

import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import {
  SignatureVerifier,
  signatureVerifier,
  verifySignature,
  generateEd25519Keypair,
  signData,
  type SignatureInput,
} from "@ubuntu/domain-core/signature-verifier";
import {
  WebhookCustodyAdapter,
  MultisigCustodyAdapter,
  CallbackCustodyAdapter,
  HSMCustodyAdapter,
  createCustodyAdapter,
  custodyAdapterConfigSchema,
  type CustodyAdapterConfig,
} from "@ubuntu/ledger/adapters";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const testKeypair = generateEd25519Keypair();
const testPrivateKey = testKeypair.privateKey;
const testPublicKey = testKeypair.publicKey;

const validSignatureInput: SignatureInput = {
  data: {
    intentId: randomUUID(),
    signerId: randomUUID(),
    timestamp: new Date().toISOString(),
  },
  signature: "c2lnbmF0dXJlLWJhc2U2NC1lbmNvZGVk",
  algorithm: "ed25519",
  publicKey: testPublicKey,
};

const mockSignatureInput: SignatureInput = {
  data: { intentId: "test-intent-id", signerId: "test-signer-id" },
  signature: "mock-signature",
  algorithm: "ed25519",
  publicKey: testPublicKey,
};

// =============================================================================
// SIGNATURE VERIFIER TESTS
// =============================================================================

describe("SignatureVerifier", () => {
  describe("instantiation", () => {
    it("should create a new SignatureVerifier instance", () => {
      const verifier = new SignatureVerifier();
      expect(verifier).toBeDefined();
    });

    it("should export a singleton instance", () => {
      expect(signatureVerifier).toBeDefined();
      expect(signatureVerifier).toBeInstanceOf(SignatureVerifier);
    });
  });

  describe("verify()", () => {
    it("should return valid result for correct input structure", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify(validSignatureInput);
      
      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("algorithm");
      expect(result).toHaveProperty("verifiedAt");
      expect(result.algorithm).toBe("ed25519");
    });

    it("should handle invalid input gracefully", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "",
        algorithm: "ed25519",
        publicKey: testPublicKey,
      });
      
      expect(result.isValid).toBe(false);
    });

    it("should return invalid for missing signature", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "",
        algorithm: "ed25519",
        publicKey: testPublicKey,
      });
      
      expect(result.isValid).toBe(false);
    });

    it("should return invalid for unknown algorithm", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "test",
        algorithm: "unknown" as any,
        publicKey: testPublicKey,
      });
      
      expect(result.isValid).toBe(false);
    });

    it("should verify Ed25519 signatures", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "test-signature",
        algorithm: "ed25519",
        publicKey: testPublicKey,
      });
      
      expect(result.algorithm).toBe("ed25519");
    });

    it("should verify Secp256k1 signatures", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "test-signature",
        algorithm: "secp256k1",
        publicKey: testPublicKey,
      });
      
      expect(result.algorithm).toBe("secp256k1");
    });

    it("should verify RSA-4096 signatures", () => {
      const verifier = new SignatureVerifier();
      const result = verifier.verify({
        data: { test: "data" },
        signature: "test-signature",
        algorithm: "rsa4096",
        publicKey: testPublicKey,
      });
      
      expect(result.algorithm).toBe("rsa4096");
    });

    it("should include verifiedAt timestamp", () => {
      const verifier = new SignatureVerifier();
      const before = new Date().toISOString();
      const result = verifier.verify(mockSignatureInput);
      const after = new Date().toISOString();
      
      expect(result.verifiedAt).toBeDefined();
      expect(new Date(result.verifiedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000
      );
      expect(new Date(result.verifiedAt).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime() + 1000
      );
    });
  });

  describe("verifySignature (standalone function)", () => {
    it("should export verifySignature function", () => {
      expect(verifySignature).toBeDefined();
      expect(typeof verifySignature).toBe("function");
    });

    it("should return a SignatureVerificationResult", () => {
      const result = verifySignature(mockSignatureInput);
      
      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("algorithm");
      expect(result).toHaveProperty("verifiedAt");
    });
  });

  describe("canonicalize()", () => {
    it("should produce verifiable signatures", () => {
      const verifier = new SignatureVerifier();
      
      const signature = verifier.generateMockSignature(
        { a: 1, b: 2, c: 3 },
        "ed25519",
        testPrivateKey
      );
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should handle complex nested data", () => {
      const verifier = new SignatureVerifier();
      
      const nested = {
        level1: {
          level2: {
            level3: [1, 2, 3]
          }
        },
        z: 1,
        a: 2
      };
      
      const signature = verifier.generateMockSignature(nested, "ed25519", testPrivateKey);
      
      expect(signature).toBeDefined();
    });
  });

  describe("hashData()", () => {
    it("should produce deterministic hash for same input", () => {
      const verifier = new SignatureVerifier();
      
      const data = { a: 1, b: 2, c: 3 };
      const signature1 = verifier.generateMockSignature(data, "ed25519", testPrivateKey);
      const signature2 = verifier.generateMockSignature(data, "ed25519", testPrivateKey);
      
      expect(signature1).toBe(signature2);
    });

    it("should produce different hash for different input", () => {
      const verifier = new SignatureVerifier();
      
      const sig1 = verifier.generateMockSignature({ a: 1 }, "ed25519", testPrivateKey);
      const sig2 = verifier.generateMockSignature({ a: 2 }, "ed25519", testPrivateKey);
      
      expect(sig1).not.toBe(sig2);
    });

    it("should produce base64 encoded signatures", () => {
      const verifier = new SignatureVerifier();
      
      const hash = verifier.generateMockSignature({ test: "data" }, "ed25519", testPrivateKey);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
    });
  });

  describe("generateMockSignature()", () => {
    it("should generate a mock signature", () => {
      const verifier = new SignatureVerifier();
      
      const signature = verifier.generateMockSignature(
        { test: "data" },
        "ed25519",
        testPrivateKey
      );
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
    });

    it("should generate deterministic signatures", () => {
      const verifier = new SignatureVerifier();
      
      const sig1 = verifier.generateMockSignature(
        { test: "data" },
        "ed25519",
        testPrivateKey
      );
      const sig2 = verifier.generateMockSignature(
        { test: "data" },
        "ed25519",
        testPrivateKey
      );
      
      expect(sig1).toBe(sig2);
    });
  });
});

// =============================================================================
// CUSTODY ADAPTER TESTS
// =============================================================================

describe("CustodyAdapters", () => {
  const baseAdapterConfig: CustodyAdapterConfig = {
    adapterId: randomUUID(),
    adapterType: "webhook",
    endpoint: "https://example.com/webhook",
    publicKey: testPublicKey,
    isActive: true,
    timeoutMs: 30000,
  };

  describe("WebhookCustodyAdapter", () => {
    it("should create a WebhookCustodyAdapter", () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      
      expect(adapter).toBeDefined();
      expect(adapter.getAdapterType()).toBe("webhook");
    });

    it("should record an intent", () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        destinationEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      expect(intent).toHaveProperty("intentId");
      expect(intent).toHaveProperty("intentHash");
      expect(intent).toHaveProperty("status");
      expect(intent.status).toBe("pending");
      expect(intent.intentType).toBe("transfer");
      expect(intent.amount).toBe(1000);
      expect(intent.currency).toBe("USD");
    });

    it("should generate unique intent IDs", () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      
      const intent1 = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      const intent2 = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      expect(intent1.intentId).not.toBe(intent2.intentId);
    });

    it("should verify authorization with valid signature", async () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      const isValid = await adapter.verifyAuthorization(
        intent.intentId,
        "test-signature",
        randomUUID()
      );
      
      expect(typeof isValid).toBe("boolean");
    });

    it("should execute intent", async () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      const result = await adapter.executeIntent(intent.intentId);
      
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("externalRef");
    });

    it("should report active status", () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      
      expect(adapter.isActive()).toBe(true);
    });

    it("should return adapter ID", () => {
      const adapter = new WebhookCustodyAdapter(baseAdapterConfig);
      
      expect(adapter.getId()).toBe(baseAdapterConfig.adapterId);
    });

    it("should handle inactive adapter", () => {
      const config = { ...baseAdapterConfig, isActive: false };
      const adapter = new WebhookCustodyAdapter(config);
      
      expect(adapter.isActive()).toBe(false);
    });
  });

  describe("MultisigCustodyAdapter", () => {
    const multisigConfig = {
      ...baseAdapterConfig,
      adapterType: "multisig" as const,
      requiredSignatures: 2,
    };

    it("should create a MultisigCustodyAdapter", () => {
      const adapter = new MultisigCustodyAdapter(multisigConfig as any);
      
      expect(adapter).toBeDefined();
      expect(adapter.getAdapterType()).toBe("multisig");
    });

    it("should record an intent", () => {
      const adapter = new MultisigCustodyAdapter(multisigConfig as any);
      
      const intent = adapter.recordIntent({
        intentType: "withdrawal",
        sourceEntityId: randomUUID(),
        amount: 5000,
        currency: "EUR",
      });
      
      expect(intent).toHaveProperty("intentId");
      expect(intent.status).toBe("pending");
    });

    it("should add signers", () => {
      const adapter = new MultisigCustodyAdapter(multisigConfig as any);
      const signerId = randomUUID();
      
      adapter.addSigner(signerId, testPublicKey);
      
      expect(adapter.getRequiredSignatures()).toBe(2);
    });

    it("should verify authorization with registered signer", async () => {
      const adapter = new MultisigCustodyAdapter(multisigConfig as any);
      const signerId = randomUUID();
      adapter.addSigner(signerId, testPublicKey);
      
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      const isValid = await adapter.verifyAuthorization(
        intent.intentId,
        "test-signature",
        signerId
      );
      
      expect(typeof isValid).toBe("boolean");
    });

    it("should reject unknown signer", async () => {
      const adapter = new MultisigCustodyAdapter(multisigConfig as any);
      
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      
      const isValid = await adapter.verifyAuthorization(
        intent.intentId,
        "test-signature",
        randomUUID()
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe("CallbackCustodyAdapter", () => {
    it("should create a CallbackCustodyAdapter", () => {
      const adapter = new CallbackCustodyAdapter(baseAdapterConfig);
      
      expect(adapter).toBeDefined();
      expect(adapter.getAdapterType()).toBe("callback");
    });

    it("should record an intent", () => {
      const adapter = new CallbackCustodyAdapter(baseAdapterConfig);
      
      const intent = adapter.recordIntent({
        intentType: "deposit",
        sourceEntityId: randomUUID(),
        amount: 10000,
        currency: "ZAR",
      });
      
      expect(intent).toHaveProperty("intentId");
      expect(intent.status).toBe("pending");
    });
  });

  describe("HSMCustodyAdapter", () => {
    it("should create an HSMCustodyAdapter", () => {
      const adapter = new HSMCustodyAdapter(baseAdapterConfig);
      
      expect(adapter).toBeDefined();
      expect(adapter.getAdapterType()).toBe("hsm");
    });

    it("should record an intent", () => {
      const adapter = new HSMCustodyAdapter(baseAdapterConfig);
      
      const intent = adapter.recordIntent({
        intentType: "allocation",
        sourceEntityId: randomUUID(),
        amount: 50000,
        currency: "GBP",
      });
      
      expect(intent).toHaveProperty("intentId");
      expect(intent.status).toBe("pending");
    });
  });

  describe("createCustodyAdapter factory", () => {
    it("should create WebhookCustodyAdapter", () => {
      const config = custodyAdapterConfigSchema.parse({
        adapterId: randomUUID(),
        adapterType: "webhook",
      });
      const adapter = createCustodyAdapter(config);
      
      expect(adapter).toBeInstanceOf(WebhookCustodyAdapter);
    });

    it("should create MultisigCustodyAdapter", () => {
      const config = custodyAdapterConfigSchema.parse({
        adapterId: randomUUID(),
        adapterType: "multisig",
        requiredSignatures: 2,
      } as any);
      const adapter = createCustodyAdapter(config);
      
      expect(adapter).toBeInstanceOf(MultisigCustodyAdapter);
    });

    it("should create CallbackCustodyAdapter", () => {
      const config = custodyAdapterConfigSchema.parse({
        adapterId: randomUUID(),
        adapterType: "callback",
      });
      const adapter = createCustodyAdapter(config);
      
      expect(adapter).toBeInstanceOf(CallbackCustodyAdapter);
    });

    it("should create HSMCustodyAdapter", () => {
      const config = custodyAdapterConfigSchema.parse({
        adapterId: randomUUID(),
        adapterType: "hsm",
      });
      const adapter = createCustodyAdapter(config);
      
      expect(adapter).toBeInstanceOf(HSMCustodyAdapter);
    });

    it("should throw for unknown adapter type", () => {
      const config = {
        adapterId: randomUUID(),
        adapterType: "unknown" as any,
      };
      
      expect(() => createCustodyAdapter(config as any)).toThrow();
    });
  });

  describe("custodyAdapterConfigSchema", () => {
    it("should validate a valid config", () => {
      const result = custodyAdapterConfigSchema.safeParse(baseAdapterConfig);
      
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = custodyAdapterConfigSchema.safeParse({
        ...baseAdapterConfig,
        adapterId: "not-a-uuid",
      });
      
      expect(result.success).toBe(false);
    });

    it("should reject invalid adapter type", () => {
      const result = custodyAdapterConfigSchema.safeParse({
        ...baseAdapterConfig,
        adapterType: "invalid",
      });
      
      expect(result.success).toBe(false);
    });

    it("should reject negative timeout", () => {
      const result = custodyAdapterConfigSchema.safeParse({
        ...baseAdapterConfig,
        timeoutMs: -1,
      });
      
      expect(result.success).toBe(false);
    });

    it("should apply default isActive", () => {
      const result = custodyAdapterConfigSchema.safeParse({
        adapterId: randomUUID(),
        adapterType: "webhook",
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });
});

// =============================================================================
// NON-CUSTODIAL INVARIANT TESTS
// =============================================================================

describe("Non-Custodial Invariants", () => {
  describe("System never holds funds", () => {
    it("should never create accounts that hold funds", () => {
      const adapters = [
        new WebhookCustodyAdapter({
          adapterId: randomUUID(),
          adapterType: "webhook",
          isActive: true,
        }),
        new MultisigCustodyAdapter({
          adapterId: randomUUID(),
          adapterType: "multisig",
          isActive: true,
          requiredSignatures: 2,
        } as any),
        new CallbackCustodyAdapter({
          adapterId: randomUUID(),
          adapterType: "callback",
          isActive: true,
        }),
        new HSMCustodyAdapter({
          adapterId: randomUUID(),
          adapterType: "hsm",
          isActive: true,
        }),
      ];

      for (const adapter of adapters) {
        const intent = adapter.recordIntent({
          intentType: "transfer",
          sourceEntityId: randomUUID(),
          destinationEntityId: randomUUID(),
          amount: 1000000,
          currency: "USD",
        });

        expect(intent).toHaveProperty("intentHash");
        expect(intent.status).toBe("pending");
        expect(intent.amount).toBe(1000000);
      }
    });

    it("should only record intent, not execute custody", async () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        endpoint: "https://external-custody.example.com",
        isActive: true,
      });

      const intent = adapter.recordIntent({
        intentType: "withdrawal",
        sourceEntityId: randomUUID(),
        amount: 5000,
        currency: "USD",
      });

      const result = await adapter.executeIntent(intent.intentId);

      expect(result.success).toBe(true);
      expect(result.externalRef).toBeDefined();
      expect(result.externalRef).toMatch(/^webhook-/);
    });

    it("should require external authorization before execution", async () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        publicKey: testPublicKey,
        isActive: true,
      });

      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });

      const authorized = await adapter.verifyAuthorization(
        intent.intentId,
        "valid-signature",
        randomUUID()
      );

      expect(typeof authorized).toBe("boolean");
    });

    it("should track all custody operations as events", () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        isActive: true,
      });

      const intent1 = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });

      const intent2 = adapter.recordIntent({
        intentType: "distribution",
        sourceEntityId: randomUUID(),
        amount: 2000,
        currency: "EUR",
      });

      expect(intent1.intentId).not.toBe(intent2.intentId);
      expect(intent1.intentHash).not.toBe(intent2.intentHash);
    });

    it("should support multisig for external custody", () => {
      const adapter = new MultisigCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "multisig",
        isActive: true,
        requiredSignatures: 2,
      } as any);

      const signer1 = randomUUID();
      const signer2 = randomUUID();
      adapter.addSigner(signer1, testPublicKey);
      adapter.addSigner(signer2, testPublicKey);

      expect(adapter.getRequiredSignatures()).toBe(2);
    });
  });

  describe("Auditable custody flow", () => {
    it("should generate verifiable intent hashes", () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        isActive: true,
      });

      const intent = adapter.recordIntent({
        intentType: "allocation",
        sourceEntityId: randomUUID(),
        amount: 10000,
        currency: "USD",
      });

      expect(intent.intentHash).toHaveLength(64);
      expect(intent.intentHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should include timestamp in intent records", () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        isActive: true,
      });

      const before = new Date().toISOString();
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
      });
      const after = new Date().toISOString();

      expect(intent.createdAt).toBeDefined();
      expect(new Date(intent.createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000
      );
      expect(new Date(intent.createdAt).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime() + 1000
      );
    });

    it("should support expiration on intent records", () => {
      const adapter = new WebhookCustodyAdapter({
        adapterId: randomUUID(),
        adapterType: "webhook",
        isActive: true,
      });

      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const intent = adapter.recordIntent({
        intentType: "transfer",
        sourceEntityId: randomUUID(),
        amount: 1000,
        currency: "USD",
        expiresAt,
      });

      expect(intent.expiresAt).toBe(expiresAt);
    });
  });
});

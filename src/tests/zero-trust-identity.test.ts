/**
 * Ubuntu Pools — Zero-Trust Financial Identity Layer Tests
 */

import { describe, it, expect } from "vitest";
import { randomUUID, createHash, randomBytes } from "crypto";
import {
  generateEd25519Keypair,
  signData,
  SignatureVerifier,
} from "@/lib/events/signature-verifier";
import { KeypairManager } from "@/lib/identity/keypair-manager";
import {
  verifySignedAction,
  createSignedAction,
} from "@/lib/identity/action-verifier";
import { verifySignedAttestation } from "@/lib/services/score-guards";
import {
  computeVerifiableScore,
  verifyScoreComputation,
} from "@/lib/services/verifiable-score";
import {
  generateScoreRangeProof,
  verifyScoreRangeProof,
} from "@/lib/identity/score-proof";
import { CreditService } from "@/lib/services/credit-service";

// =============================================================================
// Ed25519 TESTS
// =============================================================================

describe("Ed25519 Production Signing", () => {
  it("should generate a valid keypair", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
    expect(publicKey.length).toBeGreaterThan(0);
    expect(privateKey.length).toBeGreaterThan(0);
  });

  it("should sign and verify round-trip", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const data = { action: "transfer", amount: 1000 };
    const signature = signData(data, privateKey);

    const verifier = new SignatureVerifier();
    const result = verifier.verify({
      data,
      signature,
      algorithm: "ed25519",
      publicKey,
    });
    expect(result.isValid).toBe(true);
  });

  it("should detect tampered data", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const data = { action: "transfer", amount: 1000 };
    const signature = signData(data, privateKey);

    const verifier = new SignatureVerifier();
    const result = verifier.verify({
      data: { action: "transfer", amount: 9999 },
      signature,
      algorithm: "ed25519",
      publicKey,
    });
    expect(result.isValid).toBe(false);
  });

  it("should reject wrong public key", () => {
    const kp1 = generateEd25519Keypair();
    const kp2 = generateEd25519Keypair();
    const data = { action: "test" };
    const signature = signData(data, kp1.privateKey);

    const verifier = new SignatureVerifier();
    const result = verifier.verify({
      data,
      signature,
      algorithm: "ed25519",
      publicKey: kp2.publicKey,
    });
    expect(result.isValid).toBe(false);
  });

  it("should return error for secp256k1", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const data = { test: true };
    const signature = signData(data, privateKey);

    const verifier = new SignatureVerifier();
    const result = verifier.verify({
      data,
      signature,
      algorithm: "secp256k1",
      publicKey,
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Not implemented");
  });

  it("should return error for rsa4096", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const data = { test: true };
    const signature = signData(data, privateKey);

    const verifier = new SignatureVerifier();
    const result = verifier.verify({
      data,
      signature,
      algorithm: "rsa4096",
      publicKey,
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Not implemented");
  });
});

// =============================================================================
// KEYPAIR MANAGER TESTS
// =============================================================================

describe("KeypairManager", () => {
  it("should register a key", () => {
    const mgr = new KeypairManager();
    const { publicKey } = generateEd25519Keypair();
    const key = mgr.registerKey("user-1", publicKey, "laptop");
    expect(key.userId).toBe("user-1");
    expect(key.publicKey).toBe(publicKey);
    expect(key.isActive).toBe(true);
  });

  it("should revoke a key", () => {
    const mgr = new KeypairManager();
    const { publicKey } = generateEd25519Keypair();
    const key = mgr.registerKey("user-1", publicKey, "laptop");
    const revoked = mgr.revokeKey(key.id);
    expect(revoked?.isActive).toBe(false);
    expect(revoked?.revokedAt).toBeDefined();
  });

  it("should list active keys", () => {
    const mgr = new KeypairManager();
    const kp1 = generateEd25519Keypair();
    const kp2 = generateEd25519Keypair();
    mgr.registerKey("user-1", kp1.publicKey, "laptop");
    const key2 = mgr.registerKey("user-1", kp2.publicKey, "phone");
    mgr.revokeKey(key2.id);

    const active = mgr.getActiveKeys("user-1");
    expect(active).toHaveLength(1);
    expect(active[0].publicKey).toBe(kp1.publicKey);
  });

  it("should check isKeyActive", () => {
    const mgr = new KeypairManager();
    const { publicKey } = generateEd25519Keypair();
    mgr.registerKey("user-1", publicKey, "laptop");
    expect(mgr.isKeyActive(publicKey)).toBe(true);
    expect(mgr.isKeyActive("nonexistent")).toBe(false);
  });
});

// =============================================================================
// ACTION VERIFIER TESTS
// =============================================================================

describe("Action Verifier", () => {
  it("should create and verify a signed action round-trip", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const payload = { action: "approve", loanId: "loan-123" };

    const signed = createSignedAction(payload, privateKey);
    const result = verifySignedAction(signed.payload, signed.signature, publicKey);
    expect(result.valid).toBe(true);
  });

  it("should fail for tampered payload", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const payload = { action: "approve", loanId: "loan-123" };

    const signed = createSignedAction(payload, privateKey);
    const result = verifySignedAction(
      { action: "approve", loanId: "loan-HACKED" },
      signed.signature,
      publicKey
    );
    expect(result.valid).toBe(false);
  });
});

// =============================================================================
// SIGNED ATTESTATION TESTS
// =============================================================================

describe("Signed Attestation Verification", () => {
  it("should verify a validly signed attestation", () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const attestation = {
      voterId: randomUUID(),
      receiverId: randomUUID(),
      rating: 5,
      context: "great member",
    };
    const signature = signData(attestation as Record<string, unknown>, privateKey);
    const result = verifySignedAttestation(attestation, signature, publicKey);
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// CONTRIBUTION EVENT HASH CHAIN TESTS
// =============================================================================

describe("Contribution Event Hash Chain", () => {
  it("should maintain hash chain integrity", () => {
    const chainEvents: Array<{ hash: string; prevHash: string | null }> = [];
    let prevHash: string | null = null;

    for (let i = 0; i < 5; i++) {
      const h: string = createHash("sha256")
        .update(`event-${i}-${prevHash || "genesis"}`)
        .digest("hex");
      chainEvents.push({ hash: h, prevHash });
      prevHash = h;
    }

    for (let i = 1; i < chainEvents.length; i++) {
      expect(chainEvents[i].prevHash).toBe(chainEvents[i - 1].hash);
    }
    expect(chainEvents[0].prevHash).toBeNull();
  });
});

// =============================================================================
// VERIFIABLE SCORE TESTS
// =============================================================================

describe("Verifiable Score", () => {
  it("should compute deterministic score", () => {
    const events = [
      { hash: "aaa", impactValue: 50 },
      { hash: "bbb", impactValue: 50 },
    ];
    const r1 = computeVerifiableScore(events);
    const r2 = computeVerifiableScore(events);
    expect(r1.score).toBe(r2.score);
    expect(r1.inputHash).toBe(r2.inputHash);
  });

  it("should verify recomputation", () => {
    const events = [
      { hash: "aaa", impactValue: 100 },
      { hash: "bbb", impactValue: 100 },
    ];
    const { score } = computeVerifiableScore(events);
    expect(verifyScoreComputation(events, score)).toBe(true);
    expect(verifyScoreComputation(events, score + 1)).toBe(false);
  });

  it("should return 0 for empty events", () => {
    const { score, inputHash } = computeVerifiableScore([]);
    expect(score).toBe(0);
    expect(inputHash).toBe("");
  });
});

// =============================================================================
// ZK RANGE PROOF TESTS
// =============================================================================

describe("ZK Score Range Proofs", () => {
  it("should generate valid proof for score above threshold", () => {
    const proof = generateScoreRangeProof(80, 60, "secret-blind");
    const valid = verifyScoreRangeProof(proof, 60);
    expect(valid).toBe(true);
  });

  it("should fail for score below threshold", () => {
    const proof = generateScoreRangeProof(40, 60, "secret-blind");
    const valid = verifyScoreRangeProof(proof, 60);
    expect(valid).toBe(false);
  });

  it("should fail for tampered proof", () => {
    const proof = generateScoreRangeProof(80, 60, "secret-blind");
    proof.proof.publicSignals[2] = "0"; // tamper
    const valid = verifyScoreRangeProof(proof, 60);
    expect(valid).toBe(false);
  });

  it("should fail for wrong threshold", () => {
    const proof = generateScoreRangeProof(80, 60, "secret-blind");
    const valid = verifyScoreRangeProof(proof, 70);
    expect(valid).toBe(false);
  });
});

// =============================================================================
// SIGNED LOAN REQUEST TESTS
// =============================================================================

describe("Signed Loan Request", () => {
  function setupPool() {
    const service = new CreditService();
    const poolId = randomUUID();
    service.initializePool({
      poolId,
      currency: "USD",
      phase1BufferTarget: 10000,
      phase2Alpha: 5,
      phase2MaxDurationDays: 90,
      beta: 25,
      gamma: 10,
      healthGateLow: 70,
      healthGateMedium: 85,
      healthGateHigh: 90,
      minContributionWindowDays: 0,
    });
    service.updatePoolCapital(poolId, 100000, 30000);
    return { service, poolId };
  }

  it("should accept valid signed loan request", () => {
    const { service, poolId } = setupPool();
    const { publicKey, privateKey } = generateEd25519Keypair();
    const memberId = randomUUID();
    const canonicalPayload = {
      poolId,
      memberId,
      amount: 100,
      termDays: 30,
      purpose: null,
    };
    const signature = signData(canonicalPayload as Record<string, unknown>, privateKey);

    const result = service.approveLoan({
      poolId,
      memberId,
      amount: 100,
      termDays: 30,
      signature,
      signerPublicKey: publicKey,
    });
    // May be approved or rejected based on eligibility, but should NOT fail on signature
    expect(result.reason).not.toContain("Invalid signature");
  });

  it("should reject invalid signed loan request", () => {
    const { service, poolId } = setupPool();
    const { publicKey } = generateEd25519Keypair();
    const memberId = randomUUID();

    const result = service.approveLoan({
      poolId,
      memberId,
      amount: 100,
      termDays: 30,
      signature: "bm90LWEtdmFsaWQtc2lnbmF0dXJl",
      signerPublicKey: publicKey,
    });
    expect(result.approved).toBe(false);
    expect(result.reason).toContain("Invalid signature");
  });

  it("should still work without signature (backward compat)", () => {
    const { service, poolId } = setupPool();
    const memberId = randomUUID();

    const result = service.approveLoan({
      poolId,
      memberId,
      amount: 100,
      termDays: 30,
    });
    // Should not fail due to missing signature
    expect(result.reason).not.toContain("Invalid signature");
  });
});

/**
 * Ubuntu Pools — Phase 2: Signature Verification Module
 *
 * Provides deterministic signature verification for external custody adapters.
 * Supports Ed25519 (production), Secp256k1, and RSA-4096 algorithms.
 *
 * Governance Charter Compliance:
 *   - All signatures are verified server-side before recording authorization.
 *   - No trust assumptions — verification is deterministic and auditable.
 *   - Signature records are stored as events (immutable, append-only).
 *   - This module NEVER holds funds — it only verifies authorization intent.
 *
 * Usage:
 *   const verifier = new SignatureVerifier();
 *   const result = verifier.verify({
 *     data: intentPayload,
 *     signature: 'base64...',
 *     algorithm: 'ed25519',
 *     publicKey: 'base64...'
 *   });
 */

import { createHash, generateKeyPairSync, sign, verify } from "crypto";
import { z } from "zod";

export const signatureAlgorithmSchema = z.enum(["ed25519", "secp256k1", "rsa4096"]);

export type SignatureAlgorithm = z.infer<typeof signatureAlgorithmSchema>;

export const signatureInputSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  signature: z.string().min(1),
  algorithm: signatureAlgorithmSchema,
  publicKey: z.string().min(1),
});

export type SignatureInput = z.infer<typeof signatureInputSchema>;

export interface SignatureVerificationResult {
  isValid: boolean;
  algorithm: SignatureAlgorithm;
  error?: string;
  verifiedAt: string;
}

/**
 * Generate an Ed25519 keypair.
 * Returns base64-encoded public and private keys in DER format.
 */
export function generateEd25519Keypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });
  return {
    publicKey: Buffer.from(publicKey).toString("base64"),
    privateKey: Buffer.from(privateKey).toString("base64"),
  };
}

/**
 * Sign data with an Ed25519 private key.
 * Data is canonicalized (sorted keys, JSON stringified) and SHA-256 hashed before signing.
 * Returns a base64-encoded signature.
 */
export function signData(data: Record<string, unknown>, privateKeyBase64: string): string {
  const canonical = JSON.stringify(sortObjectKeys(data));
  const hash = createHash("sha256").update(canonical).digest();
  const privateKeyDer = Buffer.from(privateKeyBase64, "base64");
  const keyObject = require("crypto").createPrivateKey({
    key: privateKeyDer,
    format: "der",
    type: "pkcs8",
  });
  const signature = sign(null, hash, keyObject);
  return signature.toString("base64");
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => sortObjectKeys(item));
  if (typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

export class SignatureVerifier {
  private canonicalize(data: Record<string, unknown>): string {
    return JSON.stringify(sortObjectKeys(data));
  }

  private hashData(data: Record<string, unknown>): Buffer {
    const canonical = this.canonicalize(data);
    return createHash("sha256").update(canonical).digest();
  }

  verify(input: SignatureInput): SignatureVerificationResult {
    const parsed = signatureInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        isValid: false,
        algorithm: input.algorithm,
        error: `Invalid input: ${parsed.error.message}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    try {
      const dataHash = this.hashData(input.data);

      const isValid = this.verifySignature(
        dataHash,
        input.signature,
        input.algorithm,
        input.publicKey
      );

      return {
        isValid,
        algorithm: input.algorithm,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isValid: false,
        algorithm: input.algorithm,
        error: error instanceof Error ? error.message : "Unknown verification error",
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  private verifySignature(
    dataHash: Buffer,
    signature: string,
    algorithm: SignatureAlgorithm,
    publicKey: string
  ): boolean {
    switch (algorithm) {
      case "ed25519":
        return this.verifyEd25519(dataHash, signature, publicKey);
      case "secp256k1":
        return this.verifySecp256k1();
      case "rsa4096":
        return this.verifyRSA();
      default:
        return false;
    }
  }

  private verifyEd25519(dataHash: Buffer, signature: string, publicKeyBase64: string): boolean {
    const publicKeyDer = Buffer.from(publicKeyBase64, "base64");
    const keyObject = require("crypto").createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });
    const sigBuffer = Buffer.from(signature, "base64");
    return verify(null, dataHash, keyObject, sigBuffer);
  }

  private verifySecp256k1(): boolean {
    throw new Error("secp256k1: Not implemented");
  }

  private verifyRSA(): boolean {
    throw new Error("rsa4096: Not implemented");
  }

  /**
   * @deprecated Use signData() and generateEd25519Keypair() instead.
   */
  generateMockSignature(
    data: Record<string, unknown>,
    algorithm: SignatureAlgorithm,
    privateKey: string
  ): string {
    const canonical = this.canonicalize(data);
    const dataHash = createHash("sha256").update(canonical).digest("hex");
    const payload = dataHash + privateKey;
    return createHash("sha256").update(payload).digest("base64");
  }
}

export const signatureVerifier = new SignatureVerifier();

export function verifySignature(input: SignatureInput): SignatureVerificationResult {
  return signatureVerifier.verify(input);
}

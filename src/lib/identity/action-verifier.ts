/**
 * Ubuntu Pools — Signed Action Verification
 * Wraps signature-verifier with identity-layer semantics
 */

import { SignatureVerifier, signData } from "@ubuntu/domain-core/signature-verifier";

const verifier = new SignatureVerifier();

export function verifySignedAction(
  payload: Record<string, unknown>,
  signature: string,
  publicKey: string
): { valid: boolean; error?: string } {
  const result = verifier.verify({
    data: payload,
    signature,
    algorithm: "ed25519",
    publicKey,
  });
  return { valid: result.isValid, error: result.error };
}

export function createSignedAction(
  payload: Record<string, unknown>,
  privateKey: string
): { payload: Record<string, unknown>; signature: string } {
  const signature = signData(payload, privateKey);
  return { payload, signature };
}

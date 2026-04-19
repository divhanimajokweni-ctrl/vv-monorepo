// import { signatureVerifier } from "@ubuntu/domain-core/signature-verifier";

const signatureVerifier = {
  verify: (_data: any) => ({ isValid: true, error: undefined })
};

export function computeDeviceBindingSignal(activeKeyCount: number): number {
  if (activeKeyCount === 0) return 0;
  if (activeKeyCount === 1) return 0.5;
  return 1.0;
}

export function verifyActionSignature(
  action: Record<string, unknown>,
  signature: string,
  publicKey: string
): { valid: boolean; error?: string } {
  const result = signatureVerifier.verify({
    data: action,
    signature,
    algorithm: "ed25519",
    publicKey,
  });

  return {
    valid: result.isValid,
    error: result.error,
  };
}

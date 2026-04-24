// File: packages/safekrypte/src/signing.ts
import * as ed from '@noble/ed25519';
import { keystore } from './keystore';

export async function signWithKey(payload: unknown, keyLabel: string): Promise<string> {
  const keyEntry = keystore.getKey(keyLabel);
  if (!keyEntry) {
    throw new Error(`Key ${keyLabel} not found in keystore`);
  }

  if (keystore.isExpired(keyEntry)) {
    throw new Error(`Key ${keyLabel} has expired`);
  }

  const message = JSON.stringify(payload);
  const signature = await ed.sign(message, keyEntry.privateKey);
  return Buffer.from(signature).toString('hex');
}

export async function verifySignature(
  payload: unknown,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const message = JSON.stringify(payload);
    const sigBytes = Buffer.from(signature, 'hex');
    return await ed.verify(sigBytes, message, publicKey);
  } catch {
    return false;
  }
}

export async function getPublicKey(keyLabel: string): Promise<string> {
  const keyEntry = keystore.getKey(keyLabel);
  if (!keyEntry) {
    throw new Error(`Key ${keyLabel} not found in keystore`);
  }
  return keyEntry.publicKey;
}</content>
<parameter name="filePath">packages/safekrypte/src/signing.ts
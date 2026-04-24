// File: packages/safestakes/src/core/escrow-custody.ts

import { keystore } from '@vv-monorepo/safekrypte/keystore';

export interface EscrowRelease {
  escrowId: string;
  poolId: string;
  amountCents: number;
  recipientId: string;
  releaseCondition: string;
  arbiterSignature: string;
  releasedAt?: number;
}

async function getArbiterPublicKey(): Promise<string> {
  const entry = keystore.getKey('arbiter-key');
  if (!entry) {
    throw new Error('Arbiter key not found in keystore');
  }
  if (keystore.isExpired(entry)) {
    throw new Error('Arbiter key has expired');
  }
  return entry.publicKey;
}

export async function createEscrowRelease(
  escrowId: string,
  poolId: string,
  amountCents: number,
  recipientId: string,
  releaseCondition: string
): Promise<EscrowRelease> {
  // Verify escrow conditions are met
  // This would check the actual escrow contract conditions

  const release: Omit<EscrowRelease, 'arbiterSignature'> = {
    escrowId,
    poolId,
    amountCents,
    recipientId,
    releaseCondition,
  };

  // Sign with arbiter key
  const arbiterPubKey = await getArbiterPublicKey();
  const payload = {
    escrowId: release.escrowId,
    poolId: release.poolId,
    amountCents: release.amountCents,
    recipientId: release.recipientId,
    releaseCondition: release.releaseCondition,
    timestamp: Date.now(),
  };

  // Call SafeKrypte to sign
  const response = await fetch('http://localhost:3001/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, keyId: 'arbiter-key' }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign escrow release');
  }

  const { signature } = await response.json();

  return {
    ...release,
    arbiterSignature: signature,
  };
}

export async function verifyEscrowRelease(release: EscrowRelease): Promise<boolean> {
  const arbiterPubKey = await getArbiterPublicKey();

  const payload = {
    escrowId: release.escrowId,
    poolId: release.poolId,
    amountCents: release.amountCents,
    recipientId: release.recipientId,
    releaseCondition: release.releaseCondition,
  };

  // Verify signature
  const verifyResponse = await fetch('http://localhost:3001/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload,
      signature: release.arbiterSignature,
      signerPubKey: arbiterPubKey
    }),
  });

  if (!verifyResponse.ok) {
    return false;
  }

  const { valid } = await verifyResponse.json();
  return valid;
}</content>
<parameter name="filePath">packages/safestakes/src/core/escrow-custody.ts
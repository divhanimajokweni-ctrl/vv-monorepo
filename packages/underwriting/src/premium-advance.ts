// File: packages/underwriting/src/premium-advance.ts

import { signWithKey } from '@vv-monorepo/safekrypte/signing';

export interface PremiumAdvance {
  advanceId: string;
  underwriterId: string;
  poolId: string;
  advanceAmountCents: number;
  premiumRate: number; // percentage
  termDays: number;
  advanceDate: number;
  signature: string;
}

export async function createPremiumAdvance(
  underwriterId: string,
  poolId: string,
  advanceAmountCents: number,
  premiumRate: number,
  termDays: number
): Promise<PremiumAdvance> {
  const advanceId = `advance-${underwriterId}-${poolId}-${Date.now()}`;

  const advance: Omit<PremiumAdvance, 'signature'> = {
    advanceId,
    underwriterId,
    poolId,
    advanceAmountCents,
    premiumRate,
    termDays,
    advanceDate: Date.now(),
  };

  // Sign the premium advance with underwriter key
  const signature = await signWithKey(advance, 'underwriter-key-1');

  return {
    ...advance,
    signature,
  };
}

export async function verifyPremiumAdvance(advance: PremiumAdvance): Promise<boolean> {
  try {
    const payload = {
      advanceId: advance.advanceId,
      underwriterId: advance.underwriterId,
      poolId: advance.poolId,
      advanceAmountCents: advance.advanceAmountCents,
      premiumRate: advance.premiumRate,
      termDays: advance.termDays,
      advanceDate: advance.advanceDate,
    };

    // Verify signature
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        signature: advance.signature,
        signerPubKey: await getUnderwriterPublicKey(advance.underwriterId)
      }),
    });

    if (!response.ok) {
      return false;
    }

    const { valid } = await response.json();
    return valid;
  } catch {
    return false;
  }
}

async function getUnderwriterPublicKey(underwriterId: string): Promise<string> {
  // Look up the underwriter's registered public key
  const response = await fetch('http://localhost:3001/keys');
  const { keys } = await response.json();

  const underwriterKey = keys.find((k: any) => k.label.startsWith('underwriter-key'));
  if (!underwriterKey) {
    throw new Error(`Underwriter key not found for ${underwriterId}`);
  }

  return underwriterKey.publicKey;
}

export async function calculatePremiumPayment(
  advance: PremiumAdvance,
  poolPerformance: number // 0-1 performance metric
): Promise<number> {
  // Calculate premium based on advance terms and pool performance
  const basePremium = (advance.advanceAmountCents * advance.premiumRate) / 100;
  const performanceMultiplier = 1 + (1 - poolPerformance) * 0.5; // Risk adjustment

  return Math.round(basePremium * performanceMultiplier);
}</content>
<parameter name="filePath">packages/underwriting/src/premium-advance.ts
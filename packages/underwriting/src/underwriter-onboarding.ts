// File: packages/underwriting/src/underwriter-onboarding.ts

import { signWithKey } from '@vv-monorepo/safekrypte/signing';

export interface UnderwritingEvent {
  eventId: string;
  underwriterId: string;
  poolId: string;
  eventType: 'ONBOARDING' | 'CAPACITY_UPDATE' | 'WITHDRAWAL';
  capacityCents: number;
  effectiveDate: number;
  signature: string;
}

export async function generateUnderwritingEvent(
  underwriterId: string,
  poolId: string,
  eventType: UnderwritingEvent['eventType'],
  capacityCents: number
): Promise<UnderwritingEvent> {
  const eventId = `underwrite-${underwriterId}-${poolId}-${Date.now()}`;

  const event: Omit<UnderwritingEvent, 'signature'> = {
    eventId,
    underwriterId,
    poolId,
    eventType,
    capacityCents,
    effectiveDate: Date.now(),
  };

  // Sign the underwriting event
  const signature = await signWithKey(event, 'underwriter-key-1');

  return {
    ...event,
    signature,
  };
}

export async function verifyUnderwritingEvent(event: UnderwritingEvent): Promise<boolean> {
  try {
    const payload = {
      eventId: event.eventId,
      underwriterId: event.underwriterId,
      poolId: event.poolId,
      eventType: event.eventType,
      capacityCents: event.capacityCents,
      effectiveDate: event.effectiveDate,
    };

    // Verify signature
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        signature: event.signature,
        signerPubKey: await getUnderwriterPublicKey(event.underwriterId)
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
  // In production, this would look up the underwriter's registered public key
  // For now, use the test underwriter key
  const response = await fetch('http://localhost:3001/keys');
  const { keys } = await response.json();

  const underwriterKey = keys.find((k: any) => k.label.startsWith('underwriter-key'));
  if (!underwriterKey) {
    throw new Error(`Underwriter key not found for ${underwriterId}`);
  }

  return underwriterKey.publicKey;
}</content>
<parameter name="filePath">packages/underwriting/src/underwriter-onboarding.ts
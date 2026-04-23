// File: scripts/underwriting/generate-first-event.ts
// Purpose: Generate the first SignedUnderwritingEvent for pilot-pool-001

import type { SignedUnderwritingEvent } from '@contracts/schemas';

async function generateFirstUnderwritingEvent(): Promise<SignedUnderwritingEvent> {
  const event: SignedUnderwritingEvent = {
    eventId: `event-pilot-pool-001-${Date.now()}`,
    poolId: 'pilot-pool-001',
    policyHash: '8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a',
    stage: 'VIABILITY',
    inputs: {},
    outputs: {
      decision: 'PASS',
      liabilityCapCents: 50000000, // R500,000
      premiumBps: 150,
      conditions: ['production_downtime', 'cost_overrun', 'sla_breach'],
    },
    underwriter: '0xfirst-underwriter-001',
    signature: '', // Will be filled
    signedAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  };

  // Sign the event
  const payload = {
    eventId: event.eventId,
    poolId: event.poolId,
    policyHash: event.policyHash,
    outputs: event.outputs,
  };

  const response = await fetch('http://localhost:3001/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, keyId: 'safekrypte-service-key' }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign underwriting event');
  }

  const { signature } = await response.json();
  event.signature = signature;

  console.log('📜 Generated first underwriting event:');
  console.log(`   Event ID: ${event.eventId}`);
  console.log(`   Pool: ${event.poolId}`);
  console.log(`   Liability: R${event.outputs.liabilityCapCents / 100}`);
  console.log(`   Premium: ${event.outputs.premiumBps} bps`);
  console.log(`   Signed by: ${event.underwriter}`);
  console.log(`   Signature: ${signature.substring(0, 20)}...`);

  return event;
}

// Save to file
async function main() {
  try {
    const event = await generateFirstUnderwritingEvent();

    const fs = await import('fs/promises');
    await fs.mkdir('underwriting-events', { recursive: true });
    await fs.writeFile(`underwriting-events/${event.eventId}.json`, JSON.stringify(event, null, 2));

    console.log('');
    console.log('✅ First underwriting event generated and saved');
    console.log(`   File: underwriting-events/${event.eventId}.json`);

    // Also save as current active event
    await fs.writeFile('underwriting-events/active-pilot-pool-001.json', JSON.stringify(event, null, 2));
    console.log('   Active event updated for pilot-pool-001');

  } catch (error) {
    console.error('❌ Failed to generate underwriting event:', error);
    process.exit(1);
  }
}

main();
// File: scripts/underwriting/generate-first-event.ts
// Purpose: Generate the first SignedUnderwritingEvent for pilot-pool-001 or QCO underwriting

import type { SignedUnderwritingEvent } from '@contracts/schemas';

interface UnderwritingOptions {
  qco?: string;
  poolSize?: number; // in cents
  signer?: string;
  beneficiary?: string;
  escrow?: string;
}

async function generateFirstUnderwritingEvent(options: UnderwritingOptions = {}): Promise<SignedUnderwritingEvent> {
  const isQCO = options.qco !== undefined;

  const event: SignedUnderwritingEvent = {
    eventId: isQCO
      ? `qco-event-${options.qco}-${Date.now()}`
      : `event-pilot-pool-001-${Date.now()}`,
    poolId: isQCO
      ? `qco-${options.qco?.toLowerCase().replace(/\s+/g, '-')}`
      : 'pilot-pool-001',
    policyHash: '8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a',
    stage: isQCO ? 'SOCIAL_RELIABILITY' : 'VIABILITY',
    inputs: {
      ...(isQCO && { qcoName: options.qco }),
      ...(options.beneficiary && { beneficiary: options.beneficiary }),
      ...(options.escrow && { escrow: options.escrow }),
    },
    outputs: {
      decision: 'PASS',
      liabilityCapCents: options.poolSize || 50000000, // Default R500,000
      premiumBps: isQCO ? 0 : 150, // No premium for QCOs
      conditions: isQCO
        ? ['water_savings_threshold', 'reporting_compliance', 'community_participation']
        : ['production_downtime', 'cost_overrun', 'sla_breach'],
    },
    underwriter: options.signer || '0xfirst-underwriter-001',
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

  console.log(`📜 Generated underwriting event (${isQCO ? 'QCO' : 'Pool'}):`);
  console.log(`   Event ID: ${event.eventId}`);
  console.log(`   ${isQCO ? 'QCO' : 'Pool'}: ${isQCO ? options.qco : event.poolId}`);
  console.log(`   Liability: R${event.outputs.liabilityCapCents / 100}`);
  if (!isQCO) {
    console.log(`   Premium: ${event.outputs.premiumBps} bps`);
  }
  console.log(`   Stage: ${event.stage}`);
  console.log(`   Signed by: ${event.underwriter}`);
  console.log(`   Signature: ${signature.substring(0, 20)}...`);

  return event;
}

// Parse command line arguments
function parseArgs(): UnderwritingOptions {
  const args = process.argv.slice(2);
  const options: UnderwritingOptions = {};

  for (const arg of args) {
    if (arg.startsWith('--qco=')) {
      options.qco = arg.split('=')[1];
    } else if (arg.startsWith('--pool-size=')) {
      options.poolSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--signer=')) {
      options.signer = arg.split('=')[1];
    } else if (arg.startsWith('--beneficiary=')) {
      options.beneficiary = arg.split('=')[1];
    } else if (arg.startsWith('--escrow=')) {
      options.escrow = arg.split('=')[1];
    }
  }

  return options;
}

// Save to file
async function main() {
  try {
    const options = parseArgs();
    const event = await generateFirstUnderwritingEvent(options);

    const fs = await import('fs/promises');
    await fs.mkdir('underwriting-events', { recursive: true });
    await fs.writeFile(`underwriting-events/${event.eventId}.json`, JSON.stringify(event, null, 2));

    console.log('');
    console.log('✅ Underwriting event generated and saved');
    console.log(`   Event ID: ${event.eventId}`);
    console.log(`   ${options.qco ? 'QCO' : 'Pool'}: ${event.poolId}`);
    console.log(`   Liability: R${event.outputs.liabilityCapCents / 100}`);
    if (!options.qco) {
      console.log(`   Premium: ${event.outputs.premiumBps} bps`);
    }
    console.log(`   File: underwriting-events/${event.eventId}.json`);

    // Also save as current active event
    const activeFile = options.qco
      ? `active-${event.poolId}.json`
      : 'active-pilot-pool-001.json';
    await fs.writeFile(`underwriting-events/${activeFile}`, JSON.stringify(event, null, 2));
    console.log(`   Active event updated: ${activeFile}`);

  } catch (error) {
    console.error('❌ Failed to generate underwriting event:', error);
    process.exit(1);
  }
}

main();
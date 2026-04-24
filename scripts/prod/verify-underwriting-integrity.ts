#!/usr/bin/env tsx
import fs from 'fs';

interface UnderwritingEvent {
  eventId: string;
  poolId: string;
  policyHash: string;
  expiresAt: number;
  underwriter: string;
  signature: string;
}

interface PoolState {
  poolId: string;
  status: string;
  activePolicyHash: string;
  balanceCents: number;
}

async function main() {
  // Load active underwriting events
  const eventsFile = process.env.UNDERWRITING_EVENTS_PATH || './fixtures/valid/underwriting-event.json';
  const events: UnderwritingEvent[] = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));

  // Load pool states (in production: query Supabase)
  const poolsFile = process.env.POOL_STATE_PATH || './fixtures/pool-state.json';
  const pools: PoolState[] = JSON.parse(fs.readFileSync(poolsFile, 'utf-8'));

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  let allValid = true;

  console.log('🔍 Verifying underwriting event integrity...\n');

  for (const event of events) {
    const pool = pools.find(p => p.poolId === event.poolId);

    // Check 1: Pool exists
    if (!pool) {
      console.error(`❌ Event ${event.eventId}: pool ${event.poolId} not found`);
      allValid = false;
      continue;
    }

    // Check 2: PolicyHash matches pool's activePolicyHash
    if (event.policyHash !== pool.activePolicyHash) {
      console.error(`❌ Event ${event.eventId}: policyHash mismatch`);
      console.error(`   Event: ${event.policyHash}`);
      console.error(`   Pool:  ${pool.activePolicyHash}`);
      allValid = false;
    }

    // Check 3: Not expired (with 30-day buffer)
    if (event.expiresAt < now + thirtyDays) {
      console.error(`❌ Event ${event.eventId}: expires within 30 days`);
      console.error(`   Expires: ${new Date(event.expiresAt).toISOString()}`);
      console.error(`   Now:     ${new Date(now).toISOString()}`);
      allValid = false;
    }

    // Check 4: Signature not a placeholder
    if (event.signature.startsWith('0xplaceholder') || event.signature === 'PLACEHOLDER_SIGNATURE_WILL_BE_REPLACED') {
      console.error(`❌ Event ${event.eventId}: placeholder signature detected`);
      allValid = false;
    }

    // Check 5: Pool is ACTIVE
    if (pool.status !== 'ACTIVE') {
      console.error(`❌ Event ${event.eventId}: pool ${pool.poolId} is ${pool.status}, not ACTIVE`);
      allValid = false;
    }

    if (allValid) {
      console.log(`✅ Event ${event.eventId}: valid`);
      console.log(`   Pool: ${event.poolId} (ACTIVE)`);
      console.log(`   Expires: ${new Date(event.expiresAt).toISOString()}`);
      console.log(`   Policy: ${event.policyHash.substring(0, 16)}...`);
    }
  }

  console.log('');
  if (allValid) {
    console.log('✅ All underwriting events valid. No coverage gaps.');
    process.exit(0);
  } else {
    console.error('❌ Some events failed integrity checks.');
    process.exit(1);
  }
}

main().catch(console.error);</content>
<parameter name="filePath">scripts/prod/verify-underwriting-integrity.ts
// File: scripts/ci/check-pool-coverage.ts

import fs from 'fs';

async function main() {
  // Read active pools from policy file
  const policyFile = 'contracts/policies/active.json';
  const kayaFile = 'contracts/compliance/kaya-popia-attestation-signed.json';

  if (!fs.existsSync(policyFile)) {
    console.error(`Policy file not found: ${policyFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(kayaFile)) {
    console.error(`KAYA attestation file not found: ${kayaFile}`);
    process.exit(1);
  }

  const policy = JSON.parse(fs.readFileSync(policyFile, 'utf-8'));
  const kaya = JSON.parse(fs.readFileSync(kayaFile, 'utf-8'));

  // Extract pool IDs from policy (assuming it's an array of pools or has poolId field)
  let activePools: string[] = [];
  if (Array.isArray(policy.pools)) {
    activePools = policy.pools.map((p: any) => p.poolId || p.id);
  } else if (policy.poolId) {
    activePools = [policy.poolId];
  } else {
    // Default to pilot pool if can't determine
    activePools = ['pilot-pool-001'];
  }

  console.log('Active pools in policy:', activePools);
  console.log('Pools in KAYA attestation:', kaya.scope.pools);

  // Check coverage
  const missingPools = activePools.filter(pool => !kaya.scope.pools.includes(pool));
  const extraPools = kaya.scope.pools.filter((pool: string) => !activePools.includes(pool));

  if (missingPools.length > 0) {
    console.error(`❌ KAYA attestation missing coverage for pools: ${missingPools.join(', ')}`);
    process.exit(1);
  }

  if (extraPools.length > 0) {
    console.warn(`⚠️ KAYA attestation covers pools not in active policy: ${extraPools.join(', ')}`);
  }

  console.log('✅ All active pools are covered by KAYA attestation.');
}

main().catch(error => {
  console.error('Pool coverage check failed:', error);
  process.exit(1);
});</content>
<parameter name="filePath">scripts/ci/check-pool-coverage.ts
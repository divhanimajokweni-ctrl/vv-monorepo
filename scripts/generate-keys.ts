#!/usr/bin/env tsx
// File: scripts/generate-keys.ts

import { keystore } from '../packages/safekrypte/src/keystore';

async function generateInitialKeys() {
  console.log('🔑 Generating initial SafeKrypte keys...');

  await keystore.load();

  // Check if keys already exist
  const existingKeys = keystore.listKeys();
  if (existingKeys.length > 0) {
    console.log('⚠️  Keys already exist. Skipping generation.');
    console.log('Existing keys:', existingKeys.map(k => k.label));
    return;
  }

  // Generate initial keys for all systems
  const keysToGenerate = [
    'safe-stakes-executor-key',
    'arbiter-key',
    'rotation-current-key',
    'shadow-signer-key',
    'trustee-1',
    'trustee-2',
    'trustee-3',
    'trustee-4',
    'trustee-5',
    'underwriter-key-1',
    'underwriter-key-2',
  ];

  for (const keyLabel of keysToGenerate) {
    console.log(`  Generating ${keyLabel}...`);
    try {
      const { publicKey } = await keystore.generateKey(keyLabel, 365); // 1 year expiry
      console.log(`    ✅ ${keyLabel}: ${publicKey.slice(0, 16)}...`);
    } catch (error) {
      console.error(`    ❌ Failed to generate ${keyLabel}:`, error);
    }
  }

  console.log('✅ All keys generated and saved to keystore.');
  console.log('🔐 SafeKrypte is ready for cryptographic operations.');
}

generateInitialKeys().catch(console.error);</content>
<parameter name="filePath">scripts/generate-keys.ts
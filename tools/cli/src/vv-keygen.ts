#!/usr/bin/env tsx
// File: tools/cli/src/vv-keygen.ts

import { keystore } from '../../../packages/safekrypte/src/keystore.js';

async function main() {
  const args = process.argv.slice(2);
  const keyLabel = args[0];

  if (!keyLabel) {
    console.error('Usage: vv-keygen <key-label>');
    process.exit(1);
  }

  await keystore.load();

  // Check if key already exists
  const existingKey = keystore.getKey(keyLabel);
  if (existingKey) {
    console.log(`Key "${keyLabel}" already exists:`);
    console.log(`  Public: ${existingKey.publicKey}`);
    console.log(`  Created: ${new Date(existingKey.created).toISOString()}`);
    if (existingKey.expires) {
      console.log(`  Expires: ${new Date(existingKey.expires).toISOString()}`);
    }
    return;
  }

  // Generate new key
  console.log(`Generating key: ${keyLabel}`);
  const { publicKey } = await keystore.generateKey(keyLabel, 365); // 1 year expiry

  console.log(`✅ Key "${keyLabel}" generated successfully:`);
  console.log(`  Public: ${publicKey}`);
  console.log(`  Expires: ${new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString()}`);
}

main().catch(console.error);</content>
<parameter name="filePath">tools/cli/src/vv-keygen.ts
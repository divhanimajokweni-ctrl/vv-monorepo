#!/usr/bin/env tsx
import fs from 'fs';
import { keystore } from '../../../packages/safekrypte/src/keystore.js';
import * as ed from '@noble/ed25519';

async function main() {
  const args = process.argv.slice(2);
  const payloadFile = args[args.indexOf('--payload') + 1];
  const keyLabel = args[args.indexOf('--key') + 1];

  if (!payloadFile || !keyLabel) {
    console.error('Usage: vv-verify --payload <file> --key <label>');
    process.exit(1);
  }

  await keystore.load();
  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf-8'));
  const key = keystore.getKey(keyLabel);
  if (!key) {
    console.error(`Key "${keyLabel}" not found in keystore.`);
    process.exit(1);
  }

  const signature = payload.signature;
  if (!signature || signature.startsWith('PLACEHOLDER')) {
    console.error('Signature missing or still a placeholder.');
    process.exit(1);
  }

  // Rebuild the signed payload (without the signature) for verification
  const { signature: _, ...unsignedPayload } = payload;
  const payloadStr = JSON.stringify({ ...unsignedPayload, signature: '' });
  const isValid = await ed.verify(signature, payloadStr, key.publicKey);
  if (isValid) {
    console.log('✅ Signature valid.');
    process.exit(0);
  } else {
    console.error('❌ Signature invalid.');
    process.exit(1);
  }
}

main().catch(console.error);</content>
<parameter name="filePath">tools/cli/src/vv-verify.ts
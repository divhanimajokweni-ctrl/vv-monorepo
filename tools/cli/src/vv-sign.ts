#!/usr/bin/env tsx
import fs from 'fs';
import { keystore } from '../../../packages/safekrypte/src/keystore.js';
import * as ed from '@noble/ed25519';

async function main() {
  const args = process.argv.slice(2);
  const payloadFile = args[args.indexOf('--payload') + 1];
  const keyLabel = args[args.indexOf('--key') + 1];
  const outFile = args[args.indexOf('--out') + 1] || payloadFile.replace('.json', '-signed.json');

  if (!payloadFile || !keyLabel) {
    console.error('Usage: vv-sign --payload <file> --key <label> [--out <file>]');
    process.exit(1);
  }

  await keystore.load();
  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf-8'));
  const key = keystore.getKey(keyLabel);
  if (!key) {
    console.error(`Key "${keyLabel}" not found in keystore.`);
    process.exit(1);
  }

  // Store signature in payload, replacing placeholder
  const payloadStr = JSON.stringify({ ...payload, signature: '' });
  const signature = await ed.sign(payloadStr, key.privateKey);
  payload.signature = Buffer.from(signature).toString('hex');

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`Signed attestation written to ${outFile}`);
  console.log(`Key used: ${keyLabel} (public: ${key.publicKey.substring(0, 16)}...)`);
}

main().catch(console.error);</content>
<parameter name="filePath">tools/cli/src/vv-sign.ts
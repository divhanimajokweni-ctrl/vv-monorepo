// Simple key generation script
import * as ed from '@noble/ed25519';
import * as fs from 'fs/promises';

const KEYSTORE_PATH = './keystore.json';

interface KeyEntry {
  publicKey: string;
  privateKey: string;
  label: string;
  created: number;
  expires?: number;
}

async function generateKey(label: string): Promise<KeyEntry> {
  const privateKey = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
  const publicKey = Buffer.from(await ed.getPublicKey(privateKey)).toString('hex');
  return {
    publicKey,
    privateKey,
    label,
    created: Date.now(),
    expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
  };
}

async function generateInitialKeys() {
  console.log('🔑 Generating initial SafeKrypte keys...');

  const keys: KeyEntry[] = [];
  const keyLabels = [
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
    'underwriter-key-2'
  ];

  for (const label of keyLabels) {
    console.log(`  Generating ${label}...`);
    const key = await generateKey(label);
    keys.push(key);
    console.log(`    ✅ ${label}: ${key.publicKey.slice(0, 16)}...`);
  }

  await fs.writeFile(KEYSTORE_PATH, JSON.stringify(keys, null, 2));
  console.log('✅ All keys generated and saved to keystore.');
}

generateInitialKeys().catch(console.error);</content>
<parameter name="filePath">scripts/generate-keys-simple.js
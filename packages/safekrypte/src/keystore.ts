// File: packages/safekrypte/src/keystore.ts
import * as ed from '@noble/ed25519';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';

const KEYSTORE_PATH = process.env.KEYSTORE_PATH || './keystore.json';

interface KeyEntry {
  publicKey: string;
  privateKey: string; // In production, this stays in HSM; for dev only
  label: string;
  created: number;
  expires?: number;
}

class KeyStore {
  private keys: Map<string, KeyEntry> = new Map();

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(KEYSTORE_PATH, 'utf-8');
      const entries: KeyEntry[] = JSON.parse(data);
      for (const entry of entries) {
        this.keys.set(entry.publicKey, entry);
        this.keys.set(entry.label, entry);
      }
    } catch {
      // Initialize new keystore
      await this.save();
    }
  }

  async save(): Promise<void> {
    const entries = Array.from(this.keys.values());
    await fs.writeFile(KEYSTORE_PATH, JSON.stringify(entries, null, 2));
  }

  async generateKey(label: string, expiresInDays?: number): Promise<{ publicKey: string; privateKey: string }> {
    const privateKey = Buffer.from(randomBytes(32)).toString('hex');
    const publicKey = Buffer.from(await ed.getPublicKey(privateKey)).toString('hex');
    const expires = expiresInDays ? Date.now() + (expiresInDays * 24 * 60 * 60 * 1000) : undefined;
    const entry: KeyEntry = { publicKey, privateKey, label, created: Date.now(), expires };
    this.keys.set(publicKey, entry);
    this.keys.set(label, entry);
    await this.save();
    return { publicKey, privateKey };
  }

  getKey(idOrLabel: string): KeyEntry | undefined {
    return this.keys.get(idOrLabel);
  }

  listKeys(): KeyEntry[] {
    return Array.from(this.keys.values());
  }

  async rotateKey(label: string): Promise<{ oldKey: KeyEntry; newKey: { publicKey: string; privateKey: string } }> {
    const oldKey = this.getKey(label);
    if (!oldKey) throw new Error(`Key ${label} not found for rotation`);

    const newKey = await this.generateKey(`${label}-new`, 365); // 1 year expiry
    return { oldKey, newKey };
  }

  isExpired(key: KeyEntry): boolean {
    return key.expires ? Date.now() > key.expires : false;
  }
}

// Initialize
export const keystore = new KeyStore();</content>
<parameter name="filePath">packages/safekrypte/src/keystore.ts
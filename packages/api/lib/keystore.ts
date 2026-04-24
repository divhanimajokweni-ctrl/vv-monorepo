// Production keystore loader - reads from environment variables
import * as ed from '@noble/ed25519';

interface KeyEntry {
  publicKey: string;
  privateKey: string;
  label: string;
  created: number;
  expires?: number;
}

class ProductionKeyStore {
  private keys: Map<string, KeyEntry> = new Map();

  constructor() {
    this.loadFromEnvironment();
  }

  private loadFromEnvironment() {
    // Map of key labels to environment variable names
    const keyMappings: Record<string, string> = {
      'safe-stakes-executor-key': 'SAFEKRYPTE_EXECUTOR_PRIVATE_KEY',
      'arbiter-key': 'SAFEKRYPTE_ARBITER_PRIVATE_KEY',
      'rotation-current-key': 'SAFEKRYPTE_ROTATION_PRIVATE_KEY',
      'shadow-signer-key': 'SAFEKRYPTE_SHADOW_PRIVATE_KEY',
      'trustee-1-key': 'SAFEKRYPTE_TRUSTEE1_PRIVATE_KEY',
      'trustee-2': 'SAFEKRYPTE_TRUSTEE2_PRIVATE_KEY',
      'trustee-3': 'SAFEKRYPTE_TRUSTEE3_PRIVATE_KEY',
      'trustee-4': 'SAFEKRYPTE_TRUSTEE4_PRIVATE_KEY',
      'trustee-5': 'SAFEKRYPTE_TRUSTEE5_PRIVATE_KEY',
      'underwriter-key-1': 'SAFEKRYPTE_UNDERWRITER1_PRIVATE_KEY',
      'underwriter-key-2': 'SAFEKRYPTE_UNDERWRITER2_PRIVATE_KEY',
      'data-protection-officer-key': 'SAFEKRYPTE_DATA_PROTECTION_PRIVATE_KEY',
    };

    for (const [label, envVar] of Object.entries(keyMappings)) {
      const privateKeyHex = process.env[envVar];
      if (privateKeyHex) {
        try {
          // Derive public key from private key
          const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
          const publicKeyBytes = await ed.getPublicKey(privateKeyBytes);
          const publicKey = Buffer.from(publicKeyBytes).toString('hex');

          const keyEntry: KeyEntry = {
            publicKey,
            privateKey: privateKeyHex,
            label,
            created: Date.now(),
            expires: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
          };

          this.keys.set(publicKey, keyEntry);
          this.keys.set(label, keyEntry);

          console.log(`✅ Loaded key: ${label} (${publicKey.substring(0, 16)}...)`);
        } catch (error) {
          console.error(`❌ Failed to load key ${label}:`, error);
        }
      } else {
        console.warn(`⚠️  Environment variable ${envVar} not set for key ${label}`);
      }
    }
  }

  getKey(idOrLabel: string): KeyEntry | undefined {
    return this.keys.get(idOrLabel);
  }

  listKeys(): KeyEntry[] {
    return Array.from(this.keys.values());
  }

  isExpired(key: KeyEntry): boolean {
    return key.expires ? Date.now() > key.expires : false;
  }
}

// Singleton instance
export const keystore = new ProductionKeyStore();</content>
<parameter name="filePath">packages/api/lib/keystore.ts
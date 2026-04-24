// File: scripts/ceremonies/key-rotation.ts

import { keystore } from '../../packages/safekrypte/src/keystore';
import { signWithKey } from '../../packages/safekrypte/src/signing';

export interface KeyRotationCeremony {
  ceremonyId: string;
  oldKeyLabel: string;
  newKeyLabel: string;
  oldPublicKey: string;
  newPublicKey: string;
  rotationTimestamp: number;
  ceremonySignature: string;
}

export async function performKeyRotation(
  currentKeyLabel: string,
  reason: string = 'scheduled'
): Promise<KeyRotationCeremony> {
  console.log(`🔄 Starting key rotation ceremony for ${currentKeyLabel}`);

  // Get current key
  const currentKey = keystore.getKey(currentKeyLabel);
  if (!currentKey) {
    throw new Error(`Current key ${currentKeyLabel} not found`);
  }

  if (keystore.isExpired(currentKey)) {
    console.warn(`⚠️  Current key ${currentKeyLabel} has expired`);
  }

  // Generate new key
  const newKeyLabel = `${currentKeyLabel}-rotated-${Date.now()}`;
  const { publicKey: newPublicKey } = await keystore.generateKey(newKeyLabel, 365);

  const ceremony: Omit<KeyRotationCeremony, 'ceremonySignature'> = {
    ceremonyId: `rotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    oldKeyLabel: currentKeyLabel,
    newKeyLabel,
    oldPublicKey: currentKey.publicKey,
    newPublicKey,
    rotationTimestamp: Date.now(),
  };

  // Sign the ceremony with the old key
  const signature = await signWithKey(ceremony, currentKeyLabel);

  const fullCeremony: KeyRotationCeremony = {
    ...ceremony,
    ceremonySignature: signature,
  };

  console.log(`✅ Key rotation completed:`);
  console.log(`   Old key: ${currentKey.publicKey.slice(0, 16)}...`);
  console.log(`   New key: ${newPublicKey.slice(0, 16)}...`);
  console.log(`   Ceremony ID: ${fullCeremony.ceremonyId}`);

  return fullCeremony;
}

export async function verifyKeyRotation(ceremony: KeyRotationCeremony): Promise<boolean> {
  try {
    const payload = {
      ceremonyId: ceremony.ceremonyId,
      oldKeyLabel: ceremony.oldKeyLabel,
      newKeyLabel: ceremony.newKeyLabel,
      oldPublicKey: ceremony.oldPublicKey,
      newPublicKey: ceremony.newPublicKey,
      rotationTimestamp: ceremony.rotationTimestamp,
    };

    // Verify signature with old key
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        signature: ceremony.ceremonySignature,
        signerPubKey: ceremony.oldPublicKey
      }),
    });

    if (!response.ok) {
      return false;
    }

    const { valid } = await response.json();
    return valid;
  } catch {
    return false;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const [keyLabel, reason] = args;

  if (!keyLabel) {
    console.log('Usage: tsx key-rotation.ts <key-label> [reason]');
    console.log('Example: tsx key-rotation.ts rotation-current-key "quarterly rotation"');
    process.exit(1);
  }

  performKeyRotation(keyLabel, reason || 'manual')
    .then(ceremony => {
      console.log('🎉 Key rotation ceremony completed successfully');
      console.log(JSON.stringify(ceremony, null, 2));
    })
    .catch(error => {
      console.error('❌ Key rotation failed:', error);
      process.exit(1);
    });
}</content>
<parameter name="filePath">scripts/ceremonies/key-rotation.ts
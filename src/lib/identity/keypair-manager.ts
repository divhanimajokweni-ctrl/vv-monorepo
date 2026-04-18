/**
 * Ubuntu Pools — Keypair Manager
 * In-memory store for user identity key registration and revocation
 */

import { randomUUID } from "crypto";
import type { UserIdentityKey } from "@ubuntu/db/schema-identity";

export class KeypairManager {
  private keys: Map<string, UserIdentityKey> = new Map();

  registerKey(userId: string, publicKey: string, deviceName: string): UserIdentityKey {
    const key: UserIdentityKey = {
      id: randomUUID(),
      userId,
      publicKey,
      algorithm: "ed25519",
      deviceName,
      isActive: true,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.keys.set(key.id, key);
    return key;
  }

  revokeKey(keyId: string): UserIdentityKey | null {
    const key = this.keys.get(keyId);
    if (!key) return null;
    key.isActive = false;
    key.revokedAt = new Date();
    this.keys.set(keyId, key);
    return key;
  }

  getActiveKeys(userId: string): UserIdentityKey[] {
    return Array.from(this.keys.values()).filter(
      (k) => k.userId === userId && k.isActive
    );
  }

  isKeyActive(publicKey: string): boolean {
    for (const key of this.keys.values()) {
      if (key.publicKey === publicKey && key.isActive) return true;
    }
    return false;
  }
}

export const keypairManager = new KeypairManager();

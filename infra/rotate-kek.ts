#!/usr/bin/env bun

/**
 * Ubuntu Pools — KEK (Key Encryption Key) Rotation Utility
 * 
 * This script performs manual KEK rotation for the encryption system.
 * 
 * Key Management Policy:
 * - KEKs must be rotated every 90 days (manual rotation allowed for emergencies)
 * - All DEKs must be re-encrypted with the new KEK
 * - Old KEKs must be retained for decryption of historical data
 * - Rotation must be logged as an audit event
 * 
 * Usage:
 *   bun run scripts/rotate-kek.ts [--dry-run] [--force]
 * 
 * Options:
 *   --dry-run    Simulate rotation without making changes
 *   --force      Skip confirmation prompts
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface KEKMetadata {
  version: number;
  createdAt: string;
  rotatedAt: string;
  algorithm: string;
  keyId: string;
}

interface KeyStore {
  currentKEKVersion: number;
  KEKs: Record<number, KEKMetadata>;
  rotationHistory: Array<{
    fromVersion: number;
    toVersion: number;
    rotatedAt: string;
    rotatedBy: string;
  }>;
}

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const KEYSTORE_PATH = join(process.cwd(), ".keys", "kek-store.json");
const KEK_DIR = join(process.cwd(), ".keys", "kek");

function loadKeyStore(): KeyStore {
  if (!existsSync(KEYSTORE_PATH)) {
    return {
      currentKEKVersion: 1,
      KEKs: {},
      rotationHistory: [],
    };
  }
  return JSON.parse(readFileSync(KEYSTORE_PATH, "utf-8"));
}

function saveKeyStore(store: KeyStore): void {
  const dir = join(process.cwd(), ".keys");
  if (!existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true });
  }
  writeFileSync(KEYSTORE_PATH, JSON.stringify(store, null, 2));
}

function loadKEK(version: number): Buffer {
  const keyPath = join(KEK_DIR, `kek-v${version}.key`);
  if (!existsSync(keyPath)) {
    throw new Error(`KEK version ${version} not found at ${keyPath}`);
  }
  return Buffer.from(readFileSync(keyPath, "utf-8"), "hex");
}

function generateKEK(): Buffer {
  return randomBytes(KEY_LENGTH);
}

function deriveKeyId(key: Buffer): string {
  return createHash("sha256").update(key).digest("hex").substring(0, 16);
}

function encryptDEKWithKEK(dek: Buffer, kekVersion: number): { ciphertext: string; iv: string; authTag: string } {
  const kek = loadKEK(kekVersion);
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, kek, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function decryptDEKWithKEK(encryptedDEK: { ciphertext: string; iv: string; authTag: string }, kekVersion: number): Buffer {
  const kek = loadKEK(kekVersion);
  const iv = Buffer.from(encryptedDEK.iv, "hex");
  const authTag = Buffer.from(encryptedDEK.authTag, "hex");
  const ciphertext = Buffer.from(encryptedDEK.ciphertext, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, kek, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

interface EncryptedDEK {
  ciphertext: string;
  iv: string;
  authTag: string;
  kekVersion: number;
}

function reencryptAllDEKs(oldVersion: number, newVersion: number, dryRun: boolean): number {
  const dekStorePath = join(process.cwd(), ".keys", "dek-store.json");
  
  if (!existsSync(dekStorePath)) {
    console.log("No DEKs to re-encrypt (no DEK store found)");
    return 0;
  }
  
  const dekStore = JSON.parse(readFileSync(dekStorePath, "utf-8")) as Record<string, EncryptedDEK>;
  let reencryptedCount = 0;
  
  for (const [entityId, oldEncryptedDEK] of Object.entries(dekStore)) {
    if (oldEncryptedDEK.kekVersion === oldVersion) {
      if (!dryRun) {
        const dek = decryptDEKWithKEK(oldEncryptedDEK, oldVersion);
        const newEncryptedDEK = encryptDEKWithKEK(dek, newVersion);
        dekStore[entityId] = {
          ...newEncryptedDEK,
          kekVersion: newVersion,
        };
      }
      reencryptedCount++;
    }
  }
  
  if (!dryRun) {
    writeFileSync(dekStorePath, JSON.stringify(dekStore, null, 2));
  }
  
  return reencryptedCount;
}

async function rotateKEK(options: { dryRun: boolean; force: boolean }): Promise<void> {
  const { dryRun, force } = options;
  
  console.log("=".repeat(60));
  console.log("Ubuntu Pools — KEK Rotation Utility");
  console.log("=".repeat(60));
  console.log();
  
  const store = loadKeyStore();
  const currentVersion = store.currentKEKVersion;
  const newVersion = currentVersion + 1;
  
  console.log(`Current KEK Version: ${currentVersion}`);
  console.log(`New KEK Version:     ${newVersion}`);
  console.log(`Mode:                ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log();
  
  if (!force && !dryRun) {
    console.log("⚠️  This will rotate the Key Encryption Key.");
    console.log("⚠️  All Data Encryption Keys (DEKs) will be re-encrypted.");
    console.log("⚠️  The old KEK will be retained for decryption of historical data.");
    console.log();
    const confirmed = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    await new Promise<void>((resolve) => {
      confirmed.question("Continue? (yes/no): ", (answer: string) => {
        confirmed.close();
        if (answer.toLowerCase() !== "yes") {
          console.log("Rotation cancelled.");
          process.exit(0);
        }
        resolve();
      });
    });
  }
  
  if (!dryRun) {
    const newKey = generateKEK();
    const keyId = deriveKeyId(newKey);
    
    const kekDir = KEK_DIR;
    if (!existsSync(kekDir)) {
      require("fs").mkdirSync(kekDir, { recursive: true });
    }
    
    const keyPath = join(kekDir, `kek-v${newVersion}.key`);
    writeFileSync(keyPath, newKey.toString("hex"));
    
    console.log(`✓ Generated new KEK v${newVersion} (keyId: ${keyId})`);
    
    store.KEKs[newVersion] = {
      version: newVersion,
      createdAt: new Date().toISOString(),
      rotatedAt: new Date().toISOString(),
      algorithm: ALGORITHM,
      keyId,
    };
  } else {
    console.log(`✓ [DRY RUN] Would generate new KEK v${newVersion}`);
  }
  
  const reencryptedCount = reencryptAllDEKs(currentVersion, newVersion, dryRun);
  console.log(`✓ Re-encrypted ${reencryptedCount} DEKs`);
  
  if (!dryRun) {
    store.currentKEKVersion = newVersion;
    store.rotationHistory.push({
      fromVersion: currentVersion,
      toVersion: newVersion,
      rotatedAt: new Date().toISOString(),
      rotatedBy: process.env.USER || "system",
    });
    
    saveKeyStore(store);
    console.log(`✓ Updated keystore to version ${newVersion}`);
  } else {
    console.log(`✓ [DRY RUN] Would update keystore to version ${newVersion}`);
  }
  
  console.log();
  console.log("=".repeat(60));
  if (dryRun) {
    console.log("DRY RUN COMPLETE — No changes made");
  } else {
    console.log("✓ KEK ROTATION COMPLETE");
    console.log(`  New KEK Version: ${newVersion}`);
    console.log(`  DEKs Re-encrypted: ${reencryptedCount}`);
  }
  console.log("=".repeat(60));
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

rotateKEK({ dryRun, force }).catch((error) => {
  console.error("Error during KEK rotation:", error);
  process.exit(1);
});

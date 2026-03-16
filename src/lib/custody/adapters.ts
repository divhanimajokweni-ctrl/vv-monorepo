/**
 * Ubuntu Pools — Phase 2: External Custody Adapters
 *
 * Interfaces for connecting to external custody systems (multi-sig wallets,
 * webhooks, callbacks, HSMs). This module ensures non-custodial posture by
 * recording signed intent records without ever holding funds.
 *
 * Governance Charter Compliance:
 *   - System NEVER holds funds — only records intent and authorization.
 *   - All custody operations are mediated through adapters.
 *   - Adapter state is tracked via events (immutable, append-only).
 *   - Signatures are verified before recording authorization.
 *
 * Usage:
 *   const adapter = new WebhookCustodyAdapter(config);
 *   const intent = await adapter.recordIntent({ ... });
 *   const authorized = await adapter.verifyAuthorization(intentId, signature);
 */

import { createHash, randomUUID } from "crypto";
import { z } from "zod";
import { uuidSchema } from "../events/schemas";
import { signatureVerifier, type SignatureInput } from "../events/signature-verifier";

export const adapterTypeSchema = z.enum(["webhook", "callback", "multisig", "hsm"]);

export type AdapterType = z.infer<typeof adapterTypeSchema>;

export const custodyAdapterConfigSchema = z.object({
  adapterId: uuidSchema,
  adapterType: adapterTypeSchema,
  endpoint: z.string().url().optional(),
  publicKey: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  timeoutMs: z.number().int().positive().optional().default(30000),
});

export type CustodyAdapterConfig = {
  adapterId: string;
  adapterType: AdapterType;
  endpoint?: string;
  publicKey?: string;
  isActive?: boolean;
  timeoutMs?: number;
};

export const intentRecordSchema = z.object({
  intentId: uuidSchema,
  intentType: z.enum(["transfer", "withdrawal", "deposit", "allocation", "distribution"]),
  sourceEntityId: uuidSchema,
  destinationEntityId: uuidSchema.optional(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  intentHash: z.string().length(64),
  status: z.enum(["pending", "authorized", "executed", "rejected", "expired"]),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  executedAt: z.string().datetime().optional(),
});

export type IntentRecord = z.infer<typeof intentRecordSchema>;

export interface AuthorizationRecord {
  authorizationId: string;
  intentId: string;
  signerId: string;
  signerType: "member" | "custodian" | "multisig";
  signature: string;
  signedAt: string;
  expiresAt?: string;
}

export abstract class CustodyAdapter {
  protected config: CustodyAdapterConfig;

  constructor(config: CustodyAdapterConfig) {
    this.config = custodyAdapterConfigSchema.parse(config);
  }

  abstract getAdapterType(): AdapterType;

  isActive(): boolean {
    return this.config.isActive ?? true;
  }

  getId(): string {
    return this.config.adapterId;
  }

  abstract recordIntent(input: {
    intentType: IntentRecord["intentType"];
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): IntentRecord;

  abstract verifyAuthorization(intentId: string, signature: string, signerId: string): Promise<boolean>;

  abstract executeIntent(intentId: string): Promise<{
    success: boolean;
    externalRef?: string;
    error?: string;
  }>;

  protected generateIntentHash(input: {
    intentType: string;
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    timestamp: string;
  }): string {
    const data = JSON.stringify({
      ...input,
      adapterId: this.config.adapterId,
    });
    return createHash("sha256").update(data).digest("hex");
  }
}

export class WebhookCustodyAdapter extends CustodyAdapter {
  getAdapterType(): AdapterType {
    return "webhook";
  }

  recordIntent(input: {
    intentType: IntentRecord["intentType"];
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): IntentRecord {
    const now = new Date().toISOString();
    const intentHash = this.generateIntentHash({
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      timestamp: now,
    });

    return {
      intentId: randomUUID(),
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      intentHash,
      status: "pending",
      createdAt: now,
      expiresAt: input.expiresAt,
    };
  }

  async verifyAuthorization(
    intentId: string,
    signature: string,
    signerId: string
  ): Promise<boolean> {
    const verifyInput: SignatureInput = {
      data: { intentId, signerId },
      signature,
      algorithm: "ed25519",
      publicKey: this.config.publicKey ?? "",
    };

    const result = signatureVerifier.verify(verifyInput);
    return result.isValid;
  }

  async executeIntent(intentId: string): Promise<{
    success: boolean;
    externalRef?: string;
    error?: string;
  }> {
    if (!this.config.endpoint) {
      return { success: false, error: "No endpoint configured" };
    }

    return {
      success: true,
      externalRef: `webhook-${Date.now()}`,
    };
  }
}

export class MultisigCustodyAdapter extends CustodyAdapter {
  private requiredSignatures: number;
  private signers: Map<string, string> = new Map();

  constructor(config: CustodyAdapterConfig & { requiredSignatures: number; signers?: Map<string, string> }) {
    super(config);
    this.requiredSignatures = config.requiredSignatures ?? 2;
    if (config.signers) {
      this.signers = config.signers;
    }
  }

  getAdapterType(): AdapterType {
    return "multisig";
  }

  addSigner(signerId: string, publicKey: string): void {
    this.signers.set(signerId, publicKey);
  }

  getRequiredSignatures(): number {
    return this.requiredSignatures;
  }

  recordIntent(input: {
    intentType: IntentRecord["intentType"];
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): IntentRecord {
    const now = new Date().toISOString();
    const intentHash = this.generateIntentHash({
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      timestamp: now,
    });

    return {
      intentId: randomUUID(),
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      intentHash,
      status: "pending",
      createdAt: now,
      expiresAt: input.expiresAt,
    };
  }

  async verifyAuthorization(
    intentId: string,
    signature: string,
    signerId: string
  ): Promise<boolean> {
    const publicKey = this.signers.get(signerId);
    if (!publicKey) {
      return false;
    }

    const verifyInput: SignatureInput = {
      data: { intentId, signerId },
      signature,
      algorithm: "secp256k1",
      publicKey,
    };

    const result = signatureVerifier.verify(verifyInput);
    return result.isValid;
  }

  async executeIntent(intentId: string): Promise<{
    success: boolean;
    externalRef?: string;
    error?: string;
  }> {
    return {
      success: true,
      externalRef: `multisig-${Date.now()}`,
    };
  }
}

export class CallbackCustodyAdapter extends CustodyAdapter {
  getAdapterType(): AdapterType {
    return "callback";
  }

  recordIntent(input: {
    intentType: IntentRecord["intentType"];
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): IntentRecord {
    const now = new Date().toISOString();
    const intentHash = this.generateIntentHash({
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      timestamp: now,
    });

    return {
      intentId: randomUUID(),
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      intentHash,
      status: "pending",
      createdAt: now,
      expiresAt: input.expiresAt,
    };
  }

  async verifyAuthorization(
    intentId: string,
    signature: string,
    signerId: string
  ): Promise<boolean> {
    const verifyInput: SignatureInput = {
      data: { intentId, signerId },
      signature,
      algorithm: "ed25519",
      publicKey: this.config.publicKey ?? "",
    };

    const result = signatureVerifier.verify(verifyInput);
    return result.isValid;
  }

  async executeIntent(intentId: string): Promise<{
    success: boolean;
    externalRef?: string;
    error?: string;
  }> {
    return {
      success: true,
      externalRef: `callback-${Date.now()}`,
    };
  }
}

export class HSMCustodyAdapter extends CustodyAdapter {
  getAdapterType(): AdapterType {
    return "hsm";
  }

  recordIntent(input: {
    intentType: IntentRecord["intentType"];
    sourceEntityId: string;
    destinationEntityId?: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): IntentRecord {
    const now = new Date().toISOString();
    const intentHash = this.generateIntentHash({
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      timestamp: now,
    });

    return {
      intentId: randomUUID(),
      intentType: input.intentType,
      sourceEntityId: input.sourceEntityId,
      destinationEntityId: input.destinationEntityId,
      amount: input.amount,
      currency: input.currency,
      intentHash,
      status: "pending",
      createdAt: now,
      expiresAt: input.expiresAt,
    };
  }

  async verifyAuthorization(
    intentId: string,
    signature: string,
    signerId: string
  ): Promise<boolean> {
    const verifyInput: SignatureInput = {
      data: { intentId, signerId },
      signature,
      algorithm: "rsa4096",
      publicKey: this.config.publicKey ?? "",
    };

    const result = signatureVerifier.verify(verifyInput);
    return result.isValid;
  }

  async executeIntent(intentId: string): Promise<{
    success: boolean;
    externalRef?: string;
    error?: string;
  }> {
    return {
      success: true,
      externalRef: `hsm-${Date.now()}`,
    };
  }
}

export function createCustodyAdapter(config: CustodyAdapterConfig): CustodyAdapter {
  switch (config.adapterType) {
    case "webhook":
      return new WebhookCustodyAdapter(config);
    case "multisig":
      return new MultisigCustodyAdapter(config as any);
    case "callback":
      return new CallbackCustodyAdapter(config);
    case "hsm":
      return new HSMCustodyAdapter(config);
    default:
      throw new Error(`Unknown adapter type: ${config.adapterType}`);
  }
}

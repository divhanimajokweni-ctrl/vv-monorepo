/**
 * Ubuntu Pools — Data Sovereignty & Privacy Framework
 * Privacy as a fundamental human right
 */

import { randomUUID } from 'crypto';
import { z } from 'zod';

export const UserDataRightsSchema = z.object({
  userId: z.string().uuid(),
  rightToExport: z.boolean(),
  rightToDeletion: z.boolean(),
  rightToPortability: z.boolean(),
  rightToTransparency: z.boolean(),
  dataRetentionPolicy: z.enum(['indefinite', 'time_limited']),
  retentionPeriodDays: z.number().optional(),
});

export type UserDataRights = z.infer<typeof UserDataRightsSchema>;

export const ConsentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  purpose: z.enum(['core_service', 'analytics', 'personalization', 'third_party']),
  granted: z.boolean(),
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional(),
  version: z.string(),
});

export type Consent = z.infer<typeof ConsentSchema>;

export const DataProcessingRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  dataCategory: z.enum(['identity', 'financial', 'behavioral', 'governance', 'social']),
  processingPurpose: z.string(),
  legalBasis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
  recipients: z.array(z.string()),
  crossBorder: z.boolean(),
  retentionPeriod: z.string(),
  processedAt: z.string().datetime(),
});

export type DataProcessingRecord = z.infer<typeof DataProcessingRecordSchema>;

export interface ZeroKnowledgeProof {
  issuer: string;
  claim: string;
  proof: {
    zkProof: string;
    publicSignals: string[];
  };
  verificationKey: string;
}

export interface DataSovereigntyAudit {
  userId: string;
  actions: DataSovereigntyAction[];
}

export interface DataSovereigntyAction {
  action: 'export' | 'delete' | 'port' | 'view_processing';
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  details?: string;
}

export class DataSovereigntyService {
  private consentRegistry: Map<string, Consent> = new Map();
  private processingRecords: DataProcessingRecord[] = [];
  private auditLog: DataSovereigntyAction[] = [];

  registerConsent(consent: Omit<Consent, 'id'>): Consent {
    const fullConsent: Consent = {
      ...consent,
      id: randomUUID(),
    };
    this.consentRegistry.set(fullConsent.id, fullConsent);
    return fullConsent;
  }

  withdrawConsent(userId: string, purpose: string): boolean {
    for (const consent of this.consentRegistry.values()) {
      if (consent.userId === userId && consent.purpose === purpose) {
        const updated: Consent = {
          ...consent,
          granted: false,
          revokedAt: new Date().toISOString(),
        };
        this.consentRegistry.set(consent.id, updated);
        return true;
      }
    }
    return false;
  }

  hasConsent(userId: string, purpose: string): boolean {
    for (const consent of this.consentRegistry.values()) {
      if (consent.userId === userId && consent.purpose === purpose && consent.granted) {
        return true;
      }
    }
    return false;
  }

  getUserConsents(userId: string): Consent[] {
    return Array.from(this.consentRegistry.values()).filter(c => c.userId === userId);
  }

  recordProcessing(record: Omit<DataProcessingRecord, 'id'>): DataProcessingRecord {
    const fullRecord: DataProcessingRecord = {
      ...record,
      id: randomUUID(),
    };
    this.processingRecords.push(fullRecord);
    return fullRecord;
  }

  getProcessingRecords(userId: string): DataProcessingRecord[] {
    return this.processingRecords.filter(r => r.userId === userId);
  }

  exportUserData(userId: string): {
    consents: Consent[];
    processingRecords: DataProcessingRecord[];
    auditLog: DataSovereigntyAction[];
  } {
    const auditEntry: DataSovereigntyAction = {
      action: 'export',
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    this.auditLog.push(auditEntry);

    return {
      consents: this.getUserConsents(userId),
      processingRecords: this.getProcessingRecords(userId),
      auditLog: this.auditLog.filter(a => a.action === 'export'),
    };
  }

  deleteUserData(userId: string): { success: boolean; deletedAt: string } {
    const auditEntry: DataSovereigntyAction = {
      action: 'delete',
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    this.auditLog.push(auditEntry);

    for (const [id, consent] of this.consentRegistry) {
      if (consent.userId === userId) {
        this.consentRegistry.delete(id);
      }
    }

    this.processingRecords = this.processingRecords.filter(r => r.userId !== userId);

    return { success: true, deletedAt: new Date().toISOString() };
  }

  portUserData(userId: string): string {
    const data = this.exportUserData(userId);
    const auditEntry: DataSovereigntyAction = {
      action: 'port',
      timestamp: new Date().toISOString(),
      status: 'completed',
      details: 'Data exported for portability',
    };
    this.auditLog.push(auditEntry);

    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  generateZKProof(claim: string, userId: string): ZeroKnowledgeProof {
    return {
      issuer: 'ubuntu-pools',
      claim,
      proof: {
        zkProof: randomUUID(),
        publicSignals: [userId, Date.now().toString()],
      },
      verificationKey: 'vk_' + randomUUID(),
    };
  }
}

export const dataSovereigntyService = new DataSovereigntyService();

export function getUserDataRights(userId: string): UserDataRights {
  return {
    userId,
    rightToExport: true,
    rightToDeletion: true,
    rightToPortability: true,
    rightToTransparency: true,
    dataRetentionPolicy: 'time_limited',
    retentionPeriodDays: 365,
  };
}

export function canProcessData(userId: string, purpose: string): boolean {
  return dataSovereigntyService.hasConsent(userId, purpose);
}

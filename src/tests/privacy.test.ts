import { describe, it, expect } from 'vitest';
import {
  dataSovereigntyService,
  getUserDataRights,
  canProcessData,
} from '@ubuntu/sovereignty/sovereignty';

describe('Data Sovereignty Service', () => {
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';

  describe('registerConsent', () => {
    it('registers user consent for a purpose', () => {
      const consent = dataSovereigntyService.registerConsent({
        userId: testUserId,
        purpose: 'core_service',
        granted: true,
        grantedAt: new Date().toISOString(),
        version: '1.0',
      });

      expect(consent.id).toBeDefined();
      expect(consent.userId).toBe(testUserId);
      expect(consent.purpose).toBe('core_service');
      expect(consent.granted).toBe(true);
    });
  });

  describe('hasConsent', () => {
    it('returns true when consent exists and is granted', () => {
      dataSovereigntyService.registerConsent({
        userId: testUserId,
        purpose: 'analytics',
        granted: true,
        grantedAt: new Date().toISOString(),
        version: '1.0',
      });

      expect(canProcessData(testUserId, 'analytics')).toBe(true);
    });

    it('returns false when consent is revoked', () => {
      dataSovereigntyService.registerConsent({
        userId: testUserId,
        purpose: 'personalization',
        granted: true,
        grantedAt: new Date().toISOString(),
        version: '1.0',
      });

      dataSovereigntyService.withdrawConsent(testUserId, 'personalization');

      expect(canProcessData(testUserId, 'personalization')).toBe(false);
    });
  });

  describe('getUserDataRights', () => {
    it('returns all data rights', () => {
      const rights = getUserDataRights(testUserId);

      expect(rights.rightToExport).toBe(true);
      expect(rights.rightToDeletion).toBe(true);
      expect(rights.rightToPortability).toBe(true);
      expect(rights.rightToTransparency).toBe(true);
    });

    it('includes retention policy', () => {
      const rights = getUserDataRights(testUserId);

      expect(rights.dataRetentionPolicy).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    it('exports user data including consents and processing records', () => {
      const data = dataSovereigntyService.exportUserData(testUserId);

      expect(data).toHaveProperty('consents');
      expect(data).toHaveProperty('processingRecords');
      expect(data).toHaveProperty('auditLog');
    });
  });

  describe('deleteUserData', () => {
    it('deletes user data and returns success', () => {
      const result = dataSovereigntyService.deleteUserData(testUserId);

      expect(result.success).toBe(true);
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('portUserData', () => {
    it('returns base64 encoded data for portability', () => {
      const ported = dataSovereigntyService.portUserData(testUserId);

      expect(typeof ported).toBe('string');
      expect(ported.length).toBeGreaterThan(0);
      
      const decoded = Buffer.from(ported, 'base64').toString();
      expect(() => JSON.parse(decoded)).not.toThrow();
    });
  });

  describe('generateZKProof', () => {
    it('generates zero-knowledge proof structure', () => {
      const proof = dataSovereigntyService.generateZKProof('user has trust score > 50', testUserId);

      expect(proof.issuer).toBe('ubuntu-pools');
      expect(proof.claim).toBe('user has trust score > 50');
      expect(proof.proof).toHaveProperty('zkProof');
      expect(proof.proof).toHaveProperty('publicSignals');
      expect(proof.verificationKey).toBeDefined();
    });
  });
});

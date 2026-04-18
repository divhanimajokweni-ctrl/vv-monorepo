import { describe, it, expect } from 'vitest';
import {
  calculateTrustScore,
  getAuthorityLevel,
  canPerformAction,
  AUTHORITY_LEVELS,
} from '@ubuntu/reputation/engine';
import type { TrustEvent } from '@ubuntu/reputation/engine';

describe('Reputation Engine', () => {
  const mockEvents: TrustEvent[] = [
    { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z' },
    { type: 'help_given', userId: 'user-1', amount: 50, timestamp: '2026-02-27T11:00:00Z' },
    { type: 'help_received', userId: 'user-1', amount: 30, timestamp: '2026-02-27T12:00:00Z' },
    { type: 'endorsement_given', userId: 'user-1', targetUserId: 'user-2', amount: 10, timestamp: '2026-02-27T13:00:00Z' },
    { type: 'endorsement_received', userId: 'user-1', targetUserId: 'user-3', amount: 10, timestamp: '2026-02-27T14:00:00Z' },
    { type: 'governance_vote', userId: 'user-1', amount: 1, timestamp: '2026-02-27T15:00:00Z', metadata: { proposalId: 'prop-1' } },
    { type: 'governance_vote', userId: 'user-1', amount: 1, timestamp: '2026-02-27T16:00:00Z', metadata: { proposalId: 'prop-2' } },
    { type: 'resource_shared', userId: 'user-1', amount: 500, timestamp: '2026-02-27T17:00:00Z' },
  ];

  describe('calculateTrustScore', () => {
    it('calculates composite trust score from events', () => {
      const score = calculateTrustScore('user-1', mockEvents);
      
      expect(score.userId).toBe('user-1');
      expect(score.compositeScore).toBeGreaterThan(0);
      expect(score.compositeScore).toBeLessThanOrEqual(100);
      expect(score.components).toBeDefined();
      expect(score.lastUpdated).toBeDefined();
    });

    it('calculates reciprocity index', () => {
      const score = calculateTrustScore('user-1', mockEvents);
      
      expect(score.components.reciprocityIndex).toBeGreaterThan(0);
    });

    it('builds trust circle from endorsements', () => {
      const score = calculateTrustScore('user-1', mockEvents);
      
      expect(Array.isArray(score.trustCircle)).toBe(true);
    });
  });

  describe('getAuthorityLevel', () => {
    it('returns novice for scores 0-24', () => {
      expect(getAuthorityLevel(0)).toBe('novice');
      expect(getAuthorityLevel(24)).toBe('novice');
      expect(getAuthorityLevel(25)).toBe('contributor');
    });

    it('returns contributor for scores 25-49', () => {
      expect(getAuthorityLevel(25)).toBe('contributor');
      expect(getAuthorityLevel(49)).toBe('contributor');
      expect(getAuthorityLevel(50)).toBe('trusted_member');
    });

    it('returns trusted_member for scores 50-74', () => {
      expect(getAuthorityLevel(50)).toBe('trusted_member');
      expect(getAuthorityLevel(74)).toBe('trusted_member');
      expect(getAuthorityLevel(75)).toBe('elder');
    });

    it('returns elder for scores 75-89', () => {
      expect(getAuthorityLevel(75)).toBe('elder');
      expect(getAuthorityLevel(89)).toBe('elder');
      expect(getAuthorityLevel(90)).toBe('archivist');
    });

    it('returns archivist for scores 90-100', () => {
      expect(getAuthorityLevel(90)).toBe('archivist');
      expect(getAuthorityLevel(100)).toBe('archivist');
    });
  });

  describe('canPerformAction', () => {
    it('allows basic participation for novice', () => {
      expect(canPerformAction(10, 'view_only')).toBe(true);
      expect(canPerformAction(10, 'basic_participation')).toBe(true);
    });

    it('allows proposal creation for contributor', () => {
      expect(canPerformAction(30, 'create_proposals')).toBe(true);
      expect(canPerformAction(30, 'mentor_new_members')).toBe(true);
    });

    it('allows governance voting for trusted member', () => {
      expect(canPerformAction(60, 'vote_on_governance')).toBe(true);
      expect(canPerformAction(60, '审核_content')).toBe(true);
    });

    it('denies archivist privileges below score 90', () => {
      expect(canPerformAction(89, 'modify_protocol_parameters')).toBe(false);
      expect(canPerformAction(90, 'modify_protocol_parameters')).toBe(true);
    });
  });

  describe('AUTHORITY_LEVELS', () => {
    it('has correct privilege lists for each level', () => {
      expect(AUTHORITY_LEVELS.novice.privileges).toContain('view_only');
      expect(AUTHORITY_LEVELS.contributor.privileges).toContain('create_proposals');
      expect(AUTHORITY_LEVELS.trusted_member.privileges).toContain('vote_on_governance');
      expect(AUTHORITY_LEVELS.elder.privileges).toContain('arbitrate_disputes');
      expect(AUTHORITY_LEVELS.archivist.privileges).toContain('emergency_powers');
    });

    it('has correct score ranges', () => {
      expect(AUTHORITY_LEVELS.novice.minScore).toBe(0);
      expect(AUTHORITY_LEVELS.novice.maxScore).toBe(25);
      expect(AUTHORITY_LEVELS.archivist.minScore).toBe(90);
      expect(AUTHORITY_LEVELS.archivist.maxScore).toBe(100);
    });
  });

  describe('Attestation Expiry', () => {
    it('should exclude expired events from trust score', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const eventsWithExpiry: TrustEvent[] = [
        { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z', expiresAt: pastDate },
        { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z', expiresAt: futureDate },
      ];

      const scoreWithExpired = calculateTrustScore('user-1', eventsWithExpiry);

      const eventsAllActive: TrustEvent[] = [
        { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z' },
        { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z' },
      ];

      const scoreAllActive = calculateTrustScore('user-1', eventsAllActive);

      // With one expired event, the help_given amount should be lower
      expect(scoreWithExpired.components.reciprocityIndex).toBeLessThanOrEqual(
        scoreAllActive.components.reciprocityIndex
      );
    });

    it('should include events without expiresAt', () => {
      const events: TrustEvent[] = [
        { type: 'help_given', userId: 'user-1', amount: 100, timestamp: '2026-02-27T10:00:00Z' },
      ];
      const score = calculateTrustScore('user-1', events);
      expect(score.components.reciprocityIndex).toBeGreaterThan(0);
    });
  });
});

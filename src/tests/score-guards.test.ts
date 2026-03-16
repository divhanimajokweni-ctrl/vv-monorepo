import { describe, it, expect } from 'vitest';
import { isUniqueTx, detectCircularFlow, weightAttestation } from '@/lib/services/score-guards';

describe('Score Guards', () => {
  describe('isUniqueTx', () => {
    it('should flag duplicate transactions within 24h', () => {
      const tx = { fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T12:00:00Z' };
      const recent = [{ fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T10:00:00Z' }];
      expect(isUniqueTx(tx, recent)).toBe(false);
    });

    it('should allow unique transactions', () => {
      const tx = { fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T12:00:00Z' };
      const recent = [{ fromId: 'A', toId: 'C', amount: 100, timestamp: '2026-03-10T10:00:00Z' }];
      expect(isUniqueTx(tx, recent)).toBe(true);
    });

    it('should allow same-pair transactions with different amounts', () => {
      const tx = { fromId: 'A', toId: 'B', amount: 200, timestamp: '2026-03-10T12:00:00Z' };
      const recent = [{ fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T10:00:00Z' }];
      expect(isUniqueTx(tx, recent)).toBe(true);
    });
  });

  describe('detectCircularFlow', () => {
    it('should detect A→B→C→A circular flow', () => {
      const txs = [
        { fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T10:00:00Z' },
        { fromId: 'B', toId: 'C', amount: 100, timestamp: '2026-03-10T11:00:00Z' },
        { fromId: 'C', toId: 'A', amount: 100, timestamp: '2026-03-10T12:00:00Z' },
      ];
      const result = detectCircularFlow(txs);
      expect(result.hasCircular).toBe(true);
      expect(result.penalty).toBe(0.6);
    });

    it('should not flag linear flows', () => {
      const txs = [
        { fromId: 'A', toId: 'B', amount: 100, timestamp: '2026-03-10T10:00:00Z' },
        { fromId: 'B', toId: 'C', amount: 100, timestamp: '2026-03-10T11:00:00Z' },
      ];
      const result = detectCircularFlow(txs);
      expect(result.hasCircular).toBe(false);
      expect(result.penalty).toBe(1.0);
    });
  });

  describe('weightAttestation', () => {
    it('should weight by voter credibility', () => {
      const highVoter = weightAttestation({ rating: 5, voterScore: 80 });
      const lowVoter = weightAttestation({ rating: 5, voterScore: 5 });
      expect(highVoter).toBeGreaterThan(lowVoter);
    });

    it('should return 0 for voter score 0', () => {
      expect(weightAttestation({ rating: 5, voterScore: 0 })).toBe(0);
    });
  });
});

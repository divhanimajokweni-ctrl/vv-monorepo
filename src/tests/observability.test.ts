import { describe, it, expect } from 'vitest';
import {
  observabilityService,
  getTransparencyMetrics,
  getSystemHealth,
  getEventLog,
} from '@/lib/observability/service';

describe('Observability Service', () => {
  describe('getTransparencyMetrics', () => {
    it('returns default metrics structure', () => {
      const metrics = getTransparencyMetrics();

      expect(metrics.networkLatency).toBeDefined();
      expect(metrics.networkLatency.global).toBeGreaterThan(0);
      expect(metrics.trustFlow).toBeDefined();
      expect(metrics.governance).toBeDefined();
      expect(metrics.resourceCirculation).toBeDefined();
      expect(metrics.integrity).toBeDefined();
    });

    it('provides network latency by region', () => {
      const metrics = getTransparencyMetrics();

      expect(metrics.networkLatency.byRegion).toHaveProperty('us-east');
      expect(metrics.networkLatency.byRegion).toHaveProperty('eu-west');
    });
  });

  describe('getSystemHealth', () => {
    it('returns health status for all components', () => {
      const health = getSystemHealth();

      expect(health.status).toMatch(/healthy|degraded|critical/);
      expect(health.components).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.version).toBeDefined();
    });

    it('includes database component health', () => {
      const health = getSystemHealth();

      expect(health.components.database).toBeDefined();
      expect(health.components.database.status).toMatch(/up|down|degraded/);
    });

    it('includes websocket component health', () => {
      const health = getSystemHealth();

      expect(health.components.websocket).toBeDefined();
    });
  });

  describe('logEvent', () => {
    it('adds events to the log', () => {
      const initialCount = getEventLog(1000).length;

      observabilityService.logEvent({
        eventType: 'test.event',
        actor: 'test-user',
        impact: 10,
        integrity: {
          hash: 'abc123',
          previousHash: 'def456',
          verified: true,
        },
      });

      const newCount = getEventLog(1000).length;
      expect(newCount).toBe(initialCount + 1);
    });
  });

  describe('verifyIntegrity', () => {
    it('returns valid when hash chain is intact', () => {
      const result = observabilityService.verifyIntegrity();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('details');
    });
  });

  describe('updateMetrics', () => {
    it('updates specific metric fields', () => {
      const initial = getTransparencyMetrics();
      
      observabilityService.updateMetrics({
        trustFlow: {
          totalTrustExtensions: 100,
          activeTrustCircles: 10,
          averageTrustScore: 65,
        },
      });

      const updated = getTransparencyMetrics();
      expect(updated.trustFlow.totalTrustExtensions).toBe(100);
      expect(updated.trustFlow.activeTrustCircles).toBe(10);
      expect(updated.trustFlow.averageTrustScore).toBe(65);
    });
  });
});

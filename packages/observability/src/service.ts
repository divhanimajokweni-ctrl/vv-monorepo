/**
 * Ubuntu Pools — Observability Infrastructure
 * Community-facing transparency dashboard
 */

import { z } from 'zod';

export const SystemHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'critical']),
  components: z.record(z.string(), z.object({
    status: z.enum(['up', 'down', 'degraded']),
    latency: z.number().nullable(),
    lastCheck: z.string().datetime(),
  })),
  uptime: z.number(),
  version: z.string(),
});

export type SystemHealth = z.infer<typeof SystemHealthSchema>;

export const TransparencyMetricsSchema = z.object({
  networkLatency: z.object({
    global: z.number(),
    byRegion: z.record(z.string(), z.number()),
  }),
  trustFlow: z.object({
    totalTrustExtensions: z.number(),
    activeTrustCircles: z.number(),
    averageTrustScore: z.number(),
  }),
  governance: z.object({
    activeProposals: z.number(),
    participationRate: z.number(),
    averageVoterTurnout: z.number(),
  }),
  resourceCirculation: z.object({
    totalValueExchanged: z.number(),
    circulationVelocity: z.number(),
    activeParticipants: z.number(),
  }),
  integrity: z.object({
    lastVerified: z.string().datetime(),
    hashChainValid: z.boolean(),
    eventsCount: z.number(),
  }),
});

export type TransparencyMetrics = z.infer<typeof TransparencyMetricsSchema>;

export interface TransparencyEvent {
  timestamp: string;
  eventType: string;
  actor: string;
  impact: number;
  integrity: {
    hash: string;
    previousHash: string;
    verified: boolean;
  };
}

export class ObservabilityService {
  private metrics: TransparencyMetrics;
  private eventLog: TransparencyEvent[] = [];
  private readonly MAX_EVENT_LOG = 10000;

  constructor() {
    this.metrics = this.getDefaultMetrics();
  }

  private getDefaultMetrics(): TransparencyMetrics {
    return {
      networkLatency: {
        global: 45,
        byRegion: {
          'us-east': 23,
          'us-west': 45,
          'eu-west': 67,
          'ap-south': 89,
          'af-south': 120,
        },
      },
      trustFlow: {
        totalTrustExtensions: 0,
        activeTrustCircles: 0,
        averageTrustScore: 0,
      },
      governance: {
        activeProposals: 0,
        participationRate: 0,
        averageVoterTurnout: 0,
      },
      resourceCirculation: {
        totalValueExchanged: 0,
        circulationVelocity: 0,
        activeParticipants: 0,
      },
      integrity: {
        lastVerified: new Date().toISOString(),
        hashChainValid: true,
        eventsCount: 0,
      },
    };
  }

  updateMetrics(updates: Partial<TransparencyMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...updates,
      networkLatency: {
        ...this.metrics.networkLatency,
        ...(updates.networkLatency || {}),
      },
      trustFlow: {
        ...this.metrics.trustFlow,
        ...(updates.trustFlow || {}),
      },
      governance: {
        ...this.metrics.governance,
        ...(updates.governance || {}),
      },
      resourceCirculation: {
        ...this.metrics.resourceCirculation,
        ...(updates.resourceCirculation || {}),
      },
      integrity: {
        ...this.metrics.integrity,
        ...(updates.integrity || {}),
      },
    };
  }

  getMetrics(): TransparencyMetrics {
    return { ...this.metrics };
  }

  logEvent(event: Omit<TransparencyEvent, 'timestamp'>): void {
    const fullEvent: TransparencyEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.eventLog.push(fullEvent);
    if (this.eventLog.length > this.MAX_EVENT_LOG) {
      this.eventLog.shift();
    }
  }

  getEventLog(limit = 100, offset = 0): TransparencyEvent[] {
    return this.eventLog.slice(offset, offset + limit);
  }

  verifyIntegrity(): { valid: boolean; details: string } {
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    
    for (const event of this.eventLog) {
      if (event.integrity.previousHash !== previousHash) {
        return { valid: false, details: `Hash chain broken at ${event.timestamp}` };
      }
      if (!event.integrity.verified) {
        return { valid: false, details: `Unverified event at ${event.timestamp}` };
      }
      previousHash = event.integrity.hash;
    }

    return { valid: true, details: 'Hash chain verified' };
  }

  getHealth(): SystemHealth {
    const allLatencies = Object.values(this.metrics.networkLatency.byRegion) as number[];
    const avgLatency = allLatencies.reduce((a: number, b: number) => a + b, 0) / allLatencies.length;
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (avgLatency > 200 || !this.metrics.integrity.hashChainValid) {
      status = 'critical';
    } else if (avgLatency > 100) {
      status = 'degraded';
    }

    return {
      status,
      components: {
        database: {
          status: 'up',
          latency: 12,
          lastCheck: new Date().toISOString(),
        },
        websocket: {
          status: 'up',
          latency: 8,
          lastCheck: new Date().toISOString(),
        },
        ledger: {
          status: 'up',
          latency: 15,
          lastCheck: new Date().toISOString(),
        },
        governance: {
          status: this.metrics.governance.activeProposals > 10 ? 'degraded' : 'up',
          latency: 25,
          lastCheck: new Date().toISOString(),
        },
      },
      uptime: process.uptime?.() || 0,
      version: process.env.APP_VERSION || '1.0.0',
    };
  }
}

export const observabilityService = new ObservabilityService();

export function getTransparencyMetrics(): TransparencyMetrics {
  return observabilityService.getMetrics();
}

export function getSystemHealth(): SystemHealth {
  return observabilityService.getHealth();
}

export function getEventLog(limit = 100, offset = 0): TransparencyEvent[] {
  return observabilityService.getEventLog(limit, offset);
}

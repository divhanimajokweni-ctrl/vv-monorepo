/**
 * Ubuntu Pools — Observability Infrastructure
 * Community-facing transparency dashboard
 */
import { z } from 'zod';
export declare const SystemHealthSchema: z.ZodObject<{
    status: z.ZodEnum<{
        healthy: "healthy";
        degraded: "degraded";
        critical: "critical";
    }>;
    components: z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodEnum<{
            degraded: "degraded";
            up: "up";
            down: "down";
        }>;
        latency: z.ZodNullable<z.ZodNumber>;
        lastCheck: z.ZodString;
    }, z.core.$strip>>;
    uptime: z.ZodNumber;
    version: z.ZodString;
}, z.core.$strip>;
export type SystemHealth = z.infer<typeof SystemHealthSchema>;
export declare const TransparencyMetricsSchema: z.ZodObject<{
    networkLatency: z.ZodObject<{
        global: z.ZodNumber;
        byRegion: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, z.core.$strip>;
    trustFlow: z.ZodObject<{
        totalTrustExtensions: z.ZodNumber;
        activeTrustCircles: z.ZodNumber;
        averageTrustScore: z.ZodNumber;
    }, z.core.$strip>;
    governance: z.ZodObject<{
        activeProposals: z.ZodNumber;
        participationRate: z.ZodNumber;
        averageVoterTurnout: z.ZodNumber;
    }, z.core.$strip>;
    resourceCirculation: z.ZodObject<{
        totalValueExchanged: z.ZodNumber;
        circulationVelocity: z.ZodNumber;
        activeParticipants: z.ZodNumber;
    }, z.core.$strip>;
    integrity: z.ZodObject<{
        lastVerified: z.ZodString;
        hashChainValid: z.ZodBoolean;
        eventsCount: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
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
export declare class ObservabilityService {
    private metrics;
    private eventLog;
    private readonly MAX_EVENT_LOG;
    constructor();
    private getDefaultMetrics;
    updateMetrics(updates: Partial<TransparencyMetrics>): void;
    getMetrics(): TransparencyMetrics;
    logEvent(event: Omit<TransparencyEvent, 'timestamp'>): void;
    getEventLog(limit?: number, offset?: number): TransparencyEvent[];
    verifyIntegrity(): {
        valid: boolean;
        details: string;
    };
    getHealth(): SystemHealth;
}
export declare const observabilityService: ObservabilityService;
export declare function getTransparencyMetrics(): TransparencyMetrics;
export declare function getSystemHealth(): SystemHealth;
export declare function getEventLog(limit?: number, offset?: number): TransparencyEvent[];

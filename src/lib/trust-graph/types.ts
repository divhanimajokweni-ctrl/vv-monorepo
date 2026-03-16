/**
 * Ubuntu Pools — Global Trust Graph Types
 */

import { z } from "zod";

export const GraphNodeInputSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.enum(["user", "village", "business", "institution", "pool"]),
  label: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  accessLevel: z.enum(["public", "partners", "private"]).optional(),
  isVerified: z.boolean().optional(),
});

export type GraphNodeInput = z.infer<typeof GraphNodeInputSchema>;

export const GraphEdgeInputSchema = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  edgeType: z.enum(["transaction", "attestation", "collaboration", "investment", "loan", "membership"]),
  transactionValue: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type GraphEdgeInput = z.infer<typeof GraphEdgeInputSchema>;

export const TrustWeightInputSchema = z.object({
  transactionValue: z.number().min(0),
  reputationMultiplier: z.number().min(0),
  frequencyFactor: z.number().min(0),
});

export type TrustWeightInput = z.infer<typeof TrustWeightInputSchema>;

export const GraphQuerySchema = z.object({
  nodeId: z.string().uuid().optional(),
  entityType: z.enum(["user", "village", "business", "institution", "pool"]).optional(),
  minTrustScore: z.number().int().min(0).max(100).optional(),
  depth: z.number().int().min(1).max(5).optional(),
  accessLevel: z.enum(["public", "partners", "private"]).optional(),
});

export type GraphQuery = z.infer<typeof GraphQuerySchema>;

export interface TrustScoreComponents {
  composite: number;
  transactionTrust: number;
  communityTrust: number;
  collaborationTrust: number;
}

export interface TrustProfile {
  nodeId: string;
  entityId: string;
  entityType: string;
  label: string;
  trustScore: number;
  components?: TrustScoreComponents;
  edgeCount?: number;
  neighborCount?: number;
  isVerified: boolean;
}

export interface ClusterResult {
  clusterId: number;
  nodeIds: string[];
  size: number;
  avgTrustScore: number;
  dominantEdgeType: string;
}

export interface FraudFlag {
  nodeId: string;
  flagType: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  entityId: string;
  entityType: string;
  label: string;
  trustScore: number;
  pageRank: number;
  accessLevel: string;
  isVerified: boolean;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: string;
  weight: number;
  transactionValue: number;
  reputationMultiplier: number;
  frequencyFactor: number;
  interactionCount: number;
  metadata?: Record<string, unknown>;
}

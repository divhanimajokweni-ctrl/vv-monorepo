/**
 * Ubuntu Pools — Hierarchical Trust Graph (HTG)
 * 
 * Enables scaling to millions of users by organizing trust in nested layers:
 * Individual → Village → Federation → Global Network
 * 
 * Each layer aggregates trust from the layer below it.
 */

import { z } from "zod";

export const TrustLayerSchema = z.enum([
  "individual",
  "village",
  "federation",
  "global",
]);

export type TrustLayer = z.infer<typeof TrustLayerSchema>;

export const TrustNodeSchema = z.object({
  id: z.string().uuid(),
  layer: TrustLayerSchema,
  parentId: z.string().uuid().nullable(),
  trustScore: z.number().min(0).max(100),
  memberCount: z.number().int().min(0),
  governanceParticipation: z.number().min(0).max(1),
  defaultRate: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TrustNode = z.infer<typeof TrustNodeSchema>;

export interface TrustAggregation {
  layer: TrustLayer;
  nodeId: string;
  aggregatedScore: number;
  confidence: number;
  childCount: number;
}

export interface VillageTrustMetrics {
  villageId: string;
  averageMemberScore: number;
  governanceParticipation: number;
  defaultRateFactor: number;
  collectiveTrustScore: number;
}

export interface FederationTrustMetrics {
  federationId: string;
  villages: VillageTrustMetrics[];
  weightedAverageScore: number;
  totalMembers: number;
  federationTrustScore: number;
}

export interface GlobalTrustMetrics {
  federations: FederationTrustMetrics[];
  globalTrustScore: number;
  totalMembers: number;
}

export function calculateVillageTrust(
  memberScores: number[],
  governanceParticipation: number,
  defaultRate: number
): number {
  if (memberScores.length === 0) return 0;

  const average = memberScores.reduce((a, b) => a + b, 0) / memberScores.length;
  
  const governanceMultiplier = 1 + (governanceParticipation * 0.1);
  const defaultPenalty = 1 - (defaultRate * 0.2);
  
  return Math.min(100, average * governanceMultiplier * defaultPenalty);
}

export function calculateFederationTrust(
  villageScores: { score: number; memberCount: number }[]
): { weightedAverage: number; totalMembers: number } {
  if (villageScores.length === 0) {
    return { weightedAverage: 0, totalMembers: 0 };
  }

  const totalWeight = villageScores.reduce((sum, v) => sum + v.memberCount, 0);
  const weightedSum = villageScores.reduce(
    (sum, v) => sum + v.score * v.memberCount,
    0
  );

  return {
    weightedAverage: totalWeight > 0 ? weightedSum / totalWeight : 0,
    totalMembers: totalWeight,
  };
}

export function aggregateTrustAtLayer(
  childScores: { id: string; score: number; memberCount: number }[]
): TrustAggregation {
  if (childScores.length === 0) {
    return {
      layer: "village",
      nodeId: "",
      aggregatedScore: 0,
      confidence: 0,
      childCount: 0,
    };
  }

  const totalWeight = childScores.reduce((sum, c) => sum + c.memberCount, 0);
  const weightedSum = childScores.reduce(
    (sum, c) => sum + c.score * c.memberCount,
    0
  );

  const aggregatedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const confidence = Math.min(1, childScores.length / 10);

  return {
    layer: "village",
    nodeId: "",
    aggregatedScore,
    confidence,
    childCount: childScores.length,
  };
}

export function calculateCreditRiskEnhancement(
  individualScore: number,
  villageTrustScore: number,
  villageDefaultRate: number
): number {
  const villageReliability = 1 - villageDefaultRate;
  const combinedScore = (individualScore * 0.7) + (villageTrustScore * 0.3 * villageReliability);
  
  return Math.min(100, Math.max(0, combinedScore));
}

export function detectFraudRing(
  nodeIds: string[],
  interconnections: number,
  averageTrustScore: number
): { isSuspicious: boolean; riskLevel: "low" | "medium" | "high" | "critical" } {
  const density = interconnections / Math.max(1, (nodeIds.length * (nodeIds.length - 1)) / 2);
  
  if (density > 0.8 && averageTrustScore < 30) {
    return { isSuspicious: true, riskLevel: "critical" };
  }
  if (density > 0.6 && averageTrustScore < 40) {
    return { isSuspicious: true, riskLevel: "high" };
  }
  if (density > 0.4 && averageTrustScore < 50) {
    return { isSuspicious: true, riskLevel: "medium" };
  }
  
  return { isSuspicious: false, riskLevel: "low" };
}

export class HierarchicalTrustGraph {
  private nodes: Map<string, TrustNode> = new Map();
  private children: Map<string, string[]> = new Map();

  addNode(node: TrustNode): void {
    this.nodes.set(node.id, node);
    
    if (node.parentId) {
      const siblings = this.children.get(node.parentId) || [];
      siblings.push(node.id);
      this.children.set(node.parentId, siblings);
    }
  }

  getNode(id: string): TrustNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(parentId: string): TrustNode[] {
    const childIds = this.children.get(parentId) || [];
    return childIds.map(id => this.nodes.get(id)).filter(Boolean) as TrustNode[];
  }

  getAncestors(nodeId: string): TrustNode[] {
    const ancestors: TrustNode[] = [];
    let current = this.nodes.get(nodeId);
    
    while (current?.parentId) {
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return ancestors;
  }

  propagateTrustUp(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    if (node.layer === "individual") {
      return node.trustScore;
    }

    const childNodes = this.getChildren(nodeId);
    if (childNodes.length === 0) return node.trustScore;

    const childScores = childNodes.map(child => ({
      id: child.id,
      score: this.propagateTrustUp(child.id),
      memberCount: child.memberCount,
    }));

    const { weightedAverage } = calculateFederationTrust(
      childScores.map(c => ({ score: c.score, memberCount: c.memberCount }))
    );

    return weightedAverage;
  }

  findTrustPath(fromId: string, toId: string): TrustNode[] | null {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    if (!fromNode || !toNode) return null;

    if (fromNode.layer === toNode.layer) {
      const lca = this.findLowestCommonAncestor(fromId, toId);
      if (lca) {
        return [fromNode, lca, toNode].filter(Boolean) as TrustNode[];
      }
    }

    const fromAncestors = [fromNode, ...this.getAncestors(fromId)];
    const toAncestors = [toNode, ...this.getAncestors(toId)];

    for (const ancestor of fromAncestors) {
      const common = toAncestors.find(a => a.id === ancestor.id);
      if (common) {
        const pathIndex = fromAncestors.indexOf(ancestor);
        return [...fromAncestors.slice(0, pathIndex + 1), common, toNode];
      }
    }

    return null;
  }

  private findLowestCommonAncestor(id1: string, id2: string): TrustNode | null {
    const ancestors1 = new Set([id1, ...this.getAncestors(id1).map(n => n.id)]);
    const ancestors2 = this.getAncestors(id2);

    for (const ancestor of ancestors2) {
      if (ancestors1.has(ancestor.id)) {
        return this.nodes.get(ancestor.id) || null;
      }
    }

    return null;
  }

  getLayerStatistics(layer: TrustLayer): {
    count: number;
    avgTrustScore: number;
    totalMembers: number;
  } {
    const layerNodes = Array.from(this.nodes.values()).filter(n => n.layer === layer);
    
    if (layerNodes.length === 0) {
      return { count: 0, avgTrustScore: 0, totalMembers: 0 };
    }

    const avgTrustScore = layerNodes.reduce((sum, n) => sum + n.trustScore, 0) / layerNodes.length;
    const totalMembers = layerNodes.reduce((sum, n) => sum + n.memberCount, 0);

    return { count: layerNodes.length, avgTrustScore, totalMembers };
  }
}

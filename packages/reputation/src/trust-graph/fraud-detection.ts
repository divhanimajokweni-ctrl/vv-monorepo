/**
 * Ubuntu Pools — Trust Graph Fraud Detection
 * Detects gaming patterns in the trust graph
 */

import type { GraphNode, GraphEdge, FraudFlag } from "./types";

/**
 * Detect circular transaction patterns using DFS cycle detection.
 */
export function detectCircularTransactions(edges: GraphEdge[]): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const graph = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (edge.edgeType === "transaction" || edge.edgeType === "loan") {
      if (!graph.has(edge.sourceNodeId)) graph.set(edge.sourceNodeId, new Set());
      graph.get(edge.sourceNodeId)!.add(edge.targetNodeId);
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycleNodes = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = graph.get(node);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (inStack.has(neighbor)) {
          cycleNodes.add(node);
          cycleNodes.add(neighbor);
          return true;
        }
        if (!visited.has(neighbor) && dfs(neighbor)) {
          cycleNodes.add(node);
          return true;
        }
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node);
  }

  for (const nodeId of cycleNodes) {
    flags.push({
      nodeId,
      flagType: "circular_transaction",
      severity: "high",
      evidence: { detectedIn: "circular_transaction_scan" },
    });
  }

  return flags;
}

/**
 * Detect reputation boosting clusters — mutual attestation cliques
 * exceeding 3× the global average attestation weight.
 */
export function detectReputationBoostingClusters(
  nodes: GraphNode[],
  edges: GraphEdge[]
): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const attestationEdges = edges.filter((e) => e.edgeType === "attestation");
  if (attestationEdges.length === 0) return flags;

  const globalAvgWeight =
    attestationEdges.reduce((sum, e) => sum + e.weight, 0) / attestationEdges.length;
  const threshold = globalAvgWeight * 3;

  // Build mutual attestation map
  const mutual = new Map<string, Map<string, number>>();
  for (const edge of attestationEdges) {
    if (!mutual.has(edge.sourceNodeId)) mutual.set(edge.sourceNodeId, new Map());
    mutual.get(edge.sourceNodeId)!.set(edge.targetNodeId, edge.weight);
  }

  const flaggedNodes = new Set<string>();
  for (const [src, targets] of mutual) {
    for (const [tgt, weight] of targets) {
      const reverseWeight = mutual.get(tgt)?.get(src);
      if (reverseWeight !== undefined) {
        const avgMutual = (weight + reverseWeight) / 2;
        if (avgMutual > threshold) {
          flaggedNodes.add(src);
          flaggedNodes.add(tgt);
        }
      }
    }
  }

  for (const nodeId of flaggedNodes) {
    flags.push({
      nodeId,
      flagType: "reputation_boosting",
      severity: "medium",
      evidence: { threshold, globalAvgWeight },
    });
  }

  return flags;
}

/**
 * Detect sybil nodes — unique_counterparties / total_edges < 0.3
 */
export function detectSybilNodes(
  nodes: GraphNode[],
  edges: GraphEdge[]
): FraudFlag[] {
  const flags: FraudFlag[] = [];

  const nodeEdges = new Map<string, { total: number; counterparties: Set<string> }>();
  for (const node of nodes) {
    nodeEdges.set(node.id, { total: 0, counterparties: new Set() });
  }

  for (const edge of edges) {
    const src = nodeEdges.get(edge.sourceNodeId);
    if (src) {
      src.total++;
      src.counterparties.add(edge.targetNodeId);
    }
    const tgt = nodeEdges.get(edge.targetNodeId);
    if (tgt) {
      tgt.total++;
      tgt.counterparties.add(edge.sourceNodeId);
    }
  }

  for (const [nodeId, data] of nodeEdges) {
    if (data.total >= 3) {
      const ratio = data.counterparties.size / data.total;
      if (ratio < 0.3) {
        flags.push({
          nodeId,
          flagType: "sybil_suspect",
          severity: "high",
          evidence: { ratio, totalEdges: data.total, uniqueCounterparties: data.counterparties.size },
        });
      }
    }
  }

  return flags;
}

/**
 * Detect velocity anomalies — interaction spike > 5× rolling average.
 */
export function detectVelocityAnomalies(
  edges: GraphEdge[],
  windowMs: number
): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const now = Date.now();

  // Count interactions per node in recent window vs overall
  const recentCounts = new Map<string, number>();
  const totalCounts = new Map<string, number>();

  for (const edge of edges) {
    const lastTime = edge.metadata?.lastInteractionTime as number | undefined;
    const count = edge.interactionCount;

    for (const nodeId of [edge.sourceNodeId, edge.targetNodeId]) {
      totalCounts.set(nodeId, (totalCounts.get(nodeId) ?? 0) + count);
      if (lastTime && now - lastTime < windowMs) {
        recentCounts.set(nodeId, (recentCounts.get(nodeId) ?? 0) + count);
      }
    }
  }

  for (const [nodeId, recentCount] of recentCounts) {
    const totalCount = totalCounts.get(nodeId) ?? 0;
    const avgRate = totalCount > recentCount ? (totalCount - recentCount) : 1;
    if (recentCount > avgRate * 5) {
      flags.push({
        nodeId,
        flagType: "velocity_anomaly",
        severity: "medium",
        evidence: { recentCount, avgRate, multiplier: recentCount / avgRate },
      });
    }
  }

  return flags;
}

const SEVERITY_PENALTIES: Record<string, number> = {
  low: 0.9,
  medium: 0.7,
  high: 0.4,
  critical: 0.1,
};

/**
 * Apply fraud penalties to trust scores.
 * Returns adjusted scores map.
 */
export function applyFraudPenalties(
  scores: Map<string, number>,
  flags: FraudFlag[]
): Map<string, number> {
  const adjusted = new Map(scores);

  for (const flag of flags) {
    const current = adjusted.get(flag.nodeId);
    if (current !== undefined) {
      const penalty = SEVERITY_PENALTIES[flag.severity] ?? 1;
      adjusted.set(flag.nodeId, Math.round(current * penalty));
    }
  }

  return adjusted;
}

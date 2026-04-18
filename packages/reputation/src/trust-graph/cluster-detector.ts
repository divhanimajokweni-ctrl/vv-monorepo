/**
 * Ubuntu Pools — Trust Graph Cluster Detection
 * Label propagation algorithm for community detection
 */

import type { GraphNode, GraphEdge, ClusterResult } from "./types";

/**
 * Detect natural clusters using label propagation.
 * No external dependencies required.
 */
export function detectClusters(
  nodes: GraphNode[],
  edges: GraphEdge[]
): ClusterResult[] {
  if (nodes.length === 0) return [];

  // Initialize: each node gets its own label
  const labels = new Map<string, number>();
  nodes.forEach((node, i) => labels.set(node.id, i));

  // Build adjacency with weights
  const neighbors = new Map<string, Array<{ nodeId: string; weight: number; edgeType: string }>>();
  for (const node of nodes) {
    neighbors.set(node.id, []);
  }
  for (const edge of edges) {
    neighbors.get(edge.sourceNodeId)?.push({
      nodeId: edge.targetNodeId,
      weight: edge.weight,
      edgeType: edge.edgeType,
    });
    neighbors.get(edge.targetNodeId)?.push({
      nodeId: edge.sourceNodeId,
      weight: edge.weight,
      edgeType: edge.edgeType,
    });
  }

  // Iterate label propagation
  const maxIterations = 50;
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    for (const node of nodes) {
      const nodeNeighbors = neighbors.get(node.id) ?? [];
      if (nodeNeighbors.length === 0) continue;

      // Weighted vote for labels
      const labelWeights = new Map<number, number>();
      for (const n of nodeNeighbors) {
        const label = labels.get(n.nodeId)!;
        labelWeights.set(label, (labelWeights.get(label) ?? 0) + n.weight);
      }

      // Pick label with highest weight
      let bestLabel = labels.get(node.id)!;
      let bestWeight = -1;
      for (const [label, weight] of labelWeights) {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestLabel = label;
        }
      }

      if (bestLabel !== labels.get(node.id)) {
        labels.set(node.id, bestLabel);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Group nodes by label
  const clusters = new Map<number, string[]>();
  for (const [nodeId, label] of labels) {
    if (!clusters.has(label)) clusters.set(label, []);
    clusters.get(label)!.push(nodeId);
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const results: ClusterResult[] = [];
  let clusterId = 0;
  for (const [, nodeIds] of clusters) {
    if (nodeIds.length < 2) continue;

    const avgTrustScore =
      nodeIds.reduce((sum, id) => sum + (nodeMap.get(id)?.trustScore ?? 0), 0) / nodeIds.length;

    // Find dominant edge type within cluster
    const edgeTypeCounts = new Map<string, number>();
    const clusterSet = new Set(nodeIds);
    for (const edge of edges) {
      if (clusterSet.has(edge.sourceNodeId) && clusterSet.has(edge.targetNodeId)) {
        edgeTypeCounts.set(edge.edgeType, (edgeTypeCounts.get(edge.edgeType) ?? 0) + 1);
      }
    }
    let dominantEdgeType = "transaction";
    let maxCount = 0;
    for (const [type, count] of edgeTypeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantEdgeType = type;
      }
    }

    results.push({
      clusterId: clusterId++,
      nodeIds,
      size: nodeIds.length,
      avgTrustScore: Math.round(avgTrustScore),
      dominantEdgeType,
    });
  }

  return results;
}

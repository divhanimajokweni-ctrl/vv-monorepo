/**
 * Ubuntu Pools — Trust Graph PageRank
 * In-memory PageRank computation on adjacency list
 */

import type { GraphNode, GraphEdge } from "./types";

export interface PageRankOptions {
  dampingFactor?: number;
  iterations?: number;
  tolerance?: number;
}

/**
 * Compute PageRank for all nodes in the graph.
 * Returns a map of nodeId → rank.
 */
export function computePageRank(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: PageRankOptions = {}
): Map<string, number> {
  const { dampingFactor = 0.85, iterations = 100, tolerance = 1e-6 } = options;

  const nodeIds = nodes.map((n) => n.id);
  const n = nodeIds.length;
  if (n === 0) return new Map();

  // Build adjacency: outgoing edges per node
  const outEdges = new Map<string, string[]>();
  for (const id of nodeIds) {
    outEdges.set(id, []);
  }
  for (const edge of edges) {
    const out = outEdges.get(edge.sourceNodeId);
    if (out) out.push(edge.targetNodeId);
  }

  // Initialize ranks uniformly
  let ranks = new Map<string, number>();
  const initial = 1 / n;
  for (const id of nodeIds) {
    ranks.set(id, initial);
  }

  const base = (1 - dampingFactor) / n;

  for (let iter = 0; iter < iterations; iter++) {
    const newRanks = new Map<string, number>();
    for (const id of nodeIds) {
      newRanks.set(id, 0);
    }

    // Distribute rank
    for (const id of nodeIds) {
      const out = outEdges.get(id)!;
      const rank = ranks.get(id)!;
      if (out.length > 0) {
        const share = rank / out.length;
        for (const target of out) {
          if (newRanks.has(target)) {
            newRanks.set(target, newRanks.get(target)! + share);
          }
        }
      } else {
        // Dangling node: distribute evenly
        const share = rank / n;
        for (const target of nodeIds) {
          newRanks.set(target, newRanks.get(target)! + share);
        }
      }
    }

    // Apply damping
    for (const id of nodeIds) {
      newRanks.set(id, base + dampingFactor * newRanks.get(id)!);
    }

    // Check convergence
    let maxDiff = 0;
    for (const id of nodeIds) {
      maxDiff = Math.max(maxDiff, Math.abs(newRanks.get(id)! - ranks.get(id)!));
    }

    ranks = newRanks;
    if (maxDiff < tolerance) break;
  }

  return ranks;
}

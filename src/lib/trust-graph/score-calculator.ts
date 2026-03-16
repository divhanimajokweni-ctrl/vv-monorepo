/**
 * Ubuntu Pools — Trust Graph Score Calculator
 * Computes composite trust scores from graph edges
 */

import type { GraphNode, GraphEdge, TrustScoreComponents } from "./types";

const TRANSACTION_WEIGHT = 0.5;
const COMMUNITY_WEIGHT = 0.3;
const COLLABORATION_WEIGHT = 0.2;

const TRANSACTION_EDGE_TYPES = new Set(["transaction", "loan"]);
const COMMUNITY_EDGE_TYPES = new Set(["attestation", "membership"]);
const COLLABORATION_EDGE_TYPES = new Set(["collaboration", "investment"]);

function sumWeightsForTypes(
  nodeId: string,
  edges: GraphEdge[],
  edgeTypes: Set<string>
): number {
  let totalWeight = 0;
  let count = 0;
  for (const edge of edges) {
    if (
      (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) &&
      edgeTypes.has(edge.edgeType)
    ) {
      totalWeight += edge.weight;
      count++;
    }
  }
  if (count === 0) return 0;
  // Normalize to 0-100 range: average weight capped at 100
  return Math.min((totalWeight / count) * 10, 100);
}

/**
 * Calculate composite graph trust score for a node.
 * Weights: 0.5 × TransactionTrust + 0.3 × CommunityTrust + 0.2 × CollaborationTrust
 */
export function calculateGraphTrustScore(
  nodeId: string,
  edges: GraphEdge[],
  _nodes: GraphNode[]
): TrustScoreComponents {
  const transactionTrust = sumWeightsForTypes(nodeId, edges, TRANSACTION_EDGE_TYPES);
  const communityTrust = sumWeightsForTypes(nodeId, edges, COMMUNITY_EDGE_TYPES);
  const collaborationTrust = sumWeightsForTypes(nodeId, edges, COLLABORATION_EDGE_TYPES);

  const composite = Math.min(
    Math.round(
      TRANSACTION_WEIGHT * transactionTrust +
      COMMUNITY_WEIGHT * communityTrust +
      COLLABORATION_WEIGHT * collaborationTrust
    ),
    100
  );

  return { composite, transactionTrust, communityTrust, collaborationTrust };
}

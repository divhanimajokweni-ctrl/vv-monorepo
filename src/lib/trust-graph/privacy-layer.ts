/**
 * Ubuntu Pools — Trust Graph Privacy Layer
 * Access-level filtering and trust profile generation
 */

import type { GraphNode, GraphEdge, TrustProfile } from "./types";
import type { TrustGraphEngine } from "./graph-engine";

type AccessLevel = "public" | "partners" | "private";

const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  public: 0,
  partners: 1,
  private: 2,
};

/**
 * Filter nodes and edges by requestor's access level.
 * Strips data above the requestor's access level.
 */
export function filterByAccessLevel(
  requestorLevel: AccessLevel,
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const requestorRank = ACCESS_HIERARCHY[requestorLevel];

  const filteredNodes = nodes.filter((node) => {
    const nodeRank = ACCESS_HIERARCHY[node.accessLevel as AccessLevel] ?? 0;
    return nodeRank <= requestorRank;
  });

  const nodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = edges.filter(
    (e) => nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Generate a trust profile at the specified access level.
 * - public: composite score only
 * - partners: component scores + edge counts
 * - private: full detail
 */
export function generateTrustProfile(
  node: GraphNode,
  accessLevel: AccessLevel,
  edges: GraphEdge[],
  components?: { composite: number; transactionTrust: number; communityTrust: number; collaborationTrust: number }
): TrustProfile {
  const nodeEdges = edges.filter(
    (e) => e.sourceNodeId === node.id || e.targetNodeId === node.id
  );

  const neighborIds = new Set<string>();
  for (const e of nodeEdges) {
    if (e.sourceNodeId !== node.id) neighborIds.add(e.sourceNodeId);
    if (e.targetNodeId !== node.id) neighborIds.add(e.targetNodeId);
  }

  const profile: TrustProfile = {
    nodeId: node.id,
    entityId: node.entityId,
    entityType: node.entityType,
    label: node.label,
    trustScore: node.trustScore,
    isVerified: node.isVerified,
  };

  if (accessLevel === "partners" || accessLevel === "private") {
    profile.components = components;
    profile.edgeCount = nodeEdges.length;
    profile.neighborCount = neighborIds.size;
  }

  return profile;
}

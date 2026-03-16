/**
 * Ubuntu Pools — Trust Graph Engine
 * Central orchestrator tying together all graph operations
 */

import type { GraphNode, GraphEdge, GraphNodeInput, GraphEdgeInput, FraudFlag, TrustScoreComponents } from "./types";
import { calculateEdgeWeight, calculateFrequencyFactor, calculateReputationMultiplier } from "./weight-calculator";
import { calculateGraphTrustScore } from "./score-calculator";
import { computePageRank } from "./pagerank";
import {
  detectCircularTransactions,
  detectReputationBoostingClusters,
  detectSybilNodes,
  detectVelocityAnomalies,
  applyFraudPenalties,
} from "./fraud-detection";

/**
 * In-memory trust graph engine.
 * In production, this would be backed by the database tables.
 */
export class TrustGraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private entityIndex: Map<string, string> = new Map(); // "entityId:entityType" -> nodeId
  private edgeIndex: Map<string, string> = new Map(); // "src:tgt:type" -> edgeId
  private nextId = 1;

  private genId(): string {
    return `node-${this.nextId++}`;
  }

  upsertNode(input: GraphNodeInput): GraphNode {
    const key = `${input.entityId}:${input.entityType}`;
    const existingId = this.entityIndex.get(key);

    if (existingId) {
      const existing = this.nodes.get(existingId)!;
      const updated: GraphNode = {
        ...existing,
        label: input.label,
        metadata: input.metadata ?? existing.metadata,
        accessLevel: input.accessLevel ?? existing.accessLevel,
        isVerified: input.isVerified ?? existing.isVerified,
      };
      this.nodes.set(existingId, updated);
      return updated;
    }

    const node: GraphNode = {
      id: this.genId(),
      entityId: input.entityId,
      entityType: input.entityType,
      label: input.label,
      trustScore: 0,
      pageRank: 0,
      accessLevel: input.accessLevel ?? "public",
      isVerified: input.isVerified ?? false,
      metadata: input.metadata,
    };
    this.nodes.set(node.id, node);
    this.entityIndex.set(key, node.id);
    return node;
  }

  upsertEdge(input: GraphEdgeInput): GraphEdge {
    const edgeKey = `${input.sourceNodeId}:${input.targetNodeId}:${input.edgeType}`;
    const existingId = this.edgeIndex.get(edgeKey);

    if (existingId) {
      const existing = this.edges.get(existingId)!;
      const sourceNode = this.nodes.get(input.sourceNodeId);
      const interactionCount = existing.interactionCount + 1;
      const frequencyFactor = calculateFrequencyFactor(interactionCount);
      const reputationMultiplier = calculateReputationMultiplier(sourceNode?.trustScore ?? 0);
      const transactionValue = input.transactionValue ?? existing.transactionValue;
      const weight = calculateEdgeWeight({ transactionValue, reputationMultiplier, frequencyFactor });

      const updated: GraphEdge = {
        ...existing,
        interactionCount,
        frequencyFactor,
        reputationMultiplier,
        transactionValue,
        weight,
        metadata: input.metadata ?? existing.metadata,
      };
      this.edges.set(existingId, updated);
      return updated;
    }

    const sourceNode = this.nodes.get(input.sourceNodeId);
    const frequencyFactor = calculateFrequencyFactor(1);
    const reputationMultiplier = calculateReputationMultiplier(sourceNode?.trustScore ?? 0);
    const transactionValue = input.transactionValue ?? 0;
    const weight = calculateEdgeWeight({ transactionValue, reputationMultiplier, frequencyFactor });

    const edge: GraphEdge = {
      id: this.genId(),
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      edgeType: input.edgeType,
      weight,
      transactionValue,
      reputationMultiplier,
      frequencyFactor,
      interactionCount: 1,
      metadata: input.metadata,
    };
    this.edges.set(edge.id, edge);
    this.edgeIndex.set(edgeKey, edge.id);
    return edge;
  }

  removeEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    const edgeKey = `${edge.sourceNodeId}:${edge.targetNodeId}:${edge.edgeType}`;
    this.edgeIndex.delete(edgeKey);
    this.edges.delete(edgeId);
    return true;
  }

  getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  getNodeByEntity(entityId: string, entityType: string): GraphNode | undefined {
    const key = `${entityId}:${entityType}`;
    const nodeId = this.entityIndex.get(key);
    return nodeId ? this.nodes.get(nodeId) : undefined;
  }

  getEdgesBetween(nodeA: string, nodeB: string): GraphEdge[] {
    return this.getAllEdges().filter(
      (e) =>
        (e.sourceNodeId === nodeA && e.targetNodeId === nodeB) ||
        (e.sourceNodeId === nodeB && e.targetNodeId === nodeA)
    );
  }

  getNeighbors(nodeId: string, depth: number = 1, _accessLevel?: string): GraphNode[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }];
    visited.add(nodeId);

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      if (d >= depth) continue;

      for (const edge of this.getAllEdges()) {
        let neighbor: string | null = null;
        if (edge.sourceNodeId === id) neighbor = edge.targetNodeId;
        else if (edge.targetNodeId === id) neighbor = edge.sourceNodeId;

        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, d: d + 1 });
        }
      }
    }

    visited.delete(nodeId);
    return Array.from(visited)
      .map((id) => this.nodes.get(id))
      .filter((n): n is GraphNode => n !== undefined);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  recalculateScores(): Map<string, TrustScoreComponents> {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();

    // PageRank
    const pageRanks = computePageRank(nodes, edges);
    for (const [nodeId, rank] of pageRanks) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.pageRank = rank;
      }
    }

    // Graph trust scores
    const scoreMap = new Map<string, TrustScoreComponents>();
    for (const node of nodes) {
      const components = calculateGraphTrustScore(node.id, edges, nodes);
      node.trustScore = components.composite;
      this.nodes.set(node.id, node);
      scoreMap.set(node.id, components);
    }

    return scoreMap;
  }

  runFraudDetection(): FraudFlag[] {
    const nodes = this.getAllNodes();
    const edges = this.getAllEdges();

    const flags: FraudFlag[] = [
      ...detectCircularTransactions(edges),
      ...detectReputationBoostingClusters(nodes, edges),
      ...detectSybilNodes(nodes, edges),
      ...detectVelocityAnomalies(edges, 24 * 60 * 60 * 1000),
    ];

    // Apply penalties
    if (flags.length > 0) {
      const scores = new Map<string, number>();
      for (const node of nodes) {
        scores.set(node.id, node.trustScore);
      }
      const adjusted = applyFraudPenalties(scores, flags);
      for (const [nodeId, score] of adjusted) {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.trustScore = score;
          this.nodes.set(nodeId, node);
        }
      }
    }

    return flags;
  }
}

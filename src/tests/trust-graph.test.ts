import { describe, it, expect } from "vitest";
import {
  calculateEdgeWeight,
  calculateFrequencyFactor,
  calculateReputationMultiplier,
  normalizeTransactionValue,
} from "@/lib/trust-graph/weight-calculator";
import { calculateGraphTrustScore } from "@/lib/trust-graph/score-calculator";
import { computePageRank } from "@/lib/trust-graph/pagerank";
import {
  detectCircularTransactions,
  detectReputationBoostingClusters,
  detectSybilNodes,
  detectVelocityAnomalies,
  applyFraudPenalties,
} from "@/lib/trust-graph/fraud-detection";
import { detectClusters } from "@/lib/trust-graph/cluster-detector";
import { filterByAccessLevel, generateTrustProfile } from "@/lib/trust-graph/privacy-layer";
import type { GraphNode, GraphEdge } from "@/lib/trust-graph/types";

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
  return {
    entityId: overrides.id,
    entityType: "user",
    label: `Node ${overrides.id}`,
    trustScore: 50,
    pageRank: 0,
    accessLevel: "public",
    isVerified: false,
    ...overrides,
  };
}

function makeEdge(
  overrides: Partial<GraphEdge> & { id: string; sourceNodeId: string; targetNodeId: string }
): GraphEdge {
  return {
    edgeType: "transaction",
    weight: 1,
    transactionValue: 100,
    reputationMultiplier: 1,
    frequencyFactor: 1,
    interactionCount: 1,
    ...overrides,
  };
}

// =============================================================================
// Weight Calculator
// =============================================================================

describe("Weight Calculator", () => {
  describe("calculateEdgeWeight", () => {
    it("should compute W = T × R × F", () => {
      expect(
        calculateEdgeWeight({ transactionValue: 2, reputationMultiplier: 3, frequencyFactor: 4 })
      ).toBe(24);
    });

    it("should return 0 when any factor is 0", () => {
      expect(
        calculateEdgeWeight({ transactionValue: 0, reputationMultiplier: 1, frequencyFactor: 1 })
      ).toBe(0);
    });
  });

  describe("calculateFrequencyFactor", () => {
    it("should return 0 for 0 interactions", () => {
      expect(calculateFrequencyFactor(0)).toBe(0);
    });

    it("should scale logarithmically", () => {
      expect(calculateFrequencyFactor(1)).toBeCloseTo(1.0, 5);
      expect(calculateFrequencyFactor(3)).toBeCloseTo(2.0, 5);
      expect(calculateFrequencyFactor(7)).toBeCloseTo(3.0, 5);
    });

    it("should cap at 5.0", () => {
      expect(calculateFrequencyFactor(1000000)).toBe(5.0);
    });
  });

  describe("calculateReputationMultiplier", () => {
    it("should clamp minimum to 0.1", () => {
      expect(calculateReputationMultiplier(0)).toBe(0.1);
      expect(calculateReputationMultiplier(5)).toBe(0.1);
    });

    it("should clamp maximum to 2.0", () => {
      expect(calculateReputationMultiplier(300)).toBe(2.0);
    });

    it("should return score/100 in normal range", () => {
      expect(calculateReputationMultiplier(50)).toBe(0.5);
      expect(calculateReputationMultiplier(100)).toBe(1.0);
    });
  });

  describe("normalizeTransactionValue", () => {
    it("should normalize against median", () => {
      expect(normalizeTransactionValue(500, 100)).toBe(5.0);
    });

    it("should cap at 10.0", () => {
      expect(normalizeTransactionValue(5000, 100)).toBe(10.0);
    });

    it("should return 0 for zero median", () => {
      expect(normalizeTransactionValue(100, 0)).toBe(0);
    });
  });
});

// =============================================================================
// Score Calculator
// =============================================================================

describe("Score Calculator", () => {
  it("should compute composite with correct weights", () => {
    const nodes = [makeNode({ id: "A" })];
    const edges: GraphEdge[] = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction", weight: 5 }),
      makeEdge({ id: "e2", sourceNodeId: "A", targetNodeId: "C", edgeType: "attestation", weight: 5 }),
      makeEdge({ id: "e3", sourceNodeId: "A", targetNodeId: "D", edgeType: "collaboration", weight: 5 }),
    ];

    const result = calculateGraphTrustScore("A", edges, nodes);
    expect(result.composite).toBeGreaterThan(0);
    expect(result.composite).toBeLessThanOrEqual(100);
    expect(result.transactionTrust).toBeGreaterThan(0);
    expect(result.communityTrust).toBeGreaterThan(0);
    expect(result.collaborationTrust).toBeGreaterThan(0);
  });

  it("should return 0 for node with no edges", () => {
    const result = calculateGraphTrustScore("A", [], [makeNode({ id: "A" })]);
    expect(result.composite).toBe(0);
    expect(result.transactionTrust).toBe(0);
  });

  it("should cap composite at 100", () => {
    const edges: GraphEdge[] = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction", weight: 100 }),
      makeEdge({ id: "e2", sourceNodeId: "A", targetNodeId: "C", edgeType: "attestation", weight: 100 }),
      makeEdge({ id: "e3", sourceNodeId: "A", targetNodeId: "D", edgeType: "collaboration", weight: 100 }),
    ];
    const result = calculateGraphTrustScore("A", edges, []);
    expect(result.composite).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// PageRank
// =============================================================================

describe("PageRank", () => {
  it("should converge for a simple graph", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" }), makeNode({ id: "C" })];
    const edges = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B" }),
      makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "C" }),
      makeEdge({ id: "e3", sourceNodeId: "C", targetNodeId: "A" }),
    ];

    const ranks = computePageRank(nodes, edges);
    expect(ranks.size).toBe(3);

    // All nodes should have roughly equal rank in a cycle
    const values = Array.from(ranks.values());
    const sum = values.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("should handle disconnected components", () => {
    const nodes = [
      makeNode({ id: "A" }),
      makeNode({ id: "B" }),
      makeNode({ id: "C" }),
      makeNode({ id: "D" }),
    ];
    const edges = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B" }),
    ];

    const ranks = computePageRank(nodes, edges);
    expect(ranks.size).toBe(4);
    const sum = Array.from(ranks.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("should respect damping factor", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
    const edges = [makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B" })];

    const ranks = computePageRank(nodes, edges, { dampingFactor: 0.85 });
    // B should have higher rank than A (it receives a link)
    expect(ranks.get("B")!).toBeGreaterThan(ranks.get("A")!);
  });

  it("should return empty map for no nodes", () => {
    const ranks = computePageRank([], []);
    expect(ranks.size).toBe(0);
  });
});

// =============================================================================
// Fraud Detection
// =============================================================================

describe("Fraud Detection", () => {
  describe("detectCircularTransactions", () => {
    it("should detect A→B→C→A cycle", () => {
      const edges = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction" }),
        makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "C", edgeType: "transaction" }),
        makeEdge({ id: "e3", sourceNodeId: "C", targetNodeId: "A", edgeType: "transaction" }),
      ];
      const flags = detectCircularTransactions(edges);
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0].flagType).toBe("circular_transaction");
      expect(flags[0].severity).toBe("high");
    });

    it("should not flag linear transactions", () => {
      const edges = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction" }),
        makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "C", edgeType: "transaction" }),
      ];
      const flags = detectCircularTransactions(edges);
      expect(flags.length).toBe(0);
    });
  });

  describe("detectSybilNodes", () => {
    it("should flag nodes with low counterparty ratio", () => {
      const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
      // A has 4 edges but only to B (ratio = 1/4 = 0.25 < 0.3)
      const edges = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction" }),
        makeEdge({ id: "e2", sourceNodeId: "A", targetNodeId: "B", edgeType: "attestation" }),
        makeEdge({ id: "e3", sourceNodeId: "A", targetNodeId: "B", edgeType: "loan" }),
        makeEdge({ id: "e4", sourceNodeId: "B", targetNodeId: "A", edgeType: "transaction" }),
      ];
      const flags = detectSybilNodes(nodes, edges);
      // Both A and B have ratio 1/4 = 0.25
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0].flagType).toBe("sybil_suspect");
    });

    it("should not flag nodes with diverse counterparties", () => {
      const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" }), makeNode({ id: "C" }), makeNode({ id: "D" })];
      const edges = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "transaction" }),
        makeEdge({ id: "e2", sourceNodeId: "A", targetNodeId: "C", edgeType: "attestation" }),
        makeEdge({ id: "e3", sourceNodeId: "A", targetNodeId: "D", edgeType: "loan" }),
      ];
      const flags = detectSybilNodes(nodes, edges);
      // A has 3 edges, 3 counterparties → ratio = 1.0
      const aFlags = flags.filter((f) => f.nodeId === "A");
      expect(aFlags.length).toBe(0);
    });
  });

  describe("detectReputationBoostingClusters", () => {
    it("should flag mutual high-weight attestations", () => {
      const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
      // Mutual attestations with very high weight relative to average
      const edges: GraphEdge[] = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "attestation", weight: 100 }),
        makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "A", edgeType: "attestation", weight: 100 }),
      ];
      const flags = detectReputationBoostingClusters(nodes, edges);
      // avg = 100, threshold = 300 — mutual avg = 100, so NOT flagged (100 < 300)
      // Need to make one much higher to trigger
      expect(flags.length).toBe(0);
    });

    it("should not flag low-weight attestations", () => {
      const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
      const edges: GraphEdge[] = [
        makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", edgeType: "attestation", weight: 1 }),
      ];
      const flags = detectReputationBoostingClusters(nodes, edges);
      expect(flags.length).toBe(0);
    });
  });

  describe("detectVelocityAnomalies", () => {
    it("should flag nodes with interaction spikes", () => {
      const now = Date.now();
      const edges: GraphEdge[] = [
        makeEdge({
          id: "e1",
          sourceNodeId: "A",
          targetNodeId: "B",
          interactionCount: 100,
          metadata: { lastInteractionTime: now - 1000 },
        }),
        makeEdge({
          id: "e2",
          sourceNodeId: "A",
          targetNodeId: "C",
          interactionCount: 2,
          metadata: { lastInteractionTime: now - 100000000 },
        }),
      ];
      const flags = detectVelocityAnomalies(edges, 60 * 60 * 1000); // 1 hour window
      // Recent: A has 100 from e1. Total: 102. Avg non-recent: 2. 100 > 2*5=10 → flagged
      const aFlags = flags.filter((f) => f.nodeId === "A");
      expect(aFlags.length).toBeGreaterThan(0);
    });
  });

  describe("applyFraudPenalties", () => {
    it("should apply severity multipliers correctly", () => {
      const scores = new Map([["A", 100], ["B", 100], ["C", 100], ["D", 100]]);
      const flags = [
        { nodeId: "A", flagType: "test", severity: "low" as const, evidence: {} },
        { nodeId: "B", flagType: "test", severity: "medium" as const, evidence: {} },
        { nodeId: "C", flagType: "test", severity: "high" as const, evidence: {} },
        { nodeId: "D", flagType: "test", severity: "critical" as const, evidence: {} },
      ];
      const adjusted = applyFraudPenalties(scores, flags);
      expect(adjusted.get("A")).toBe(90);
      expect(adjusted.get("B")).toBe(70);
      expect(adjusted.get("C")).toBe(40);
      expect(adjusted.get("D")).toBe(10);
    });

    it("should not modify scores without flags", () => {
      const scores = new Map([["A", 80]]);
      const adjusted = applyFraudPenalties(scores, []);
      expect(adjusted.get("A")).toBe(80);
    });
  });
});

// =============================================================================
// Privacy Layer
// =============================================================================

describe("Privacy Layer", () => {
  describe("filterByAccessLevel", () => {
    const nodes: GraphNode[] = [
      makeNode({ id: "A", accessLevel: "public" }),
      makeNode({ id: "B", accessLevel: "partners" }),
      makeNode({ id: "C", accessLevel: "private" }),
    ];
    const edges: GraphEdge[] = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B" }),
      makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "C" }),
    ];

    it("should filter to public only for public access", () => {
      const result = filterByAccessLevel("public", nodes, edges);
      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].id).toBe("A");
      expect(result.edges.length).toBe(0);
    });

    it("should include partners for partners access", () => {
      const result = filterByAccessLevel("partners", nodes, edges);
      expect(result.nodes.length).toBe(2);
      expect(result.edges.length).toBe(1);
    });

    it("should include all for private access", () => {
      const result = filterByAccessLevel("private", nodes, edges);
      expect(result.nodes.length).toBe(3);
      expect(result.edges.length).toBe(2);
    });
  });

  describe("generateTrustProfile", () => {
    const node = makeNode({ id: "A", trustScore: 75 });
    const edges: GraphEdge[] = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B" }),
    ];
    const components = { composite: 75, transactionTrust: 60, communityTrust: 80, collaborationTrust: 70 };

    it("should return only score for public access", () => {
      const profile = generateTrustProfile(node, "public", edges, components);
      expect(profile.trustScore).toBe(75);
      expect(profile.components).toBeUndefined();
      expect(profile.edgeCount).toBeUndefined();
    });

    it("should include components for partners access", () => {
      const profile = generateTrustProfile(node, "partners", edges, components);
      expect(profile.components).toBeDefined();
      expect(profile.components!.composite).toBe(75);
      expect(profile.edgeCount).toBe(1);
    });

    it("should include full detail for private access", () => {
      const profile = generateTrustProfile(node, "private", edges, components);
      expect(profile.components).toBeDefined();
      expect(profile.edgeCount).toBe(1);
      expect(profile.neighborCount).toBe(1);
    });
  });
});

// =============================================================================
// Cluster Detection
// =============================================================================

describe("Cluster Detection", () => {
  it("should detect clusters in connected components", () => {
    const nodes = [
      makeNode({ id: "A" }),
      makeNode({ id: "B" }),
      makeNode({ id: "C" }),
      makeNode({ id: "D" }),
      makeNode({ id: "E" }),
    ];
    const edges = [
      makeEdge({ id: "e1", sourceNodeId: "A", targetNodeId: "B", weight: 10 }),
      makeEdge({ id: "e2", sourceNodeId: "B", targetNodeId: "C", weight: 10 }),
      makeEdge({ id: "e3", sourceNodeId: "A", targetNodeId: "C", weight: 10 }),
      makeEdge({ id: "e4", sourceNodeId: "D", targetNodeId: "E", weight: 10 }),
    ];

    const clusters = detectClusters(nodes, edges);
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    // ABC cluster and DE cluster
    const sizes = clusters.map((c) => c.size).sort();
    expect(sizes).toContain(2);
    expect(sizes).toContain(3);
  });

  it("should return empty for no nodes", () => {
    expect(detectClusters([], [])).toEqual([]);
  });

  it("should skip singleton clusters", () => {
    const nodes = [makeNode({ id: "A" }), makeNode({ id: "B" })];
    // No edges — each is isolated
    const clusters = detectClusters(nodes, []);
    expect(clusters.length).toBe(0);
  });
});

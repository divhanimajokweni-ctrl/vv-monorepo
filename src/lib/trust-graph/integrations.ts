/**
 * Ubuntu Pools — Trust Graph ServiceBus Integration
 * Maps domain events to graph mutations
 */

import type { TrustGraphEngine } from "./graph-engine";

interface ServiceBus {
  on(eventType: string, handler: (payload: Record<string, unknown>) => void | Promise<void>): () => void;
  emit(eventType: string, payload: Record<string, unknown>): Promise<void>;
}

/**
 * Register event handlers that translate domain events into graph mutations.
 */
export function registerGraphEventHandlers(bus: ServiceBus, engine: TrustGraphEngine): void {
  bus.on("pool.contribution_made", (payload) => {
    const sourceNodeId = payload.sourceNodeId as string;
    const targetNodeId = payload.targetNodeId as string;
    const amount = payload.amount as number;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "transaction",
        transactionValue: amount ?? 0,
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "transaction" });
    }
  });

  bus.on("member.endorsed", (payload) => {
    const sourceNodeId = payload.sourceNodeId as string;
    const targetNodeId = payload.targetNodeId as string;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "attestation",
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "attestation" });
    }
  });

  bus.on("village.member_joined", (payload) => {
    const sourceNodeId = payload.memberNodeId as string;
    const targetNodeId = payload.villageNodeId as string;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "membership",
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "membership" });
    }
  });

  bus.on("investment.created", (payload) => {
    const sourceNodeId = payload.investorNodeId as string;
    const targetNodeId = payload.businessNodeId as string;
    const amount = payload.amount as number;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "investment",
        transactionValue: amount ?? 0,
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "investment" });
    }
  });

  bus.on("credit.loan_issued", (payload) => {
    const sourceNodeId = payload.lenderNodeId as string;
    const targetNodeId = payload.borrowerNodeId as string;
    const amount = payload.amount as number;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "loan",
        transactionValue: amount ?? 0,
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "loan" });
    }
  });

  bus.on("procurement.completed", (payload) => {
    const sourceNodeId = payload.buyerNodeId as string;
    const targetNodeId = payload.supplierNodeId as string;
    const amount = payload.amount as number;

    if (sourceNodeId && targetNodeId) {
      engine.upsertEdge({
        sourceNodeId,
        targetNodeId,
        edgeType: "collaboration",
        transactionValue: amount ?? 0,
      });
      bus.emit("trust_graph.edge_updated", { sourceNodeId, targetNodeId, edgeType: "collaboration" });
    }
  });
}

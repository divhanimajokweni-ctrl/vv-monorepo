/**
 * Ubuntu Pools — Global Trust Graph Schema
 * Network-level trust layer for portable economic reputation
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  bigint,
  integer,
  numeric,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// =============================================================================
// ENUMS
// =============================================================================

export const graphNodeTypeEnum = pgEnum("graph_node_type", [
  "user",
  "village",
  "business",
  "institution",
  "pool",
]);

export const graphEdgeTypeEnum = pgEnum("graph_edge_type", [
  "transaction",
  "attestation",
  "collaboration",
  "investment",
  "loan",
  "membership",
]);

export const trustAccessLevelEnum = pgEnum("trust_access_level", [
  "public",
  "partners",
  "private",
]);

// =============================================================================
// TABLE: trust_graph_nodes
// =============================================================================

export const trustGraphNodes = pgTable(
  "trust_graph_nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: uuid("entity_id").notNull(),
    entityType: graphNodeTypeEnum("entity_type").notNull(),
    label: text("label").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    trustScore: integer("trust_score").notNull().default(0),
    pageRank: numeric("page_rank").notNull().default("0"),
    accessLevel: trustAccessLevelEnum("access_level").notNull().default("public"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entityUnique: uniqueIndex("trust_graph_nodes_entity_unique").on(
      table.entityId,
      table.entityType
    ),
    trustScoreIdx: index("idx_trust_graph_nodes_score").on(table.trustScore),
    entityTypeIdx: index("idx_trust_graph_nodes_type").on(table.entityType),
  })
);

// =============================================================================
// TABLE: trust_graph_edges
// =============================================================================

export const trustGraphEdges = pgTable(
  "trust_graph_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceNodeId: uuid("source_node_id")
      .notNull()
      .references(() => trustGraphNodes.id, { onDelete: "cascade" }),
    targetNodeId: uuid("target_node_id")
      .notNull()
      .references(() => trustGraphNodes.id, { onDelete: "cascade" }),
    edgeType: graphEdgeTypeEnum("edge_type").notNull(),
    weight: numeric("weight").notNull().default("0"),
    transactionValue: bigint("transaction_value", { mode: "number" }).notNull().default(0),
    reputationMultiplier: numeric("reputation_multiplier").notNull().default("1"),
    frequencyFactor: numeric("frequency_factor").notNull().default("0"),
    interactionCount: integer("interaction_count").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    firstInteraction: timestamptz("first_interaction").notNull().defaultNow(),
    lastInteraction: timestamptz("last_interaction").notNull().defaultNow(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    edgeUnique: uniqueIndex("trust_graph_edges_unique").on(
      table.sourceNodeId,
      table.targetNodeId,
      table.edgeType
    ),
    sourceIdx: index("idx_trust_graph_edges_source").on(table.sourceNodeId),
    targetIdx: index("idx_trust_graph_edges_target").on(table.targetNodeId),
    edgeTypeIdx: index("idx_trust_graph_edges_type").on(table.edgeType),
  })
);

// =============================================================================
// TABLE: trust_graph_snapshots
// =============================================================================

export const trustGraphSnapshots = pgTable(
  "trust_graph_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => trustGraphNodes.id, { onDelete: "cascade" }),
    trustScore: integer("trust_score").notNull(),
    pageRank: numeric("page_rank").notNull(),
    transactionTrust: numeric("transaction_trust").notNull(),
    communityTrust: numeric("community_trust").notNull(),
    collaborationTrust: numeric("collaboration_trust").notNull(),
    snapshotAt: timestamptz("snapshot_at").notNull().defaultNow(),
  },
  (table) => ({
    nodeIdx: index("idx_trust_graph_snapshots_node").on(table.nodeId),
    snapshotAtIdx: index("idx_trust_graph_snapshots_at").on(table.snapshotAt),
  })
);

// =============================================================================
// TABLE: trust_graph_fraud_flags
// =============================================================================

export const trustGraphFraudFlags = pgTable(
  "trust_graph_fraud_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => trustGraphNodes.id, { onDelete: "cascade" }),
    flagType: text("flag_type").notNull(),
    severity: text("severity").notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().default({}),
    resolvedAt: timestamptz("resolved_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    nodeIdx: index("idx_trust_graph_fraud_flags_node").on(table.nodeId),
    severityIdx: index("idx_trust_graph_fraud_flags_severity").on(table.severity),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TrustGraphNode = typeof trustGraphNodes.$inferSelect;
export type NewTrustGraphNode = typeof trustGraphNodes.$inferInsert;

export type TrustGraphEdge = typeof trustGraphEdges.$inferSelect;
export type NewTrustGraphEdge = typeof trustGraphEdges.$inferInsert;

export type TrustGraphSnapshot = typeof trustGraphSnapshots.$inferSelect;
export type NewTrustGraphSnapshot = typeof trustGraphSnapshots.$inferInsert;

export type TrustGraphFraudFlag = typeof trustGraphFraudFlags.$inferSelect;
export type NewTrustGraphFraudFlag = typeof trustGraphFraudFlags.$inferInsert;

export type GraphNodeType = (typeof graphNodeTypeEnum.enumValues)[number];
export type GraphEdgeType = (typeof graphEdgeTypeEnum.enumValues)[number];
export type TrustAccessLevel = (typeof trustAccessLevelEnum.enumValues)[number];

/**
 * Ubuntu Pools — CPME Schema
 * Collective Procurement & Market Engine
 * Extends Village OS with demand/supply aggregation, supplier marketplace, contracts
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
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// =============================================================================
// ENUMS
// =============================================================================

export const procurementCircleStatusEnum = pgEnum("procurement_circle_status", [
  "forming",
  "active",
  "negotiating",
  "contracting",
  "completed",
  "cancelled",
]);

export const demandStatusEnum = pgEnum("demand_status", [
  "draft",
  "open",
  "aggregating",
  "locked",
  "fulfilled",
  "cancelled",
]);

export const supplyStatusEnum = pgEnum("supply_status", [
  "draft",
  "available",
  "reserved",
  "sold",
  "expired",
]);

export const supplierStatusEnum = pgEnum("supplier_status", [
  "pending",
  "verified",
  "suspended",
  "removed",
]);

export const bidStatusEnum = pgEnum("bid_status", [
  "submitted",
  "shortlisted",
  "negotiating",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "pending_approval",
  "active",
  "fulfilling",
  "completed",
  "disputed",
  "terminated",
]);

export const orderSettlementStatusEnum = pgEnum("order_settlement_status", [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "confirmed",
  "disputed",
  "refunded",
]);

// =============================================================================
// TABLE: procurement_circles (groups of villages forming buying collectives)
// =============================================================================

export const procurementCircles = pgTable(
  "procurement_circles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    creatorVillageId: uuid("creator_village_id")
      .notNull()
      .references(() => villageEntities.id, { onDelete: "cascade" }),
    memberVillageIds: jsonb("member_village_ids").$type<string[]>().default([]),
    minVillages: integer("min_villages").notNull().default(1),
    maxVillages: integer("max_villages"),
    totalDemand: bigint("total_demand", { mode: "number" }).notNull().default(0),
    targetPrice: bigint("target_price", { mode: "number" }),
    deadline: timestamptz("deadline"),
    status: procurementCircleStatusEnum("status").notNull().default("forming"),
    coordinationFeePercent: integer("coordination_fee_percent").notNull().default(50),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("idx_procurement_circles_creator").on(table.creatorVillageId),
    categoryIdx: index("idx_procurement_circles_category").on(table.category),
    statusIdx: index("idx_procurement_circles_status").on(table.status),
  })
);

// =============================================================================
// TABLE: village_demands (what villages want to buy collectively)
// =============================================================================

export const villageDemands = pgTable(
  "village_demands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villageEntities.id, { onDelete: "cascade" }),
    circleId: uuid("circle_id").references(() => procurementCircles.id, {
      onDelete: "set null",
    }),
    product: text("product").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull(),
    unit: text("unit").notNull(),
    individualPrice: bigint("individual_price", { mode: "number" }).notNull(),
    targetPrice: bigint("target_price", { mode: "number" }),
    urgency: text(" urgency").notNull().default("normal"),
    deliveryLocation: jsonb("delivery_location").$type<{
      country?: string;
      region?: string;
      address?: string;
    }>().default({}),
    preferredSuppliers: jsonb("preferred_suppliers").$type<string[]>().default([]),
    deadline: timestamptz("deadline"),
    status: demandStatusEnum("status").notNull().default("draft"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_village_demands_village").on(table.villageId),
    circleIdx: index("idx_village_demands_circle").on(table.circleId),
    categoryIdx: index("idx_village_demands_category").on(table.category),
    statusIdx: index("idx_village_demands_status").on(table.status),
  })
);

// =============================================================================
// TABLE: village_supplies (what villages want to sell collectively)
// =============================================================================

export const villageSupplies = pgTable(
  "village_supplies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villageEntities.id, { onDelete: "cascade" }),
    product: text("product").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull(),
    unit: text("unit").notNull(),
    askingPrice: bigint("asking_price", { mode: "number" }).notNull(),
    minPrice: bigint("min_price", { mode: "number" }),
    quality: text("quality").notNull().default("standard"),
    harvestDate: timestamptz("harvest_date"),
    expiryDate: timestamptz("expiry_date"),
    location: jsonb("location").$type<{
      country?: string;
      region?: string;
      address?: string;
    }>().default({}),
    preferredBuyers: jsonb("preferred_buyers").$type<string[]>().default([]),
    deadline: timestamptz("deadline"),
    status: supplyStatusEnum("status").notNull().default("draft"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    villageIdx: index("idx_village_supplies_village").on(table.villageId),
    categoryIdx: index("idx_village_supplies_category").on(table.category),
    statusIdx: index("idx_village_supplies_status").on(table.status),
  })
);

// =============================================================================
// TABLE: suppliers (registered suppliers who can bid)
// =============================================================================

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    businessType: text("business_type").notNull(),
    registrationNumber: text("registration_number"),
    taxId: text("tax_id"),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    address: jsonb("address").$type<{
      street?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    }>().default({}),
    categories: jsonb("categories").$type<string[]>().default([]),
    certifications: jsonb("certifications").$type<string[]>().default([]),
    minOrderValue: bigint("min_order_value", { mode: "number" }),
    maxOrderCapacity: bigint("max_order_capacity", { mode: "number" }),
    paymentTerms: text("payment_terms").notNull().default("net_30"),
    deliveryRegions: jsonb("delivery_regions").$type<string[]>().default([]),
    trustScore: integer("trust_score").notNull().default(500),
    successfulOrders: integer("successful_orders").notNull().default(0),
    totalOrderValue: bigint("total_order_value", { mode: "number" }).notNull().default(0),
    status: supplierStatusEnum("status").notNull().default("pending"),
    verifiedAt: timestamptz("verified_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_suppliers_name").on(table.name),
    categoryIdx: index("idx_suppliers_category").on(table.categories),
    statusIdx: index("idx_suppliers_status").on(table.status),
    trustIdx: index("idx_suppliers_trust").on(table.trustScore),
  })
);

// =============================================================================
// TABLE: bids (supplier responses to demands)
// =============================================================================

export const bids = pgTable(
  "bids",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    demandId: uuid("demand_id")
      .notNull()
      .references(() => villageDemands.id, { onDelete: "cascade" }),
    supplyId: uuid("supply_id").references(() => villageSupplies.id, {
      onDelete: "set null",
    }),
    circleId: uuid("circle_id").references(() => procurementCircles.id, {
      onDelete: "set null",
    }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    totalPrice: bigint("total_price", { mode: "number" }).notNull(),
    quantityOffered: integer("quantity_offered").notNull(),
    deliveryTime: integer("delivery_time").notNull(),
    deliveryTerms: text("delivery_terms"),
    paymentTerms: text("payment_terms"),
    warranty: text("warranty"),
    additionalNotes: text("additional_notes"),
    discountPercent: integer("discount_percent").notNull().default(0),
    savingsFromRetail: integer("savings_from_retail").notNull().default(0),
    status: bidStatusEnum("status").notNull().default("submitted"),
    submittedAt: timestamptz("submitted_at").notNull().defaultNow(),
    expiresAt: timestamptz("expires_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    demandIdx: index("idx_bids_demand").on(table.demandId),
    supplyIdx: index("idx_bids_supply").on(table.supplyId),
    circleIdx: index("idx_bids_circle").on(table.circleId),
    supplierIdx: index("idx_bids_supplier").on(table.supplierId),
    statusIdx: index("idx_bids_status").on(table.status),
  })
);

// =============================================================================
// TABLE: contracts (agreements between villages and suppliers)
// =============================================================================

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractNumber: text("contract_number").notNull().unique(),
    circleId: uuid("circle_id").references(() => procurementCircles.id, {
      onDelete: "set null",
    }),
    demandId: uuid("demand_id").references(() => villageDemands.id, {
      onDelete: "set null",
    }),
    supplyId: uuid("supply_id").references(() => villageSupplies.id, {
      onDelete: "set null",
    }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    winningBidId: uuid("winning_bid_id").references(() => bids.id, {
      onDelete: "set null",
    }),
    memberVillageIds: jsonb("member_village_ids").$type<string[]>().default([]),
    product: text("product").notNull(),
    quantity: integer("quantity").notNull(),
    unit: text("unit").notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    totalValue: bigint("total_value", { mode: "number" }).notNull(),
    coordinationFeePercent: integer("coordination_fee_percent").notNull().default(50),
    coordinationFee: bigint("coordination_fee", { mode: "number" }).notNull().default(0),
    netValue: bigint("net_value", { mode: "number" }).notNull(),
    deliveryTerms: text("delivery_terms").notNull(),
    paymentTerms: text("payment_terms").notNull(),
    deliveryDeadline: timestamptz("delivery_deadline"),
    approvalVoteId: uuid("approval_vote_id"),
    status: contractStatusEnum("status").notNull().default("draft"),
    signedAt: timestamptz("signed_at"),
    startedAt: timestamptz("started_at"),
    completedAt: timestamptz("completed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    contractNumberIdx: index("idx_contracts_number").on(table.contractNumber),
    circleIdx: index("idx_contracts_circle").on(table.circleId),
    supplierIdx: index("idx_contracts_supplier").on(table.supplierId),
    statusIdx: index("idx_contracts_status").on(table.status),
  })
);

// =============================================================================
// TABLE: order_settlements (tracking delivery and payment)
// =============================================================================

export const orderSettlements = pgTable(
  "order_settlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    paidByVillageId: uuid("paid_by_village_id")
      .notNull()
      .references(() => villageEntities.id, { onDelete: "cascade" }),
    paidToSupplierId: uuid("paid_to_supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    status: orderSettlementStatusEnum("status").notNull().default("pending"),
    paymentReference: text("payment_reference"),
    paymentConfirmedAt: timestamptz("payment_confirmed_at"),
    shippedAt: timestamptz("shipped_at"),
    trackingNumber: text("tracking_number"),
    deliveredAt: timestamptz("delivered_at"),
    confirmedAt: timestamptz("confirmed_at"),
    disputeReason: text("dispute_reason"),
    resolvedAt: timestamptz("resolved_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    contractIdx: index("idx_order_settlements_contract").on(table.contractId),
    villageIdx: index("idx_order_settlements_village").on(table.paidByVillageId),
    statusIdx: index("idx_order_settlements_status").on(table.status),
  })
);

// =============================================================================
// TABLE: village_entities (unified reference for villages across CPME)
// =============================================================================

export const villageEntities = pgTable(
  "village_entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull().default("village"),
    ubuntuScore: integer("ubuntu_score").notNull().default(500),
    location: jsonb("location").$type<{
      country?: string;
      region?: string;
    }>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_village_entities_name").on(table.name),
    typeIdx: index("idx_village_entities_type").on(table.type),
    scoreIdx: index("idx_village_entities_score").on(table.ubuntuScore),
  })
);

// =============================================================================
// TABLE: cross_village_federations (federations of villages for bulk coordination)
// =============================================================================

export const crossVillageFederations = pgTable(
  "cross_village_federations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    memberVillageIds: jsonb("member_village_ids").$type<string[]>().default([]),
    totalDemand: bigint("total_demand", { mode: "number" }).notNull().default(0),
    activeContracts: integer("active_contracts").notNull().default(0),
    totalTradeVolume: bigint("total_trade_volume", { mode: "number" }).notNull().default(0),
    coordinationFeePercent: integer("coordination_fee_percent").notNull().default(50),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_cross_village_federations_name").on(table.name),
    categoryIdx: index("idx_cross_village_federations_category").on(table.category),
  })
);

// =============================================================================
// TABLE: market_intelligence (aggregated demand/supply data for insights)
// =============================================================================

export const marketIntelligence = pgTable(
  "market_intelligence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull(),
    product: text("product").notNull(),
    region: text("region"),
    periodStart: timestamptz("period_start").notNull(),
    periodEnd: timestamptz("period_end").notNull(),
    totalDemand: bigint("total_demand", { mode: "number" }).notNull().default(0),
    averagePrice: bigint("average_price", { mode: "number" }).notNull().default(0),
    priceRangeLow: bigint("price_range_low", { mode: "number" }),
    priceRangeHigh: bigint("price_range_high", { mode: "number" }),
    participatingVillages: integer("participating_villages").notNull().default(0),
    supplierCount: integer("supplier_count").notNull().default(0),
    negotiationSuccessRate: integer("negotiation_success_rate").notNull().default(0),
    averageSavingsPercent: integer("average_savings_percent").notNull().default(0),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("idx_market_intelligence_category").on(table.category),
    productIdx: index("idx_market_intelligence_product").on(table.product),
    periodIdx: index("idx_market_intelligence_period").on(
      table.periodStart,
      table.periodEnd
    ),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ProcurementCircle = typeof procurementCircles.$inferSelect;
export type NewProcurementCircle = typeof procurementCircles.$inferInsert;

export type VillageDemand = typeof villageDemands.$inferSelect;
export type NewVillageDemand = typeof villageDemands.$inferInsert;

export type VillageSupply = typeof villageSupplies.$inferSelect;
export type NewVillageSupply = typeof villageSupplies.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type Bid = typeof bids.$inferSelect;
export type NewBid = typeof bids.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

export type OrderSettlement = typeof orderSettlements.$inferSelect;
export type NewOrderSettlement = typeof orderSettlements.$inferInsert;

export type VillageEntity = typeof villageEntities.$inferSelect;
export type NewVillageEntity = typeof villageEntities.$inferInsert;

export type CrossVillageFederation = typeof crossVillageFederations.$inferSelect;
export type NewCrossVillageFederation = typeof crossVillageFederations.$inferInsert;

export type MarketIntelligence = typeof marketIntelligence.$inferSelect;
export type NewMarketIntelligence = typeof marketIntelligence.$inferInsert;

export type ProcurementCircleStatus =
  (typeof procurementCircleStatusEnum.enumValues)[number];
export type DemandStatus = (typeof demandStatusEnum.enumValues)[number];
export type SupplyStatus = (typeof supplyStatusEnum.enumValues)[number];
export type SupplierStatus = (typeof supplierStatusEnum.enumValues)[number];
export type BidStatus = (typeof bidStatusEnum.enumValues)[number];
export type ContractStatus = (typeof contractStatusEnum.enumValues)[number];
export type OrderSettlementStatus =
  (typeof orderSettlementStatusEnum.enumValues)[number];

// Re-export village entities from schema-village
import { villages } from "./schema-village";

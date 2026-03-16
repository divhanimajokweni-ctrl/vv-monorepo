/**
 * Ubuntu Pools — CPME Core Services
 * Collective Procurement & Market Engine
 */

import { db } from "@/db/client";
import {
  procurementCircles,
  villageDemands,
  villageSupplies,
  suppliers,
  bids,
  contracts,
  orderSettlements,
  villageEntities,
  crossVillageFederations,
  marketIntelligence as marketIntelligenceTable,
} from "@/db/schema-cpme";
import {
  eq,
  and,
  desc,
  sql,
  gt,
  lt,
  gte,
  lte,
} from "drizzle-orm";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateDemandInput {
  villageId: string;
  circleId?: string;
  product: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  individualPrice: number;
  targetPrice?: number;
  urgency?: "low" | "normal" | "high" | "critical";
  deliveryLocation?: {
    country?: string;
    region?: string;
    address?: string;
  };
  preferredSuppliers?: string[];
  deadline?: Date;
}

export interface CreateSupplyInput {
  villageId: string;
  product: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  askingPrice: number;
  minPrice?: number;
  quality?: "low" | "standard" | "premium" | "organic";
  harvestDate?: Date;
  expiryDate?: Date;
  location?: {
    country?: string;
    region?: string;
    address?: string;
  };
  preferredBuyers?: string[];
  deadline?: Date;
}

export interface CreateBidInput {
  demandId: string;
  supplyId?: string;
  circleId?: string;
  supplierId: string;
  unitPrice: number;
  quantityOffered: number;
  deliveryTime: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  warranty?: string;
  additionalNotes?: string;
  expiresAt?: Date;
}

export interface CreateContractInput {
  circleId?: string;
  demandId?: string;
  supplyId?: string;
  supplierId: string;
  winningBidId?: string;
  memberVillageIds: string[];
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  coordinationFeePercent?: number;
  deliveryTerms: string;
  paymentTerms: string;
  deliveryDeadline?: Date;
}

// =============================================================================
// DEMAND AGGREGATION SERVICE
// =============================================================================

export class DemandAggregationService {
  async createDemand(input: CreateDemandInput) {
    const [demand] = await db
      .insert(villageDemands)
      .values({
        villageId: input.villageId,
        circleId: input.circleId,
        product: input.product,
        category: input.category,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        individualPrice: input.individualPrice,
        targetPrice: input.targetPrice,
        urgency: input.urgency || "normal",
        deliveryLocation: input.deliveryLocation || {},
        preferredSuppliers: input.preferredSuppliers || [],
        deadline: input.deadline,
        status: "draft",
      })
      .returning();

    if (input.circleId) {
      await this.updateCircleDemand(input.circleId);
    }

    return demand;
  }

  async updateDemandStatus(demandId: string, status: string) {
    const [demand] = await db
      .update(villageDemands)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(villageDemands.id, demandId))
      .returning();

    if (demand?.circleId) {
      await this.updateCircleDemand(demand.circleId);
    }

    return demand;
  }

  async aggregateDemandForCircle(circleId: string) {
    const demands = await db
      .select()
      .from(villageDemands)
      .where(
        and(
          eq(villageDemands.circleId, circleId),
          eq(villageDemands.status, "locked")
        )
      );

    const totalQuantity = demands.reduce((sum, d) => sum + d.quantity, 0);
    const avgTargetPrice =
      demands.length > 0
        ? demands.reduce((sum, d) => sum + Number(d.targetPrice || d.individualPrice), 0) /
          demands.length
        : 0;

    return {
      demands,
      totalQuantity,
      avgTargetPrice,
      villageCount: demands.length,
    };
  }

  async getCircleDemandSummary(circleId: string) {
    const demands = await db
      .select()
      .from(villageDemands)
      .where(eq(villageDemands.circleId, circleId));

    const byStatus = demands.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: demands.length,
      byStatus,
      totalQuantity: demands.reduce((sum, d) => sum + d.quantity, 0),
      estimatedValue: demands.reduce(
        (sum, d) => sum + d.quantity * Number(d.individualPrice),
        0
      ),
    };
  }

  private async updateCircleDemand(circleId: string) {
    const summary = await this.getCircleDemandSummary(circleId);
    await db
      .update(procurementCircles)
      .set({
        totalDemand: summary.estimatedValue,
        updatedAt: new Date(),
      })
      .where(eq(procurementCircles.id, circleId));
  }

  async getVillageDemands(villageId: string) {
    return db
      .select()
      .from(villageDemands)
      .where(eq(villageDemands.villageId, villageId))
      .orderBy(desc(villageDemands.createdAt));
  }

  async getOpenDemands(category?: string, region?: string) {
    let query = db
      .select()
      .from(villageDemands)
      .where(
        and(
          eq(villageDemands.status, "open"),
          gt(villageDemands.deadline, new Date())
        )
      )
      .orderBy(desc(villageDemands.createdAt));

    if (category) {
      query = db
        .select()
        .from(villageDemands)
        .where(
          and(
            eq(villageDemands.status, "open"),
            eq(villageDemands.category, category),
            gt(villageDemands.deadline, new Date())
          )
        )
        .orderBy(desc(villageDemands.createdAt)) as typeof query;
    }

    return query;
  }
}

// =============================================================================
// SUPPLY AGGREGATION SERVICE
// =============================================================================

export class SupplyAggregationService {
  async createSupply(input: CreateSupplyInput) {
    const [supply] = await db
      .insert(villageSupplies)
      .values({
        villageId: input.villageId,
        product: input.product,
        category: input.category,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        askingPrice: input.askingPrice,
        minPrice: input.minPrice,
        quality: input.quality || "standard",
        harvestDate: input.harvestDate,
        expiryDate: input.expiryDate,
        location: input.location || {},
        preferredBuyers: input.preferredBuyers || [],
        deadline: input.deadline,
        status: "draft",
      })
      .returning();

    return supply;
  }

  async updateSupplyStatus(supplyId: string, status: string) {
    const [supply] = await db
      .update(villageSupplies)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(villageSupplies.id, supplyId))
      .returning();

    return supply;
  }

  async getVillageSupplies(villageId: string) {
    return db
      .select()
      .from(villageSupplies)
      .where(eq(villageSupplies.villageId, villageId))
      .orderBy(desc(villageSupplies.createdAt));
  }

  async getOpenSupplies(category?: string, region?: string) {
    let query = db
      .select()
      .from(villageSupplies)
      .where(
        and(
          eq(villageSupplies.status, "available"),
          gt(villageSupplies.deadline, new Date())
        )
      )
      .orderBy(desc(villageSupplies.createdAt));

    if (category) {
      query = db
        .select()
        .from(villageSupplies)
        .where(
          and(
            eq(villageSupplies.status, "available"),
            eq(villageSupplies.category, category),
            gt(villageSupplies.deadline, new Date())
          )
        )
        .orderBy(desc(villageSupplies.createdAt)) as typeof query;
    }

    return query;
  }

  async aggregateSupplyByProduct(product: string, region?: string) {
    const supplies = await db
      .select()
      .from(villageSupplies)
      .where(
        and(
          eq(villageSupplies.product, product),
          eq(villageSupplies.status, "available")
        )
      );

    return {
      supplies,
      totalQuantity: supplies.reduce((sum, s) => sum + s.quantity, 0),
      avgAskingPrice:
        supplies.length > 0
          ? supplies.reduce((sum, s) => sum + Number(s.askingPrice), 0) / supplies.length
          : 0,
      villageCount: supplies.length,
    };
  }
}

// =============================================================================
// SUPPLIER MATCHING SERVICE
// =============================================================================

export class SupplierMatchingService {
  async registerSupplier(input: {
    name: string;
    description?: string;
    businessType: string;
    registrationNumber?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: any;
    categories: string[];
    certifications?: string[];
    minOrderValue?: number;
    maxOrderCapacity?: number;
    paymentTerms?: string;
    deliveryRegions?: string[];
  }) {
    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: input.name,
        description: input.description,
        businessType: input.businessType,
        registrationNumber: input.registrationNumber,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        address: input.address || {},
        categories: input.categories,
        certifications: input.certifications || [],
        minOrderValue: input.minOrderValue,
        maxOrderCapacity: input.maxOrderCapacity,
        paymentTerms: input.paymentTerms || "net_30",
        deliveryRegions: input.deliveryRegions || [],
        status: "pending",
      })
      .returning();

    return supplier;
  }

  async verifySupplier(supplierId: string) {
    const [supplier] = await db
      .update(suppliers)
      .set({
        status: "verified",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    return supplier;
  }

  async matchSuppliersToDemand(
    demandId: string,
    options?: { category?: string; minTrustScore?: number; region?: string }
  ) {
    const [demand] = await db
      .select()
      .from(villageDemands)
      .where(eq(villageDemands.id, demandId));

    if (!demand) {
      throw new Error("Demand not found");
    }

    let query = db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.status, "verified"),
          sql`${suppliers.categories} @> ${JSON.stringify([demand.category])}`
        )
      )
      .orderBy(desc(suppliers.trustScore));

    if (options?.minTrustScore) {
      query = db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.status, "verified"),
            sql`${suppliers.categories} @> ${JSON.stringify([demand.category])}`,
            gte(suppliers.trustScore, options.minTrustScore)
          )
        )
        .orderBy(desc(suppliers.trustScore)) as typeof query;
    }

    return query;
  }

  async getSupplier(supplierId: string) {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId));
    return supplier;
  }

  async listSuppliers(options?: { category?: string; status?: string }) {
    let query = db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.trustScore));

    if (options?.status) {
      query = db
        .select()
        .from(suppliers)
        .where(eq(suppliers.status, options.status as any))
        .orderBy(desc(suppliers.trustScore)) as typeof query;
    }

    return query;
  }

  async updateSupplierTrust(supplierId: string, successfulOrder: boolean) {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId));

    if (!supplier) return null;

    const newTrustScore = successfulOrder
      ? Math.min(1000, supplier.trustScore + 10)
      : Math.max(100, supplier.trustScore - 20);

    const [updated] = await db
      .update(suppliers)
      .set({
        trustScore: newTrustScore,
        successfulOrders: supplier.successfulOrders + (successfulOrder ? 1 : 0),
        totalOrderValue: supplier.totalOrderValue + (successfulOrder ? 1 : 0),
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    return updated;
  }
}

// =============================================================================
// CONTRACT NEGOTIATION SERVICE
// =============================================================================

export class ContractNegotiationService {
  async submitBid(input: CreateBidInput) {
    const [demand] = await db
      .select()
      .from(villageDemands)
      .where(eq(villageDemands.id, input.demandId));

    if (!demand) {
      throw new Error("Demand not found");
    }

    const totalPrice = input.unitPrice * input.quantityOffered;
    const savingsFromRetail =
      demand.quantity * Number(demand.individualPrice) - totalPrice;
    const discountPercent =
      ((Number(demand.individualPrice) - input.unitPrice) /
        Number(demand.individualPrice)) *
      100;

    const [bid] = await db
      .insert(bids)
      .values({
        demandId: input.demandId,
        supplyId: input.supplyId,
        circleId: input.circleId,
        supplierId: input.supplierId,
        unitPrice: input.unitPrice,
        totalPrice,
        quantityOffered: input.quantityOffered,
        deliveryTime: input.deliveryTime,
        deliveryTerms: input.deliveryTerms,
        paymentTerms: input.paymentTerms,
        warranty: input.warranty,
        additionalNotes: input.additionalNotes,
        discountPercent: Math.round(discountPercent),
        savingsFromRetail,
        expiresAt: input.expiresAt,
        status: "submitted",
      })
      .returning();

    return bid;
  }

  async getBidsForDemand(demandId: string) {
    return db
      .select()
      .from(bids)
      .where(eq(bids.demandId, demandId))
      .orderBy(bids.unitPrice);
  }

  async shortlistBid(bidId: string) {
    const [bid] = await db
      .update(bids)
      .set({ status: "shortlisted", updatedAt: new Date() })
      .where(eq(bids.id, bidId))
      .returning();

    return bid;
  }

  async acceptBid(bidId: string) {
    const [bid] = await db
      .update(bids)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(bids.id, bidId))
      .returning();

    await db
      .update(bids)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(
        and(
          eq(bids.demandId, bid.demandId),
          sql`${bids.id} != ${bidId}`
        )
      );

    return bid;
  }

  async createContract(input: CreateContractInput) {
    const contractNumber = `CPME-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const totalValue = input.unitPrice * input.quantity;
    const coordinationFeePercent = input.coordinationFeePercent || 50;
    const coordinationFee = Math.round(
      (totalValue * coordinationFeePercent) / 1000
    );
    const netValue = totalValue - coordinationFee;

    const [contract] = await db
      .insert(contracts)
      .values({
        contractNumber,
        circleId: input.circleId,
        demandId: input.demandId,
        supplyId: input.supplyId,
        supplierId: input.supplierId,
        winningBidId: input.winningBidId,
        memberVillageIds: input.memberVillageIds,
        product: input.product,
        quantity: input.quantity,
        unit: input.unit,
        unitPrice: input.unitPrice,
        totalValue,
        coordinationFeePercent,
        coordinationFee,
        netValue,
        deliveryTerms: input.deliveryTerms,
        paymentTerms: input.paymentTerms,
        deliveryDeadline: input.deliveryDeadline,
        status: "draft",
      })
      .returning();

    return contract;
  }

  async approveContract(contractId: string, voteId: string) {
    const [contract] = await db
      .update(contracts)
      .set({
        status: "pending_approval",
        approvalVoteId: voteId,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))
      .returning();

    return contract;
  }

  async signContract(contractId: string) {
    const [contract] = await db
      .update(contracts)
      .set({
        status: "active",
        signedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contractId))
      .returning();

    if (contract.demandId) {
      await db
        .update(villageDemands)
        .set({ status: "fulfilled", updatedAt: new Date() })
        .where(eq(villageDemands.id, contract.demandId));
    }

    return contract;
  }

  async getContracts(options?: {
    supplierId?: string;
    circleId?: string;
    status?: string;
  }) {
    let query = db
      .select()
      .from(contracts)
      .orderBy(desc(contracts.createdAt));

    if (options?.supplierId) {
      query = db
        .select()
        .from(contracts)
        .where(eq(contracts.supplierId, options.supplierId))
        .orderBy(desc(contracts.createdAt)) as typeof query;
    }

    if (options?.circleId) {
      query = db
        .select()
        .from(contracts)
        .where(eq(contracts.circleId, options.circleId))
        .orderBy(desc(contracts.createdAt)) as typeof query;
    }

    if (options?.status) {
      query = db
        .select()
        .from(contracts)
        .where(eq(contracts.status, options.status as any))
        .orderBy(desc(contracts.createdAt)) as typeof query;
    }

    return query;
  }
}

// =============================================================================
// ORDER SETTLEMENT SERVICE
// =============================================================================

export class OrderSettlementService {
  async initiateSettlement(contractId: string, paidByVillageId: string) {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contractId));

    if (!contract) {
      throw new Error("Contract not found");
    }

    const [settlement] = await db
      .insert(orderSettlements)
      .values({
        contractId,
        amount: contract.totalValue,
        paidByVillageId,
        paidToSupplierId: contract.supplierId,
        status: "pending",
      })
      .returning();

    return settlement;
  }

  async confirmPayment(settlementId: string, paymentReference: string) {
    const [settlement] = await db
      .update(orderSettlements)
      .set({
        status: "paid",
        paymentReference,
        paymentConfirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orderSettlements.id, settlementId))
      .returning();

    await db
      .update(contracts)
      .set({ status: "fulfilling", updatedAt: new Date() })
      .where(eq(contracts.id, settlement.contractId));

    return settlement;
  }

  async markShipped(settlementId: string, trackingNumber?: string) {
    const [settlement] = await db
      .update(orderSettlements)
      .set({
        status: "shipped",
        shippedAt: new Date(),
        trackingNumber,
        updatedAt: new Date(),
      })
      .where(eq(orderSettlements.id, settlementId))
      .returning();

    return settlement;
  }

  async markDelivered(settlementId: string) {
    const [settlement] = await db
      .update(orderSettlements)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orderSettlements.id, settlementId))
      .returning();

    return settlement;
  }

  async confirmReceipt(settlementId: string) {
    const [settlement] = await db
      .update(orderSettlements)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orderSettlements.id, settlementId))
      .returning();

    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, settlement.contractId));

    if (contract) {
      await db
        .update(contracts)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(contracts.id, contract.id));
    }

    await db
      .update(suppliers)
      .set({
        successfulOrders: sql`${suppliers.successfulOrders} + 1`,
        totalOrderValue: sql`${suppliers.totalOrderValue} + ${settlement.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, settlement.paidToSupplierId));

    return settlement;
  }

  async raiseDispute(settlementId: string, reason: string) {
    const [settlement] = await db
      .update(orderSettlements)
      .set({
        status: "disputed",
        disputeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(orderSettlements.id, settlementId))
      .returning();

    await db
      .update(contracts)
      .set({ status: "disputed", updatedAt: new Date() })
      .where(eq(contracts.id, settlement.contractId));

    return settlement;
  }

  async getSettlement(settlementId: string) {
    const [settlement] = await db
      .select()
      .from(orderSettlements)
      .where(eq(orderSettlements.id, settlementId));
    return settlement;
  }

  async getContractSettlements(contractId: string) {
    return db
      .select()
      .from(orderSettlements)
      .where(eq(orderSettlements.contractId, contractId));
  }
}

// =============================================================================
// PROCUREMENT CIRCLE SERVICE
// =============================================================================

export class ProcurementCircleService {
  async createCircle(input: {
    name: string;
    description?: string;
    category: string;
    creatorVillageId: string;
    minVillages?: number;
    maxVillages?: number;
    coordinationFeePercent?: number;
    deadline?: Date;
  }) {
    const [circle] = await db
      .insert(procurementCircles)
      .values({
        name: input.name,
        description: input.description,
        category: input.category,
        creatorVillageId: input.creatorVillageId,
        memberVillageIds: [input.creatorVillageId],
        minVillages: input.minVillages || 1,
        maxVillages: input.maxVillages,
        coordinationFeePercent: input.coordinationFeePercent || 50,
        deadline: input.deadline,
        status: "forming",
      })
      .returning();

    return circle;
  }

  async joinCircle(circleId: string, villageId: string) {
    const [circle] = await db
      .select()
      .from(procurementCircles)
      .where(eq(procurementCircles.id, circleId));

    if (!circle) {
      throw new Error("Circle not found");
    }

    const currentMembers = circle.memberVillageIds || [];
    if (circle.maxVillages && currentMembers.length >= circle.maxVillages) {
      throw new Error("Circle is at maximum capacity");
    }

    const memberVillageIds = [...currentMembers, villageId];

    const newStatus =
      memberVillageIds.length >= circle.minVillages ? "active" : "forming";

    const [updated] = await db
      .update(procurementCircles)
      .set({
        memberVillageIds,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(procurementCircles.id, circleId))
      .returning();

    return updated;
  }

  async getCircles(options?: { category?: string; status?: string }) {
    let query = db
      .select()
      .from(procurementCircles)
      .orderBy(desc(procurementCircles.createdAt));

    if (options?.category) {
      query = db
        .select()
        .from(procurementCircles)
        .where(eq(procurementCircles.category, options.category))
        .orderBy(desc(procurementCircles.createdAt)) as typeof query;
    }

    if (options?.status) {
      query = db
        .select()
        .from(procurementCircles)
        .where(eq(procurementCircles.status, options.status as any))
        .orderBy(desc(procurementCircles.createdAt)) as typeof query;
    }

    return query;
  }

  async getCircle(circleId: string) {
    const [circle] = await db
      .select()
      .from(procurementCircles)
      .where(eq(procurementCircles.id, circleId));
    return circle;
  }

  async lockCircleDemand(circleId: string) {
    const [circle] = await db
      .update(procurementCircles)
      .set({
        status: "negotiating",
        updatedAt: new Date(),
      })
      .where(eq(procurementCircles.id, circleId))
      .returning();

    await db
      .update(villageDemands)
      .set({ status: "locked", updatedAt: new Date() })
      .where(eq(villageDemands.circleId, circleId));

    return circle;
  }
}

// =============================================================================
// MARKET INTELLIGENCE SERVICE
// =============================================================================

export class MarketIntelligenceService {
  async recordTransaction(data: {
    category: string;
    product: string;
    region?: string;
    quantity: number;
    price: number;
    villageCount: number;
    savingsPercent?: number;
  }) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setMonth(periodStart.getMonth() - 1);

    const periodEnd = new Date();
    periodEnd.setDate(0);

    const existing = await db
      .select()
      .from(marketIntelligenceTable)
      .where(
        and(
          eq(marketIntelligenceTable.product, data.product),
          eq(marketIntelligenceTable.category, data.category),
          eq(marketIntelligenceTable.periodStart, periodStart)
        )
      )
      .then((r) => r[0]);

    if (existing) {
      const newTotalDemand = Number(existing.totalDemand) + data.quantity;
      const newTotalValue =
        Number(existing.averagePrice || 0) * Number(existing.totalDemand) +
        data.price * data.quantity;

      await db
        .update(marketIntelligenceTable)
        .set({
          totalDemand: newTotalDemand,
          averagePrice: Math.round(newTotalValue / newTotalDemand),
          participatingVillages: existing.participatingVillages + data.villageCount,
          averageSavingsPercent: Math.round(
            ((existing.averageSavingsPercent || 0) + (data.savingsPercent || 0)) / 2
          ),
        })
        .where(eq(marketIntelligenceTable.id, existing.id));
    } else {
      await db.insert(marketIntelligenceTable).values({
        category: data.category,
        product: data.product,
        region: data.region,
        periodStart,
        periodEnd,
        totalDemand: data.quantity,
        averagePrice: data.price,
        participatingVillages: data.villageCount,
        averageSavingsPercent: data.savingsPercent || 0,
      });
    }
  }

  async getIntelligence(category?: string, product?: string, region?: string) {
    let query = db
      .select()
      .from(marketIntelligenceTable)
      .orderBy(desc(marketIntelligenceTable.periodEnd));

    if (category) {
      query = db
        .select()
        .from(marketIntelligenceTable)
        .where(eq(marketIntelligenceTable.category, category))
        .orderBy(desc(marketIntelligenceTable.periodEnd)) as typeof query;
    }

    if (product) {
      query = db
        .select()
        .from(marketIntelligenceTable)
        .where(eq(marketIntelligenceTable.product, product))
        .orderBy(desc(marketIntelligenceTable.periodEnd)) as typeof query;
    }

    return query;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const demandAggregation = new DemandAggregationService();
export const supplyAggregation = new SupplyAggregationService();
export const supplierMatching = new SupplierMatchingService();
export const contractNegotiation = new ContractNegotiationService();
export const orderSettlement = new OrderSettlementService();
export const procurementCircle = new ProcurementCircleService();
export const marketIntel = new MarketIntelligenceService();

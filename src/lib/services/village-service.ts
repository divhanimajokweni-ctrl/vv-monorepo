/**
 * Ubuntu Pools — Village OS Service
 * Business logic for programmable economic units
 */

import { db } from "@/db/client";
import {
  villages,
  villageMembers,
  liquidityPools,
  poolContributions,
  procurementEvents,
  procurementParticipants,
  investments,
  investmentBackers,
  insurancePools,
  insuranceMembers,
  insuranceClaims,
  villageProposals,
  villageVotes,
  villageMessages,
  villageRelations,
  type NewVillage,
  type NewVillageMember,
  type NewLiquidityPool,
  type NewPoolContribution,
  type NewProcurementEvent,
  type NewInvestment,
  type NewInsurancePool,
  type NewVillageProposal,
} from "@/db/schema-village";
import { eq, and, desc, sql, gt, lt, gte, lte } from "drizzle-orm";

export interface CreateVillageInput {
  name: string;
  description?: string;
  founderId: string;
  currency?: string;
  isPublic?: boolean;
  tags?: string[];
  location?: {
    country?: string;
    region?: string;
    coordinates?: { lat: number; lng: number };
  };
  settings?: {
    minContribution?: number;
    maxMembers?: number;
    votingPeriodDays?: number;
    quorumThreshold?: number;
    approvalThreshold?: number;
  };
}

export interface JoinVillageInput {
  villageId: string;
  userId: string;
  role?: "admin" | "treasurer" | "member";
}

export interface CreatePoolInput {
  villageId: string;
  poolType: "savings" | "procurement" | "investment" | "insurance";
  name: string;
  description?: string;
  contributionAmount: number;
  totalCycles: number;
  cycleDuration?: number;
}

export interface ContributeToPoolInput {
  poolId: string;
  memberId: string;
  userId: string;
  cycle: number;
  amount: number;
}

export interface CreateProcurementInput {
  villageId: string;
  organizerId: string;
  product: string;
  description?: string;
  totalVolume: number;
  individualPrice: number;
  negotiatedPrice: number;
  minParticipants?: number;
  deadline?: Date;
}

export interface CreateInvestmentInput {
  villageId: string;
  businessName: string;
  description?: string;
  investmentAmount: number;
  expectedReturn: number;
}

export interface CreateInsuranceInput {
  villageId: string;
  name: string;
  coverageType: string;
  description?: string;
  monthlyContribution: number;
  coverageLimit?: number;
}

export interface CreateProposalInput {
  villageId: string;
  proposerId: string;
  proposalType: string;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
}

export interface CastVoteInput {
  proposalId: string;
  voterId: string;
  vote: "approved" | "rejected";
  weight: number;
}

export interface SendMessageInput {
  villageId: string;
  senderId: string;
  channel: string;
  content: string;
  isEncrypted?: boolean;
  eventReference?: string;
}

export class VillageService {
  async createVillage(input: CreateVillageInput) {
    const [village] = await db
      .insert(villages)
      .values({
        name: input.name,
        description: input.description,
        founderId: input.founderId,
        currency: input.currency || "USD",
        isPublic: input.isPublic ?? true,
        tags: input.tags || [],
        location: input.location || {},
        settings: input.settings || {},
      })
      .returning();

    await db.insert(villageMembers).values({
      villageId: village.id,
      userId: input.founderId,
      role: "admin",
      ubuntuScore: 500,
      reputationScore: 500,
      governanceWeight: Math.floor(Math.sqrt(500)),
    });

    return village;
  }

  async getVillage(villageId: string) {
    const [village] = await db
      .select()
      .from(villages)
      .where(eq(villages.id, villageId));
    return village;
  }

  async listVillages(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    let query = db
      .select()
      .from(villages)
      .orderBy(desc(villages.createdAt));

    if (options?.search) {
      query = query.where(
        sql`${villages.name} ILIKE ${`%${options.search}%`}`
      ) as typeof query;
    }

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return query;
  }

  async joinVillage(input: JoinVillageInput) {
    const [member] = await db
      .insert(villageMembers)
      .values({
        villageId: input.villageId,
        userId: input.userId,
        role: input.role || "member",
        ubuntuScore: 500,
        reputationScore: 500,
        governanceWeight: Math.floor(Math.sqrt(500)),
      })
      .onConflictDoNothing()
      .returning();

    return member;
  }

  async leaveVillage(villageId: string, userId: string) {
    await db
      .delete(villageMembers)
      .where(
        and(
          eq(villageMembers.villageId, villageId),
          eq(villageMembers.userId, userId)
        )
      );
  }

  async getVillageMembers(villageId: string) {
    return db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.villageId, villageId))
      .orderBy(desc(villageMembers.joinedAt));
  }

  async getMemberRole(villageId: string, userId: string) {
    const [member] = await db
      .select()
      .from(villageMembers)
      .where(
        and(
          eq(villageMembers.villageId, villageId),
          eq(villageMembers.userId, userId)
        )
      );
    return member;
  }

  async createPool(input: CreatePoolInput) {
    const village = await this.getVillage(input.villageId);
    if (!village) {
      throw new Error("Village not found");
    }

    const payoutOrder: Array<{ userId: string; cycle: number }> = [];
    const members = await this.getVillageMembers(input.villageId);

    for (let i = 0; i < input.totalCycles; i++) {
      if (members[i % members.length]) {
        payoutOrder.push({
          userId: members[i % members.length].userId,
          cycle: i + 1,
        });
      }
    }

    const [pool] = await db
      .insert(liquidityPools)
      .values({
        villageId: input.villageId,
        poolType: input.poolType,
        name: input.name,
        description: input.description,
        contributionAmount: input.contributionAmount,
        totalCycles: input.totalCycles,
        cycleDuration: input.cycleDuration || 30,
        payoutOrder,
        memberCount: members.length,
      })
      .returning();

    return pool;
  }

  async getVillagePools(villageId: string) {
    return db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.villageId, villageId))
      .orderBy(desc(liquidityPools.createdAt));
  }

  async contributeToPool(input: ContributeToPoolInput) {
    const [contribution] = await db
      .insert(poolContributions)
      .values({
        poolId: input.poolId,
        memberId: input.memberId,
        userId: input.userId,
        cycle: input.cycle,
        amount: input.amount,
        status: "paid",
        paidAt: new Date(),
      })
      .returning();

    const pool = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.id, input.poolId))
      .then((r) => r[0]);

    if (pool) {
      await db
        .update(liquidityPools)
        .set({
          totalFunds: pool.totalFunds + input.amount,
        })
        .where(eq(liquidityPools.id, input.poolId));
    }

    return contribution;
  }

  async getPoolContributions(poolId: string) {
    return db
      .select()
      .from(poolContributions)
      .where(eq(poolContributions.poolId, poolId))
      .orderBy(desc(poolContributions.createdAt));
  }

  async createProcurementEvent(input: CreateProcurementInput) {
    const savingsPercent = Math.round(
      ((input.individualPrice - input.negotiatedPrice) / input.individualPrice) *
        100
    );

    const [event] = await db
      .insert(procurementEvents)
      .values({
        villageId: input.villageId,
        organizerId: input.organizerId,
        product: input.product,
        description: input.description,
        totalVolume: input.totalVolume,
        individualPrice: input.individualPrice,
        negotiatedPrice: input.negotiatedPrice,
        savingsPercent,
        minParticipants: input.minParticipants || 1,
        deadline: input.deadline,
        status: "proposed",
      })
      .returning();

    return event;
  }

  async joinProcurement(eventId: string, userId: string, quantity: number = 1) {
    const [participant] = await db
      .insert(procurementParticipants)
      .values({
        eventId,
        userId,
        quantity,
      })
      .onConflictDoNothing()
      .returning();

    const event = await db
      .select()
      .from(procurementEvents)
      .where(eq(procurementEvents.id, eventId))
      .then((r) => r[0]);

    if (event) {
      await db
        .update(procurementEvents)
        .set({
          participantCount: event.participantCount + quantity,
        })
        .where(eq(procurementEvents.id, eventId));
    }

    return participant;
  }

  async getVillageProcurements(villageId: string) {
    return db
      .select()
      .from(procurementEvents)
      .where(eq(procurementEvents.villageId, villageId))
      .orderBy(desc(procurementEvents.createdAt));
  }

  async createInvestment(input: CreateInvestmentInput) {
    const [investment] = await db
      .insert(investments)
      .values({
        villageId: input.villageId,
        businessName: input.businessName,
        description: input.description,
        investmentAmount: input.investmentAmount,
        expectedReturn: input.expectedReturn,
        returnRate: Math.round(
          ((input.expectedReturn - input.investmentAmount) /
            input.investmentAmount) *
            100
        ),
        status: "proposed",
      })
      .returning();

    return investment;
  }

  async backInvestment(investmentId: string, userId: string, amount: number) {
    const investment = await db
      .select()
      .from(investments)
      .where(eq(investments.id, investmentId))
      .then((r) => r[0]);

    if (!investment) {
      throw new Error("Investment not found");
    }

    const expectedReturn = Math.round(
      (amount / investment.investmentAmount) * investment.expectedReturn
    );

    const [backer] = await db
      .insert(investmentBackers)
      .values({
        investmentId,
        userId,
        amount,
        expectedReturn,
      })
      .returning();

    await db
      .update(investments)
      .set({
        investorCount: investment.investorCount + 1,
      })
      .where(eq(investments.id, investmentId));

    return backer;
  }

  async getVillageInvestments(villageId: string) {
    return db
      .select()
      .from(investments)
      .where(eq(investments.villageId, villageId))
      .orderBy(desc(investments.createdAt));
  }

  async createInsurancePool(input: CreateInsuranceInput) {
    const [pool] = await db
      .insert(insurancePools)
      .values({
        villageId: input.villageId,
        name: input.name,
        coverageType: input.coverageType,
        description: input.description,
        monthlyContribution: input.monthlyContribution,
        coverageLimit: input.coverageLimit,
        status: "active",
      })
      .returning();

    return pool;
  }

  async joinInsurancePool(poolId: string, memberId: string, userId: string) {
    const [member] = await db
      .insert(insuranceMembers)
      .values({
        poolId,
        memberId,
        userId,
      })
      .onConflictDoNothing()
      .returning();

    const pool = await db
      .select()
      .from(insurancePools)
      .where(eq(insurancePools.id, poolId))
      .then((r) => r[0]);

    if (pool) {
      await db
        .update(insurancePools)
        .set({
          memberCount: pool.memberCount + 1,
        })
        .where(eq(insurancePools.id, poolId));
    }

    return member;
  }

  async submitClaim(
    poolId: string,
    claimantId: string,
    memberId: string,
    claimAmount: number,
    reason: string,
    description?: string
  ) {
    const [claim] = await db
      .insert(insuranceClaims)
      .values({
        poolId,
        claimantId,
        memberId,
        claimAmount,
        reason,
        description,
        status: "pending",
      })
      .returning();

    return claim;
  }

  async reviewClaim(
    claimId: string,
    reviewerId: string,
    approvedAmount?: number,
    approved?: boolean
  ) {
    const status = approved ? "approved" : "rejected";

    await db
      .update(insuranceClaims)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        approvedAmount: approvedAmount,
      })
      .where(eq(insuranceClaims.id, claimId));
  }

  async getVillageInsurancePools(villageId: string) {
    return db
      .select()
      .from(insurancePools)
      .where(eq(insurancePools.villageId, villageId))
      .orderBy(desc(insurancePools.createdAt));
  }

  async createProposal(input: CreateProposalInput) {
    const member = await this.getMemberRole(input.villageId, input.proposerId);
    const weight = member?.governanceWeight || 1;

    const votingPeriodEnd = new Date();
    votingPeriodEnd.setDate(votingPeriodEnd.getDate() + 7);

    const [proposal] = await db
      .insert(villageProposals)
      .values({
        villageId: input.villageId,
        proposerId: input.proposerId,
        proposalType: input.proposalType,
        title: input.title,
        description: input.description,
        payload: input.payload || {},
        votingPeriodStart: new Date(),
        votingPeriodEnd,
        status: "active",
      })
      .returning();

    return proposal;
  }

  async castVote(input: CastVoteInput) {
    const [vote] = await db
      .insert(villageVotes)
      .values({
        proposalId: input.proposalId,
        voterId: input.voterId,
        vote: input.vote,
        weight: input.weight,
      })
      .onConflictDoNothing()
      .returning();

    const proposal = await db
      .select()
      .from(villageProposals)
      .where(eq(villageProposals.id, input.proposalId))
      .then((r) => r[0]);

    if (proposal && vote) {
      const updateFields: Record<string, number> = {
        totalWeight: proposal.totalWeight + input.weight,
      };

      if (input.vote === "approved") {
        updateFields.votesFor = proposal.votesFor + input.weight;
      } else {
        updateFields.votesAgainst = proposal.votesAgainst + input.weight;
      }

      await db
        .update(villageProposals)
        .set(updateFields)
        .where(eq(villageProposals.id, input.proposalId));
    }

    return vote;
  }

  async getVillageProposals(villageId: string) {
    return db
      .select()
      .from(villageProposals)
      .where(eq(villageProposals.villageId, villageId))
      .orderBy(desc(villageProposals.createdAt));
  }

  async sendMessage(input: SendMessageInput) {
    const [message] = await db
      .insert(villageMessages)
      .values({
        villageId: input.villageId,
        senderId: input.senderId,
        channel: input.channel,
        content: input.content,
        isEncrypted: input.isEncrypted || false,
        eventReference: input.eventReference,
      })
      .returning();

    return message;
  }

  async getVillageMessages(
    villageId: string,
    channel?: string,
    limit: number = 50
  ) {
    let query = db
      .select()
      .from(villageMessages)
      .where(eq(villageMessages.villageId, villageId))
      .orderBy(desc(villageMessages.createdAt))
      .limit(limit);

    if (channel) {
      query = db
        .select()
        .from(villageMessages)
        .where(
          and(
            eq(villageMessages.villageId, villageId),
            eq(villageMessages.channel, channel)
          )
        )
        .orderBy(desc(villageMessages.createdAt))
        .limit(limit) as typeof query;
    }

    return query;
  }

  async linkVillages(
    fromVillageId: string,
    toVillageId: string,
    relationType: string,
    description?: string
  ) {
    const [relation] = await db
      .insert(villageRelations)
      .values({
        fromVillageId,
        toVillageId,
        relationType,
        description,
      })
      .onConflictDoNothing()
      .returning();

    return relation;
  }

  async getVillageRelations(villageId: string) {
    const outgoing = await db
      .select()
      .from(villageRelations)
      .where(eq(villageRelations.fromVillageId, villageId));

    const incoming = await db
      .select()
      .from(villageRelations)
      .where(eq(villageRelations.toVillageId, villageId));

    return { outgoing, incoming };
  }

  async calculateVillageScore(villageId: string) {
    const members = await this.getVillageMembers(villageId);
    const avgUserScore =
      members.length > 0
        ? members.reduce((sum, m) => sum + m.ubuntuScore, 0) / members.length
        : 0;

    const pools = await this.getVillagePools(villageId);
    const totalPoolFunds = pools.reduce((sum, p) => sum + Number(p.totalFunds), 0);

    const poolStability =
      pools.length > 0
        ? pools.reduce(
            (sum, p) =>
              sum + (p.currentCycle / Math.max(1, p.totalCycles)) * 100,
            0
          ) / pools.length
        : 100;

    const proposals = await this.getVillageProposals(villageId);
    const governanceParticipation = Math.min(
      100,
      proposals.length * 10
    );

    const score = Math.round(
      avgUserScore * 0.4 +
        Math.min(1000, Math.log(totalPoolFunds + 1) * 100) * 0.3 +
        poolStability * 0.2 +
        governanceParticipation * 0.1
    );

    return Math.max(100, Math.min(1000, score));
  }

  async updateVillageScore(villageId: string) {
    const newScore = await this.calculateVillageScore(villageId);

    await db
      .update(villages)
      .set({
        villageScore: newScore,
        updatedAt: new Date(),
      })
      .where(eq(villages.id, villageId));

    return newScore;
  }

  async processRoscaCycle(poolId: string) {
    const [pool] = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.id, poolId));

    if (!pool || pool.status !== "active") {
      throw new Error("Pool not found or inactive");
    }

    if (pool.currentCycle >= pool.totalCycles) {
      await db
        .update(liquidityPools)
        .set({ status: "completed" })
        .where(eq(liquidityPools.id, poolId));
      return null;
    }

    const contributions = await db
      .select()
      .from(poolContributions)
      .where(
        and(
          eq(poolContributions.poolId, poolId),
          eq(poolContributions.cycle, pool.currentCycle),
          eq(poolContributions.status, "paid")
        )
      );

    const totalCollected = contributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    await db
      .update(liquidityPools)
      .set({
        totalFunds: pool.totalFunds + totalCollected,
        currentCycle: pool.currentCycle + 1,
      })
      .where(eq(liquidityPools.id, poolId));

    return {
      cycle: pool.currentCycle,
      totalCollected,
      nextPayout: pool.payoutOrder?.[pool.currentCycle - 1] || null,
    };
  }
}

export const villageService = new VillageService();

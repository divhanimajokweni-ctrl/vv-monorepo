/**
 * Ubuntu Pools — Village Economic Mirror
 * Real-time visualization of collective economic power
 */

import { db } from "@/db/client";
import {
  villages,
  villageMembers,
  liquidityPools,
  poolContributions,
  procurementEvents,
  investments,
  insurancePools,
  villageProposals,
  villageMessages,
} from "@/db/schema-village";
import { eq, and, sql, desc, sum, count } from "drizzle-orm";

export interface VillageEconomicMirror {
  village: {
    id: string;
    name: string;
    score: number;
    memberCount: number;
  };
  collectivePower: {
    monthlyBuyingPower: number;
    monthlySavingsPotential: number;
    sharedEmergencyBuffer: number;
    pooledInvestments: number;
  };
  yourImpact: {
    monthlyContribution: number;
    villageMultiplier: number;
    unlockedValue: number;
    eligibleOpportunities: string[];
  };
  milestones: VillageMilestone[];
  recentActivity: VillageActivity[];
}

export interface VillageMilestone {
  id: string;
  type: "pool_target" | "member_count" | "savings" | "procurement" | "governance";
  title: string;
  progress: number;
  target: number;
  achieved: boolean;
}

export interface VillageActivity {
  id: string;
  type: ActivityType;
  actor: string;
  description: string;
  timestamp: Date;
  impact?: string;
}

export type ActivityType =
  | "pool_contribution"
  | "member_joined"
  | "proposal_created"
  | "vote_cast"
  | "procurement_completed"
  | "investment_funded"
  | "insurance_claim"
  | "message_sent"
  | "endorsement_given";

export class VillageEconomicMirrorService {
  async getEconomicMirror(villageId: string, memberId?: string): Promise<VillageEconomicMirror> {
    const [village] = await db
      .select()
      .from(villages)
      .where(eq(villages.id, villageId))
      .limit(1);

    if (!village) {
      throw new Error("Village not found");
    }

    const members = await db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.villageId, villageId));

    const pools = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.villageId, villageId));

    const poolFunds = pools.reduce((sum, p) => sum + Number(p.totalFunds || 0), 0);
    const poolContribAmount = pools.reduce((sum, p) => sum + Number(p.contributionAmount || 0), 0);

    const procurements = await db
      .select()
      .from(procurementEvents)
      .where(eq(procurementEvents.villageId, villageId));

    const investAmount = await db
      .select({ total: sum(investments.investmentAmount) })
      .from(investments)
      .where(eq(investments.villageId, villageId))
      .then((r) => Number(r[0]?.total || 0));

    const insurancePoolsData = await db
      .select()
      .from(insurancePools)
      .where(eq(insurancePools.villageId, villageId));

    const insuranceBalance = insurancePoolsData.reduce(
      (sum, p) => sum + Number(p.poolBalance || 0),
      0
    );

    const avgScore = members.length > 0
      ? members.reduce((sum, m) => sum + m.ubuntuScore, 0) / members.length
      : 500;

    const villageMultiplier = 1 + Math.log10(Math.max(1, poolFunds / 1000)) + (avgScore / 200);

    let memberContribution = 0;
    let eligibleOpportunities: string[] = [];

    if (memberId) {
      const [member] = members.filter((m) => m.id === memberId);
      if (member) {
        memberContribution = Number(member.totalContributions || 0);

        if (member.ubuntuScore >= 50) {
          eligibleOpportunities.push("Emergency Credit (R2,000)");
        }
        if (member.ubuntuScore >= 60) {
          eligibleOpportunities.push("Procurement Pool Access");
        }
        if (member.ubuntuScore >= 70) {
          eligibleOpportunities.push("Village Investment Voting");
        }
        if (member.governanceWeight >= 5) {
          eligibleOpportunities.push("Proposal Creation");
        }
      }
    }

    const monthlyBuyingPower = members.length * 1000;
    const savingsRate = 0.15;
    const monthlySavingsPotential = monthlyBuyingPower * savingsRate;
    const sharedEmergencyBuffer = insuranceBalance + (poolFunds * 0.1);

    const milestones = this.calculateMilestones(village, members.length, poolFunds, procurements);
    const recentActivity = await this.getRecentActivity(villageId);

    return {
      village: {
        id: village.id,
        name: village.name,
        score: village.villageScore,
        memberCount: members.length,
      },
      collectivePower: {
        monthlyBuyingPower,
        monthlySavingsPotential,
        sharedEmergencyBuffer,
        pooledInvestments: investAmount,
      },
      yourImpact: {
        monthlyContribution: memberContribution,
        villageMultiplier: Math.round(villageMultiplier * 100) / 100,
        unlockedValue: Math.round(memberContribution * villageMultiplier),
        eligibleOpportunities,
      },
      milestones,
      recentActivity,
    };
  }

  private calculateMilestones(
    village: any,
    memberCount: number,
    poolFunds: number,
    procurements: any[]
  ): VillageMilestone[] {
    const milestones: VillageMilestone[] = [];

    milestones.push({
      id: "member_25",
      type: "member_count",
      title: "Reach 25 Members",
      progress: memberCount,
      target: 25,
      achieved: memberCount >= 25,
    });

    milestones.push({
      id: "pool_100k",
      type: "pool_target",
      title: "R100,000 Pooled Capital",
      progress: poolFunds,
      target: 100000,
      achieved: poolFunds >= 100000,
    });

    const completedProcurements = procurements.filter((p) => p.status === "completed");
    milestones.push({
      id: "procurement_5",
      type: "procurement",
      title: "5 Procurement Deals",
      progress: completedProcurements.length,
      target: 5,
      achieved: completedProcurements.length >= 5,
    });

    milestones.push({
      id: "savings_10pct",
      type: "savings",
      title: "10% Monthly Savings",
      progress: 0,
      target: 10,
      achieved: false,
    });

    return milestones;
  }

  private async getRecentActivity(villageId: string): Promise<VillageActivity[]> {
    const activities: VillageActivity[] = [];

    const recentProposals = await db
      .select()
      .from(villageProposals)
      .where(eq(villageProposals.villageId, villageId))
      .orderBy(desc(villageProposals.createdAt))
      .limit(3);

    for (const proposal of recentProposals) {
      activities.push({
        id: proposal.id,
        type: "proposal_created",
        actor: proposal.proposerId.slice(0, 8),
        description: `New proposal: ${proposal.title}`,
        timestamp: new Date(proposal.createdAt),
      });
    }

    const recentMessages = await db
      .select()
      .from(villageMessages)
      .where(eq(villageMessages.villageId, villageId))
      .orderBy(desc(villageMessages.createdAt))
      .limit(2);

    for (const message of recentMessages) {
      activities.push({
        id: message.id,
        type: "message_sent",
        actor: message.senderId.slice(0, 8),
        description: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
        timestamp: new Date(message.createdAt),
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }

  async getActivityFeed(villageId: string, limit: number = 20): Promise<VillageActivity[]> {
    return this.getRecentActivity(villageId);
  }

  generateImpactNarrative(mirror: VillageEconomicMirror): string {
    const parts: string[] = [];

    parts.push(`Your village of ${mirror.village.memberCount} members has collective buying power of R${mirror.collectivePower.monthlyBuyingPower.toLocaleString()} monthly.`);

    if (mirror.yourImpact.villageMultiplier > 1) {
      parts.push(`Your R${mirror.yourImpact.monthlyContribution} contribution unlocks R${mirror.yourImpact.unlockedValue} in collective value.`);
    }

    if (mirror.collectivePower.sharedEmergencyBuffer > 0) {
      parts.push(`Your shared emergency buffer stands at R${mirror.collectivePower.sharedEmergencyBuffer.toLocaleString()}.`);
    }

    const nextMilestone = mirror.milestones.find((m) => !m.achieved);
    if (nextMilestone) {
      const percent = Math.round((nextMilestone.progress / nextMilestone.target) * 100);
      parts.push(`Next milestone: ${nextMilestone.title} is ${percent}% complete.`);
    }

    return parts.join(" ");
  }
}

export const villageMirror = new VillageEconomicMirrorService();

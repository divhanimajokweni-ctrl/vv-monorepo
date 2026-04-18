/**
 * Ubuntu Pools — Living Village Loop
 * Activity engine that makes the village feel alive
 */

import { db } from "@ubuntu/db/client";
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
  insuranceClaims,
  villageProposals,
  villageVotes,
} from "@ubuntu/db/schema-village";
import { eq, and, sql, desc, gt, lt, gte, count } from "drizzle-orm";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  villageId: string;
  actorId?: string;
  actorName?: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  priority: "low" | "medium" | "high";
}

export type ActivityEventType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "POOL_CREATED"
  | "CONTRIBUTION_MADE"
  | "POOL_COMPLETED"
  | "PROCUREMENT_STARTED"
  | "PROCUREMENT_COMPLETED"
  | "INVESTMENT_CREATED"
  | "INVESTMENT_FUNDED"
  | "INSURANCE_CLAIM"
  | "INSURANCE_CLAIM_PAID"
  | "PROPOSAL_CREATED"
  | "VOTE_CAST"
  | "GOVERNANCE_DECISION"
  | "VILLAGE_MILESTONE"
  | "ENDORSEMENT_GIVEN"
  | "TRUST_SCORE_INCREASED";

export interface ActivityFeedConfig {
  villageId: string;
  limit: number;
  includeTypes?: ActivityEventType[];
  excludeTypes?: ActivityEventType[];
  since?: Date;
}

const ACTIVITY_CONFIG = {
  MAX_EVENTS_PER_QUERY: 50,
  STALE_THRESHOLD_HOURS: 24,
  PRIORITY_THRESHOLDS: {
    high: ["VILLAGE_MILESTONE", "GOVERNANCE_DECISION", "INSURANCE_CLAIM_PAID"],
    medium: ["MEMBER_JOINED", "CONTRIBUTION_MADE", "INVESTMENT_FUNDED"],
    low: ["MEMBER_LEFT", "VOTE_CAST"],
  },
} as const;

export class LivingVillageLoop {
  async generateActivityEvents(config: ActivityFeedConfig): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    const since = config.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const memberEvents = await this.getMemberActivity(config.villageId, since);
    events.push(...memberEvents);

    const poolEvents = await this.getPoolActivity(config.villageId, since);
    events.push(...poolEvents);

    const procurementEvents_ = await this.getProcurementActivity(config.villageId, since);
    events.push(...procurementEvents_);

    const investmentEvents = await this.getInvestmentActivity(config.villageId, since);
    events.push(...investmentEvents);

    const insuranceEvents = await this.getInsuranceActivity(config.villageId, since);
    events.push(...insuranceEvents);

    const governanceEvents = await this.getGovernanceActivity(config.villageId, since);
    events.push(...governanceEvents);

    const milestoneEvents = await this.getMilestoneActivity(config.villageId);
    events.push(...milestoneEvents);

    let filtered = events;

    if (config.includeTypes && config.includeTypes.length > 0) {
      filtered = filtered.filter((e) => config.includeTypes!.includes(e.type));
    }

    if (config.excludeTypes && config.excludeTypes.length > 0) {
      filtered = filtered.filter((e) => !config.excludeTypes!.includes(e.type));
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered.slice(0, config.limit);
  }

  private async getMemberActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const members = await db
      .select()
      .from(villageMembers)
      .where(
        and(
          eq(villageMembers.villageId, villageId),
          gt(villageMembers.joinedAt, since)
        )
      )
      .orderBy(desc(villageMembers.joinedAt));

    return members.map((member) => ({
      id: `member_join_${member.id}`,
      type: "MEMBER_JOINED" as ActivityEventType,
      villageId,
      actorId: member.id,
      title: "New Member Joined",
      description: `A new member joined the village`,
      timestamp: new Date(member.joinedAt),
      priority: "medium" as const,
    }));
  }

  private async getPoolActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const contributions = await db
      .select({
        id: poolContributions.id,
        amount: poolContributions.amount,
        memberId: poolContributions.memberId,
        poolId: poolContributions.poolId,
        createdAt: poolContributions.createdAt,
      })
      .from(poolContributions)
      .innerJoin(liquidityPools, eq(poolContributions.poolId, liquidityPools.id))
      .where(
        and(
          eq(liquidityPools.villageId, villageId),
          gt(poolContributions.createdAt, since)
        )
      )
      .orderBy(desc(poolContributions.createdAt))
      .limit(10);

    for (const contrib of contributions) {
      events.push({
        id: `contrib_${contrib.id}`,
        type: "CONTRIBUTION_MADE" as ActivityEventType,
        villageId,
        actorId: contrib.memberId,
        title: "Pool Contribution",
        description: `R${Number(contrib.amount).toLocaleString()} contributed to savings pool`,
        timestamp: new Date(contrib.createdAt),
        priority: "medium",
      });
    }

    return events;
  }

  private async getProcurementActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const procurements = await db
      .select()
      .from(procurementEvents)
      .where(
        and(
          eq(procurementEvents.villageId, villageId),
          gt(procurementEvents.createdAt, since)
        )
      )
      .orderBy(desc(procurementEvents.createdAt));

    for (const proc of procurements) {
      events.push({
        id: `procurement_${proc.id}`,
        type: proc.status === "completed" ? "PROCUREMENT_COMPLETED" : "PROCUREMENT_STARTED",
        villageId,
        actorId: proc.organizerId,
        title: proc.status === "completed" ? "Procurement Completed" : "New Procurement Started",
        description: `${proc.product}: ${proc.savingsPercent}% savings achieved`,
        metadata: { savings: proc.savingsPercent, participants: proc.participantCount },
        timestamp: new Date(proc.createdAt),
        priority: proc.status === "completed" ? "high" : "medium",
      });
    }

    return events;
  }

  private async getInvestmentActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const investBackers = await db
      .select({
        id: investmentBackers.id,
        amount: investmentBackers.amount,
        userId: investmentBackers.userId,
        investmentId: investmentBackers.investmentId,
        createdAt: investmentBackers.createdAt,
        businessName: investments.businessName,
        status: investments.status,
      })
      .from(investmentBackers)
      .innerJoin(investments, eq(investmentBackers.investmentId, investments.id))
      .where(
        and(
          eq(investments.villageId, villageId),
          gt(investmentBackers.createdAt, since)
        )
      )
      .orderBy(desc(investmentBackers.createdAt));

    for (const backer of investBackers) {
      events.push({
        id: `backer_${backer.id}`,
        type: "INVESTMENT_FUNDED" as ActivityEventType,
        villageId,
        actorId: backer.userId,
        title: "Investment Backed",
        description: `R${backer.amount.toLocaleString()} invested in ${backer.businessName}`,
        metadata: { investmentId: backer.investmentId },
        timestamp: new Date(backer.createdAt),
        priority: "medium",
      });
    }

    return events;
  }

  private async getInsuranceActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const claims = await db
      .select()
      .from(insuranceClaims)
      .innerJoin(insurancePools, eq(insuranceClaims.poolId, insurancePools.id))
      .where(
        and(
          eq(insurancePools.villageId, villageId),
          gt(insuranceClaims.createdAt, since)
        )
      )
      .orderBy(desc(insuranceClaims.createdAt));

    for (const claim of claims) {
      events.push({
        id: `claim_${claim.insurance_claims.id}`,
        type: claim.insurance_claims.status === "paid" 
          ? "INSURANCE_CLAIM_PAID" 
          : "INSURANCE_CLAIM",
        villageId,
        actorId: claim.insurance_claims.claimantId,
        title: claim.insurance_claims.status === "paid" 
          ? "Insurance Claim Paid" 
          : "Insurance Claim Filed",
        description: `R${claim.insurance_claims.claimAmount.toLocaleString()} ${claim.insurance_claims.status}`,
        timestamp: new Date(claim.insurance_claims.createdAt),
        priority: claim.insurance_claims.status === "paid" ? "high" : "medium",
      });
    }

    return events;
  }

  private async getGovernanceActivity(villageId: string, since: Date): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const proposals = await db
      .select()
      .from(villageProposals)
      .where(
        and(
          eq(villageProposals.villageId, villageId),
          gt(villageProposals.createdAt, since)
        )
      )
      .orderBy(desc(villageProposals.createdAt));

    for (const proposal of proposals) {
      events.push({
        id: `proposal_${proposal.id}`,
        type: "PROPOSAL_CREATED" as ActivityEventType,
        villageId,
        actorId: proposal.proposerId,
        title: "New Proposal",
        description: proposal.title,
        metadata: { votesFor: proposal.votesFor, votesAgainst: proposal.votesAgainst },
        timestamp: new Date(proposal.createdAt),
        priority: "medium",
      });
    }

    const votes = await db
      .select()
      .from(villageVotes)
      .innerJoin(villageProposals, eq(villageVotes.proposalId, villageProposals.id))
      .where(
        and(
          eq(villageProposals.villageId, villageId),
          gt(villageVotes.createdAt, since)
        )
      )
      .orderBy(desc(villageVotes.createdAt))
      .limit(5);

    for (const vote of votes) {
      events.push({
        id: `vote_${vote.village_votes.id}`,
        type: "VOTE_CAST" as ActivityEventType,
        villageId,
        actorId: vote.village_votes.voterId,
        title: "Vote Cast",
        description: `Voted ${vote.village_votes.vote} on proposal`,
        timestamp: new Date(vote.village_votes.createdAt),
        priority: "low",
      });
    }

    return events;
  }

  private async getMilestoneActivity(villageId: string): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    const [village] = await db
      .select()
      .from(villages)
      .where(eq(villages.id, villageId))
      .limit(1);

    if (!village) return events;

    const memberCount = await db
      .select({ count: count() })
      .from(villageMembers)
      .where(eq(villageMembers.villageId, villageId))
      .then((r) => Number(r[0]?.count || 0));

    if (memberCount > 0 && memberCount % 10 === 0) {
      events.push({
        id: `milestone_members_${memberCount}`,
        type: "VILLAGE_MILESTONE",
        villageId,
        title: "Member Milestone!",
        description: `Village has reached ${memberCount} members`,
        timestamp: new Date(),
        priority: "high",
      });
    }

    return events;
  }

  formatActivityForFeed(event: ActivityEvent): string {
    const timeAgo = this.getTimeAgo(event.timestamp);

    switch (event.type) {
      case "MEMBER_JOINED":
        return `${timeAgo} • A new member joined the village`;
      case "CONTRIBUTION_MADE":
        return `${timeAgo} • ${event.description}`;
      case "PROCUREMENT_COMPLETED":
        return `${timeAgo} • Procurement complete: ${event.description}`;
      case "INVESTMENT_FUNDED":
        return `${timeAgo} • ${event.description}`;
      case "INSURANCE_CLAIM_PAID":
        return `${timeAgo} • Insurance claim paid: ${event.description}`;
      case "PROPOSAL_CREATED":
        return `${timeAgo} • New proposal: ${event.title}`;
      case "VOTE_CAST":
        return `${timeAgo} • ${event.description}`;
      case "VILLAGE_MILESTONE":
        return `${timeAgo} • 🎉 ${event.description}`;
      default:
        return `${timeAgo} • ${event.title}`;
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  async getActivitySummary(villageId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    lastActivity: Date | null;
  }> {
    const events = await this.generateActivityEvents({
      villageId,
      limit: ACTIVITY_CONFIG.MAX_EVENTS_PER_QUERY,
    });

    const byType = events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: events.length,
      byType,
      lastActivity: events.length > 0 ? events[0].timestamp : null,
    };
  }
}

export const livingVillageLoop = new LivingVillageLoop();

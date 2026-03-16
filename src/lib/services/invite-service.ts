/**
 * Ubuntu Pools — Invite Chain Service
 * Trust-based onboarding with proper guardrails
 */

import { db } from "@/db/client";
import {
  invites,
  inviteRelationships,
  invitePenalties,
  anchorInvitations,
  type NewInvite,
  type NewInviteRelationship,
  type NewInvitePenalty,
  type NewAnchorInvitation,
} from "@/db/schema-invite";
import { villageMembers, villages } from "@/db/schema-village";
import { eq, and, sql, desc, gt, lt } from "drizzle-orm";
import { getTrustTier } from "@/lib/reputation/friction";

const INVITE_CONFIG = {
  EXPIRY_DAYS: 14,
  NOVICE_MAX_INVITES: 2,
  CONTRIBUTOR_MAX_INVITES: 5,
  STEWARD_MAX_INVITES: 10,
  ARCHIVIST_MAX_INVITES: -1,
  RISK_SHARE_PERCENT: 10,
  MAX_PENALTY_POINTS: 50,
  DIVERSITY_REQUIREMENT: 5,
} as const;

export interface CreateInviteInput {
  inviterId: string;
  inviterVillageId: string;
  inviteeEmail?: string;
  inviteeName?: string;
  villageId: string;
}

export interface AcceptInviteInput {
  inviteCode: string;
  inviteeId: string;
}

export interface RecordPenaltyInput {
  inviterId: string;
  inviteeId: string;
  reason: string;
  description?: string;
}

export interface InviteResult {
  success: boolean;
  invite?: any;
  error?: string;
  remainingInvites?: number;
}

export class InviteChainService {
  private generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getInviterStats(inviterId: string) {
    const sentInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.inviterId, inviterId));

    const acceptedInvites = sentInvites.filter((i) => i.status === "accepted");
    const pendingInvites = sentInvites.filter((i) => i.status === "pending");
    const expiredInvites = sentInvites.filter((i) => i.status === "expired");

    const penalties = await db
      .select()
      .from(invitePenalties)
      .where(eq(invitePenalties.inviterId, inviterId));

    const totalPenaltyPoints = penalties.reduce((sum, p) => sum + p.penaltyPoints, 0);

    return {
      totalSent: sentInvites.length,
      accepted: acceptedInvites.length,
      pending: pendingInvites.length,
      expired: expiredInvites.length,
      penaltyPoints: totalPenaltyPoints,
      activeInvites: pendingInvites.length,
    };
  }

  async canInvite(inviterId: string): Promise<{
    canInvite: boolean;
    maxInvites: number;
    currentInvites: number;
    remainingInvites: number;
    reason?: string;
  }> {
    const [member] = await db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.id, inviterId))
      .limit(1);

    if (!member) {
      return {
        canInvite: false,
        maxInvites: 0,
        currentInvites: 0,
        remainingInvites: 0,
        reason: "Member not found",
      };
    }

    const stats = await this.getInviterStats(inviterId);
    const tier = getTrustTier(member.ubuntuScore);

    const maxInvites = tier.maxInvites === -1 ? 999 : tier.maxInvites;
    const remainingInvites = maxInvites - stats.accepted;

    if (remainingInvites <= 0) {
      return {
        canInvite: false,
        maxInvites,
        currentInvites: stats.accepted,
        remainingInvites: 0,
        reason: `You've reached your maximum invites (${maxInvites}). Build more trust to earn more invites.`,
      };
    }

    const penalties = await db
      .select()
      .from(invitePenalties)
      .where(eq(invitePenalties.inviterId, inviterId));

    const totalPenaltyPoints = penalties.reduce((sum, p) => sum + p.penaltyPoints, 0);

    if (totalPenaltyPoints >= INVITE_CONFIG.MAX_PENALTY_POINTS) {
      return {
        canInvite: false,
        maxInvites,
        currentInvites: stats.accepted,
        remainingInvites: 0,
        reason: "Your invite privileges have been suspended due to invitee violations.",
      };
    }

    return {
      canInvite: true,
      maxInvites,
      currentInvites: stats.accepted,
      remainingInvites,
    };
  }

  async createInvite(input: CreateInviteInput): Promise<InviteResult> {
    const canInvite = await this.canInvite(input.inviterId);

    if (!canInvite.canInvite) {
      return {
        success: false,
        error: canInvite.reason,
      };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_CONFIG.EXPIRY_DAYS);

    const [invite] = await db
      .insert(invites)
      .values({
        inviterId: input.inviterId,
        inviterVillageId: input.inviterVillageId,
        inviteeEmail: input.inviteeEmail,
        inviteeName: input.inviteeName,
        inviteCode: this.generateInviteCode(),
        villageId: input.villageId,
        status: "pending",
        tier: "novice",
        expiresAt,
        inviterRiskShare: INVITE_CONFIG.RISK_SHARE_PERCENT,
      })
      .returning();

    return {
      success: true,
      invite,
      remainingInvites: canInvite.remainingInvites - 1,
    };
  }

  async acceptInvite(input: AcceptInviteInput): Promise<InviteResult> {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.inviteCode, input.inviteCode))
      .limit(1);

    if (!invite) {
      return { success: false, error: "Invalid invite code" };
    }

    if (invite.status === "accepted") {
      return { success: false, error: "Invite already used" };
    }

    if (invite.status === "revoked") {
      return { success: false, error: "Invite has been revoked" };
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      await db
        .update(invites)
        .set({ status: "expired" })
        .where(eq(invites.id, invite.id));

      return { success: false, error: "Invite has expired" };
    }

    if (invite.currentUses >= invite.maxUses) {
      return { success: false, error: "Invite has reached maximum uses" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(invites)
        .set({
          status: "accepted",
          currentUses: invite.currentUses + 1,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));

      await tx.insert(inviteRelationships).values({
        inviterId: invite.inviterId,
        inviteeId: input.inviteeId,
        inviteId: invite.id,
        villageId: invite.villageId,
        trustLevel: 100 - invite.inviterRiskShare,
        riskShareActive: true,
      });
    });

    return {
      success: true,
      invite: { ...invite, status: "accepted" },
    };
  }

  async recordPenalty(input: RecordPenaltyInput): Promise<void> {
    await db.insert(invitePenalties).values({
      inviterId: input.inviterId,
      inviteeId: input.inviteeId,
      reason: input.reason,
      penaltyPoints: INVITE_CONFIG.RISK_SHARE_PERCENT,
      description: input.description,
    });

    const [member] = await db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.id, input.inviterId))
      .limit(1);

    if (member) {
      const newScore = Math.max(0, member.ubuntuScore - INVITE_CONFIG.RISK_SHARE_PERCENT);
      await db
        .update(villageMembers)
        .set({ ubuntuScore: newScore })
        .where(eq(villageMembers.id, input.inviterId));
    }
  }

  async revokeInvite(inviteId: string, inviterId: string): Promise<InviteResult> {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId))
      .limit(1);

    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.inviterId !== inviterId) {
      return { success: false, error: "Not authorized to revoke this invite" };
    }

    await db
      .update(invites)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(invites.id, inviteId));

    return { success: true };
  }

  async registerAnchor(input: {
    anchorId: string;
    anchorName: string;
    anchorTitle?: string;
    villageId: string;
    communityType: string;
    inviteQuota?: number;
  }): Promise<void> {
    await db.insert(anchorInvitations).values({
      anchorId: input.anchorId,
      anchorName: input.anchorName,
      anchorTitle: input.anchorTitle,
      villageId: input.villageId,
      communityType: input.communityType,
      inviteQuota: input.inviteQuota || 50,
      verifiedAt: new Date(),
    });
  }

  async getInvitesForVillage(villageId: string) {
    return db
      .select()
      .from(invites)
      .where(eq(invites.villageId, villageId))
      .orderBy(desc(invites.createdAt));
  }

  async getInviteStats() {
    const allInvites = await db.select().from(invites);
    const byStatus = allInvites.reduce(
      (acc, invite) => {
        acc[invite.status] = (acc[invite.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: allInvites.length,
      accepted: allInvites.filter((i) => i.status === "accepted").length,
      pending: allInvites.filter((i) => i.status === "pending").length,
      expired: allInvites.filter((i) => i.status === "expired").length,
      revoked: allInvites.filter((i) => i.status === "revoked").length,
      acceptanceRate:
        allInvites.length > 0
          ? (allInvites.filter((i) => i.status === "accepted").length / allInvites.length) * 100
          : 0,
      byStatus,
    };
  }

  async getVillageInviteNetwork(villageId: string) {
    const villageInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.villageId, villageId));

    const relationships = await db
      .select()
      .from(inviteRelationships)
      .where(eq(inviteRelationships.villageId, villageId));

    const inviterIds = [...new Set(relationships.map((r) => r.inviterId))];
    const inviteeIds = [...new Set(relationships.map((r) => r.inviteeId))];

    return {
      totalInvites: villageInvites.length,
      acceptedInvites: villageInvites.filter((i) => i.status === "accepted").length,
      uniqueInviters: inviterIds.length,
      uniqueInvitees: inviteeIds.length,
      networkDepth: this.calculateNetworkDepth(relationships),
    };
  }

  private calculateNetworkDepth(relationships: any[]): number {
    if (relationships.length === 0) return 0;

    const adjacency = new Map<string, Set<string>>();

    for (const rel of relationships) {
      if (!adjacency.has(rel.inviterId)) {
        adjacency.set(rel.inviterId, new Set());
      }
      adjacency.get(rel.inviterId)!.add(rel.inviteeId);
    }

    let maxDepth = 0;
    const visited = new Set<string>();

    for (const [inviter] of adjacency) {
      const depth = this.getDepth(inviter, adjacency, visited, 0);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private getDepth(
    node: string,
    adjacency: Map<string, Set<string>>,
    visited: Set<string>,
    currentDepth: number
  ): number {
    if (visited.has(node)) return currentDepth;
    visited.add(node);

    const children = adjacency.get(node);
    if (!children || children.size === 0) return currentDepth;

    let maxChildDepth = currentDepth;
    for (const child of children) {
      const childDepth = this.getDepth(child, adjacency, visited, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  }
}

export const inviteChain = new InviteChainService();

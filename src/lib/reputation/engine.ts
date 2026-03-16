/**
 * Ubuntu Pools — Trust-Based Reputation System
 * Authority derived from collective prosperity contribution
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';

export const TrustScoreSchema = z.object({
  userId: z.string().uuid(),
  compositeScore: z.number().min(0).max(100),
  components: z.object({
    reciprocityIndex: z.number().min(0).max(100),
    consistencyScore: z.number().min(0).max(100),
    communityEndorsements: z.number().min(0).max(100),
    governanceParticipation: z.number().min(0).max(100),
    resourceSharing: z.number().min(0).max(100),
  }),
  trustCircle: z.array(z.string().uuid()),
  lastUpdated: z.string().datetime(),
});

export type TrustScore = z.infer<typeof TrustScoreSchema>;

export const AuthorityLevelSchema = z.enum([
  'novice',
  'contributor',
  'trusted_member',
  'elder',
  'archivist',
]);

export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>;

export interface TrustEvent {
  type: 'help_given' | 'help_received' | 'endorsement_given' | 'endorsement_received' | 'governance_vote' | 'resource_shared';
  userId: string;
  targetUserId?: string;
  amount: number;
  timestamp: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export const AUTHORITY_LEVELS: Record<AuthorityLevel, { minScore: number; maxScore: number; privileges: string[] }> = {
  novice: {
    minScore: 0,
    maxScore: 25,
    privileges: ['view_only', 'basic_participation'],
  },
  contributor: {
    minScore: 25,
    maxScore: 50,
    privileges: ['create_proposals', 'mentor_new_members'],
  },
  trusted_member: {
    minScore: 50,
    maxScore: 75,
    privileges: ['vote_on_governance', '审核_content', 'create_proposals', 'mentor_new_members'],
  },
  elder: {
    minScore: 75,
    maxScore: 90,
    privileges: ['propose_constitutional_changes', 'arbitrate_disputes', 'vote_on_governance', '审核_content', 'create_proposals', 'mentor_new_members'],
  },
  archivist: {
    minScore: 90,
    maxScore: 100,
    privileges: ['modify_protocol_parameters', 'emergency_powers', 'propose_constitutional_changes', 'arbitrate_disputes', 'vote_on_governance', '审核_content', 'create_proposals', 'mentor_new_members'],
  },
};

export class ReputationEngine {
  private eventHistory: TrustEvent[] = [];

  calculateTrustScore(userId: string, allEvents: TrustEvent[]): TrustScore {
    const now = new Date().toISOString();
    const activeEvents = allEvents.filter(e => !e.expiresAt || e.expiresAt > now);
    const userEvents = activeEvents.filter(e => e.userId === userId || e.targetUserId === userId);
    
    const reciprocityIndex = this.calculateReciprocity(userEvents, userId);
    const consistencyScore = this.calculateConsistency(userEvents);
    const communityEndorsements = this.calculateEndorsements(userEvents, userId);
    const governanceParticipation = this.calculateGovernanceParticipation(userEvents);
    const resourceSharing = this.calculateResourceSharing(userEvents);

    const weightedScore = (
      0.25 * reciprocityIndex +
      0.20 * consistencyScore +
      0.20 * communityEndorsements +
      0.20 * governanceParticipation +
      0.15 * resourceSharing
    );

    const trustCircle = this.getTrustCircle(userEvents, userId);
    const trustMultiplier = Math.min(1 + (trustCircle.length * 0.05), 2.0);
    const compositeScore = Math.min(Math.round(weightedScore * trustMultiplier), 100);

    return {
      userId,
      compositeScore,
      components: {
        reciprocityIndex: Math.round(reciprocityIndex),
        consistencyScore: Math.round(consistencyScore),
        communityEndorsements: Math.round(communityEndorsements),
        governanceParticipation: Math.round(governanceParticipation),
        resourceSharing: Math.round(resourceSharing),
      },
      trustCircle,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateReciprocity(events: TrustEvent[], userId: string): number {
    const helpGiven = events
      .filter(e => e.type === 'help_given' && e.userId === userId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const helpReceived = events
      .filter(e => e.type === 'help_received' && e.userId === userId)
      .reduce((sum, e) => sum + e.amount, 0);

    if (helpReceived === 0) return helpGiven > 0 ? 100 : 50;
    return Math.min((helpGiven / helpReceived) * 50, 100);
  }

  private calculateConsistency(events: TrustEvent[]): number {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > thirtyDaysAgo);
    const uniqueDays = new Set(recentEvents.map(e => e.timestamp.split('T')[0])).size;
    
    return Math.min((uniqueDays / 30) * 100, 100);
  }

  private calculateEndorsements(events: TrustEvent[], userId: string): number {
    const endorsementsGiven = events.filter(e => e.type === 'endorsement_given' && e.userId === userId).length;
    const endorsementsReceived = events.filter(e => e.type === 'endorsement_received' && e.userId === userId).length;
    
    const baseScore = Math.min(endorsementsReceived * 10, 80);
    const bonus = endorsementsGiven > 0 ? 20 : 0;
    
    return Math.min(baseScore + bonus, 100);
  }

  private calculateGovernanceParticipation(events: TrustEvent[]): number {
    const governanceEvents = events.filter(e => e.type === 'governance_vote');
    const uniqueProposals = new Set(governanceEvents.map(e => e.metadata?.proposalId as string)).size;
    
    return Math.min(uniqueProposals * 5, 100);
  }

  private calculateResourceSharing(events: TrustEvent[]): number {
    const resources = events.filter(e => e.type === 'resource_shared');
    const totalValue = resources.reduce((sum, e) => sum + e.amount, 0);
    
    return Math.min(totalValue / 10, 100);
  }

  private getTrustCircle(events: TrustEvent[], userId: string): string[] {
    const endorsements = events.filter(
      e => (e.type === 'endorsement_received' && e.userId === userId) ||
           (e.type === 'endorsement_given' && e.targetUserId === userId)
    );
    
    const uniqueUsers = new Set<string>();
    endorsements.forEach(e => {
      if (e.userId !== userId) uniqueUsers.add(e.userId);
      if (e.targetUserId && e.targetUserId !== userId) uniqueUsers.add(e.targetUserId);
    });
    
    return Array.from(uniqueUsers);
  }

  getAuthorityLevel(score: number): AuthorityLevel {
    if (score >= 90) return 'archivist';
    if (score >= 75) return 'elder';
    if (score >= 50) return 'trusted_member';
    if (score >= 25) return 'contributor';
    return 'novice';
  }

  getPrivileges(score: number): string[] {
    const level = this.getAuthorityLevel(score);
    return AUTHORITY_LEVELS[level].privileges;
  }

  hasPrivilege(score: number, privilege: string): boolean {
    return this.getPrivileges(score).includes(privilege);
  }
}

export const reputationEngine = new ReputationEngine();

export function calculateTrustScore(userId: string, events: TrustEvent[]): TrustScore {
  return reputationEngine.calculateTrustScore(userId, events);
}

export function getAuthorityLevel(score: number): AuthorityLevel {
  return reputationEngine.getAuthorityLevel(score);
}

export function canPerformAction(score: number, action: string): boolean {
  return reputationEngine.hasPrivilege(score, action);
}

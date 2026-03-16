/**
 * Ubuntu Pools — Reputation Friction System
 * Mechanisms to prevent reputation inflation and maintain trust integrity
 */

import { db } from "@/db/client";
import { villageMembers, villages, liquidityPools } from "@/db/schema-village";
import { eq, and, sql, desc } from "drizzle-orm";

export const REPUTATION_FRICTION_CONFIG = {
  DECAY_HALFLIFE_DAYS: 90,
  MAX_INFLUENCE_PER_USER_PERCENT: 5,
  MIN_ENDORSEMENTS_FOR_DIVERSITY: 5,
  REPUTATION_AGE_WEIGHT: 0.15,
  ACTIVITY_DECAY_ENABLED: true,
  NEGATIVE_SIGNAL_THRESHOLD: 3,
} as const;

export interface ReputationFrictionInput {
  memberId: string;
  baseScore: number;
  accountCreatedAt: Date;
  lastActiveAt: Date;
  endorsements: Endorsement[];
  interactions: MemberInteraction[];
}

export interface Endorsement {
  endorserId: string;
  endorserScore: number;
  weight: number;
}

export interface MemberInteraction {
  counterpartyId: string;
  counterpartyScore: number;
  type: "contribution" | "loan" | "trade" | "governance";
  value: number;
  occurredAt: Date;
}

export interface ReputationFrictionResult {
  adjustedScore: number;
  reputationAgeMultiplier: number;
  diversityPenalty: number;
  activityDecay: number;
  maxInfluenceCap: number;
  finalScore: number;
}

function calculateReputationAge(
  accountCreatedAt: Date,
  lastActiveAt: Date,
  currentDate: Date = new Date()
): number {
  const daysSinceCreation = 
    (currentDate.getTime() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceActive = 
    (currentDate.getTime() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  
  const reputationAgeYears = daysSinceCreation / 365;
  
  const recencyFactor = Math.exp(-daysSinceActive / REPUTATION_FRICTION_CONFIG.DECAY_HALFLIFE_DAYS);
  
  return reputationAgeYears * recencyFactor;
}

export function applyReputationAgeMultiplier(
  baseScore: number,
  reputationAgeYears: number
): number {
  const weight = REPUTATION_FRICTION_CONFIG.REPUTATION_AGE_WEIGHT;
  const ageBonus = Math.min(reputationAgeYears * 5, 20);
  const multiplier = 1 + (ageBonus * weight / 100);
  
  return baseScore * multiplier;
}

export function calculateDiversityPenalty(
  endorsements: Endorsement[],
  interactions: MemberInteraction[]
): number {
  if (endorsements.length < REPUTATION_FRICTION_CONFIG.MIN_ENDORSEMENTS_FOR_DIVERSITY) {
    return 1 - (endorsements.length / REPUTATION_FRICTION_CONFIG.MIN_ENDORSEMENTS_FOR_DIVERSITY) * 0.1;
  }
  
  const endorserScores = endorsements.map(e => e.endorserScore);
  const avgScore = endorserScores.reduce((a, b) => a + b, 0) / endorserScores.length;
  const variance = endorserScores.reduce((sum, score) => 
    sum + Math.pow(score - avgScore, 2), 0) / endorserScores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev < 10) {
    return 0.95;
  }
  
  if (stdDev < 30) {
    return 1.0;
  }
  
  return 1.0 + Math.min(stdDev / 200, 0.1);
}

export function applyMaxInfluenceCap(
  endorsements: Endorsement[]
): number {
  if (endorsements.length === 0) return 1.0;
  
  const totalWeight = endorsements.reduce((sum, e) => sum + e.weight, 0);
  const maxAllowed = REPUTATION_FRICTION_CONFIG.MAX_INFLUENCE_PER_USER_PERCENT / 100;
  
  const sortedByInfluence = [...endorsements].sort((a, b) => 
    (b.endorserScore * b.weight) - (a.endorserScore * a.weight)
  );
  
  let cumulativeWeight = 0;
  let capApplied = 1.0;
  
  for (const endorsement of sortedByInfluence) {
    const influence = (endorsement.endorserScore * endorsement.weight) / totalWeight;
    
    if (influence > maxAllowed) {
      const excess = influence - maxAllowed;
      capApplied -= excess;
    }
  }
  
  return Math.max(capApplied, 0.8);
}

export function calculateActivityDecay(
  lastActiveAt: Date,
  currentDate: Date = new Date()
): number {
  const daysSinceActive = 
    (currentDate.getTime() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceActive <= 0) return 1.0;
  if (daysSinceActive <= 7) return 1.0;
  if (daysSinceActive <= 30) return 0.96;
  if (daysSinceActive <= 90) return 0.80;
  if (daysSinceActive <= 180) return 0.60;
  if (daysSinceActive <= 365) return 0.40;
  
  return 0.25;
}

export function calculateNegativeSignalPenalty(
  negativeSignals: number
): number {
  const threshold = REPUTATION_FRICTION_CONFIG.NEGATIVE_SIGNAL_THRESHOLD;
  
  if (negativeSignals <= threshold) return 1.0;
  
  const excess = negativeSignals - threshold;
  const penalty = Math.min(excess * 0.1, 0.5);
  
  return 1 - penalty;
}

export function applyReputationFriction(
  input: ReputationFrictionInput,
  negativeSignals: number = 0
): ReputationFrictionResult {
  const accountCreatedAt = new Date(input.accountCreatedAt);
  const lastActiveAt = new Date(input.lastActiveAt);
  const currentDate = new Date();
  
  const reputationAgeYears = calculateReputationAge(accountCreatedAt, lastActiveAt, currentDate);
  const reputationAgeMultiplier = applyReputationAgeMultiplier(input.baseScore, reputationAgeYears);
  
  const diversityPenalty = calculateDiversityPenalty(input.endorsements, input.interactions);
  
  const maxInfluenceCap = applyMaxInfluenceCap(input.endorsements);
  
  const activityDecay = REPUTATION_FRICTION_CONFIG.ACTIVITY_DECAY_ENABLED 
    ? calculateActivityDecay(lastActiveAt, currentDate)
    : 1.0;
  
  const negativePenalty = calculateNegativeSignalPenalty(negativeSignals);
  
  const finalScore = Math.round(
    input.baseScore *
    (reputationAgeMultiplier / input.baseScore) *
    diversityPenalty *
    maxInfluenceCap *
    activityDecay *
    negativePenalty
  );
  
  return {
    adjustedScore: Math.round(reputationAgeMultiplier),
    reputationAgeMultiplier: Math.round(reputationAgeMultiplier),
    diversityPenalty: Math.round(diversityPenalty * 100) / 100,
    activityDecay: Math.round(activityDecay * 100) / 100,
    maxInfluenceCap: Math.round(maxInfluenceCap * 100) / 100,
    finalScore: Math.max(1, Math.min(100, finalScore)),
  };
}

export async function getMemberReputationProfile(memberId: string) {
  const [member] = await db
    .select()
    .from(villageMembers)
    .where(eq(villageMembers.id, memberId))
    .limit(1);
  
  if (!member) return null;
  
  const endorsements = await db
    .select({
      endorserId: villageMembers.id,
      endorserScore: villageMembers.ubuntuScore,
    })
    .from(villageMembers)
    .where(eq(villageMembers.villageId, member.villageId))
    .limit(20);
  
  return {
    member,
    endorsements,
    hasDiversity: endorsements.length >= REPUTATION_FRICTION_CONFIG.MIN_ENDORSEMENTS_FOR_DIVERSITY,
  };
}

export function getTrustTier(score: number): {
  tier: string;
  privileges: string[];
  maxInvites: number;
} {
  if (score >= 90) {
    return {
      tier: "archivist",
      privileges: ["view_all", "propose_constitutional", "emergency_override", "invite_unlimited"],
      maxInvites: -1,
    };
  }
  if (score >= 75) {
    return {
      tier: "steward",
      privileges: ["view_all", "propose_standard", "manage_pools", "invite_10"],
      maxInvites: 10,
    };
  }
  if (score >= 50) {
    return {
      tier: "contributor",
      privileges: ["view_limited", "propose_simple", "invite_5"],
      maxInvites: 5,
    };
  }
  if (score >= 25) {
    return {
      tier: "novice",
      privileges: ["view_basic", "invite_2"],
      maxInvites: 2,
    };
  }
  return {
    tier: "observer",
    privileges: ["view_public"],
    maxInvites: 0,
  };
}

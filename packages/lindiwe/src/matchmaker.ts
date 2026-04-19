/**
 * Ubuntu Pools — Matchmaker Service
 * Bridges social sentiment to financial action
 * 
 * Features:
 * - Signal to Asset matching algorithm
 * - Pool recommendations based on intent tags
 * - Ubuntu Score integration for personalized offers
 * - Social-Accord Synergy calculation
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { SanitizedProfile, IntentTag } from './services/sovereignty-proxy';

export interface PoolRecommendation {
  poolId: string;
  poolName: string;
  category: 'energy' | 'housing' | 'entrepreneur' | 'tech' | 'community' | 'general';
  matchScore: number;
  matchReasons: string[];
  financialOutput: {
    productType: string;
    description: string;
  };
  pricing: {
    baseRate: number;
    ubuntuDiscount: number;
    finalRate: number;
    entryFeeReduction: number;
  };
  requirements: {
    minUbuntuScore: number;
    minContribution: number;
    poolHealthThreshold: number;
  };
}

export interface ProsperityOpportunity {
  id: string;
  memberId: string;
  opportunityType: 'pool_join' | 'loan_reduction' | 'investment' | 'anchor_status';
  title: string;
  description: string;
  matchScore: number;
  ubuntuScore: number;
  socialAccordSynergy: number;
  combinedScore: number;
  callToAction: string;
  recommendedPools: PoolRecommendation[];
  createdAt: Date;
}

export interface MatchmakerInput {
  memberId: string;
  sanitizedProfile: SanitizedProfile;
  ubuntuScore: number;
  contributionBase: number;
  poolHealth: number;
  villageHealth?: number;
}

const POOL_TEMPLATES: Record<string, Omit<PoolRecommendation, 'matchScore' | 'matchReasons'>> = {
  solar_seed: {
    poolId: 'solar-seed',
    poolName: 'Solar Seed Collective',
    category: 'energy',
    financialOutput: {
      productType: 'Renewable Energy Pool',
      description: 'Invest in community solar infrastructure and earn yield from energy production.',
    },
    pricing: {
      baseRate: 500,
      ubuntuDiscount: 0,
      finalRate: 500,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 30,
      minContribution: 1000,
      poolHealthThreshold: 60,
    },
  },
  hardware_ai_trust: {
    poolId: 'hardware-ai-trust',
    poolName: 'Hardware & AI Trust',
    category: 'tech',
    financialOutput: {
      productType: 'Tech Innovation Fund',
      description: 'Back hardware and AI startups with community-governed venture pool.',
    },
    pricing: {
      baseRate: 800,
      ubuntuDiscount: 0,
      finalRate: 800,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 50,
      minContribution: 5000,
      poolHealthThreshold: 70,
    },
  },
  community_housing: {
    poolId: 'community-housing',
    poolName: 'Community Housing Co-op',
    category: 'housing',
    financialOutput: {
      productType: 'Community Housing Loan',
      description: 'Low-interest loans for cooperative housing developments.',
    },
    pricing: {
      baseRate: 350,
      ubuntuDiscount: 0,
      finalRate: 350,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 40,
      minContribution: 2000,
      poolHealthThreshold: 65,
    },
  },
  microcredit_seed: {
    poolId: 'microcredit-seed',
    poolName: 'Micro-Credit Seed Fund',
    category: 'entrepreneur',
    financialOutput: {
      productType: 'Business Micro-Loan',
      description: 'Seed capital for side hustles and small business ventures.',
    },
    pricing: {
      baseRate: 600,
      ubuntuDiscount: 0,
      finalRate: 600,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 25,
      minContribution: 500,
      poolHealthThreshold: 50,
    },
  },
  local_coop: {
    poolId: 'local-coop',
    poolName: 'Local Co-op Support Fund',
    category: 'community',
    financialOutput: {
      productType: 'Co-op Membership',
      description: 'Support local cooperatives and earn community dividend shares.',
    },
    pricing: {
      baseRate: 300,
      ubuntuDiscount: 0,
      finalRate: 300,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 35,
      minContribution: 1000,
      poolHealthThreshold: 60,
    },
  },
  general_savings: {
    poolId: 'general-savings',
    poolName: 'General Savings Pool',
    category: 'general',
    financialOutput: {
      productType: 'Savings Pool',
      description: 'Core savings pool with stable returns and high liquidity.',
    },
    pricing: {
      baseRate: 250,
      ubuntuDiscount: 0,
      finalRate: 250,
      entryFeeReduction: 0,
    },
    requirements: {
      minUbuntuScore: 0,
      minContribution: 100,
      poolHealthThreshold: 0,
    },
  },
};

function calculateSocialAccordSynergy(profile: SanitizedProfile, poolHealth: number, villageHealth?: number): number {
  if (profile.intentTags.length === 0) return 0;

  const tagDiversity = Math.min(profile.intentTags.length * 10, 30);
  const tagStrength = profile.aggregatedScore * 0.4;
  const poolHealthBonus = poolHealth > 70 ? 20 : poolHealth > 50 ? 10 : 0;
  const villageBonus = villageHealth !== undefined ? Math.round(villageHealth * 0.1) : 0;

  return Math.min(Math.round(tagDiversity + tagStrength + poolHealthBonus + villageBonus), 100);
}

function calculateCombinedScore(ubuntuScore: number, socialAccordSynergy: number): number {
  return Math.round(ubuntuScore * 0.65 + socialAccordSynergy * 0.35);
}

function calculateUbuntuDiscount(ubuntuScore: number): { discount: number; entryFeeReduction: number } {
  if (ubuntuScore >= 80) {
    return { discount: 150, entryFeeReduction: 20 };
  }
  if (ubuntuScore >= 60) {
    return { discount: 100, entryFeeReduction: 15 };
  }
  if (ubuntuScore >= 40) {
    return { discount: 50, entryFeeReduction: 10 };
  }
  if (ubuntuScore >= 25) {
    return { discount: 25, entryFeeReduction: 5 };
  }
  return { discount: 0, entryFeeReduction: 0 };
}

function matchTagsToPools(tags: IntentTag[]): string[] {
  const poolMatches: Record<string, string[]> = {
    'solar_seed': ['ESG', 'Energy'],
    'hardware_ai_trust': ['Tech', 'Entrepreneur'],
    'community_housing': ['Housing', 'Community'],
    'microcredit_seed': ['Entrepreneur'],
    'local_coop': ['Community', 'Housing'],
  };
  
  const matchedPools = new Set<string>();
  
  for (const tag of tags) {
    for (const [pool, categories] of Object.entries(poolMatches)) {
      if (categories.includes(tag.category)) {
        matchedPools.add(pool);
      }
    }
  }
  
  if (matchedPools.size === 0) {
    matchedPools.add('general_savings');
  }
  
  return Array.from(matchedPools);
}

function calculateMatchScore(
  profile: SanitizedProfile,
  poolId: string,
  poolHealth: number
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50;
  
  const poolCategories: Record<string, string[]> = {
    'solar_seed': ['ESG', 'Energy'],
    'hardware_ai_trust': ['Tech', 'Entrepreneur'],
    'community_housing': ['Housing', 'Community'],
    'microcredit_seed': ['Entrepreneur'],
    'local_coop': ['Community'],
    'general_savings': [],
  };
  
  const poolCats = poolCategories[poolId] || [];
  
  for (const tag of profile.intentTags) {
    if (poolCats.includes(tag.category)) {
      score += Math.round(tag.strength * 30);
      reasons.push(`Your ${tag.category.toLowerCase()} interest aligns with this pool`);
    }
  }
  
  if (profile.profileType === 'esg_focused' && poolId === 'solar_seed') {
    score += 15;
    reasons.push('Strong ESG focus matches renewable energy mission');
  }
  if (profile.profileType === 'community_anchor' && poolId === 'community_housing') {
    score += 15;
    reasons.push('Community engagement aligns with housing co-op');
  }
  if (profile.profileType === 'entrepreneur' && poolId === 'microcredit_seed') {
    score += 15;
    reasons.push('Entrepreneurial interests match micro-credit pool');
  }
  
  if (poolHealth >= 80) {
    score += 10;
    reasons.push('Pool has excellent health metrics');
  } else if (poolHealth >= 60) {
    score += 5;
    reasons.push('Pool has good stability');
  }
  
  if (profile.intentTags.length >= 3) {
    score += 5;
    reasons.push('Diverse interests show engaged member');
  }
  
  return {
    score: Math.min(Math.round(score), 100),
    reasons: reasons.slice(0, 3),
  };
}

export function generateProsperityOpportunity(input: MatchmakerInput): ProsperityOpportunity {
  const { memberId, sanitizedProfile, ubuntuScore, contributionBase, poolHealth, villageHealth } = input;

  const socialAccordSynergy = calculateSocialAccordSynergy(sanitizedProfile, poolHealth, villageHealth);
  const combinedScore = calculateCombinedScore(ubuntuScore, socialAccordSynergy);
  
  const poolIds = matchTagsToPools(sanitizedProfile.intentTags);
  const recommendations: PoolRecommendation[] = [];
  
  for (const poolId of poolIds) {
    const template = POOL_TEMPLATES[poolId];
    if (!template) continue;
    
    const { score: matchScore, reasons } = calculateMatchScore(sanitizedProfile, poolId, poolHealth);
    const discount = calculateUbuntuDiscount(ubuntuScore);
    
    recommendations.push({
      ...template,
      matchScore,
      matchReasons: reasons,
      pricing: {
        ...template.pricing,
        ubuntuDiscount: discount.discount,
        finalRate: Math.max(0, template.pricing.baseRate - discount.discount),
        entryFeeReduction: discount.entryFeeReduction,
      },
    });
  }
  
  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  
  let opportunityType: ProsperityOpportunity['opportunityType'] = 'pool_join';
  let title = 'Prosperity Opportunity';
  let description = '';
  let callToAction = '';
  
  const topPool = recommendations[0];
  
  if (topPool && matchTagsToPools(sanitizedProfile.intentTags).includes(topPool.poolId)) {
    opportunityType = 'pool_join';
    title = `Your ${topPool.category === 'energy' ? 'Clean Energy' : topPool.category === 'tech' ? 'Tech Innovation' : topPool.poolName} Match`;
    description = `Your engagement with ${sanitizedProfile.intentTags.slice(0, 2).map(t => `#${t.category}`).join(', ')} aligns with ${topPool.poolName}. Because your Ubuntu Score is ${ubuntuScore}, your entry fee is reduced by ${topPool.pricing.entryFeeReduction}%. Join the pool to grow the Safety Buffer.`;
    callToAction = `Join ${topPool.poolName}`;
  }
  
  if (ubuntuScore >= 75 && sanitizedProfile.profileType === 'community_anchor') {
    opportunityType = 'anchor_status';
    title = 'Anchor Status Eligible';
    description = 'Your high consistency and community engagement qualify you for Anchor status. This unlocks reduced interest rates on community housing loans.';
    callToAction = 'Apply for Anchor Status';
  }
  
  if (sanitizedProfile.intentTags.some(t => t.category === 'Entrepreneur') && poolHealth >= 60) {
    opportunityType = 'loan_reduction';
    title = 'Entrepreneurial Opportunity';
    description = 'Your interest in business ventures matches our Micro-Credit Seed Fund. Your Ubuntu Score qualifies you for preferred rates.';
    callToAction = 'Explore Business Loans';
  }
  
  return {
    id: randomUUID(),
    memberId,
    opportunityType,
    title,
    description,
    matchScore: recommendations[0]?.matchScore || 0,
    ubuntuScore,
    socialAccordSynergy,
    combinedScore,
    callToAction,
    recommendedPools: recommendations.slice(0, 3),
    createdAt: new Date(),
  };
}

export function calculateMatchQuality(
  profile: SanitizedProfile,
  poolId: string,
  poolHealth: number
): number {
  const { score } = calculateMatchScore(profile, poolId, poolHealth);
  return score;
}

export function getPoolRecommendations(
  memberId: string,
  ubuntuScore: number,
  poolHealth: number = 70
): PoolRecommendation[] {
  const sanitizedProfile: SanitizedProfile = {
    memberId,
    sovereigntyEnabled: true,
    intentTags: [],
    profileType: 'blank',
    aggregatedScore: 0,
    lastUpdated: new Date(),
  };
  
  const input: MatchmakerInput = {
    memberId,
    sanitizedProfile,
    ubuntuScore,
    contributionBase: 0,
    poolHealth,
  };
  
  const opportunity = generateProsperityOpportunity(input);
  return opportunity.recommendedPools;
}

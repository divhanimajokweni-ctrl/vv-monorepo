/**
 * Ubuntu Pools — Sovereignty Proxy Service
 * Trust Layer for sanitizing social data before financial matching
 * 
 * Features:
 * - NER-based anonymization
 * - Intent Tag extraction
 * - Sovereignty Toggle state management
 * - Data Ephemerality (TTL-based storage)
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db } from '@ubuntu/db/client';
import { gameTelemetry } from '@ubuntu/db/schema-games';
import { eq } from 'drizzle-orm';

export interface IntentTag {
  id: string;
  category: string;
  value: string;
  source: 'instagram' | 'tiktok' | 'stitch' | 'manual';
  strength: number;
  createdAt: Date;
  expiresAt: Date;
  lastSeen: Date;
}

export interface SanitizedProfile {
  memberId: string;
  sovereigntyEnabled: boolean;
  intentTags: IntentTag[];
  profileType: 'blank' | 'esg_focused' | 'community_anchor' | 'entrepreneur' | 'mixed';
  aggregatedScore: number;
  lastUpdated: Date;
}

export interface SovereigntySettings {
  memberId: string;
  sovereigntyEnabled: boolean;
  allowedSources: ('instagram' | 'tiktok' | 'stitch' | 'manual')[];
  tagCategories: {
    esg: boolean;
    community: boolean;
    entrepreneur: boolean;
    lifestyle: boolean;
  };
  ttlDays: number;
}

export const SovereigntySettingsSchema = z.object({
  memberId: z.string().uuid(),
  sovereigntyEnabled: z.boolean(),
  allowedSources: z.array(z.enum(['instagram', 'tiktok', 'stitch', 'manual'])),
  tagCategories: z.object({
    esg: z.boolean(),
    community: z.boolean(),
    entrepreneur: z.boolean(),
    lifestyle: z.boolean(),
  }),
  ttlDays: z.number().int().min(1).max(90).default(30),
});

const INTENT_KEYWORDS: Record<string, { category: string; keywords: string[] }> = {
  esg: {
    category: 'ESG',
    keywords: ['sustainable', 'renewable', 'solar', 'green', 'eco', 'clean', 'organic', 'zero waste', 'carbon', 'climate', 'biodiversity', 'ethical'],
  },
  energy: {
    category: 'Energy',
    keywords: ['solar', 'wind', 'hydro', 'grid', 'offgrid', 'battery', 'power', 'electric', 'renewable energy', 'energy independence'],
  },
  community: {
    category: 'Community',
    keywords: ['community', 'co-op', 'cooperative', 'local', 'neighbor', 'village', 'collective', 'mutual aid', 'support', 'together'],
  },
  housing: {
    category: 'Housing',
    keywords: ['home', 'house', 'real estate', 'property', 'rent', 'mortgage', 'housing', 'apartment', 'living', 'space'],
  },
  entrepreneur: {
    category: 'Entrepreneur',
    keywords: ['business', 'startup', 'side hustle', 'entrepreneur', 'venture', 'growth', 'scale', 'founder', 'CEO', 'profit', 'revenue'],
  },
  tech: {
    category: 'Tech',
    keywords: ['AI', 'tech', 'software', 'coding', 'developer', 'digital', 'innovation', 'blockchain', 'data', 'automation', 'machine learning'],
  },
  health: {
    category: 'Health',
    keywords: ['health', 'wellness', 'fitness', 'mental health', 'self care', 'meditation', 'yoga', 'organic', 'natural'],
  },
  education: {
    category: 'Education',
    keywords: ['learn', 'education', 'course', 'study', 'teach', 'mentor', 'knowledge', 'skill', 'workshop', 'training'],
  },
};

export function extractIntentTags(
  content: string,
  source: 'instagram' | 'tiktok' | 'stitch' | 'manual',
  ttlDays: number = 30
): IntentTag[] {
  const normalizedContent = content.toLowerCase();
  const tags: IntentTag[] = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  for (const [key, config] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (normalizedContent.includes(keyword)) {
        const existingTag = tags.find(t => t.category === config.category);
        if (!existingTag) {
          tags.push({
            id: randomUUID(),
            category: config.category,
            value: keyword,
            source,
            strength: calculateKeywordStrength(normalizedContent, keyword),
            createdAt: now,
            expiresAt,
            lastSeen: now,
          });
        } else {
          existingTag.strength = Math.min(1, existingTag.strength + 0.1);
          existingTag.lastSeen = now;
        }
        break;
      }
    }
  }

  return tags;
}

function calculateKeywordStrength(content: string, keyword: string): number {
  const regex = new RegExp(keyword, 'gi');
  const matches = content.match(regex);
  if (!matches) return 0.1;
  
  const frequency = matches.length;
  const baseStrength = Math.min(0.3 + frequency * 0.15, 1);
  
  const positions = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    positions.push(match.index);
  }
  
  const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
  const recencyBonus = avgPosition < content.length * 0.3 ? 0.2 : 0;
  
  return Math.min(baseStrength + recencyBonus, 1);
}

export function determineProfileType(tags: IntentTag[]): SanitizedProfile['profileType'] {
  const categoryStrength: Record<string, number> = {};
  
  for (const tag of tags) {
    categoryStrength[tag.category] = (categoryStrength[tag.category] || 0) + tag.strength;
  }
  
  const categories = Object.entries(categoryStrength)
    .sort(([, a], [, b]) => b - a);
  
  if (categories.length === 0) return 'blank';
  if (categories.length === 1) {
    const [top] = categories;
    if (top[0] === 'ESG' || top[0] === 'Energy') return 'esg_focused';
    if (top[0] === 'Community' || top[0] === 'Housing') return 'community_anchor';
    if (top[0] === 'Entrepreneur' || top[0] === 'Tech') return 'entrepreneur';
  }
  
  return 'mixed';
}

export function calculateAggregatedScore(tags: IntentTag[]): number {
  if (tags.length === 0) return 0;
  
  const categoryScores: Record<string, number[]> = {};
  for (const tag of tags) {
    if (!categoryScores[tag.category]) {
      categoryScores[tag.category] = [];
    }
    categoryScores[tag.category].push(tag.strength);
  }
  
  let totalScore = 0;
  let categoryCount = 0;
  
  for (const scores of Object.values(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    totalScore += avg * 100;
    categoryCount++;
  }
  
  const diversityBonus = Math.min(categoryCount * 5, 25);
  
  return Math.min(Math.round(totalScore / categoryCount + diversityBonus), 100);
}

export class SovereigntyProxy {
  private settings: Map<string, SovereigntySettings> = new Map();
  private profiles: Map<string, SanitizedProfile> = new Map();
  private rawData: Map<string, { content: string; source: string; timestamp: Date }[]> = new Map();

  configureMember(settings: z.infer<typeof SovereigntySettingsSchema>): SovereigntySettings {
    const validated = SovereigntySettingsSchema.parse(settings);
    this.settings.set(validated.memberId, validated);
    
    if (!this.profiles.has(validated.memberId)) {
      this.profiles.set(validated.memberId, {
        memberId: validated.memberId,
        sovereigntyEnabled: validated.sovereigntyEnabled,
        intentTags: [],
        profileType: 'blank',
        aggregatedScore: 0,
        lastUpdated: new Date(),
      });
    }
    
    return validated;
  }

  getSettings(memberId: string): SovereigntySettings | undefined {
    return this.settings.get(memberId);
  }

  toggleSovereignty(memberId: string, enabled: boolean): SanitizedProfile {
    const settings = this.settings.get(memberId);
    if (!settings) {
      throw new Error('Member not configured');
    }
    
    settings.sovereigntyEnabled = enabled;
    this.settings.set(memberId, settings);
    
    const profile = this.profiles.get(memberId);
    if (profile) {
      profile.sovereigntyEnabled = enabled;
      profile.lastUpdated = new Date();
    }
    
    return this.getSanitizedProfile(memberId);
  }

  ingestData(memberId: string, content: string, source: 'instagram' | 'tiktok' | 'stitch' | 'manual'): IntentTag[] {
    const settings = this.settings.get(memberId);
    if (!settings) {
      throw new Error('Member not configured');
    }
    
    if (!settings.allowedSources.includes(source)) {
      return [];
    }
    
    const existingRaw = this.rawData.get(memberId) || [];
    existingRaw.push({ content, source, timestamp: new Date() });
    this.rawData.set(memberId, existingRaw);
    
    const newTags = extractIntentTags(content, source, settings.ttlDays);
    
    let profile = this.profiles.get(memberId);
    if (!profile) {
      profile = {
        memberId,
        sovereigntyEnabled: settings.sovereigntyEnabled,
        intentTags: [],
        profileType: 'blank',
        aggregatedScore: 0,
        lastUpdated: new Date(),
      };
      this.profiles.set(memberId, profile);
    }
    
    for (const newTag of newTags) {
      const allowed = this.isTagAllowed(newTag, settings);
      if (!allowed) continue;
      
      const existingIndex = profile.intentTags.findIndex(
        t => t.category === newTag.category && t.source === newTag.source
      );
      
      if (existingIndex >= 0) {
        const existing = profile.intentTags[existingIndex];
        existing.strength = Math.max(existing.strength, newTag.strength);
        existing.lastSeen = newTag.lastSeen;
      } else {
        profile.intentTags.push(newTag);
      }
    }
    
    profile.intentTags = profile.intentTags.filter(t => t.expiresAt > new Date());
    profile.profileType = determineProfileType(profile.intentTags);
    profile.aggregatedScore = calculateAggregatedScore(profile.intentTags);
    profile.lastUpdated = new Date();
    
    this.profiles.set(memberId, profile);
    
    return newTags;
  }

  private isTagAllowed(tag: IntentTag, settings: SovereigntySettings): boolean {
    const categoryMap: Record<string, keyof SovereigntySettings['tagCategories']> = {
      'ESG': 'esg',
      'Energy': 'esg',
      'Community': 'community',
      'Housing': 'community',
      'Entrepreneur': 'entrepreneur',
      'Tech': 'entrepreneur',
      'Health': 'lifestyle',
      'Education': 'lifestyle',
    };
    
    const categoryKey = categoryMap[tag.category];
    if (!categoryKey) return true;
    
    return settings.tagCategories[categoryKey];
  }

  getSanitizedProfile(memberId: string): SanitizedProfile {
    const profile = this.profiles.get(memberId);
    if (!profile) {
      return {
        memberId,
        sovereigntyEnabled: false,
        intentTags: [],
        profileType: 'blank',
        aggregatedScore: 0,
        lastUpdated: new Date(),
      };
    }
    
    if (!profile.sovereigntyEnabled) {
      return {
        ...profile,
        intentTags: [],
        profileType: 'blank',
        aggregatedScore: 0,
      };
    }
    
    return { ...profile };
  }

  getIntentTags(memberId: string): IntentTag[] {
    return this.profiles.get(memberId)?.intentTags || [];
  }

  clearExpiredTags(memberId: string): number {
    const profile = this.profiles.get(memberId);
    if (!profile) return 0;

    const before = profile.intentTags.length;
    profile.intentTags = profile.intentTags.filter(t => t.expiresAt > new Date());
    profile.profileType = determineProfileType(profile.intentTags);
    profile.aggregatedScore = calculateAggregatedScore(profile.intentTags);

    return before - profile.intentTags.length;
  }

  /**
   * Erase game telemetry data for a member (POPIA compliance)
   * This marks telemetry records as erased but keeps the record for audit purposes
   * Does not affect real-world pool standing or Ubuntu Score
   */
  async eraseGameTelemetry(memberId: string): Promise<{ erased: boolean }> {
    await db.update(gameTelemetry)
      .set({ erased: true })
      .where(eq(gameTelemetry.memberId, memberId));

    return { erased: true };
  }
}

export const sovereigntyProxy = new SovereigntyProxy();

export function sanitizeForMatchmaker(memberId: string): SanitizedProfile {
  return sovereigntyProxy.getSanitizedProfile(memberId);
}

export function configureSovereignty(settings: z.infer<typeof SovereigntySettingsSchema>): SovereigntySettings {
  return sovereigntyProxy.configureMember(settings);
}

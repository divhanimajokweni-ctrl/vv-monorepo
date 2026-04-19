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

export const sovereigntyProxy = {
  async getProfile(id: string): Promise<SanitizedProfile> {
    return {
      memberId: id,
      sovereigntyEnabled: true,
      intentTags: [],
      profileType: 'blank',
      aggregatedScore: 0,
      lastUpdated: new Date()
    };
  },
  async getSanitizedProfile(id: string): Promise<SanitizedProfile> {
    return {
      memberId: id,
      sovereigntyEnabled: true,
      intentTags: [],
      profileType: 'blank',
      aggregatedScore: 0,
      lastUpdated: new Date()
    };
  }
};
/**
 * Ubuntu Pools — Feature Flags
 * Control feature rollouts safely with gradual rollout percentages
 */

export enum Feature {
  MICROCREDIT_ENABLED = 'phase2:microcredit',
  ADVANCED_ANALYTICS = 'product:advanced-analytics',
  PROSPERITY_TIERS_V2 = 'product:prosperity-tiers-v2',
  LINDIWE_LEARNING = 'ai:lindiwe-learning',
  NEW_DASHBOARD = 'experimental:new-dashboard',
  BULK_BUYING_CIRCLES = 'experimental:bulk-buying',
  GOVERNANCE_V2 = 'feature:governance-v2',
  CREDIT_POOL_V2 = 'feature:credit-pool-v2',
}

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number;
  allowlist?: string[];
  blocklist?: string[];
  description: string;
}

const FLAGS: Record<Feature, FeatureFlagConfig> = {
  [Feature.MICROCREDIT_ENABLED]: {
    enabled: true,
    rolloutPercentage: 5,
    description: 'Enable Phase 2 microcredit system',
  },
  [Feature.ADVANCED_ANALYTICS]: {
    enabled: true,
    rolloutPercentage: 50,
    description: 'New analytics dashboard',
  },
  [Feature.PROSPERITY_TIERS_V2]: {
    enabled: false,
    rolloutPercentage: 0,
    description: 'New prosperity tier calculation',
  },
  [Feature.LINDIWE_LEARNING]: {
    enabled: true,
    rolloutPercentage: 10,
    allowlist: ['founder@ubuntu.local'],
    description: 'Lindiwe AI learning system',
  },
  [Feature.NEW_DASHBOARD]: {
    enabled: true,
    rolloutPercentage: 3,
    description: 'Experimental new dashboard',
  },
  [Feature.BULK_BUYING_CIRCLES]: {
    enabled: true,
    rolloutPercentage: 2,
    blocklist: ['test-user-1', 'test-user-2'],
    description: 'SME bulk-buying circles',
  },
  [Feature.GOVERNANCE_V2]: {
    enabled: true,
    rolloutPercentage: 20,
    description: 'New governance system v2',
  },
  [Feature.CREDIT_POOL_V2]: {
    enabled: false,
    rolloutPercentage: 0,
    description: 'New credit pool mechanics',
  },
};

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export class FeatureFlagEngine {
  static isEnabled(feature: Feature, userId: string): boolean {
    const config = FLAGS[feature];
    
    if (config.blocklist?.includes(userId)) {
      return false;
    }
    
    if (config.allowlist?.includes(userId)) {
      return true;
    }
    
    if (!config.enabled) {
      return false;
    }
    
    if (config.rolloutPercentage >= 100) {
      return true;
    }
    
    if (config.rolloutPercentage <= 0) {
      return false;
    }
    
    const hash = hashUserId(userId);
    const bucket = hash % 100;
    
    return bucket < config.rolloutPercentage;
  }

  static getConfig(feature: Feature): FeatureFlagConfig {
    return FLAGS[feature];
  }

  static setFeaturePercentage(feature: Feature, percentage: number): void {
    if (FLAGS[feature]) {
      FLAGS[feature].rolloutPercentage = Math.max(0, Math.min(100, percentage));
      console.log(`[Feature Flags] ${feature} rollout set to ${percentage}%`);
    }
  }

  static setFeatureEnabled(feature: Feature, enabled: boolean): void {
    if (FLAGS[feature]) {
      FLAGS[feature].enabled = enabled;
      console.log(`[Feature Flags] ${feature} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  static getAllFlags(): Record<Feature, FeatureFlagConfig> {
    return { ...FLAGS };
  }

  static getEnabledFlags(userId: string): Feature[] {
    const enabled: Feature[] = [];
    
    for (const feature of Object.values(Feature)) {
      if (this.isEnabled(feature, userId)) {
        enabled.push(feature);
      }
    }
    
    return enabled;
  }
}

export function isFeatureEnabled(feature: Feature, userId: string): boolean {
  return FeatureFlagEngine.isEnabled(feature, userId);
}

export function getFeatureConfig(feature: Feature): FeatureFlagConfig {
  return FeatureFlagEngine.getConfig(feature);
}

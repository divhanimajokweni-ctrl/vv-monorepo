/**
 * Ubuntu Pools — Edge Caching & Performance Optimization
 * Zero-latency interactions for universal dignity
 */

export const EDGE_CONFIG = {
  cache: {
    static: {
      maxAge: 60 * 60 * 24 * 365, // 1 year for immutable assets
      staleWhileRevalidate: 0,
    },
    dynamic: {
      maxAge: 60, // 1 minute for user-agnostic data
      staleWhileRevalidate: 60 * 10, // 10 minutes background revalidation
    },
    session: {
      maxAge: 60 * 60 * 24, // 24 hours
      staleWhileRevalidate: 0,
    },
  },
  regions: {
    primary: ['iad1', 'lhr1', 'sin1'],
    secondary: ['sfo1', 'fra1', 'syd1'],
    edge: ['abh1', 'cpt1', 'jnb1'],
  },
  performance: {
    targetTTFB: 100, // ms
    targetFCP: 1500, // ms on 3G
    targetInteraction: 3000, // ms on 2G
    websocketLatency: 50, // ms
  },
};

export const CACHE_TAGS = {
  EVENTS: 'events',
  ACCOUNTS: 'accounts',
  GOVERNANCE: 'governance',
  TRUST: 'trust',
  METRICS: 'metrics',
} as const;

export function getCacheHeaders(resourceType: 'static' | 'dynamic' | 'session'): Record<string, string> {
  const config = EDGE_CONFIG.cache[resourceType];
  
  return {
    'Cache-Control': `public, max-age=${config.maxAge}, s-maxage=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`,
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'on',
  };
}

export function getEdgeRegion(userCountry?: string): string {
  const regionMap: Record<string, string[]> = {
    US: ['iad1', 'sfo1'],
    GB: ['lhr1'],
    DE: ['fra1'],
    SG: ['sin1'],
    AU: ['syd1'],
    ZA: ['cpt1', 'jnb1'],
    AE: ['abh1'],
  };

  const regions = regionMap[userCountry || ''] || EDGE_CONFIG.regions.primary;
  return regions[0];
}

export function getRevalidateTime(entityType: string): number {
  const revalidateTimes: Record<string, number> = {
    events: 1,
    accounts: 60,
    governance: 5,
    trust: 30,
    metrics: 10,
  };
  return revalidateTimes[entityType] || 60;
}

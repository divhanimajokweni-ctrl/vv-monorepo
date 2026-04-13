/**
 * Ubuntu Pools — Cache Engine
 * Redis-based caching for reducing database load
 * 
 * Supports Upstash Redis (serverless-friendly) with graceful fallback to memory cache
 */

interface CacheOptions {
  ttl?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
}

interface CacheWarmupConfig {
  enabled: boolean;
  keyPrefix: string;
  warmupInterval: number; // minutes
  maxConcurrency: number;
}

interface CacheInvalidationRule {
  pattern: string;
  onEvent: string[];
  ttl?: number;
}

const stats: CacheStats = { hits: 0, misses: 0, sets: 0 };

const cacheWarmupConfigs: Map<string, CacheWarmupConfig> = new Map();
const invalidationRules: CacheInvalidationRule[] = [];

let redisClient: unknown = null;
let useRedis = false;

async function getRedis() {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN || '',
    });
    useRedis = true;
    return redisClient;
  } catch {
    return null;
  }
}

const memoryCache = new Map<string, { value: unknown; expiry: number }>();

function getMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  stats.hits++;
  return entry.value as T;
}

function setMemory(key: string, value: unknown, ttl: number): void {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000,
  });
  stats.sets++;
  
  if (memoryCache.size > 10000) {
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiry) memoryCache.delete(k);
    }
  }
}

function deleteMemory(key: string): void {
  memoryCache.delete(key);
}

export const CacheEngine = {
  async get<T>(key: string): Promise<T | null> {
    const redis = await getRedis();
    
    if (redis) {
      try {
        const value = await (redis as { get: (key: string) => Promise<string | null> }).get(key);
        if (value !== null) {
          stats.hits++;
          return JSON.parse(value) as T;
        }
      } catch {
        // Fall through to memory cache
      }
    }
    
    return getMemory<T>(key);
  },

  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? 3600;
    const redis = await getRedis();
    
    if (redis) {
      try {
        await (redis as { setex: (key: string, ttl: number, value: string) => Promise<void> }).setex(key, ttl, JSON.stringify(value));
        stats.sets++;
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    setMemory(key, value, ttl);
  },

  async delete(key: string): Promise<void> {
    const redis = await getRedis();
    
    if (redis) {
      try {
        await (redis as { del: (key: string) => Promise<void> }).del(key);
      } catch {
        // Fall through
      }
    }
    
    deleteMemory(key);
  },

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    stats.misses++;
    const value = await factory();
    await this.set(key, value, options);
    return value;
  },

  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;
    const redis = await getRedis();
    
    if (redis && useRedis) {
      try {
        const keys = await (redis as { keys: (pattern: string) => Promise<string[]> }).keys(pattern);
        if (keys.length > 0) {
          await (redis as { del: (...keys: string[]) => Promise<number> }).del(...keys);
          count = keys.length;
        }
      } catch {
        // Fall through
      }
    } else {
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          count++;
        }
      }
    }
    
    return count;
  },

  getStats(): CacheStats {
    return { ...stats };
  },

  resetStats(): void {
    stats.hits = 0;
    stats.misses = 0;
    stats.sets = 0;
  },

  isUsingRedis(): boolean {
    return useRedis;
  },

  /**
   * Cache Warming: Pre-populate frequently accessed data
   */
  async warmupCache(config: CacheWarmupConfig, warmupFn: () => Promise<Array<{ key: string; value: unknown; ttl?: number }>>): Promise<void> {
    if (!config.enabled) return;

    try {
      console.log(`Starting cache warmup for ${config.keyPrefix}`);
      const items = await warmupFn();

      // Process in batches to avoid overwhelming Redis
      const batches = [];
      for (let i = 0; i < items.length; i += config.maxConcurrency) {
        batches.push(items.slice(i, i + config.maxConcurrency));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(item => this.set(`${config.keyPrefix}:${item.key}`, item.value, { ttl: item.ttl }))
        );
      }

      console.log(`Cache warmup completed: ${items.length} items cached`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  },

  /**
   * Cache Invalidation Hooks: Automatic cleanup on data changes
   */
  registerInvalidationRule(rule: CacheInvalidationRule): void {
    invalidationRules.push(rule);
  },

  async invalidateOnEvent(eventType: string, entityId?: string): Promise<number> {
    let totalInvalidated = 0;

    for (const rule of invalidationRules) {
      if (rule.onEvent.includes(eventType)) {
        const pattern = entityId ? rule.pattern.replace('{entityId}', entityId) : rule.pattern;
        const invalidated = await this.invalidatePattern(pattern);
        totalInvalidated += invalidated;

        if (rule.ttl) {
          // Set a grace period before allowing new caching
          await this.set(`_grace_${pattern}`, 'warming', { ttl: rule.ttl });
        }
      }
    }

    if (totalInvalidated > 0) {
      console.log(`Invalidated ${totalInvalidated} cache entries for event ${eventType}`);
    }

    return totalInvalidated;
  },

  /**
   * Session-Based Caching: Cache user sessions with automatic cleanup
   */
  async cacheUserSession(userId: string, sessionData: unknown, ttlMinutes: number = 60): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.set(sessionKey, sessionData, { ttl: ttlMinutes * 60 });

    // Cache behavioral scores for active users (24-hour TTL)
    const scoreKey = `behavioral_score:${userId}`;
    await this.set(scoreKey, sessionData, { ttl: 24 * 60 * 60 });
  },

  /**
   * Register automatic cache warming for behavioral scores
   */
  registerBehavioralScoreWarmup(): void {
    cacheWarmupConfigs.set('behavioral_scores', {
      enabled: true,
      keyPrefix: 'behavioral_score',
      warmupInterval: 30, // minutes
      maxConcurrency: 10,
    });
  },
};

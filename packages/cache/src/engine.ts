export class CacheEngine {
  private cache: Map<string, { value: unknown; expiry: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, ttlMs: number = 60000): Promise<void> {
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export const cacheEngine = new CacheEngine();
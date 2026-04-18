type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(...args: any[]): string {
    return args.map(arg => JSON.stringify(arg)).join('|');
  }
}

export const cacheService = new CacheService();

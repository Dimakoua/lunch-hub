type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class CacheService {
  private readonly STORAGE_PREFIX = 'lunch-hub-cache-';
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.cleanup();
  }

  private cleanup(): void {
    if (typeof window === 'undefined') return;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        this.get(key.replace(this.STORAGE_PREFIX, ''));
      }
    });
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === 'undefined') return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now() + ttl,
    };
    localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
    if (!stored) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(stored);
      if (Date.now() > entry.timestamp) {
        localStorage.removeItem(this.STORAGE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
      return null;
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  generateKey(...args: unknown[]): string {
    return args.map(arg => {
      if (typeof arg === 'number') {
        // Round coordinates to ~11m precision to improve cache hit rate
        return arg.toFixed(4);
      }
      return JSON.stringify(arg);
    }).join('|');
  }
}

export const cacheService = new CacheService();

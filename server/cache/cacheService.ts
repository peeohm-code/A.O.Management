/**
 * Simple In-Memory Cache Service
 * 
 * This provides a lightweight caching layer without requiring Redis.
 * For production with multiple servers, consider using Redis instead.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  constructor() {
    // Start cleanup interval (every 5 minutes)
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL (time to live in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + "%",
      totalRequests,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry info (for debugging)
   */
  getEntryInfo(key: string): {
    exists: boolean;
    createdAt?: Date;
    expiresAt?: Date;
    ttlSeconds?: number;
  } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return { exists: false };
    }

    const now = Date.now();
    const ttlSeconds = Math.max(0, Math.floor((entry.expiresAt - now) / 1000));

    return {
      exists: true,
      createdAt: new Date(entry.createdAt),
      expiresAt: new Date(entry.expiresAt),
      ttlSeconds,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Manually trigger cleanup of expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
        this.stats.evictions++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }

    return removed;
  }

  /**
   * Get or set pattern (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetchFn();
    this.set(key, data, ttlSeconds);
    return data;
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  project: (id: number) => `project:${id}`,
  projectList: () => `projects:list`,
  projectStats: (id: number) => `project:${id}:stats`,
  
  task: (id: number) => `task:${id}`,
  taskList: (projectId?: number) => projectId ? `tasks:project:${projectId}` : `tasks:list`,
  taskStats: (projectId: number) => `tasks:project:${projectId}:stats`,
  
  checklist: (id: number) => `checklist:${id}`,
  checklistTemplates: () => `checklist:templates`,
  
  user: (id: number) => `user:${id}`,
  userNotifications: (userId: number) => `user:${userId}:notifications`,
  
  dashboardStats: () => `dashboard:stats`,
};

/**
 * Cache TTL configurations (in seconds)
 */
export const CacheTTL = {
  short: 60, // 1 minute - for frequently changing data
  medium: 300, // 5 minutes - for moderately changing data
  long: 1800, // 30 minutes - for rarely changing data
  veryLong: 3600, // 1 hour - for static data
};

/**
 * Invalidate cache patterns
 */
export const invalidateCache = {
  project: (id: number) => {
    cache.delete(CacheKeys.project(id));
    cache.delete(CacheKeys.projectStats(id));
    cache.delete(CacheKeys.projectList());
  },
  
  task: (taskId: number, projectId?: number) => {
    cache.delete(CacheKeys.task(taskId));
    if (projectId) {
      cache.delete(CacheKeys.taskList(projectId));
      cache.delete(CacheKeys.taskStats(projectId));
    }
    cache.delete(CacheKeys.taskList());
  },
  
  checklist: (id: number) => {
    cache.delete(CacheKeys.checklist(id));
    cache.delete(CacheKeys.checklistTemplates());
  },
  
  user: (id: number) => {
    cache.delete(CacheKeys.user(id));
    cache.delete(CacheKeys.userNotifications(id));
  },
  
  dashboard: () => {
    cache.delete(CacheKeys.dashboardStats());
  },
  
  all: () => {
    cache.clear();
  },
};

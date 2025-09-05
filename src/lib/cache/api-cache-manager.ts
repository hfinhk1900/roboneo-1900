/**
 * API 缓存管理器 - My Image Library
 *
 * 提供动态 API 缓存、增量同步和智能失效策略
 */

export interface CacheConfig {
  /** 缓存键前缀 */
  keyPrefix: string;
  /** 缓存时长 (毫秒) */
  ttl: number;
  /** 最大缓存项数 */
  maxItems: number;
  /** 是否启用增量同步 */
  enableSync: boolean;
  /** 同步间隔 (毫秒) */
  syncInterval: number;
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
  lastModified?: string;
  version: number;
}

export interface SyncResult {
  updated: number;
  deleted: number;
  errors: string[];
}

export class APICacheManager {
  private static instance: APICacheManager;
  private cache = new Map<string, CacheItem>();
  private syncTimers = new Map<string, NodeJS.Timeout>();

  private readonly defaultConfig: CacheConfig = {
    keyPrefix: 'api_cache',
    ttl: 5 * 60 * 1000, // 5分钟
    maxItems: 100,
    enableSync: true,
    syncInterval: 30 * 1000, // 30秒
  };

  private constructor() {
    this.setupCleanupTimer();
  }

  public static getInstance(): APICacheManager {
    if (!APICacheManager.instance) {
      APICacheManager.instance = new APICacheManager();
    }
    return APICacheManager.instance;
  }

  /**
   * 获取缓存数据
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const cacheKey = `${mergedConfig.keyPrefix}:${key}`;

    // 检查缓存
    const cached = this.cache.get(cacheKey);

    if (cached && this.isValid(cached, mergedConfig.ttl)) {
      console.log('[API Cache] Cache hit:', key);

      // 设置增量同步
      if (mergedConfig.enableSync && !this.syncTimers.has(cacheKey)) {
        this.setupIncrementalSync(cacheKey, fetcher, mergedConfig);
      }

      return cached.data;
    }

    console.log('[API Cache] Cache miss, fetching:', key);

    try {
      // 获取新数据
      const data = await fetcher();

      // 存储到缓存
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: 1,
      };

      this.set(cacheKey, cacheItem, mergedConfig);

      // 设置增量同步
      if (mergedConfig.enableSync) {
        this.setupIncrementalSync(cacheKey, fetcher, mergedConfig);
      }

      return data;
    } catch (error) {
      // 网络错误时返回过期缓存
      if (cached) {
        console.log('[API Cache] Using stale cache due to error:', key);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 条件请求 (支持 ETag/Last-Modified)
   */
  async getConditional<T>(
    key: string,
    fetcher: (headers?: Record<string, string>) => Promise<{
      data: T;
      etag?: string;
      lastModified?: string;
      notModified?: boolean;
    }>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const cacheKey = `${mergedConfig.keyPrefix}:${key}`;

    const cached = this.cache.get(cacheKey);

    try {
      const headers: Record<string, string> = {};

      // 添加条件请求头
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }
      if (cached?.lastModified) {
        headers['If-Modified-Since'] = cached.lastModified;
      }

      const response = await fetcher(headers);

      // 304 Not Modified
      if (response.notModified && cached) {
        console.log('[API Cache] Conditional cache hit (304):', key);

        // 更新时间戳但保持数据
        cached.timestamp = Date.now();
        this.cache.set(cacheKey, cached);

        return cached.data;
      }

      // 数据已更新
      const cacheItem: CacheItem<T> = {
        data: response.data,
        timestamp: Date.now(),
        etag: response.etag,
        lastModified: response.lastModified,
        version: cached ? cached.version + 1 : 1,
      };

      this.set(cacheKey, cacheItem, mergedConfig);

      console.log('[API Cache] Conditional cache updated:', key);
      return response.data;
    } catch (error) {
      // 出错时使用缓存
      if (cached) {
        console.log(
          '[API Cache] Using cached data due to conditional request error:',
          key
        );
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 手动设置缓存
   */
  set<T>(
    key: string,
    item: CacheItem<T>,
    config: Partial<CacheConfig> = {}
  ): void {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // 检查缓存大小
    if (this.cache.size >= mergedConfig.maxItems) {
      this.evictOldest();
    }

    this.cache.set(key, item);
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const fullKey = key.startsWith(this.defaultConfig.keyPrefix)
      ? key
      : `${this.defaultConfig.keyPrefix}:${key}`;

    // 清理同步定时器
    const timer = this.syncTimers.get(fullKey);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(fullKey);
    }

    return this.cache.delete(fullKey);
  }

  /**
   * 批量删除缓存 (支持模式匹配)
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    // 清理所有同步定时器
    for (const timer of this.syncTimers.values()) {
      clearTimeout(timer);
    }
    this.syncTimers.clear();

    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    totalItems: number;
    memoryUsage: number;
    hitRate?: number;
    oldestItem?: number;
    newestItem?: number;
  } {
    const items = Array.from(this.cache.values());
    const timestamps = items.map((item) => item.timestamp);

    return {
      totalItems: this.cache.size,
      memoryUsage: this.calculateMemoryUsage(),
      oldestItem: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestItem: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  /**
   * 设置增量同步
   */
  private setupIncrementalSync<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): void {
    // 清理现有定时器
    const existingTimer = this.syncTimers.get(cacheKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[API Cache] Incremental sync for:', cacheKey);

        const newData = await fetcher();
        const cached = this.cache.get(cacheKey);

        if (cached) {
          // 检查数据是否有变化
          const hasChanged =
            JSON.stringify(cached.data) !== JSON.stringify(newData);

          if (hasChanged) {
            console.log('[API Cache] Data changed, updating cache:', cacheKey);

            const updatedItem: CacheItem<T> = {
              ...cached,
              data: newData,
              timestamp: Date.now(),
              version: cached.version + 1,
            };

            this.cache.set(cacheKey, updatedItem);

            // 触发变化事件
            this.notifyChange(cacheKey, newData);
          } else {
            // 数据未变化，仅更新时间戳
            cached.timestamp = Date.now();
            this.cache.set(cacheKey, cached);
          }
        }

        // 设置下次同步
        this.setupIncrementalSync(cacheKey, fetcher, config);
      } catch (error) {
        console.warn('[API Cache] Incremental sync failed:', cacheKey, error);

        // 出错时延长同步间隔
        setTimeout(() => {
          this.setupIncrementalSync(cacheKey, fetcher, config);
        }, config.syncInterval * 2);
      }
    }, config.syncInterval);

    this.syncTimers.set(cacheKey, timer);
  }

  /**
   * 检查缓存项是否有效
   */
  private isValid(item: CacheItem, ttl: number): boolean {
    return Date.now() - item.timestamp < ttl;
  }

  /**
   * 淘汰最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTimestamp = Number.POSITIVE_INFINITY;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * 计算内存使用 (估算)
   */
  private calculateMemoryUsage(): number {
    let totalBytes = 0;

    for (const [key, item] of this.cache.entries()) {
      // 粗略估算
      totalBytes += new Blob([key]).size;
      totalBytes += new Blob([JSON.stringify(item)]).size;
    }

    return totalBytes;
  }

  /**
   * 设置清理定时器
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 每分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (!this.isValid(item, this.defaultConfig.ttl)) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[API Cache] Cleaned ${cleaned} expired items`);
    }
  }

  /**
   * 通知缓存变化 (可扩展为事件系统)
   */
  private notifyChange<T>(key: string, data: T): void {
    // 可以在这里触发自定义事件或回调
    const event = new CustomEvent('api-cache-changed', {
      detail: { key, data, timestamp: Date.now() },
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * 预热缓存
   */
  async warmup(
    keys: Array<{
      key: string;
      fetcher: () => Promise<any>;
      config?: Partial<CacheConfig>;
    }>
  ): Promise<SyncResult> {
    const result: SyncResult = {
      updated: 0,
      deleted: 0,
      errors: [],
    };

    const promises = keys.map(async ({ key, fetcher, config }) => {
      try {
        await this.get(key, fetcher, config);
        result.updated++;
      } catch (error) {
        result.errors.push(
          `Failed to warmup ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    await Promise.allSettled(promises);
    return result;
  }
}

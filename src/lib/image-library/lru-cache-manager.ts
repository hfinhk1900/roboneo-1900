/**
 * LRU 缓存管理器 - My Image Library
 *
 * 专门用于管理 ObjectURL 的 LRU 缓存，避免内存泄漏
 * 并提供高效的缩略图访问机制
 */

export interface CacheItem {
  key: string;
  objectUrl: string;
  blob: Blob;
  lastAccessed: number;
  size: number;
}

export interface LRUCacheConfig {
  maxItems: number; // 最大缓存项数
  maxMemoryMB: number; // 最大内存使用(MB)
  ttl: number; // 缓存存活时间(ms)
  cleanupInterval: number; // 清理间隔(ms)
}

export class LRUCacheManager {
  private cache = new Map<string, CacheItem>();
  private accessOrder: string[] = [];
  private currentMemoryBytes = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private readonly config: LRUCacheConfig;
  private readonly defaultConfig: LRUCacheConfig = {
    maxItems: 100,
    maxMemoryMB: 50,
    ttl: 30 * 60 * 1000, // 30分钟
    cleanupInterval: 5 * 60 * 1000, // 5分钟清理一次
  };

  constructor(config?: Partial<LRUCacheConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.startCleanupTimer();
  }

  /**
   * 获取缓存项
   */
  get(key: string): string | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    // 更新访问时间和顺序
    item.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    return item.objectUrl;
  }

  /**
   * 设置缓存项
   */
  set(key: string, blob: Blob): string {
    // 检查是否已存在
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.updateAccessOrder(key);
      return existing.objectUrl;
    }

    // 创建 ObjectURL
    const objectUrl = URL.createObjectURL(blob);
    const item: CacheItem = {
      key,
      objectUrl,
      blob,
      lastAccessed: Date.now(),
      size: blob.size,
    };

    // 检查是否需要清理空间
    this.ensureSpace(item.size);

    // 添加到缓存
    this.cache.set(key, item);
    this.accessOrder.push(key);
    this.currentMemoryBytes += item.size;

    return objectUrl;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // 清理 ObjectURL
    URL.revokeObjectURL(item.objectUrl);

    // 从缓存中移除
    this.cache.delete(key);
    this.currentMemoryBytes -= item.size;

    // 从访问顺序中移除
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    return true;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    // 清理所有 ObjectURL
    for (const item of this.cache.values()) {
      URL.revokeObjectURL(item.objectUrl);
    }

    this.cache.clear();
    this.accessOrder = [];
    this.currentMemoryBytes = 0;
  }

  /**
   * 检查缓存项是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return item !== undefined && !this.isExpired(item);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    itemCount: number;
    memoryUsageMB: number;
    memoryUsageBytes: number;
    maxMemoryMB: number;
    hitRate?: number;
  } {
    return {
      itemCount: this.cache.size,
      memoryUsageMB: this.currentMemoryBytes / (1024 * 1024),
      memoryUsageBytes: this.currentMemoryBytes,
      maxMemoryMB: this.config.maxMemoryMB,
    };
  }

  /**
   * 手动触发清理
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    const now = Date.now();

    // 清理过期项
    const expiredKeys: string[] = [];
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    return initialSize - this.cache.size;
  }

  /**
   * 预加载缓存项
   */
  async preload(
    keys: string[],
    blobProvider: (key: string) => Promise<Blob | null>
  ): Promise<void> {
    const promises = keys
      .filter((key) => !this.has(key))
      .slice(0, 10) // 限制并发数
      .map(async (key) => {
        try {
          const blob = await blobProvider(key);
          if (blob) {
            this.set(key, blob);
          }
        } catch (error) {
          console.warn(`Failed to preload cache item: ${key}`, error);
        }
      });

    await Promise.all(promises);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }

  /**
   * 私有方法：检查项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.lastAccessed > this.config.ttl;
  }

  /**
   * 私有方法：更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 私有方法：确保有足够空间
   */
  private ensureSpace(requiredBytes: number): void {
    const maxBytes = this.config.maxMemoryMB * 1024 * 1024;

    // 检查内存限制
    while (
      this.currentMemoryBytes + requiredBytes > maxBytes ||
      this.cache.size >= this.config.maxItems
    ) {
      if (this.accessOrder.length === 0) break;

      const oldestKey = this.accessOrder[0];
      this.delete(oldestKey);
    }
  }

  /**
   * 私有方法：启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 私有方法：停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * 全局 LRU 缓存管理器实例
 */
let thumbnailCache: LRUCacheManager | undefined;
let fullImageCache: LRUCacheManager | undefined;

/**
 * 获取缩略图缓存管理器
 */
export function getThumbnailCache(): LRUCacheManager {
  if (!thumbnailCache) {
    thumbnailCache = new LRUCacheManager({
      maxItems: 200,
      maxMemoryMB: 20,
      ttl: 30 * 60 * 1000, // 30分钟
      cleanupInterval: 5 * 60 * 1000,
    });
  }
  return thumbnailCache;
}

/**
 * 获取完整图片缓存管理器
 */
export function getFullImageCache(): LRUCacheManager {
  if (!fullImageCache) {
    fullImageCache = new LRUCacheManager({
      maxItems: 20,
      maxMemoryMB: 100,
      ttl: 10 * 60 * 1000, // 10分钟
      cleanupInterval: 2 * 60 * 1000,
    });
  }
  return fullImageCache;
}

/**
 * 清理所有缓存
 */
export function clearAllCaches(): void {
  if (thumbnailCache) {
    thumbnailCache.clear();
  }
  if (fullImageCache) {
    fullImageCache.clear();
  }
}

/**
 * 获取总体缓存统计
 */
export function getGlobalCacheStats(): {
  thumbnail: ReturnType<LRUCacheManager['getStats']>;
  fullImage: ReturnType<LRUCacheManager['getStats']>;
  totalMemoryMB: number;
} {
  const thumbnailStats = getThumbnailCache().getStats();
  const fullImageStats = getFullImageCache().getStats();

  return {
    thumbnail: thumbnailStats,
    fullImage: fullImageStats,
    totalMemoryMB: thumbnailStats.memoryUsageMB + fullImageStats.memoryUsageMB,
  };
}

/**
 * 销毁所有缓存管理器
 */
export function destroyAllCaches(): void {
  if (thumbnailCache) {
    thumbnailCache.destroy();
    thumbnailCache = undefined;
  }
  if (fullImageCache) {
    fullImageCache.destroy();
    fullImageCache = undefined;
  }
}

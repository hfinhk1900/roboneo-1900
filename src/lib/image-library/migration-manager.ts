/**
 * 数据迁移管理器 - My Image Library
 *
 * 负责从 localStorage 中的历史记录迁移到新的 IndexedDB 存储
 */

import type {
  ImageRecord,
  MigrationStatus,
  ToolParams,
  ToolType,
} from '@/types/image-library';
import { IndexedDBManager } from './indexeddb-manager';

// 现有的历史记录接口
interface StickerHistoryItem {
  id?: string;
  url: string;
  style: string;
  asset_id?: string;
  createdAt: number;
}

interface ProductshotHistoryItem {
  id?: string;
  url: string;
  scene: string;
  asset_id?: string;
  createdAt: number;
}

interface AIBackgroundHistoryItem {
  id?: string;
  url: string;
  mode: 'background' | 'color';
  style: string;
  asset_id?: string;
  createdAt: number;
}

// localStorage 键名映射（兼容旧/新键名）
const STORAGE_KEYS: Record<string, string[]> = {
  // Sticker 历史
  sticker: ['sticker_history', 'roboneo_sticker_history_v1'],
  // Product Shot 历史
  productshot: ['roboneo_productshot_history_v1'],
  // AI Background 历史
  aibackground: ['roboneo_aibg_history_v1', 'aibackground_history'],
  // 水印移除 / 头像
  watermark: ['roboneo_watermark_removal_history_v1'],
  profile: ['roboneo_profile_picture_history_v1'],
};

export class MigrationManager {
  private static instances: Map<string, MigrationManager> = new Map();
  private dbManager: IndexedDBManager;

  private constructor(userId?: string) {
    this.dbManager = IndexedDBManager.getInstance(userId);
  }

  public static getInstance(userId?: string): MigrationManager {
    const key = userId || 'guest';
    if (!MigrationManager.instances.has(key)) {
      MigrationManager.instances.set(key, new MigrationManager(userId));
    }
    return MigrationManager.instances.get(key)!;
  }

  /**
   * 执行完整的数据迁移
   */
  async migrateAllData(): Promise<MigrationStatus> {
    const status: MigrationStatus = {
      isComplete: false,
      migratedCount: 0,
      totalCount: 0,
      errors: [],
    };

    try {
      // 初始化数据库
      await this.dbManager.initialize();

      // 检查是否已经迁移过
      if (await this.isMigrationComplete()) {
        status.isComplete = true;
        return status;
      }

      // 迁移各工具的历史记录
      const migrations = [
        this.migrateStickerHistory(),
        this.migrateProductshotHistory(),
        this.migrateAIBackgroundHistory(),
        this.migrateWatermarkRemovalHistory(),
        this.migrateProfilePictureHistory(),
        // 可以添加更多工具的迁移
      ];

      const results = await Promise.allSettled(migrations);

      // 汇总结果
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          status.migratedCount += result.value.count;
          status.totalCount += result.value.total;
        } else {
          const toolNames = [
            'Sticker',
            'ProductShot',
            'AIBackground',
            'WatermarkRemoval',
            'ProfilePicture',
          ];
          status.errors.push(
            `${toolNames[index]} migration failed: ${result.reason}`
          );
        }
      });

      // 标记迁移完成
      await this.markMigrationComplete();
      status.isComplete = true;

      // 清理 localStorage (可选，保守起见暂时保留)
      // await this.cleanupLocalStorage();
    } catch (error) {
      status.errors.push(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return status;
  }

  /**
   * 迁移 Sticker 历史记录
   */
  private async migrateStickerHistory(): Promise<{
    count: number;
    total: number;
  }> {
    const data = this.getCombinedLocalStorageData<StickerHistoryItem[]>(
      STORAGE_KEYS.sticker
    );
    if (!data || data.length === 0) {
      return { count: 0, total: 0 };
    }

    const records: ImageRecord[] = [];

    for (const item of data) {
      try {
        const record = await this.convertStickerItem(item);
        if (record) {
          records.push(record);
        }
      } catch (error) {
        console.warn('Failed to convert sticker item:', item, error);
      }
    }

    if (records.length > 0) {
      await this.dbManager.saveImages(records);
    }

    return { count: records.length, total: data.length };
  }

  /**
   * 迁移 ProductShot 历史记录
   */
  private async migrateProductshotHistory(): Promise<{
    count: number;
    total: number;
  }> {
    const data = this.getCombinedLocalStorageData<ProductshotHistoryItem[]>(
      STORAGE_KEYS.productshot
    );
    if (!data || data.length === 0) {
      return { count: 0, total: 0 };
    }

    const records: ImageRecord[] = [];

    for (const item of data) {
      try {
        const record = await this.convertProductshotItem(item);
        if (record) {
          records.push(record);
        }
      } catch (error) {
        console.warn('Failed to convert productshot item:', item, error);
      }
    }

    if (records.length > 0) {
      await this.dbManager.saveImages(records);
    }

    return { count: records.length, total: data.length };
  }

  /**
   * 迁移 AI Background 历史记录
   */
  private async migrateAIBackgroundHistory(): Promise<{
    count: number;
    total: number;
  }> {
    const data = this.getCombinedLocalStorageData<AIBackgroundHistoryItem[]>(
      STORAGE_KEYS.aibackground
    );
    if (!data || data.length === 0) {
      return { count: 0, total: 0 };
    }

    const records: ImageRecord[] = [];

    for (const item of data) {
      try {
        const record = await this.convertAIBackgroundItem(item);
        if (record) {
          records.push(record);
        }
      } catch (error) {
        console.warn('Failed to convert aibackground item:', item, error);
      }
    }

    if (records.length > 0) {
      await this.dbManager.saveImages(records);
    }

    return { count: records.length, total: data.length };
  }

  /**
   * 迁移 Watermark Removal 历史记录
   */
  private async migrateWatermarkRemovalHistory(): Promise<{
    count: number;
    total: number;
  }> {
    const data = this.getCombinedLocalStorageData<any[]>(
      STORAGE_KEYS.watermark
    );
    if (!data || data.length === 0) {
      return { count: 0, total: 0 };
    }

    const records: ImageRecord[] = [];
    for (const item of data) {
      try {
        const record = await this.convertWatermarkItem(item);
        if (record) records.push(record);
      } catch (error) {
        console.warn('Failed to convert watermark item:', item, error);
      }
    }

    if (records.length > 0) {
      await this.dbManager.saveImages(records);
    }

    return { count: records.length, total: data.length };
  }

  /**
   * 迁移 Profile Picture 历史记录
   */
  private async migrateProfilePictureHistory(): Promise<{
    count: number;
    total: number;
  }> {
    const data = this.getCombinedLocalStorageData<any[]>(STORAGE_KEYS.profile);
    if (!data || data.length === 0) {
      return { count: 0, total: 0 };
    }

    const records: ImageRecord[] = [];
    for (const item of data) {
      try {
        const record = await this.convertProfileItem(item);
        if (record) records.push(record);
      } catch (error) {
        console.warn('Failed to convert profile picture item:', item, error);
      }
    }

    if (records.length > 0) {
      await this.dbManager.saveImages(records);
    }

    return { count: records.length, total: data.length };
  }

  /**
   * 转换 Sticker 历史记录项
   */
  private async convertStickerItem(
    item: StickerHistoryItem
  ): Promise<ImageRecord | null> {
    if (!item.url) return null;

    try {
      const blob = await this.downloadImageAsBlob(item.url);
      const thumbnail = blob
        ? await this.dbManager.generateThumbnail(blob)
        : undefined;

      return {
        id: item.id || this.generateId('sticker'),
        url: item.url,
        blob: blob ?? undefined,
        thumbnail,
        toolType: 'sticker',
        toolParams: {
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        fileSize: blob?.size,
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    } catch (error) {
      console.warn(
        'Failed to download image for sticker item:',
        item.url,
        error
      );

      // 即使无法下载图片，也保存记录 (仅 URL)
      return {
        id: item.id || this.generateId('sticker'),
        url: item.url,
        toolType: 'sticker',
        toolParams: {
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    }
  }

  /**
   * 转换 ProductShot 历史记录项
   */
  private async convertProductshotItem(
    item: ProductshotHistoryItem
  ): Promise<ImageRecord | null> {
    if (!item.url) return null;

    try {
      const blob = await this.downloadImageAsBlob(item.url);
      const thumbnail = blob
        ? await this.dbManager.generateThumbnail(blob)
        : undefined;

      return {
        id: item.id || this.generateId('productshot'),
        url: item.url,
        blob: blob ?? undefined,
        thumbnail,
        toolType: 'productshot',
        toolParams: {
          scene: item.scene,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        fileSize: blob?.size,
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    } catch (error) {
      console.warn(
        'Failed to download image for productshot item:',
        item.url,
        error
      );

      return {
        id: item.id || this.generateId('productshot'),
        url: item.url,
        toolType: 'productshot',
        toolParams: {
          scene: item.scene,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    }
  }

  /**
   * 转换 AI Background 历史记录项
   */
  private async convertAIBackgroundItem(
    item: AIBackgroundHistoryItem
  ): Promise<ImageRecord | null> {
    if (!item.url) return null;

    try {
      const blob = await this.downloadImageAsBlob(item.url);
      const thumbnail = blob
        ? await this.dbManager.generateThumbnail(blob)
        : undefined;

      return {
        id: item.id || this.generateId('aibackground'),
        url: item.url,
        blob: blob ?? undefined,
        thumbnail,
        toolType: 'aibackground',
        toolParams: {
          mode: item.mode,
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        fileSize: blob?.size,
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    } catch (error) {
      console.warn(
        'Failed to download image for aibackground item:',
        item.url,
        error
      );

      return {
        id: item.id || this.generateId('aibackground'),
        url: item.url,
        toolType: 'aibackground',
        toolParams: {
          mode: item.mode,
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    }
  }

  /**
   * 转换 Watermark Removal 历史记录项
   * 以 processedImage 作为库中展示的图片
   */
  private async convertWatermarkItem(item: any): Promise<ImageRecord | null> {
    const url = item.processedImage || item.url;
    if (!url) return null;

    try {
      const blob = await this.downloadImageAsBlob(url);
      const thumbnail = blob
        ? await this.dbManager.generateThumbnail(blob)
        : undefined;

      return {
        id: item.id || this.generateId('watermark-removal'),
        url,
        blob: blob ?? undefined,
        thumbnail,
        toolType: 'watermark-removal',
        toolParams: {
          method: item.method,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        fileSize: blob?.size,
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    } catch (error) {
      console.warn('Failed to download watermark image:', url, error);
      return {
        id: item.id || this.generateId('watermark-removal'),
        url,
        toolType: 'watermark-removal',
        toolParams: {
          method: item.method,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    }
  }

  /**
   * 转换 Profile Picture 历史记录项
   */
  private async convertProfileItem(item: any): Promise<ImageRecord | null> {
    const url = item.url;
    if (!url) return null;

    try {
      const blob = await this.downloadImageAsBlob(url);
      const thumbnail = blob
        ? await this.dbManager.generateThumbnail(blob)
        : undefined;

      return {
        id: item.id || this.generateId('profile-picture'),
        url,
        blob: blob ?? undefined,
        thumbnail,
        toolType: 'profile-picture',
        toolParams: {
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        fileSize: blob?.size,
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    } catch (error) {
      console.warn('Failed to download profile image:', url, error);
      return {
        id: item.id || this.generateId('profile-picture'),
        url,
        toolType: 'profile-picture',
        toolParams: {
          style: item.style,
        } as ToolParams,
        createdAt: item.createdAt || Date.now(),
        lastAccessedAt: Date.now(),
        syncStatus: item.id ? 'synced' : 'local',
        serverId: item.id,
      };
    }
  }

  /**
   * 从 localStorage 获取数据
   */
  private getLocalStorageData<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Failed to parse localStorage data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 从多个 localStorage 键合并数据（按时间降序去重）
   */
  private getCombinedLocalStorageData<T extends Array<any>>(
    keys: string[]
  ): any[] | null {
    const all: any[] = [];
    for (const key of keys) {
      const part = this.getLocalStorageData<any[]>(key);
      if (Array.isArray(part)) {
        all.push(...part);
      }
    }
    if (all.length === 0) return null;
    // 去重：按 id/url + createdAt 去重
    const seen = new Set<string>();
    const unique = all.filter((item) => {
      const id = item?.id || item?.url || JSON.stringify(item).slice(0, 100);
      const key = `${id}-${item?.createdAt || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // 按时间降序
    unique.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
    return unique;
  }

  /**
   * 下载图片为 Blob
   */
  private async downloadImageAsBlob(url: string): Promise<Blob | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.warn('Failed to download image:', url, error);
      return null;
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(toolType: ToolType): string {
    return `${toolType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查迁移是否已完成
   */
  private async isMigrationComplete(): Promise<boolean> {
    try {
      const metadata = await this.getMetadata('migration_complete');
      return metadata === 'true';
    } catch {
      return false;
    }
  }

  /**
   * 标记迁移完成
   */
  private async markMigrationComplete(): Promise<void> {
    await this.setMetadata('migration_complete', 'true');
    await this.setMetadata('migration_date', new Date().toISOString());
  }

  /**
   * 获取元数据
   */
  private async getMetadata(key: string): Promise<string | null> {
    await this.dbManager.initialize();

    return new Promise((resolve, reject) => {
      const db = (this.dbManager as any).db;
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 设置元数据
   */
  private async setMetadata(key: string, value: string): Promise<void> {
    await this.dbManager.initialize();

    return new Promise((resolve, reject) => {
      const db = (this.dbManager as any).db;
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理 localStorage (可选)
   */
  private async cleanupLocalStorage(): Promise<void> {
    try {
      Object.values(STORAGE_KEYS).forEach((keys) => {
        for (const key of keys) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }

  /**
   * 获取迁移进度 (用于 UI 显示)
   */
  async getMigrationProgress(): Promise<MigrationStatus> {
    const totalItems = this.countLocalStorageItems();

    if (totalItems === 0) {
      return {
        isComplete: true,
        migratedCount: 0,
        totalCount: 0,
        errors: [],
      };
    }

    // 检查数据库中已有的记录数
    await this.dbManager.initialize();
    const result = await this.dbManager.queryImages({}, 'newest', {
      page: 1,
      pageSize: 1000,
    });

    return {
      isComplete: await this.isMigrationComplete(),
      migratedCount: result.totalCount,
      totalCount: totalItems,
      errors: [],
    };
  }

  /**
   * 统计 localStorage 中的记录数
   */
  private countLocalStorageItems(): number {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach((keys) => {
      const combined = this.getCombinedLocalStorageData<any[]>(keys);
      if (Array.isArray(combined)) total += combined.length;
    });
    return total;
  }
}

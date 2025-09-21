/**
 * IndexedDB 管理器 - My Image Library 数据存储层
 *
 * 提供高性能的本地图片存储、缩略图管理和 LRU 缓存
 */

import type {
  FilterOptions,
  ImageRecord,
  MigrationStatus,
  PaginationParams,
  QueryResult,
  SortOption,
  StorageQuota,
  ThumbnailConfig,
} from '@/types/image-library';

export class IndexedDBManager {
  private static instances: Map<string, IndexedDBManager> = new Map();
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly dbVersion = 1;

  // 表名
  private readonly stores = {
    images: 'images',
    thumbnails: 'thumbnails',
    metadata: 'metadata',
  };

  // 缩略图配置
  private readonly thumbnailConfig: ThumbnailConfig = {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.8,
  };

  private constructor(userId?: string) {
    // 为每个用户创建独立的数据库
    if (userId) {
      this.dbName = `RoboneoImageLibrary_${userId}`;
    } else {
      // 未登录用户使用通用数据库（本地预览）
      this.dbName = 'RoboneoImageLibrary_Guest';
    }
  }

  public static getInstance(userId?: string): IndexedDBManager {
    const key = userId || 'guest';
    if (!IndexedDBManager.instances.has(key)) {
      IndexedDBManager.instances.set(key, new IndexedDBManager(userId));
    }
    return IndexedDBManager.instances.get(key)!;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 图片记录表
        if (!db.objectStoreNames.contains(this.stores.images)) {
          const imageStore = db.createObjectStore(this.stores.images, {
            keyPath: 'id',
          });

          // 创建索引
          imageStore.createIndex('toolType', 'toolType', { unique: false });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
          imageStore.createIndex('lastAccessedAt', 'lastAccessedAt', {
            unique: false,
          });
          imageStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          imageStore.createIndex('fileSize', 'fileSize', { unique: false });
        }

        // 缩略图存储表 (单独存储以优化查询性能)
        if (!db.objectStoreNames.contains(this.stores.thumbnails)) {
          db.createObjectStore(this.stores.thumbnails, {
            keyPath: 'imageId',
          });
        }

        // 元数据表 (统计信息、配置等)
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          db.createObjectStore(this.stores.metadata, {
            keyPath: 'key',
          });
        }
      };
    });
  }

  /**
   * 保存图片记录
   */
  async saveImage(record: ImageRecord): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readwrite'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      // 保存主记录 (不包含 blob 以减少主表大小)
      const recordToSave: ImageRecord = {
        ...record,
        blob: undefined, // blob 单独存储在 thumbnails 表中
        lastAccessedAt: Date.now(),
      };

      const imageRequest = imageStore.put(recordToSave);

      // 如果有 blob 或缩略图，保存到单独的表
      if (record.blob || record.thumbnail) {
        const thumbnailData = {
          imageId: record.id,
          fullBlob: record.blob,
          thumbnailBlob: record.thumbnail,
          updatedAt: Date.now(),
        };
        thumbnailStore.put(thumbnailData);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 批量保存图片记录
   */
  async saveImages(records: ImageRecord[]): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readwrite'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      let completed = 0;
      const total = records.length;

      if (total === 0) {
        resolve();
        return;
      }

      records.forEach((record) => {
        // 保存主记录
        const recordToSave: ImageRecord = {
          ...record,
          blob: undefined,
          lastAccessedAt: Date.now(),
        };

        const imageRequest = imageStore.put(recordToSave);

        imageRequest.onsuccess = () => {
          // 保存 blob 数据
          if (record.blob || record.thumbnail) {
            const thumbnailData = {
              imageId: record.id,
              fullBlob: record.blob,
              thumbnailBlob: record.thumbnail,
              updatedAt: Date.now(),
            };

            const thumbnailRequest = thumbnailStore.put(thumbnailData);
            thumbnailRequest.onsuccess = () => {
              completed++;
              if (completed === total) resolve();
            };
            thumbnailRequest.onerror = () => reject(thumbnailRequest.error);
          } else {
            completed++;
            if (completed === total) resolve();
          }
        };

        imageRequest.onerror = () => reject(imageRequest.error);
      });
    });
  }

  /**
   * 获取图片记录 (带缩略图)
   */
  async getImage(id: string, includeFull = false): Promise<ImageRecord | null> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readonly'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      const imageRequest = imageStore.get(id);

      imageRequest.onsuccess = () => {
        const record = imageRequest.result as ImageRecord;
        if (!record) {
          resolve(null);
          return;
        }

        // 获取 blob 数据
        const thumbnailRequest = thumbnailStore.get(id);
        thumbnailRequest.onsuccess = () => {
          const thumbnailData = thumbnailRequest.result;

          if (thumbnailData) {
            record.thumbnail = thumbnailData.thumbnailBlob;
            if (includeFull) {
              record.blob = thumbnailData.fullBlob;
            }
          }

          // 更新访问时间
          record.lastAccessedAt = Date.now();
          this.updateLastAccessed(id);

          resolve(record);
        };

        thumbnailRequest.onerror = () => {
          // 即使缩略图获取失败，仍返回主记录
          resolve(record);
        };
      };

      imageRequest.onerror = () => reject(imageRequest.error);
    });
  }

  /**
   * 查询图片记录 (支持筛选、排序、分页)
   */
  async queryImages(
    filters: FilterOptions = {},
    sort: SortOption = 'newest',
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<QueryResult> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readonly'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      let request: IDBRequest;

      // 根据筛选条件选择索引
      if (filters.toolType && filters.toolType !== 'all') {
        const index = imageStore.index('toolType');
        request = index.getAll(filters.toolType);
      } else {
        request = imageStore.getAll();
      }

      request.onsuccess = async () => {
        let records = request.result as ImageRecord[];

        // 应用其他筛选条件
        records = this.applyFilters(records, filters);

        // 排序
        records = this.applySorting(records, sort);

        // 计算分页
        const totalCount = records.length;
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedRecords = records.slice(startIndex, endIndex);

        // 批量加载缩略图
        const recordsWithThumbnails = await this.loadThumbnailsForRecords(
          paginatedRecords,
          thumbnailStore
        );

        resolve({
          records: recordsWithThumbnails,
          totalCount,
          hasMore: endIndex < totalCount,
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除图片记录
   */
  async deleteImage(id: string): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readwrite'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      imageStore.delete(id);
      thumbnailStore.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 批量删除图片记录
   */
  async deleteImages(ids: string[]): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails],
        'readwrite'
      );
      const imageStore = transaction.objectStore(this.stores.images);
      const thumbnailStore = transaction.objectStore(this.stores.thumbnails);

      let completed = 0;
      const total = ids.length;

      if (total === 0) {
        resolve();
        return;
      }

      ids.forEach((id) => {
        const imageRequest = imageStore.delete(id);
        const thumbnailRequest = thumbnailStore.delete(id);

        imageRequest.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };

        imageRequest.onerror = () => reject(imageRequest.error);
      });
    });
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.stores.images, this.stores.thumbnails, this.stores.metadata],
        'readwrite'
      );

      transaction.objectStore(this.stores.images).clear();
      transaction.objectStore(this.stores.thumbnails).clear();
      transaction.objectStore(this.stores.metadata).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 获取存储配额信息
   */
  async getStorageQuota(): Promise<StorageQuota> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
      };
    }

    return {
      used: 0,
      total: 0,
      available: 0,
    };
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const { maxWidth, maxHeight, quality } = this.thumbnailConfig;

        // 计算缩略图尺寸 (保持宽高比)
        const { width, height } = this.calculateThumbnailSize(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // 绘制缩略图
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (thumbnailBlob) => {
            if (thumbnailBlob) {
              resolve(thumbnailBlob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * 私有方法：确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * 私有方法：应用筛选条件
   */
  private applyFilters(
    records: ImageRecord[],
    filters: FilterOptions
  ): ImageRecord[] {
    let filtered = records;

    // 日期范围筛选
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((record) => {
        const createdDate = new Date(record.createdAt);
        return createdDate >= start && createdDate <= end;
      });
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((record) => {
        return filters.tags!.some((tag) => record.tags?.includes(tag));
      });
    }

    // 搜索文本筛选
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      filtered = filtered.filter((record) => {
        return (
          record.id.toLowerCase().includes(searchText) ||
          record.toolType.toLowerCase().includes(searchText) ||
          JSON.stringify(record.toolParams)
            .toLowerCase()
            .includes(searchText) ||
          record.tags?.some((tag) => tag.toLowerCase().includes(searchText))
        );
      });
    }

    return filtered;
  }

  /**
   * 私有方法：应用排序
   */
  private applySorting(
    records: ImageRecord[],
    sort: SortOption
  ): ImageRecord[] {
    switch (sort) {
      case 'newest':
        return records.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return records.sort((a, b) => a.createdAt - b.createdAt);
      case 'mostAccessed':
        return records.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
      case 'largest':
        return records.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
      case 'smallest':
        return records.sort((a, b) => (a.fileSize || 0) - (b.fileSize || 0));
      default:
        return records;
    }
  }

  /**
   * 私有方法：批量加载缩略图
   */
  private async loadThumbnailsForRecords(
    records: ImageRecord[],
    thumbnailStore: IDBObjectStore
  ): Promise<ImageRecord[]> {
    return Promise.all(
      records.map(async (record) => {
        return new Promise<ImageRecord>((resolve) => {
          const request = thumbnailStore.get(record.id);
          request.onsuccess = () => {
            const thumbnailData = request.result;
            if (thumbnailData) {
              record.thumbnail = thumbnailData.thumbnailBlob;
            }
            resolve(record);
          };
          request.onerror = () => resolve(record); // 失败时返回原记录
        });
      })
    );
  }

  /**
   * 私有方法：更新访问时间
   */
  private async updateLastAccessed(id: string): Promise<void> {
    try {
      const transaction = this.db!.transaction(
        [this.stores.images],
        'readwrite'
      );
      const store = transaction.objectStore(this.stores.images);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.lastAccessedAt = Date.now();
          store.put(record);
        }
      };
    } catch (error) {
      // 静默失败，不影响主要功能
      console.warn('Failed to update last accessed time:', error);
    }
  }

  /**
   * 私有方法：计算缩略图尺寸
   */
  private calculateThumbnailSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }
}

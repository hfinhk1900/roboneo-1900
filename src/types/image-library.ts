/**
 * My Image Library - 统一图片记录接口和类型定义
 *
 * 用于整合所有 AI 工具生成的图片记录，提供统一的存储和管理接口
 */

export type ToolType =
  | 'sticker'
  | 'productshot'
  | 'aibackground'
  | 'watermark-removal'
  | 'profile-picture'
  | 'scream-ai';

export interface ImageRecord {
  /** 唯一标识符 */
  id: string;
  /** 图片 URL (可能是 ObjectURL 或远程 URL) */
  url: string;
  /** 原始文件 Blob (IndexedDB 存储) */
  blob?: Blob;
  /** 缩略图 Blob */
  thumbnail?: Blob;
  /** 生成图片的工具类型 */
  toolType: ToolType;
  /** 工具特定参数 */
  toolParams: ToolParams;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后访问时间 (用于 LRU 缓存) */
  lastAccessedAt: number;
  /** 文件大小 (字节) */
  fileSize?: number;
  /** 图片尺寸 */
  dimensions?: {
    width: number;
    height: number;
  };
  /** 服务端同步状态 */
  syncStatus: 'local' | 'synced' | 'pending' | 'error';
  /** 服务端 ID (同步后获得) */
  serverId?: string;
  /** 标签 (用户自定义) */
  tags?: string[];
}

export type ToolParams =
  | StickerParams
  | ProductshotParams
  | AIBackgroundParams
  | WatermarkRemovalParams
  | ProfilePictureParams
  | ScreamAIParams;

export interface StickerParams {
  style: string; // 'ios', 'pixel', 'lego', 'snoopy'
}

export interface ProductshotParams {
  scene: string; // 场景类型
}

export interface AIBackgroundParams {
  mode: 'background' | 'color';
  style: string; // 背景样式或颜色值
}

export interface WatermarkRemovalParams {
  method?: string; // 去除方法
}

export interface ProfilePictureParams {
  style?: string; // 头像风格
}

export interface ScreamAIParams {
  presetId: string;
  aspectRatio?: string | null;
  watermarked?: boolean;
}

/**
 * 筛选器选项
 */
export interface FilterOptions {
  toolType?: ToolType | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  searchText?: string;
}

/**
 * 排序选项
 */
export type SortOption =
  | 'newest'
  | 'oldest'
  | 'mostAccessed'
  | 'largest'
  | 'smallest';

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 查询结果
 */
export interface QueryResult {
  records: ImageRecord[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * 缩略图配置
 */
export interface ThumbnailConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * 存储配额信息
 */
export interface StorageQuota {
  used: number;
  total: number;
  available: number;
}

/**
 * 数据迁移状态
 */
export interface MigrationStatus {
  isComplete: boolean;
  migratedCount: number;
  totalCount: number;
  errors: string[];
}

/**
 * 同步状态
 */
export interface SyncProgress {
  totalItems: number;
  syncedItems: number;
  failedItems: number;
  isInProgress: boolean;
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircleIcon,
  DownloadIcon,
  FilterIcon,
  FolderIcon,
  ImageIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TrashIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useCurrentUser } from '@/hooks/use-current-user';

import { BatchAnalyticsManager } from '@/lib/analytics/batch-analytics-manager';
import { APICacheManager } from '@/lib/cache/api-cache-manager';
import { BatchDownloadManager } from '@/lib/image-library/batch-download-manager';
import { IndexedDBManager } from '@/lib/image-library/indexeddb-manager';
import {
  getFullImageCache,
  getThumbnailCache,
} from '@/lib/image-library/lru-cache-manager';
import { MigrationManager } from '@/lib/image-library/migration-manager';
import type {
  FilterOptions,
  ImageRecord,
  MigrationStatus,
  SortOption,
  StorageQuota,
  ToolType,
} from '@/types/image-library';
import PerformanceDashboard from './performance-dashboard';
// Admin-only widgets moved to admin tools page

// 工具类型映射
const TOOL_LABELS: Record<ToolType, string> = {
  sticker: 'Image to Sticker',
  productshot: 'Product Shots',
  aibackground: 'AI Backgrounds',
  'watermark-removal': 'Watermark Removal',
  'profile-picture': 'Profile Picture Maker',
};

// 排序选项映射
const SORT_OPTIONS: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  mostAccessed: 'Most Accessed',
  largest: 'Largest File',
  smallest: 'Smallest File',
};

export default function MyImageLibrary() {
  // 获取当前用户（用于数据隔离）
  const currentUser = useCurrentUser();
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Removed view mode toggle to simplify UI

  // 筛选和排序状态
  const [filters, setFilters] = useState<FilterOptions>({
    toolType: 'all',
  });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchText, setSearchText] = useState('');

  // UI 状态
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageRecord | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageRecord | null>(null);
  // Storage and SW status UI removed from public page

  // 批量下载状态
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    completed: number;
    total: number;
    currentFile?: string;
  } | null>(null);
  const [showBatchDownloadDialog, setShowBatchDownloadDialog] = useState(false);

  // 存储和迁移状态
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [migrationStatus, setMigrationStatus] =
    useState<MigrationStatus | null>(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  // 管理器实例 - 基于用户ID隔离数据
  const dbManager = useMemo(() => IndexedDBManager.getInstance(currentUser?.id), [currentUser?.id]);
  const migrationManager = useMemo(() => MigrationManager.getInstance(currentUser?.id), [currentUser?.id]);
  const thumbnailCache = useMemo(() => getThumbnailCache(), []);
  const fullImageCache = useMemo(() => getFullImageCache(), []);
  const batchDownloadManager = useMemo(() => new BatchDownloadManager(), []);
  const apiCache = useMemo(() => APICacheManager.getInstance(), []);

  // 仅在开发环境中创建分析管理器，避免生产环境的性能影响
  const analytics = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      return BatchAnalyticsManager.getInstance();
    }
    // 生产环境返回一个简化的mock对象
    return {
      track: () => {},
      trackError: () => {},
      trackImageView: () => {},
      trackImageDownload: () => {},
      trackBatchDownload: () => {},
      trackMigration: () => {},
      trackCacheHit: () => {},
      trackCacheMiss: () => {},
    };
  }, []);

  // 初始化
  useEffect(() => {
    initializeLibrary();
  }, []);

  // 监听筛选和排序变化
  useEffect(() => {
    loadImages(true);
  }, [filters, sortOption, searchText]);

  /**
   * 初始化图片库
   */
  const initializeLibrary = async () => {
    try {
      setIsLoading(true);

      // 记录初始化开始
      analytics.track('library_initialization_started');

      // 初始化数据库
      await dbManager.initialize();

      // 检查迁移状态
      const migrationProgress = await migrationManager.getMigrationProgress();
      setMigrationStatus(migrationProgress);

      // 如果需要迁移且有数据，静默迁移一次，避免空列表
      if (
        migrationProgress.totalCount > 0 &&
        (migrationProgress.migratedCount === 0 || !migrationProgress.isComplete)
      ) {
        analytics.track('migration_auto_started', {
          total_count: migrationProgress.totalCount,
        });
        try {
          const result = await migrationManager.migrateAllData();
          setMigrationStatus(result);
          analytics.track('migration_auto_completed', {
            migrated: result.migratedCount,
            total: result.totalCount,
            errors: result.errors.length,
          });
        } catch (e) {
          analytics.trackError('migration_auto_failed', {
            error_message: e instanceof Error ? e.message : 'Unknown',
          });
        }
      }

      // 加载存储配额信息
      const quota = await dbManager.getStorageQuota();
      setStorageQuota(quota);

      // 加载图片
      await loadImages(true);

      // 记录初始化成功
      analytics.track('library_initialization_completed', {
        total_images: totalCount,
        storage_used: quota.used,
        migration_needed: !migrationProgress.isComplete,
      });
    } catch (error) {
      console.error('Failed to initialize library:', error);
      analytics.trackError('library_initialization_failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to initialize image library');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 加载图片列表
   */
  const loadImages = useCallback(
    async (reset = false) => {
      try {
        const page = reset ? 1 : currentPage;
        const searchFilters = searchText ? { ...filters, searchText } : filters;

        const result = await dbManager.queryImages(searchFilters, sortOption, {
          page,
          pageSize: 20,
        });

        if (reset) {
          setImages(result.records);
          setCurrentPage(1);
        } else {
          setImages((prev) => [...prev, ...result.records]);
        }

        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Failed to load images:', error);
        toast.error('Failed to load images');
      }
    },
    [filters, sortOption, searchText, currentPage, dbManager]
  );

  /**
   * 静默数据迁移
   */
  const handleSilentMigration = async () => {
    try {
      const result = await migrationManager.migrateAllData();
      setMigrationStatus(result);

      if (result.errors.length > 0) {
        toast.warning(`迁移完成，${result.errors.length} 张图片迁移失败`);
      } else {
        toast.success(`成功迁移 ${result.migratedCount} 张历史图片！`);
      }

      // 重新加载图片
      await loadImages(true);
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('图片迁移失败，请刷新页面重试');
    }
  };

  /**
   * 执行数据迁移 (用户主动触发)
   */
  const handleMigration = async () => {
    try {
      setShowMigrationDialog(false);
      setIsLoading(true);

      toast.info('Starting data migration...');

      // 记录迁移开始
      analytics.track('migration_started', {
        total_count: migrationStatus?.totalCount || 0,
      });

      const result = await migrationManager.migrateAllData();
      setMigrationStatus(result);

      // 记录迁移结果
      analytics.trackMigration(
        result.migratedCount,
        result.totalCount,
        result.errors.length
      );

      if (result.errors.length > 0) {
        toast.warning(
          `Migration completed with ${result.errors.length} errors`
        );
      } else {
        toast.success(`Successfully migrated ${result.migratedCount} images`);
      }

      // 重新加载图片
      await loadImages(true);
    } catch (error) {
      console.error('Migration failed:', error);
      analytics.trackError('migration_failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Data migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取缓存的缩略图 URL
   */
  const getCachedThumbnailUrl = useCallback(
    async (imageRecord: ImageRecord): Promise<string | null> => {
      const cacheKey = `thumbnail_${imageRecord.id}`;

      // 尝试从缓存获取
      let objectUrl = thumbnailCache.get(cacheKey);
      if (objectUrl) {
        return objectUrl;
      }

      // 如果缓存中没有，但记录中有缩略图 blob
      if (imageRecord.thumbnail) {
        objectUrl = thumbnailCache.set(cacheKey, imageRecord.thumbnail);
        return objectUrl;
      }

      // 从数据库加载缩略图
      try {
        const fullRecord = await dbManager.getImage(imageRecord.id, false);
        if (fullRecord?.thumbnail) {
          objectUrl = thumbnailCache.set(cacheKey, fullRecord.thumbnail);
          return objectUrl;
        }
      } catch (error) {
        console.warn('Failed to load thumbnail:', error);
      }

      return null;
    },
    [thumbnailCache, dbManager]
  );

  /**
   * 获取缓存的完整图片 URL
   */
  const getCachedFullImageUrl = useCallback(
    async (imageRecord: ImageRecord): Promise<string | null> => {
      const cacheKey = `full_${imageRecord.id}`;

      // 尝试从缓存获取
      let objectUrl = fullImageCache.get(cacheKey);
      if (objectUrl) {
        return objectUrl;
      }

      // 从数据库加载完整图片
      try {
        const fullRecord = await dbManager.getImage(imageRecord.id, true);
        if (fullRecord?.blob) {
          objectUrl = fullImageCache.set(cacheKey, fullRecord.blob);
          return objectUrl;
        }
      } catch (error) {
        console.warn('Failed to load full image:', error);
      }

      return null;
    },
    [fullImageCache, dbManager]
  );

  /**
   * 处理图片预览
   */
  const handleImagePreview = async (imageRecord: ImageRecord) => {
    try {
      // 记录图片查看埋点
      analytics.trackImageView(imageRecord.id, imageRecord.toolType);

      // 使用缓存获取完整图片
      const cachedUrl = await getCachedFullImageUrl(imageRecord);

      if (cachedUrl) {
        analytics.trackCacheHit('full_image', imageRecord.id);
        setPreviewImage({ ...imageRecord, url: cachedUrl });
      } else {
        analytics.trackCacheMiss('full_image', imageRecord.id);
        // 回退到原 URL
        setPreviewImage(imageRecord);
      }

      setShowPreview(true);

      // 记录预览成功
      analytics.track('image_preview_opened', {
        image_id: imageRecord.id,
        tool_type: imageRecord.toolType,
        file_size: imageRecord.fileSize,
        from_cache: !!cachedUrl,
      });
    } catch (error) {
      console.error('Failed to load full image:', error);
      analytics.trackError('image_preview_failed', {
        image_id: imageRecord.id,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to load image');
    }
  };

  /**
   * 下载图片
   */
  const handleDownload = async (imageRecord: ImageRecord) => {
    try {
      // 使用缓存获取完整图片
      const cachedUrl = await getCachedFullImageUrl(imageRecord);

      if (cachedUrl) {
        analytics.trackCacheHit('full_image_download', imageRecord.id);
        // 使用缓存的 URL 下载
        const a = document.createElement('a');
        a.href = cachedUrl;
        a.download = `${imageRecord.toolType}_${imageRecord.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // 注意：不要手动 revokeObjectURL，LRU 缓存会管理生命周期
      } else {
        analytics.trackCacheMiss('full_image_download', imageRecord.id);
        // 回退到原 URL 下载
        const a = document.createElement('a');
        a.href = imageRecord.url;
        a.download = `${imageRecord.toolType}_${imageRecord.id}.png`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // 记录下载成功
      analytics.trackImageDownload(imageRecord.id, imageRecord.toolType, 'png');
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Failed to download image:', error);
      analytics.trackError('image_download_failed', {
        image_id: imageRecord.id,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to download image');
    }
  };

  /**
   * 显示单个图片删除确认弹窗
   */
  const showDeleteConfirmation = (imageRecord: ImageRecord) => {
    setImageToDelete(imageRecord);
    setShowSingleDeleteConfirm(true);
  };

  /**
   * 删除单个图片
   */
  const handleSingleDelete = async () => {
    if (!imageToDelete) return;

    try {
      await dbManager.deleteImages([imageToDelete.id]);

      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageToDelete.id);
        return newSet;
      });

      // 记录删除操作
      analytics.track('image_deleted', {
        image_id: imageToDelete.id,
        tool_type: imageToDelete.toolType,
      });

      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    } finally {
      setShowSingleDeleteConfirm(false);
      setImageToDelete(null);
    }
  };

  /**
   * 删除选中的图片
   */
  const handleDeleteSelected = async () => {
    try {
      const idsToDelete = Array.from(selectedImages);
      await dbManager.deleteImages(idsToDelete);

      setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)));
      setSelectedImages(new Set());
      setShowDeleteConfirm(false);

      toast.success(`Deleted ${idsToDelete.length} images`);
    } catch (error) {
      console.error('Failed to delete images:', error);
      toast.error('Failed to delete images');
    }
  };

  /**
   * 批量下载选中的图片
   */
  const handleBatchDownload = async (
    format: 'zip' | 'individual' = 'individual'
  ) => {
    if (selectedImages.size === 0) return;

    const selectedRecords = images.filter((img) => selectedImages.has(img.id));

    try {
      setIsDownloading(true);
      setDownloadProgress({ completed: 0, total: selectedRecords.length });

      // 记录批量下载开始
      analytics.trackBatchDownload(selectedRecords.length, format);

      const result = await batchDownloadManager.downloadImages(
        selectedRecords,
        {
          format,
          includeMetadata: false,
          zipFileName: `my-images-${new Date().toISOString().split('T')[0]}.zip`,
          onProgress: (completed, total, currentFile) => {
            setDownloadProgress({ completed, total, currentFile });
          },
          onError: (error, record) => {
            console.warn('Download error:', error, record);
            analytics.trackError('batch_download_item_failed', {
              image_id: record?.id,
              error_message: error,
            });
          },
        }
      );

      if (result.success) {
        // 记录批量下载成功
        analytics.track('batch_download_completed', {
          total_images: selectedRecords.length,
          downloaded_count: result.downloadedCount,
          failed_count: result.failedCount,
          format,
          success_rate: result.downloadedCount / selectedRecords.length,
        });

        toast.success(
          `Successfully downloaded ${result.downloadedCount} images`
        );
        if (result.failedCount > 0) {
          toast.warning(`${result.failedCount} images failed to download`);
        }
      } else {
        analytics.track('batch_download_failed', {
          total_images: selectedRecords.length,
          format,
          error_count: result.errors.length,
        });
        toast.error('Download failed');
      }
    } catch (error) {
      console.error('Failed to batch download:', error);
      analytics.trackError('batch_download_error', {
        total_images: selectedRecords.length,
        format,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to download images');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  /**
   * 切换图片选择
   */
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  /**
   * 格式化日期
   */
  const formatDate = (timestamp: number): string => {
    try {
      const iso = new Date(timestamp).toISOString();
      return iso.slice(0, 10) + ' ' + iso.slice(11, 16) + ' UTC';
    } catch {
      return '';
    }
  };

  // 渲染筛选栏
  const renderFilters = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* 搜索框 */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search
          </Label>
          <div className="relative mt-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search images..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 工具类型筛选 */}
        <div className="w-48">
          <Label className="text-sm font-medium text-gray-700">Tool Type</Label>
          <Select
            value={filters.toolType || 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                toolType: value === 'all' ? 'all' : (value as ToolType),
              }))
            }
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {Object.entries(TOOL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 排序选项 */}
        <div className="w-48">
          <Label className="text-sm font-medium text-gray-700">Sort By</Label>
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 视图模式切换已移除 */}
      </div>
    </div>
  );

  // 渲染操作栏
  const renderActionBar = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="text-sm text-gray-600">
            {totalCount} images total
            {selectedImages.size > 0 && `, ${selectedImages.size} selected`}
          </div>

          {images.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedImages.size === images.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedImages.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchDownload('individual')}
                disabled={isDownloading}
                className="flex-shrink-0"
              >
                <DownloadIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {isDownloading
                    ? 'Downloading...'
                    : `Download ${selectedImages.size}`}
                </span>
                <span className="sm:hidden">
                  {isDownloading ? 'Downloading...' : 'Download'}
                </span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDownloading}
                className="flex-shrink-0"
              >
                <TrashIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  Delete ({selectedImages.size})
                </span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </>
          )}

          {/* Storage/SW 状态已迁移到 Admin Tools 页面 */}
        </div>
      </div>
    </div>
  );

  /**
   * 缓存图片组件
   */
  const CachedImageCard = ({ image }: { image: ImageRecord }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let mounted = true;

      const loadThumbnail = async () => {
        try {
          const url = await getCachedThumbnailUrl(image);
          if (mounted) {
            setThumbnailUrl(url);
            setIsLoading(false);
          }
        } catch (error) {
          console.warn('Failed to load cached thumbnail:', error);
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

      loadThumbnail();

      return () => {
        mounted = false;
      };
    }, [image]);

    return (
      <div className="group relative">
        <div className="relative w-full aspect-square bg-white border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center animate-pulse">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          ) : thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={`${image.toolType} image`}
              width={200}
              height={200}
              className="w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              unoptimized
              onClick={(e) => {
                e.stopPropagation();
                handleImagePreview(image);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* 选择框 */}
          <input
            type="checkbox"
            checked={selectedImages.has(image.id)}
            onChange={() => toggleImageSelection(image.id)}
            className="absolute top-2 left-2 w-4 h-4"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 工具类型标签 */}
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
            {TOOL_LABELS[image.toolType]}
          </Badge>
        </div>

        {/* 信息行 */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[60%]">
            {TOOL_LABELS[image.toolType]}
          </span>
          <span>{formatDate(image.createdAt)}</span>
        </div>

        {/* 按钮行 */}
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
            title="Download image"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(image);
            }}
          >
            <DownloadIcon className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
            title="Delete image"
            onClick={(e) => {
              e.stopPropagation();
              showDeleteConfirmation(image);
            }}
          >
            <Trash2Icon className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>
    );
  };

  // 渲染图片网格
  const renderImageGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {images.map((image) => (
        <CachedImageCard key={image.id} image={image} />
      ))}
    </div>
  );

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading your image library...</p>
        </div>
      </div>
    );
  }

  // 下载进度显示
  const renderDownloadProgress = () => {
    if (!downloadProgress) return null;

    const percentage = Math.round(
      (downloadProgress.completed / downloadProgress.total) * 100
    );

    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Downloading Images</h4>
          <span className="text-sm text-gray-600">
            {downloadProgress.completed}/{downloadProgress.total}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {downloadProgress.currentFile &&
              `Current: ${downloadProgress.currentFile}`}
          </span>
          <span className="text-xs font-medium">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">My Image Library</h1>
        <p className="text-gray-600">
          All your AI-generated images in one place
        </p>
      </div>

      {/* 开发者工具 - 仅在显式开启时显示 */}
      {process.env.NEXT_PUBLIC_SHOW_PERF_DASHBOARD === 'true' && (
        <div className="mb-6">
          <PerformanceDashboard />
        </div>
      )}

      {/* 筛选栏 */}
      {renderFilters()}

      {/* 操作栏 */}
      {renderActionBar()}

      {/* 图片网格 */}
      {images.length > 0 ? (
        <>
          {renderImageGrid()}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPage((prev) => prev + 1);
                  loadImages(false);
                }}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <FolderIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No images found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchText || filters.toolType !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Start creating images with our AI tools'}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      )}

      {/* 迁移对话框 */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrate Your Image History</DialogTitle>
            <DialogDescription>
              We found {migrationStatus?.totalCount} images in your browser
              storage. Would you like to migrate them to the new image library
              for better performance?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowMigrationDialog(false)}
            >
              Skip
            </Button>
            <Button onClick={handleMigration}>Migrate Images</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Images</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedImages.size} selected
              images? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 单张图片删除确认对话框 */}
      <Dialog open={showSingleDeleteConfirm} onOpenChange={setShowSingleDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSingleDeleteConfirm(false);
                setImageToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSingleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {previewImage && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {TOOL_LABELS[previewImage.toolType]} Image
                </DialogTitle>
                <DialogDescription>
                  Created on {formatDate(previewImage.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Image
                    src={previewImage.url}
                    alt={`${previewImage.toolType} image`}
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg"
                    unoptimized
                    style={{ maxHeight: '60vh', objectFit: 'contain' }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Size: {formatFileSize(previewImage.fileSize)}</div>
                    {previewImage.dimensions && (
                      <div>
                        Dimensions: {previewImage.dimensions.width} ×{' '}
                        {previewImage.dimensions.height}
                      </div>
                    )}
                  </div>

                  <Button onClick={() => handleDownload(previewImage)}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Storage information dialog removed from public page */}

      {/* 下载进度显示 */}
      {renderDownloadProgress()}
    </div>
  );
}

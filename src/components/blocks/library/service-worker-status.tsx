'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  InfoIcon,
  RefreshCwIcon,
  TrashIcon,
  WifiIcon,
  WifiOffIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  type CacheStatus,
  ServiceWorkerManager,
  type ServiceWorkerStatus,
} from '@/lib/service-worker/sw-manager';

export default function ServiceWorkerStatusComponent() {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 仅在显式开启时创建 Service Worker 管理器实例
  const swManager = useMemo(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      return ServiceWorkerManager.getInstance();
    }
    return null;
  }, []);

  // 初始化
  useEffect(() => {
    initializeServiceWorker();
    setupOnlineListener();

    return () => {
      // 清理监听器（仅在开发环境）
      if (swManager) {
        swManager.removeStatusListener(handleStatusChange);
      }
    };
  }, []);

  // 初始化 Service Worker
  const initializeServiceWorker = async () => {
    if (!swManager) return;

    try {
      const status = await swManager.register();
      setSwStatus(status);

      // 添加状态监听器
      swManager.addStatusListener(handleStatusChange);

      // 如果激活成功，获取缓存状态
      if (status.isActivated) {
        await loadCacheStatus();
      }
    } catch (error) {
      console.error('Failed to initialize Service Worker:', error);
      toast.error('Failed to enable offline features');
    }
  };

  // 设置在线状态监听
  const setupOnlineListener = () => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  // 处理状态变化
  const handleStatusChange = (status: ServiceWorkerStatus) => {
    setSwStatus(status);

    if (status.hasUpdate) {
      toast.info('New version available!', {
        action: {
          label: 'Update',
          onClick: handleUpdate,
        },
      });
    }
  };

  // 加载缓存状态
  const loadCacheStatus = async () => {
    if (!swStatus?.isActivated || !swManager) return;

    try {
      const status = await swManager.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.warn('Failed to load cache status:', error);
    }
  };

  // 处理更新
  const handleUpdate = async () => {
    if (!swStatus?.hasUpdate || !swManager) return;

    try {
      setIsLoading(true);
      await swManager.skipWaiting();
      toast.success('Updating app...');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新缓存
  const handleRefreshCache = async () => {
    if (!swManager) return;

    try {
      setIsLoading(true);
      await swManager.update();
      await loadCacheStatus();
      toast.success('Cache refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    if (!swManager) return;

    try {
      setIsLoading(true);
      await swManager.clearCache();
      setCacheStatus(null);
      toast.success('Cache cleared');
    } catch (error) {
      console.error('Clear cache failed:', error);
      toast.error('Clear cache failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取连接状态图标和颜色
  const getConnectionStatus = () => {
    if (!isOnline) {
      return {
        icon: WifiOffIcon,
        label: 'Offline',
        color: 'destructive' as const,
        description: 'You are currently offline. Some features may be limited.',
      };
    }

    if (swStatus?.isActivated) {
      return {
        icon: CheckCircleIcon,
        label: 'Online + Cached',
        color: 'default' as const,
        description: 'You are online with offline backup enabled.',
      };
    }

    return {
      icon: WifiIcon,
      label: 'Online',
      color: 'secondary' as const,
      description: 'You are online but offline features are not available.',
    };
  };

  const connectionStatus = getConnectionStatus();

  // 渲染状态指示器
  const renderStatusIndicator = () => {
    const Icon = connectionStatus.icon;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Icon className="h-4 w-4" />
          <Badge variant={connectionStatus.color} className="text-xs">
            {connectionStatus.label}
          </Badge>
        </div>

        {swStatus?.hasUpdate && (
          <Badge variant="outline" className="text-xs animate-pulse">
            Update Available
          </Badge>
        )}
      </div>
    );
  };

  // 渲染缓存详情
  const renderCacheDetails = () => {
    if (!cacheStatus) {
      return (
        <div className="text-center py-4 text-gray-500">
          <InfoIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Cache information not available</p>
        </div>
      );
    }

    const totalSize = ServiceWorkerManager.formatBytes(cacheStatus.totalSize);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {cacheStatus.totalItems}
            </div>
            <div className="text-sm text-gray-500">Cached Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalSize}</div>
            <div className="text-sm text-gray-500">Cache Size</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Cache Breakdown</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Static Assets:</span>
              <span className="font-medium">{cacheStatus.byType.static}</span>
            </div>
            <div className="flex justify-between">
              <span>Images:</span>
              <span className="font-medium">{cacheStatus.byType.images}</span>
            </div>
            <div className="flex justify-between">
              <span>API Responses:</span>
              <span className="font-medium">{cacheStatus.byType.api}</span>
            </div>
            <div className="flex justify-between">
              <span>Pages:</span>
              <span className="font-medium">{cacheStatus.byType.pages}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCache}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCwIcon
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearCache}
            disabled={isLoading}
            className="flex-1"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    );
  };

  if (!swStatus) {
    return null; // 还在初始化
  }

  return (
    <div className="flex items-center justify-between">
      {/* 状态指示器 */}
      <div className="flex items-center space-x-2">
        {renderStatusIndicator()}

        {/* 更新按钮 */}
        {swStatus.hasUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdate}
            disabled={isLoading}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Update
          </Button>
        )}
      </div>

      {/* 详情对话框 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <InfoIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offline Status</DialogTitle>
            <DialogDescription>
              {connectionStatus.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 服务状态 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Service Worker Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Supported:</span>
                  <span className="flex items-center">
                    {swStatus.isSupported ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Registered:</span>
                  <span className="flex items-center">
                    {swStatus.isRegistered ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Activated:</span>
                  <span className="flex items-center">
                    {swStatus.isActivated ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircleIcon className="h-4 w-4 text-yellow-500" />
                    )}
                  </span>
                </div>
                {swStatus.error && (
                  <div className="text-red-600 text-xs">
                    Error: {swStatus.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 缓存详情 */}
            {swStatus.isActivated && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cache Details</CardTitle>
                </CardHeader>
                <CardContent>{renderCacheDetails()}</CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

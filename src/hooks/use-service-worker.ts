'use client';

import {
  ServiceWorkerManager,
  type ServiceWorkerStatus,
} from '@/lib/service-worker/sw-manager';
import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Service Worker Hook
 *
 * 自动注册和管理 Service Worker，在整个应用中提供离线能力
 */
export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 仅在客户端环境注册
    if (typeof window === 'undefined') return;

    let isMounted = true;
    const swManager = ServiceWorkerManager.getInstance();

    const initializeServiceWorker = async () => {
      try {
        console.log('[Use SW] Initializing Service Worker...');

        const swStatus = await swManager.register();

        if (isMounted) {
          setStatus(swStatus);
          setIsInitialized(true);

          // 监听状态变化
          const handleStatusChange = (newStatus: ServiceWorkerStatus) => {
            if (isMounted) {
              setStatus(newStatus);

              // 处理更新通知
              if (newStatus.hasUpdate) {
                toast.info('New version available!', {
                  description: 'Click to update for the latest features',
                  action: {
                    label: 'Update',
                    onClick: async () => {
                      try {
                        await swManager.skipWaiting();
                        toast.success('Updating app...');
                      } catch (error) {
                        console.error('Update failed:', error);
                        toast.error('Update failed. Please refresh the page.');
                      }
                    },
                  },
                  duration: 10000, // 10秒
                });
              }
            }
          };

          swManager.addStatusListener(handleStatusChange);

          // 清理函数中移除监听器
          return () => {
            swManager.removeStatusListener(handleStatusChange);
          };
        }
      } catch (error) {
        console.error('[Use SW] Failed to initialize Service Worker:', error);

        if (isMounted) {
          setStatus({
            isSupported: false,
            isRegistered: false,
            isActivated: false,
            hasUpdate: false,
            registration: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          setIsInitialized(true);
        }
      }
    };

    // 延迟注册以避免影响首屏加载
    const timer = setTimeout(initializeServiceWorker, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // 获取离线状态
  const getOfflineStatus = () => {
    if (!status) {
      return {
        isOfflineReady: false,
        canCacheAssets: false,
        description: 'Initializing offline features...',
      };
    }

    if (!status.isSupported) {
      return {
        isOfflineReady: false,
        canCacheAssets: false,
        description: 'Offline features not supported in this browser',
      };
    }

    if (!status.isActivated) {
      return {
        isOfflineReady: false,
        canCacheAssets: false,
        description: 'Setting up offline features...',
      };
    }

    return {
      isOfflineReady: true,
      canCacheAssets: true,
      description: 'Ready for offline use',
    };
  };

  return {
    status,
    isInitialized,
    offlineStatus: getOfflineStatus(),

    // 便捷方法
    isSupported: status?.isSupported ?? false,
    isRegistered: status?.isRegistered ?? false,
    isActivated: status?.isActivated ?? false,
    hasUpdate: status?.hasUpdate ?? false,
    error: status?.error ?? null,
  };
}

/**
 * Service Worker 提供者组件
 *
 * 在应用根部使用，自动初始化 Service Worker
 */
export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  useServiceWorker(); // 自动初始化

  return children;
}

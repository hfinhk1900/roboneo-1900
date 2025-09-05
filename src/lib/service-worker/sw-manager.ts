/**
 * Service Worker 管理器
 *
 * 提供 Service Worker 注册、更新、状态监控等功能
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActivated: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export interface CacheStatus {
  totalItems: number;
  totalSize: number;
  byType: {
    static: number;
    api: number;
    pages: number;
    images: number;
    other: number;
  };
  cacheVersion: string;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Array<(status: ServiceWorkerStatus) => void> = [];

  private constructor() {}

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * 注册 Service Worker
   */
  async register(): Promise<ServiceWorkerStatus> {
    const status: ServiceWorkerStatus = {
      isSupported: false,
      isRegistered: false,
      isActivated: false,
      hasUpdate: false,
      registration: null,
      error: null,
    };

    // 检查浏览器支持
    if (!('serviceWorker' in navigator)) {
      status.error = 'Service Worker not supported';
      this.notifyListeners(status);
      return status;
    }

    status.isSupported = true;

    try {
      // 注册 Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // 总是检查更新
      });

      status.isRegistered = true;
      status.registration = this.registration;

      console.log(
        '[SW Manager] Service Worker registered:',
        this.registration.scope
      );

      // 监听状态变化
      this.setupEventListeners();

      // 检查激活状态
      if (this.registration.active) {
        status.isActivated = true;
      }

      // 检查更新
      status.hasUpdate = !!this.registration.waiting;

      this.notifyListeners(status);
      return status;
    } catch (error) {
      status.error =
        error instanceof Error ? error.message : 'Registration failed';
      console.error('[SW Manager] Registration failed:', error);
      this.notifyListeners(status);
      return status;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // 监听更新
    this.registration.addEventListener('updatefound', () => {
      console.log('[SW Manager] Update found');

      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        console.log('[SW Manager] New worker state:', newWorker.state);

        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // 有更新可用
          this.notifyListeners({
            isSupported: true,
            isRegistered: true,
            isActivated: true,
            hasUpdate: true,
            registration: this.registration,
            error: null,
          });
        }
      });
    });

    // 监听控制器变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] Controller changed, reloading...');
      window.location.reload();
    });

    // 监听消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Manager] Message from SW:', event.data);
    });
  }

  /**
   * 更新 Service Worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('[SW Manager] Update check completed');
    } catch (error) {
      console.error('[SW Manager] Update failed:', error);
      throw error;
    }
  }

  /**
   * 跳过等待，立即激活新版本
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      throw new Error('No waiting Service Worker');
    }

    // 发送跳过等待消息
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * 获取缓存状态
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!this.registration?.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data as CacheStatus);
      };

      this.registration!.active!.postMessage({ type: 'GET_CACHE_STATUS' }, [
        messageChannel.port2,
      ]);

      // 设置超时
      setTimeout(() => {
        reject(new Error('Cache status request timeout'));
      }, 5000);
    });
  }

  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error('Clear cache failed'));
        }
      };

      this.registration!.active!.postMessage({ type: 'CLEAR_CACHE' }, [
        messageChannel.port2,
      ]);

      // 设置超时
      setTimeout(() => {
        reject(new Error('Clear cache request timeout'));
      }, 5000);
    });
  }

  /**
   * 获取当前状态
   */
  async getStatus(): Promise<ServiceWorkerStatus> {
    const status: ServiceWorkerStatus = {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isActivated: !!this.registration?.active,
      hasUpdate: !!this.registration?.waiting,
      registration: this.registration,
      error: null,
    };

    return status;
  }

  /**
   * 注销 Service Worker
   */
  async unregister(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.unregister();
      this.registration = null;
      console.log('[SW Manager] Service Worker unregistered');

      this.notifyListeners({
        isSupported: true,
        isRegistered: false,
        isActivated: false,
        hasUpdate: false,
        registration: null,
        error: null,
      });
    } catch (error) {
      console.error('[SW Manager] Unregister failed:', error);
      throw error;
    }
  }

  /**
   * 添加状态变化监听器
   */
  addStatusListener(listener: (status: ServiceWorkerStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态变化监听器
   */
  removeStatusListener(listener: (status: ServiceWorkerStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(status: ServiceWorkerStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SW Manager] Listener error:', error);
      }
    });
  }

  /**
   * 格式化文件大小
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 检查是否为重要更新
   */
  static isImportantUpdate(oldVersion: string, newVersion: string): boolean {
    // 简单的版本比较逻辑，可以根据需要扩展
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);

    // 主版本号变化被认为是重要更新
    return newParts[0] > oldParts[0];
  }

  /**
   * 获取离线能力状态
   */
  async getOfflineCapabilities(): Promise<{
    canCachePages: boolean;
    canCacheAssets: boolean;
    canCacheAPI: boolean;
    estimatedStorage: string;
  }> {
    const status = await this.getStatus();

    const capabilities = {
      canCachePages: status.isActivated,
      canCacheAssets: status.isActivated,
      canCacheAPI: status.isActivated,
      estimatedStorage: '0 MB',
    };

    if (status.isActivated) {
      try {
        const cacheStatus = await this.getCacheStatus();
        capabilities.estimatedStorage = ServiceWorkerManager.formatBytes(
          cacheStatus.totalSize
        );
      } catch (error) {
        console.warn('[SW Manager] Failed to get cache status:', error);
      }
    }

    return capabilities;
  }
}

/**
 * 批量埋点管理器 - My Image Library
 *
 * 提供埋点采样、批量发送和离线缓存功能
 */

export interface AnalyticsEvent {
  /** 事件名称 */
  name: string;
  /** 事件属性 */
  properties: Record<string, any>;
  /** 时间戳 */
  timestamp: number;
  /** 用户ID (可选) */
  userId?: string;
  /** 会话ID */
  sessionId: string;
  /** 页面URL */
  pageUrl: string;
  /** 用户代理 */
  userAgent: string;
}

export interface BatchConfig {
  /** 批次大小 */
  batchSize: number;
  /** 发送间隔 (毫秒) */
  flushInterval: number;
  /** 最大等待时间 (毫秒) */
  maxWaitTime: number;
  /** 采样率 (0-1) */
  samplingRate: number;
  /** 离线存储键名 */
  storageKey: string;
  /** 最大离线事件数 */
  maxOfflineEvents: number;
  /** API 端点 */
  endpoint: string;
}

export interface BatchResult {
  success: boolean;
  sentCount: number;
  errors: string[];
  retryAfter?: number;
}

export class BatchAnalyticsManager {
  private static instance: BatchAnalyticsManager;
  private eventQueue: AnalyticsEvent[] = [];
  private offlineQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private isOnline = true;

  private readonly config: BatchConfig = {
    batchSize: 50,
    flushInterval: 30 * 1000, // 30秒
    maxWaitTime: 5 * 60 * 1000, // 5分钟
    samplingRate: 0.1, // 10% 采样
    storageKey: 'roboneo_analytics_offline',
    maxOfflineEvents: 1000,
    endpoint: '/api/analytics/batch',
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupOnlineListener();
    this.loadOfflineEvents();
    this.startFlushTimer();
  }

  public static getInstance(): BatchAnalyticsManager {
    if (!BatchAnalyticsManager.instance) {
      BatchAnalyticsManager.instance = new BatchAnalyticsManager();
    }
    return BatchAnalyticsManager.instance;
  }

  /**
   * 记录事件
   */
  track(name: string, properties: Record<string, any> = {}): void {
    // 采样控制
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        // 添加默认属性
        library_version: '1.0.0',
        viewport_width:
          typeof window !== 'undefined' ? window.innerWidth : undefined,
        viewport_height:
          typeof window !== 'undefined' ? window.innerHeight : undefined,
        screen_width:
          typeof window !== 'undefined' ? window.screen.width : undefined,
        screen_height:
          typeof window !== 'undefined' ? window.screen.height : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language:
          typeof navigator !== 'undefined' ? navigator.language : undefined,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    // 添加到队列
    if (this.isOnline) {
      this.eventQueue.push(event);

      // 检查是否需要立即发送
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }
    } else {
      this.addToOfflineQueue(event);
    }

    console.log('[Analytics] Event tracked:', name, properties);
  }

  /**
   * 立即发送所有待发送事件
   */
  async flush(): Promise<BatchResult> {
    if (this.eventQueue.length === 0) {
      return {
        success: true,
        sentCount: 0,
        errors: [],
      };
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    return await this.sendBatch(eventsToSend);
  }

  /**
   * 发送离线事件
   */
  async flushOffline(): Promise<BatchResult> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return {
        success: true,
        sentCount: 0,
        errors: [],
      };
    }

    console.log(
      '[Analytics] Sending offline events:',
      this.offlineQueue.length
    );

    const result = await this.sendBatch([...this.offlineQueue]);

    if (result.success) {
      this.offlineQueue = [];
      this.saveOfflineEvents();
    }

    return result;
  }

  /**
   * 批量发送事件
   */
  private async sendBatch(events: AnalyticsEvent[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: false,
      sentCount: 0,
      errors: [],
    };

    if (events.length === 0) {
      result.success = true;
      return result;
    }

    try {
      console.log('[Analytics] Sending batch:', events.length, 'events');

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          batch_size: events.length,
          sent_at: Date.now(),
        }),
      });

      if (response.ok) {
        result.success = true;
        result.sentCount = events.length;
        console.log(
          '[Analytics] Batch sent successfully:',
          events.length,
          'events'
        );
      } else {
        // 处理不同的HTTP状态码
        if (response.status === 429) {
          // 请求过于频繁
          const retryAfter = response.headers.get('Retry-After');
          result.retryAfter = retryAfter
            ? Number.parseInt(retryAfter, 10) * 1000
            : 60000;
          result.errors.push('Rate limited');
        } else if (response.status >= 400 && response.status < 500) {
          // 客户端错误，不重试
          result.errors.push(`Client error: ${response.status}`);
        } else {
          // 服务端错误，可重试
          result.errors.push(`Server error: ${response.status}`);
          this.addToOfflineQueue(...events);
        }
      }
    } catch (error) {
      // 网络错误，添加到离线队列
      result.errors.push(
        error instanceof Error ? error.message : 'Network error'
      );
      this.addToOfflineQueue(...events);
      console.warn('[Analytics] Network error, events saved offline:', error);
    }

    return result;
  }

  /**
   * 添加到离线队列
   */
  private addToOfflineQueue(...events: AnalyticsEvent[]): void {
    this.offlineQueue.push(...events);

    // 限制离线队列大小
    if (this.offlineQueue.length > this.config.maxOfflineEvents) {
      const excess = this.offlineQueue.length - this.config.maxOfflineEvents;
      this.offlineQueue.splice(0, excess); // 移除最旧的事件
    }

    this.saveOfflineEvents();
  }

  /**
   * 设置在线状态监听
   */
  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const wasOffline = !this.isOnline;
      this.isOnline = navigator.onLine;

      console.log('[Analytics] Online status changed:', this.isOnline);

      // 重新上线时发送离线事件
      if (wasOffline && this.isOnline) {
        this.flushOffline();
      }
    };

    this.isOnline = navigator.onLine;
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * 加载离线事件
   */
  private loadOfflineEvents(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
        console.log(
          '[Analytics] Loaded offline events:',
          this.offlineQueue.length
        );
      }
    } catch (error) {
      console.warn('[Analytics] Failed to load offline events:', error);
    }
  }

  /**
   * 保存离线事件
   */
  private saveOfflineEvents(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(
        this.config.storageKey,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.warn('[Analytics] Failed to save offline events:', error);
    }
  }

  /**
   * 启动发送定时器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    queueSize: number;
    offlineQueueSize: number;
    sessionId: string;
    isOnline: boolean;
    samplingRate: number;
  } {
    return {
      queueSize: this.eventQueue.length,
      offlineQueueSize: this.offlineQueue.length,
      sessionId: this.sessionId,
      isOnline: this.isOnline,
      samplingRate: this.config.samplingRate,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    Object.assign(this.config, newConfig);

    // 重启定时器
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startFlushTimer();
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 发送剩余事件
    this.flush();
  }

  /**
   * 预定义的业务事件跟踪方法
   */
  trackImageView(imageId: string, toolType: string): void {
    this.track('image_viewed', {
      image_id: imageId,
      tool_type: toolType,
    });
  }

  trackImageDownload(imageId: string, toolType: string, format: string): void {
    this.track('image_downloaded', {
      image_id: imageId,
      tool_type: toolType,
      format,
    });
  }

  trackBatchDownload(count: number, format: string): void {
    this.track('batch_download', {
      image_count: count,
      format,
    });
  }

  trackMigration(
    migratedCount: number,
    totalCount: number,
    errors: number
  ): void {
    this.track('data_migration', {
      migrated_count: migratedCount,
      total_count: totalCount,
      error_count: errors,
    });
  }

  trackCacheHit(cacheType: string, key: string): void {
    this.track('cache_hit', {
      cache_type: cacheType,
      cache_key: key,
    });
  }

  trackCacheMiss(cacheType: string, key: string): void {
    this.track('cache_miss', {
      cache_type: cacheType,
      cache_key: key,
    });
  }

  trackError(error: string, context?: Record<string, any>): void {
    this.track('error_occurred', {
      error_message: error,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, unit: string): void {
    this.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
    });
  }
}

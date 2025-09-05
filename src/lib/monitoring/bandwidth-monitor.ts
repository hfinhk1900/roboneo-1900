/**
 * 带宽监控器 - My Image Library
 *
 * 监控 Vercel 带宽使用情况，优化成本控制
 */

export interface BandwidthMetric {
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 响应大小 (bytes) */
  responseSize: number;
  /** 请求大小 (bytes) */
  requestSize?: number;
  /** 响应时间 (ms) */
  duration: number;
  /** 状态码 */
  status: number;
  /** 资源类型 */
  resourceType: string;
  /** 时间戳 */
  timestamp: number;
  /** 是否来自缓存 */
  fromCache: boolean;
  /** CDN 命中 */
  cdnHit?: boolean;
}

export interface BandwidthSummary {
  /** 总带宽使用 (bytes) */
  totalBytes: number;
  /** 请求数量 */
  requestCount: number;
  /** 缓存命中率 */
  cacheHitRate: number;
  /** 按类型分组的带宽 */
  byType: Record<string, { bytes: number; count: number }>;
  /** 最大的请求 */
  largestRequests: BandwidthMetric[];
  /** 时间范围 */
  timeRange: { start: number; end: number };
}

export interface BandwidthAlert {
  type: 'high_usage' | 'large_response' | 'cache_miss' | 'slow_request';
  message: string;
  metric: BandwidthMetric;
  threshold: number;
  timestamp: number;
}

export class BandwidthMonitor {
  private static instance: BandwidthMonitor;
  private metrics: BandwidthMetric[] = [];
  private alerts: BandwidthAlert[] = [];
  private originalFetch: typeof fetch | null = null;
  private isMonitoring = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  // 配置阈值
  private readonly config = {
    /** 大响应阈值 (1MB) */
    largeResponseThreshold: 1024 * 1024,
    /** 慢请求阈值 (5s) */
    slowRequestThreshold: 5000,
    /** 小时带宽阈值 (100MB) */
    hourlyBandwidthThreshold: 100 * 1024 * 1024,
    /** 保留数据时长 (24小时) */
    dataRetentionHours: 24,
    /** 最大存储的指标数量 */
    maxMetrics: 1000,
  };

  private constructor() {
    // 仅在客户端环境下接入监控，避免 SSR 触发 window 访问
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      // 保存原始 fetch 引用；调用时通过 Reflect.apply 绑定 this
      this.originalFetch = window.fetch as typeof fetch;
      // 仅在显式启用时拦截 fetch，默认关闭以避免与 Next 内部行为冲突
      if (this.isFetchInterceptionEnabled()) {
        this.setupFetchInterception();
      }
      this.setupResourceObserver();
      this.setupCleanupTimer();
    }
  }

  public static getInstance(): BandwidthMonitor {
    if (!BandwidthMonitor.instance) {
      BandwidthMonitor.instance = new BandwidthMonitor();
    }
    return BandwidthMonitor.instance;
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[Bandwidth Monitor] Started monitoring');
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isMonitoring = false;
    console.log('[Bandwidth Monitor] Stopped monitoring');
  }

  /**
   * 拦截 fetch 请求
   */
  private setupFetchInterception(): void {
    if (typeof window === 'undefined') return;
    // 保存原始fetch函数
    if (!this.originalFetch) {
      this.originalFetch = window.fetch;
    }
    const original = this.originalFetch as typeof fetch;

    // 使用 Proxy 仅拦截调用，不复制属性，保留 Next 对 fetch 的所有扩展
    const proxied = new Proxy(original, {
      apply: async (
        target: typeof fetch,
        _thisArg: any,
        args: Parameters<typeof fetch>
      ): Promise<Response> => {
        // 未开启监控：直接调用
        if (!BandwidthMonitor.instance?.isMonitoring) {
          return Reflect.apply(target, window, args);
        }

        const [input, init] = args;

        // 检测 Server Action / RSC 调用，跳过监控
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
            ? String(input)
            : (input as Request)?.url || '';

        let acceptHeader: string | null = null;
        const headers = init?.headers as any;
        if (headers instanceof Headers) {
          acceptHeader = headers.get('Accept');
        } else if (headers && typeof headers === 'object') {
          acceptHeader = headers['Accept'] || headers['accept'] || null;
        }

        const isServerAction = url === '' || (acceptHeader?.startsWith('text/x-component') ?? false);
        if (isServerAction) {
          return Reflect.apply(target, window, args);
        }

        const startTime = performance.now();

        // 方法与请求体大小估算
        const method =
          init?.method || (typeof input === 'object' && (input as Request).method) || 'GET';
        let requestSize = 0;
        const body: any = init?.body;
        if (typeof body === 'string') {
          requestSize = new Blob([body]).size;
        } else if (body instanceof Blob) {
          requestSize = body.size;
        } else if (body instanceof FormData) {
          requestSize = 1024;
        }

        try {
          const response = await Reflect.apply(target, window, args);
          const endTime = performance.now();
          const duration = endTime - startTime;

          const contentLength = response.headers.get('content-length');
          const responseSize = contentLength ? Number.parseInt(contentLength, 10) : 0;

          const age = response.headers.get('age');
          const fromCache = !!(age && Number.parseInt(age, 10) > 0) || response.headers.get('x-cache') === 'HIT';
          const cdnHit = response.headers.get('x-vercel-cache') === 'HIT' || response.headers.get('cf-cache-status') === 'HIT';

          const metric: BandwidthMetric = {
            url,
            method,
            responseSize,
            requestSize,
            duration,
            status: response.status,
            resourceType: BandwidthMonitor.instance!.getResourceType(url, response),
            timestamp: Date.now(),
            fromCache,
            cdnHit,
          };

          BandwidthMonitor.instance!.recordMetric(metric);
          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;

          const metric: BandwidthMetric = {
            url,
            method,
            responseSize: 0,
            requestSize,
            duration,
            status: 0,
            resourceType: 'error',
            timestamp: Date.now(),
            fromCache: false,
          };

          BandwidthMonitor.instance!.recordMetric(metric);
          throw error;
        }
      },
    });

    window.fetch = proxied as typeof fetch;
  }

  /**
   * 监控资源加载
   */
  private setupResourceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        if (!this.isMonitoring) return;

        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const metric: BandwidthMetric = {
            url: entry.name,
            method: 'GET',
            responseSize: entry.transferSize || entry.encodedBodySize || 0,
            duration: entry.duration,
            status: entry.responseStatus || 200,
            resourceType: this.getResourceTypeFromEntry(entry),
            timestamp: Date.now(),
            fromCache: entry.transferSize === 0 && entry.encodedBodySize > 0,
          };

          this.recordMetric(metric);
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn(
        '[Bandwidth Monitor] Failed to setup resource observer:',
        error
      );
    }
  }

  /**
   * 记录带宽指标
   */
  private recordMetric(metric: BandwidthMetric): void {
    this.metrics.push(metric);

    // 限制存储的指标数量
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // 检查告警条件
    this.checkAlerts(metric);

    // 发送事件
    window.dispatchEvent(
      new CustomEvent('bandwidth-metric', {
        detail: metric,
      })
    );

    // 日志记录（仅大请求）
    if (metric.responseSize > this.config.largeResponseThreshold) {
      console.warn('[Bandwidth Monitor] Large response detected:', {
        url: metric.url,
        size: this.formatBytes(metric.responseSize),
        duration: `${metric.duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(metric: BandwidthMetric): void {
    const alerts: BandwidthAlert[] = [];

    // 大响应告警
    if (metric.responseSize > this.config.largeResponseThreshold) {
      alerts.push({
        type: 'large_response',
        message: `Large response detected: ${this.formatBytes(metric.responseSize)}`,
        metric,
        threshold: this.config.largeResponseThreshold,
        timestamp: Date.now(),
      });
    }

    // 慢请求告警
    if (metric.duration > this.config.slowRequestThreshold) {
      alerts.push({
        type: 'slow_request',
        message: `Slow request detected: ${metric.duration.toFixed(2)}ms`,
        metric,
        threshold: this.config.slowRequestThreshold,
        timestamp: Date.now(),
      });
    }

    // 缓存未命中告警 (重要资源)
    if (
      !metric.fromCache &&
      !metric.cdnHit &&
      this.isImportantResource(metric.url)
    ) {
      alerts.push({
        type: 'cache_miss',
        message: `Cache miss for important resource: ${metric.url}`,
        metric,
        threshold: 0,
        timestamp: Date.now(),
      });
    }

    // 小时带宽告警
    const hourlyUsage = this.getHourlyUsage();
    if (hourlyUsage > this.config.hourlyBandwidthThreshold) {
      alerts.push({
        type: 'high_usage',
        message: `High bandwidth usage: ${this.formatBytes(hourlyUsage)}/hour`,
        metric,
        threshold: this.config.hourlyBandwidthThreshold,
        timestamp: Date.now(),
      });
    }

    // 记录告警
    this.alerts.push(...alerts);

    // 发送告警事件
    alerts.forEach((alert) => {
      window.dispatchEvent(
        new CustomEvent('bandwidth-alert', {
          detail: alert,
        })
      );
    });
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string, response: Response): string {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image/')) return 'image';
    if (contentType.includes('video/')) return 'video';
    if (contentType.includes('audio/')) return 'audio';
    if (contentType.includes('text/css')) return 'css';
    if (contentType.includes('javascript')) return 'js';
    if (contentType.includes('application/json')) return 'api';
    if (contentType.includes('text/html')) return 'html';

    return this.getResourceTypeFromUrl(url);
  }

  /**
   * 从性能条目获取资源类型
   */
  private getResourceTypeFromEntry(entry: any): string {
    return entry.initiatorType || this.getResourceTypeFromUrl(entry.name);
  }

  /**
   * 从 URL 推断资源类型
   */
  private getResourceTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(
        extension || ''
      )
    ) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov'].includes(extension || '')) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return 'audio';
    }
    if (['css'].includes(extension || '')) {
      return 'css';
    }
    if (['js', 'mjs'].includes(extension || '')) {
      return 'js';
    }
    if (url.includes('/api/')) {
      return 'api';
    }

    return 'other';
  }

  /**
   * 判断是否为重要资源
   */
  private isImportantResource(url: string): boolean {
    // 关键 CSS/JS 文件
    if (
      url.includes('main.') ||
      url.includes('app.') ||
      url.includes('index.')
    ) {
      return true;
    }

    // API 接口
    if (url.includes('/api/')) {
      return true;
    }

    // 首屏图片
    if (
      url.includes('hero') ||
      url.includes('banner') ||
      url.includes('logo')
    ) {
      return true;
    }

    return false;
  }

  /**
   * 获取小时带宽使用量
   */
  private getHourlyUsage(): number {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    return this.metrics
      .filter((metric) => metric.timestamp > oneHourAgo)
      .reduce((total, metric) => total + metric.responseSize, 0);
  }

  /**
   * 获取带宽总结
   */
  getSummary(timeRange?: { start: number; end: number }): BandwidthSummary {
    const filteredMetrics = timeRange
      ? this.metrics.filter(
          (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        )
      : this.metrics;

    const totalBytes = filteredMetrics.reduce(
      (sum, m) => sum + m.responseSize,
      0
    );
    const cachedRequests = filteredMetrics.filter(
      (m) => m.fromCache || m.cdnHit
    );
    const cacheHitRate =
      filteredMetrics.length > 0
        ? cachedRequests.length / filteredMetrics.length
        : 0;

    // 按类型分组
    const byType: Record<string, { bytes: number; count: number }> = {};
    filteredMetrics.forEach((metric) => {
      if (!byType[metric.resourceType]) {
        byType[metric.resourceType] = { bytes: 0, count: 0 };
      }
      byType[metric.resourceType].bytes += metric.responseSize;
      byType[metric.resourceType].count += 1;
    });

    // 最大的请求
    const largestRequests = [...filteredMetrics]
      .sort((a, b) => b.responseSize - a.responseSize)
      .slice(0, 10);

    const defaultTimeRange =
      filteredMetrics.length > 0
        ? {
            start: Math.min(...filteredMetrics.map((m) => m.timestamp)),
            end: Math.max(...filteredMetrics.map((m) => m.timestamp)),
          }
        : { start: Date.now(), end: Date.now() };

    return {
      totalBytes,
      requestCount: filteredMetrics.length,
      cacheHitRate,
      byType,
      largestRequests,
      timeRange: timeRange || defaultTimeRange,
    };
  }

  /**
   * 获取告警列表
   */
  getAlerts(limit = 50): BandwidthAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 获取性能建议
   */
  getOptimizationSuggestions(): string[] {
    const summary = this.getSummary();
    const suggestions: string[] = [];

    // 缓存命中率低
    if (summary.cacheHitRate < 0.7) {
      suggestions.push(
        'Cache hit rate is low. Consider implementing better caching strategies.'
      );
    }

    // 图片占用过多带宽
    const imageBytes = summary.byType.image?.bytes || 0;
    if (imageBytes > summary.totalBytes * 0.6) {
      suggestions.push(
        'Images consume too much bandwidth. Consider using WebP format and proper compression.'
      );
    }

    // 大文件检测
    const largeFiles = summary.largestRequests.filter(
      (r) => r.responseSize > this.config.largeResponseThreshold
    );
    if (largeFiles.length > 0) {
      suggestions.push(
        `${largeFiles.length} large files detected. Consider code splitting or lazy loading.`
      );
    }

    // API 响应过大
    const apiBytes = summary.byType.api?.bytes || 0;
    const avgApiResponse = summary.byType.api
      ? apiBytes / summary.byType.api.count
      : 0;
    if (avgApiResponse > 100 * 1024) {
      // > 100KB
      suggestions.push(
        'API responses are large. Consider pagination or data compression.'
      );
    }

    return suggestions;
  }

  /**
   * 清理过期数据
   */
  private setupCleanupTimer(): void {
    this.cleanupTimer = setInterval(
      () => {
        const cutoff =
          Date.now() - this.config.dataRetentionHours * 60 * 60 * 1000;

        this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
        this.alerts = this.alerts.filter((a) => a.timestamp > cutoff);
      },
      60 * 60 * 1000
    ); // 每小时清理一次
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Number.parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 导出数据 (用于分析)
   */
  exportData(): {
    metrics: BandwidthMetric[];
    alerts: BandwidthAlert[];
    summary: BandwidthSummary;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getSummary(),
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stop();
    // 恢复原始 fetch
    if (typeof window !== 'undefined' && this.originalFetch) {
      window.fetch = this.originalFetch as typeof fetch;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 是否启用 fetch 拦截
   * 默认关闭，仅当设置了 NEXT_PUBLIC_ENABLE_BANDWIDTH_MONITOR=true 时开启
   */
  private isFetchInterceptionEnabled(): boolean {
    try {
      // 运行时开关（可通过控制台手动开启）
      const runtimeFlag = (window as any).__ROBONEO_BW_MONITOR__?.enableFetch;
      if (typeof runtimeFlag === 'boolean') return runtimeFlag;
    } catch {}

    // 编译时环境变量
    const env = process.env.NEXT_PUBLIC_ENABLE_BANDWIDTH_MONITOR;
    return env === 'true' || env === '1';
  }
}

/**
 * 性能监控管理器 - My Image Library
 *
 * 提供 Core Web Vitals 监控、瀑布图分析和性能优化建议
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  url: string;
  userAgent: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface CoreWebVitals {
  /** Largest Contentful Paint - 最大内容绘制 */
  lcp?: PerformanceMetric;
  /** First Input Delay - 首次输入延迟 */
  fid?: PerformanceMetric;
  /** Cumulative Layout Shift - 累积布局偏移 */
  cls?: PerformanceMetric;
  /** First Contentful Paint - 首次内容绘制 */
  fcp?: PerformanceMetric;
  /** Time to First Byte - 首字节时间 */
  ttfb?: PerformanceMetric;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
  startTime: number;
  responseEnd: number;
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  vitals: CoreWebVitals;
  resources: ResourceTiming[];
  navigation: {
    type: string;
    redirectCount: number;
    loadEventEnd: number;
    domContentLoadedEventEnd: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  connection?: {
    effectiveType: string;
    rtt: number;
    downlink: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private vitals: CoreWebVitals = {};
  private isSupported = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 初始化性能监控
   */
  private initialize(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('[Performance Monitor] PerformanceObserver not supported');
      return;
    }

    this.isSupported = true;

    try {
      // 监控 Core Web Vitals
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();

      // 监控导航性能
      this.observeNavigation();

      // 监控资源加载
      this.observeResourceTiming();

      console.log('[Performance Monitor] Initialized successfully');
    } catch (error) {
      console.error('[Performance Monitor] Failed to initialize:', error);
    }
  }

  /**
   * 监控 Largest Contentful Paint
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;

        if (lastEntry) {
          this.vitals.lcp = this.createMetric(
            'LCP',
            lastEntry.startTime,
            'ms',
            this.rateLCP(lastEntry.startTime)
          );

          this.reportMetric(this.vitals.lcp);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] LCP observation failed:', error);
    }
  }

  /**
   * 监控 First Input Delay
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.vitals.fid = this.createMetric(
            'FID',
            entry.processingStart - entry.startTime,
            'ms',
            this.rateFID(entry.processingStart - entry.startTime)
          );

          this.reportMetric(this.vitals.fid);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] FID observation failed:', error);
    }
  }

  /**
   * 监控 Cumulative Layout Shift
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.vitals.cls = this.createMetric(
                'CLS',
                clsValue,
                'score',
                this.rateCLS(clsValue)
              );

              this.reportMetric(this.vitals.cls);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] CLS observation failed:', error);
    }
  }

  /**
   * 监控 First Contentful Paint
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          (entry) => entry.name === 'first-contentful-paint'
        );

        if (fcpEntry) {
          this.vitals.fcp = this.createMetric(
            'FCP',
            fcpEntry.startTime,
            'ms',
            this.rateFCP(fcpEntry.startTime)
          );

          this.reportMetric(this.vitals.fcp);
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] FCP observation failed:', error);
    }
  }

  /**
   * 监控 Time to First Byte
   */
  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.responseStart && entry.requestStart) {
            const ttfb = entry.responseStart - entry.requestStart;
            this.vitals.ttfb = this.createMetric(
              'TTFB',
              ttfb,
              'ms',
              this.rateTTFB(ttfb)
            );

            this.reportMetric(this.vitals.ttfb);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance Monitor] TTFB observation failed:', error);
    }
  }

  /**
   * 监控导航性能
   */
  private observeNavigation(): void {
    if (!('performance' in window) || !window.performance.getEntriesByType) {
      return;
    }

    // 页面加载完成后获取导航性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigationEntries = window.performance.getEntriesByType(
          'navigation'
        ) as PerformanceNavigationTiming[];

        if (navigationEntries.length > 0) {
          const navEntry = navigationEntries[0];

          this.reportNavigationMetrics({
            dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcp: navEntry.connectEnd - navEntry.connectStart,
            ssl: navEntry.connectEnd - navEntry.secureConnectionStart,
            ttfb: navEntry.responseStart - navEntry.requestStart,
            download: navEntry.responseEnd - navEntry.responseStart,
            domProcessing:
              navEntry.domContentLoadedEventStart - navEntry.responseEnd,
            resourceLoad:
              navEntry.loadEventStart - navEntry.domContentLoadedEventEnd,
            total: navEntry.loadEventEnd - navEntry.startTime,
          });
        }
      }, 1000);
    });
  }

  /**
   * 监控资源加载性能
   */
  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const resources: ResourceTiming[] = [];

        entries.forEach((entry: any) => {
          resources.push({
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize || 0,
            encodedBodySize: entry.encodedBodySize || 0,
            decodedBodySize: entry.decodedBodySize || 0,
            initiatorType: entry.initiatorType,
            startTime: entry.startTime,
            responseEnd: entry.responseEnd,
          });
        });

        if (resources.length > 0) {
          this.reportResourceMetrics(resources);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(
        '[Performance Monitor] Resource timing observation failed:',
        error
      );
    }
  }

  /**
   * 创建性能指标
   */
  private createMetric(
    name: string,
    value: number,
    unit: string,
    rating: 'good' | 'needs-improvement' | 'poor'
  ): PerformanceMetric {
    return {
      name,
      value,
      unit,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * LCP 评级
   */
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  /**
   * FID 评级
   */
  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  /**
   * CLS 评级
   */
  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  /**
   * FCP 评级
   */
  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  /**
   * TTFB 评级
   */
  private rateTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 上报性能指标
   */
  private reportMetric(metric: PerformanceMetric): void {
    // 发送到分析系统
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Performance',
        event_label: metric.rating,
        value: Math.round(metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_value: metric.value,
          metric_unit: metric.unit,
        },
      });
    }

    // 发送自定义事件
    window.dispatchEvent(
      new CustomEvent('performance-metric', {
        detail: metric,
      })
    );

    console.log(
      `[Performance Monitor] ${metric.name}: ${metric.value}${metric.unit} (${metric.rating})`
    );
  }

  /**
   * 上报导航性能
   */
  private reportNavigationMetrics(metrics: Record<string, number>): void {
    const event = new CustomEvent('navigation-metrics', {
      detail: {
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href,
      },
    });

    window.dispatchEvent(event);
    console.log('[Performance Monitor] Navigation metrics:', metrics);
  }

  /**
   * 上报资源性能
   */
  private reportResourceMetrics(resources: ResourceTiming[]): void {
    // 分析最慢的资源
    const slowResources = resources
      .filter((r) => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    if (slowResources.length > 0) {
      window.dispatchEvent(
        new CustomEvent('slow-resources', {
          detail: {
            resources: slowResources,
            timestamp: Date.now(),
          },
        })
      );
    }

    // 分析大体积资源
    const largeResources = resources
      .filter((r) => r.transferSize > 1024 * 1024) // > 1MB
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 5);

    if (largeResources.length > 0) {
      window.dispatchEvent(
        new CustomEvent('large-resources', {
          detail: {
            resources: largeResources,
            timestamp: Date.now(),
          },
        })
      );
    }
  }

  /**
   * 获取当前性能报告
   */
  getReport(): PerformanceReport | null {
    if (!this.isSupported) return null;

    const report: PerformanceReport = {
      url: window.location.href,
      timestamp: Date.now(),
      vitals: this.vitals,
      resources: [],
      navigation: {
        type: 'unknown',
        redirectCount: 0,
        loadEventEnd: 0,
        domContentLoadedEventEnd: 0,
      },
    };

    // 添加内存信息
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      report.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    // 添加连接信息
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      report.connection = {
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        downlink: connection.downlink,
      };
    }

    return report;
  }

  /**
   * 测量自定义性能指标
   */
  measure(name: string, startMark?: string, endMark?: string): number {
    if (!this.isSupported) return 0;

    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : 0;
    } catch (error) {
      console.warn('[Performance Monitor] Measure failed:', error);
      return 0;
    }
  }

  /**
   * 创建性能标记
   */
  mark(name: string): void {
    if (!this.isSupported) return;

    try {
      performance.mark(name);
    } catch (error) {
      console.warn('[Performance Monitor] Mark failed:', error);
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn(
          '[Performance Monitor] Observer disconnect failed:',
          error
        );
      }
    });
    this.observers = [];
  }
}

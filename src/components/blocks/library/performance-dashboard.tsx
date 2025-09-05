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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ActivityIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  ClockIcon,
  HardDriveIcon,
  RefreshCwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WifiIcon,
  ZapIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  type BandwidthAlert,
  BandwidthMonitor,
  type BandwidthSummary,
} from '@/lib/monitoring/bandwidth-monitor';
import {
  type CoreWebVitals,
  PerformanceMonitor,
  type PerformanceReport,
} from '@/lib/monitoring/performance-monitor';

export default function PerformanceDashboard() {
  const [vitals, setVitals] = useState<CoreWebVitals>({});
  const [bandwidthSummary, setBandwidthSummary] =
    useState<BandwidthSummary | null>(null);
  const [alerts, setAlerts] = useState<BandwidthAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 仅在开发环境中创建监控器实例
  const performanceMonitor = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      return PerformanceMonitor.getInstance();
    }
    return null;
  }, []);

  const bandwidthMonitor = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      return BandwidthMonitor.getInstance();
    }
    return null;
  }, []);

  useEffect(() => {
    // 启动监控（仅在开发环境）
    if (bandwidthMonitor) {
      bandwidthMonitor.start();
    }

    // 初始数据加载
    loadData();

    // 监听性能指标事件
    const handlePerformanceMetric = (event: CustomEvent) => {
      const metric = event.detail;
      setVitals((prev) => ({
        ...prev,
        [metric.name.toLowerCase()]: metric,
      }));
    };

    // 监听带宽告警
    const handleBandwidthAlert = (event: CustomEvent) => {
      const alert = event.detail;
      setAlerts((prev) => [alert, ...prev.slice(0, 9)]); // 保留最新10条
    };

    window.addEventListener(
      'performance-metric',
      handlePerformanceMetric as EventListener
    );
    window.addEventListener(
      'bandwidth-alert',
      handleBandwidthAlert as EventListener
    );

    // 定期刷新数据
    const interval = setInterval(loadData, 30000); // 30秒

    return () => {
      window.removeEventListener(
        'performance-metric',
        handlePerformanceMetric as EventListener
      );
      window.removeEventListener(
        'bandwidth-alert',
        handleBandwidthAlert as EventListener
      );
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      // 获取带宽数据（仅在开发环境）
      if (bandwidthMonitor) {
        const summary = bandwidthMonitor.getSummary();
        setBandwidthSummary(summary);

        // 获取告警
        const newAlerts = bandwidthMonitor.getAlerts(10);
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'default' as const;
      case 'needs-improvement':
        return 'secondary' as const;
      case 'poor':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderVitalsCard = () => {
    const metrics = [
      {
        key: 'lcp',
        label: 'LCP',
        icon: ActivityIcon,
        description: 'Largest Contentful Paint',
      },
      {
        key: 'fid',
        label: 'FID',
        icon: ZapIcon,
        description: 'First Input Delay',
      },
      {
        key: 'cls',
        label: 'CLS',
        icon: BarChart3Icon,
        description: 'Cumulative Layout Shift',
      },
      {
        key: 'fcp',
        label: 'FCP',
        icon: ClockIcon,
        description: 'First Contentful Paint',
      },
    ];

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.map(({ key, label, icon: Icon, description }) => {
            const metric = vitals[key as keyof CoreWebVitals];
            if (!metric) {
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Measuring...
                  </Badge>
                </div>
              );
            }

            return (
              <div
                key={key}
                className="flex items-center justify-between"
                title={description}
              >
                <div className="flex items-center space-x-2">
                  <Icon
                    className={`h-4 w-4 ${getMetricColor(metric.rating)}`}
                  />
                  <span className="text-xs">{label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono">
                    {key === 'cls'
                      ? metric.value.toFixed(3)
                      : formatDuration(metric.value)}
                  </span>
                  <Badge
                    variant={getMetricBadgeVariant(metric.rating)}
                    className="text-xs"
                  >
                    {metric.rating === 'needs-improvement'
                      ? 'OK'
                      : metric.rating}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderBandwidthCard = () => {
    if (!bandwidthSummary) {
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Bandwidth Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 text-xs">Loading...</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDriveIcon className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Total</span>
            </div>
            <span className="text-xs font-mono">
              {formatBytes(bandwidthSummary.totalBytes)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WifiIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs">Requests</span>
            </div>
            <span className="text-xs font-mono">
              {bandwidthSummary.requestCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-4 w-4 text-purple-600" />
              <span className="text-xs">Cache Hit</span>
            </div>
            <span className="text-xs font-mono">
              {(bandwidthSummary.cacheHitRate * 100).toFixed(1)}%
            </span>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                <span className="text-xs">Alerts</span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {alerts.length}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDetailedView = () => {
    return (
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vitals">Performance</TabsTrigger>
          <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(vitals).map(([key, metric]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{key.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {key === 'cls'
                      ? metric.value.toFixed(3)
                      : formatDuration(metric.value)}
                  </div>
                  <Badge
                    variant={getMetricBadgeVariant(metric.rating)}
                    className="mt-2"
                  >
                    {metric.rating}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bandwidth" className="space-y-4">
          {bandwidthSummary && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatBytes(bandwidthSummary.totalBytes)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bandwidthSummary.requestCount} requests
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(bandwidthSummary.cacheHitRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        bandwidthSummary.requestCount *
                          bandwidthSummary.cacheHitRate
                      )}{' '}
                      cached
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Usage by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(bandwidthSummary.byType)
                      .sort(([, a], [, b]) => b.bytes - a.bytes)
                      .map(([type, data]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs capitalize">{type}</span>
                          <div className="text-xs">
                            {formatBytes(data.bytes)} ({data.count})
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {bandwidthSummary.largestRequests.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Largest Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {bandwidthSummary.largestRequests
                        .slice(0, 5)
                        .map((request, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs truncate max-w-[200px]">
                                {request.url.split('/').pop()}
                              </span>
                              <span className="text-xs font-mono">
                                {formatBytes(request.responseSize)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.resourceType} •{' '}
                              {formatDuration(request.duration)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingDownIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  No performance alerts
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="py-3">
                    <div className="flex items-start space-x-3">
                      <AlertTriangleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {alert.message}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {alert.metric.url}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      {/* 简化显示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {renderVitalsCard()}
        {renderBandwidthCard()}
      </div>

      {/* 详细视图对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            View Detailed Analytics
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Performance Analytics</DialogTitle>
                <DialogDescription>
                  Monitor Core Web Vitals and bandwidth usage for optimization
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCwIcon
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </DialogHeader>
          {renderDetailedView()}
        </DialogContent>
      </Dialog>
    </>
  );
}

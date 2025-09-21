'use client';

import { bgRemovalMonitor } from '@/lib/bg-removal-monitor';
import { rembgApiService } from '@/lib/rembg-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BarChart3, HardDrive, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BGRemovalStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = () => {
    try {
      const data = bgRemovalMonitor.getStats();
      const cache = bgRemovalMonitor.getCacheEfficiency();
      const freeTier = bgRemovalMonitor.checkFreeTierStatus();
      const cacheStats = rembgApiService.getCacheStats();
      
      setStats({ data, cache, freeTier, cacheStats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>加载统计数据中...</p>
      </div>
    );
  }

  const { data, cache, freeTier, cacheStats } = stats;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Background 使用监控</h3>
        <Button onClick={loadStats} variant="outline" size="sm">
          刷新
        </Button>
      </div>

      {/* 免费额度警告 */}
      {freeTier.warningLevel !== 'safe' && (
        <Card className={`border-l-4 ${
          freeTier.warningLevel === 'critical' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                freeTier.warningLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <span className="font-medium">
                {freeTier.warningLevel === 'critical' ? '免费额度即将用完' : '免费额度使用较高'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              已使用 {freeTier.usage}/{freeTier.limit} 次API调用
            </p>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              总调用数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCalls}</div>
            <p className="text-xs text-gray-500">
              成功: {data.successfulCalls} | 失败: {data.failedCalls}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              缓存命中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(cache.hitRate * 100)}%</div>
            <p className="text-xs text-gray-500">
              节省: {cache.savedCalls} 次调用
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              预估成本
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.estimatedMonthlyCost.toFixed(3)}</div>
            <p className="text-xs text-gray-500">
              节省: ${cache.savedCost.toFixed(3)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              缓存状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.size}/{cacheStats.maxSize}</div>
            <p className="text-xs text-gray-500">
              平均处理: {Math.round(data.avgProcessingTime)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-gray-500 text-center">
        数据每30秒自动更新 | 最后更新: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

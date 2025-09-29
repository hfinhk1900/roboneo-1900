'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DiagnosticResult {
  description: string;
  count?: number;
  data: any[];
  status: 'OK' | 'WARNING' | 'ERROR' | 'INFO';
}

interface OverallHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  errorCount: number;
  warningCount: number;
  summary: string;
}

interface DiagnosticsData {
  success: boolean;
  timestamp: string;
  overallHealth: OverallHealth;
  diagnostics: Record<string, DiagnosticResult>;
  instructions: {
    message: string;
    keyFindings: string[];
  };
}

export default function UserIntegrityDebugPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/user-integrity');
      const result = await response.json();

      if (response.ok) {
        setData(result);
        toast.success('诊断完成');
      } else {
        throw new Error(result.error || 'Failed to fetch diagnostics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`诊断失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
      case 'HEALTHY':
        return 'bg-green-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'ERROR':
      case 'CRITICAL':
        return 'bg-red-500';
      case 'INFO':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OK':
        return '正常';
      case 'WARNING':
        return '警告';
      case 'ERROR':
        return '错误';
      case 'CRITICAL':
        return '严重';
      case 'INFO':
        return '信息';
      case 'HEALTHY':
        return '健康';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User ID & Database Integrity</h1>
          <p className="text-muted-foreground mt-2">
            检查用户ID重复、注册完整性和数据库一致性问题
          </p>
        </div>
        <Button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCwIcon
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? '诊断中...' : '重新诊断'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* 总体健康状况 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                总体健康状况
                <Badge className={getStatusColor(data.overallHealth.status)}>
                  {getStatusText(data.overallHealth.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{data.overallHealth.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.overallHealth.errorCount}
                  </div>
                  <div className="text-sm text-muted-foreground">错误</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.overallHealth.warningCount}
                  </div>
                  <div className="text-sm text-muted-foreground">警告</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(data.diagnostics).length}
                  </div>
                  <div className="text-sm text-muted-foreground">检查项目</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">
                    {new Date(data.timestamp).toLocaleString('zh-CN')}
                  </div>
                  <div className="text-sm text-muted-foreground">检查时间</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 关键发现 */}
          <Card>
            <CardHeader>
              <CardTitle>关键发现</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.instructions.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    {finding}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 详细诊断结果 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">详细诊断结果</h2>
            {Object.entries(data.diagnostics).map(([key, diagnostic]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{diagnostic.description}</span>
                    <div className="flex items-center gap-2">
                      {diagnostic.count !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {diagnostic.count} 项
                        </span>
                      )}
                      <Badge className={getStatusColor(diagnostic.status)}>
                        {getStatusText(diagnostic.status)}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnostic.data && diagnostic.data.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.data.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg font-mono text-sm"
                        >
                          <pre>{JSON.stringify(item, null, 2)}</pre>
                        </div>
                      ))}
                      {diagnostic.data.length > 5 && (
                        <p className="text-sm text-muted-foreground">
                          ... 还有 {diagnostic.data.length - 5} 项
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {diagnostic.status === 'OK'
                        ? '✅ 没有发现问题'
                        : '暂无数据'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CpuIcon, ZapIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { backgroundRemovalService } from '@/lib/background-removal';

export function BrowserCompatibility() {
  const [compatibility, setCompatibility] = useState<{
    webGPU: boolean;
    wasm: boolean;
    webGL: boolean;
    supported: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 延迟检测，确保组件完全加载
    const timer = setTimeout(() => {
      const comp = backgroundRemovalService.checkCompatibility();
      setCompatibility(comp);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CpuIcon className="h-5 w-5" />
            Checking Browser Compatibility...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!compatibility) {
    return null;
  }

  const getRecommendedModel = () => {
    if (compatibility.webGPU) return 'large';
    if (compatibility.webGL) return 'medium';
    return 'small';
  };

  const getPerformanceLevel = () => {
    if (compatibility.webGPU) return { level: 'High Performance', color: 'bg-green-100 text-green-800' };
    if (compatibility.webGL) return { level: 'Medium Performance', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Basic Performance', color: 'bg-blue-100 text-blue-800' };
  };

  const performance = getPerformanceLevel();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CpuIcon className="h-5 w-5" />
          浏览器兼容性
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 总体状态 */}
        <div className="flex items-center gap-2">
          {compatibility.supported ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">
            {compatibility.supported ? 'Local Background Removal Supported' : 'Local Background Removal Not Supported'}
          </span>
        </div>

        {/* 技术特性 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={compatibility.webGPU ? 'default' : 'secondary'}>
              {compatibility.webGPU ? 'WebGPU' : 'WebGPU'}
            </Badge>
            <span className="text-sm text-gray-600">
              {compatibility.webGPU ? 'Supported' : 'Not Supported'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={compatibility.webGL ? 'default' : 'secondary'}>
              {compatibility.webGL ? 'WebGL' : 'WebGL'}
            </Badge>
            <span className="text-sm text-gray-600">
              {compatibility.webGL ? 'Supported' : 'Not Supported'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={compatibility.wasm ? 'default' : 'secondary'}>
              {compatibility.wasm ? 'WASM' : 'WASM'}
            </Badge>
            <span className="text-sm text-gray-600">
              {compatibility.wasm ? 'Supported' : 'Not Supported'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={performance.color}>
              {performance.level}
            </Badge>
          </div>
        </div>

        {/* 推荐模型 */}
        {compatibility.supported && (
          <div className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              Recommended Model: <strong>{getRecommendedModel()}</strong>
            </span>
          </div>
        )}

        {/* 兼容性警告 */}
        {!compatibility.supported && (
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Your browser does not support local background removal. Please use the latest version of Chrome, Firefox, or Safari.
              It is recommended to enable WebGL and WebAssembly support.
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Description */}
        {compatibility.supported && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>• WebGPU: Best performance, supports large models</p>
            <p>• WebGL: Medium performance, balanced quality and speed</p>
            <p>• Basic mode: Best compatibility, slower speed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

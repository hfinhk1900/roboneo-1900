'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TestBackgroundRemoval() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResultUrl(null);
      setProcessingTime(null);

      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      toast.error('请先选择图片');
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // 转换为 base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const base64 = await base64Promise;

      // 准备表单数据
      const formData = new FormData();
      formData.append('image_data', base64);
      formData.append('max_side', '1600');

      console.log('🚀 发送背景移除请求...');

      // 调用 API
      const response = await fetch('/api/bg/remove-direct', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.image) {
        setResultUrl(result.image);
        setProcessingTime(result.processing_time);
        toast.success(`背景移除成功！处理时间：${result.processing_time}秒`);
        console.log('✅ 背景移除成功:', result);
      } else {
        throw new Error(result.error || '背景移除失败');
      }
    } catch (error) {
      console.error('❌ 背景移除失败:', error);
      toast.error(error instanceof Error ? error.message : '背景移除失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;

    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('图片已下载');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 私有背景移除服务测试
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 上传区域 */}
          <Card>
            <CardHeader>
              <CardTitle>📤 上传图片</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <div className="text-gray-500 mb-2">
                    点击选择图片或拖拽到此处
                  </div>
                  <Button variant="outline">选择图片</Button>
                </label>
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <h3 className="font-medium">原图预览：</h3>
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="原图"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleRemoveBackground}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? '🔄 处理中...' : '🎯 移除背景'}
              </Button>
            </CardContent>
          </Card>

          {/* 结果区域 */}
          <Card>
            <CardHeader>
              <CardTitle>✨ 处理结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">正在移除背景，请稍候...</p>
                </div>
              )}

              {resultUrl && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">处理结果：</h3>
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={resultUrl}
                        alt="处理结果"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {processingTime && (
                    <div className="text-sm text-gray-600">
                      ⏱️ 处理时间：{processingTime} 秒
                    </div>
                  )}

                  <Button onClick={handleDownload} className="w-full">
                    💾 下载结果
                  </Button>
                </div>
              )}

              {!isProcessing && !resultUrl && (
                <div className="text-center py-8 text-gray-500">
                  上传图片并点击"移除背景"开始处理
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 说明信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 这是私有背景移除服务的测试页面</p>
              <p>• 使用你的私有 Hugging Face Space 进行背景移除</p>
              <p>• 支持 JPG、PNG、WebP 格式的图片</p>
              <p>• 处理后的图片包含透明背景</p>
              <p>• 首次使用可能需要更长时间（模型加载）</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

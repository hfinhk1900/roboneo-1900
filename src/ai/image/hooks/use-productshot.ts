'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// 场景类型定义（与 API 保持一致）
export type SceneType =
  | 'studio-model'
  | 'lifestyle-casual'
  | 'outdoor-adventure'
  | 'elegant-evening'
  | 'street-style'
  | 'minimalist-clean'
  | 'custom';

export interface SceneConfig {
  id: SceneType;
  name: string;
  category: string;
  description: string;
}

export interface ProductShotRequest {
  sceneType: SceneType;
  customSceneDescription?: string; // 自定义场景描述
  quality?: 'standard' | 'hd';

  // Advanced generation controls
  steps?: number;              // 推理步数 (28-50, 默认根据quality)
  seed?: number;               // 随机种子 (-1为随机, 固定值可重现)
  guidance_scale?: number;     // CFG引导系数 (1.0-10.0, 默认3.5)
  num_images?: number;         // 生成图片数量 (1-4, 默认1)
  size?: string;               // 图像尺寸 (默认"1024x1024")
  output_format?: 'jpeg' | 'png' | 'webp';  // 输出格式

  // Image input for img2img - NOW REQUIRED
  uploaded_image: File;        // 上传的产品图片文件 (必需)

  // Optional additional context instead of product description
  additionalContext?: string;  // 额外的场景描述或风格要求

  // Optional product type hint for better detection
  productTypeHint?: 'small' | 'medium' | 'large' | 'auto';  // 产品尺寸提示
}

export interface ProductShotResult {
  success: boolean;
  taskId: string;
  resultUrl: string;
  sceneType: SceneType;
  sceneConfig: {
    name: string;
    category: string;
  };
  processingTime?: number;
  model: string;
  provider: string;
  credits_used: number;
}

export interface UseProductShotReturn {
  // 状态
  isLoading: boolean;
  result: ProductShotResult | null;
  error: string | null;
  availableScenes: SceneConfig[];

  // 方法
  generateProductShot: (params: ProductShotRequest) => Promise<void>;
  clearResult: () => void;
  downloadImage: (url: string, filename?: string) => Promise<void>;

  // 获取场景信息
  fetchAvailableScenes: () => Promise<void>;
}

export function useProductShot(): UseProductShotReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProductShotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableScenes, setAvailableScenes] = useState<SceneConfig[]>([]);

  // 获取可用场景
  const fetchAvailableScenes = async () => {
    try {
      const response = await fetch('/api/productshot/generate', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available scenes');
      }

      const data = await response.json();
      setAvailableScenes(data.availableScenes || []);
    } catch (err) {
      console.error('Error fetching scenes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load scenes: ${errorMessage}`);
    }
  };

  // 生成产品照片
  const generateProductShot = async (params: ProductShotRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎬 Generating ProductShot with SiliconFlow:', params);

      const response = await fetch('/api/productshot/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        // 处理不同类型的错误
        if (response.status === 401) {
          throw new Error('Please sign in to generate product shots');
        } else if (response.status === 402) {
          throw new Error(`Insufficient credits. Required: ${data.required}, Current: ${data.current}`);
        } else if (response.status === 400) {
          throw new Error(data.error || 'Invalid request parameters');
        } else if (response.status === 503) {
          throw new Error('AI service temporarily unavailable. Please try again later.');
        } else {
          throw new Error(data.error || 'Failed to generate product shot');
        }
      }

      if (!data.success || !data.resultUrl) {
        throw new Error('Generation completed but no result received');
      }

      setResult(data);
      toast.success(`Product shot generated successfully! (${data.credits_used} credits used)`);

    } catch (err) {
      console.error('ProductShot generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除结果
  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  // 下载图片
  const downloadImage = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `productshot-${Date.now()}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Image downloaded successfully!');

    } catch (err) {
      console.error('Download error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      toast.error(errorMessage);
    }
  };

  return {
    isLoading,
    result,
    error,
    availableScenes,
    generateProductShot,
    clearResult,
    downloadImage,
    fetchAvailableScenes,
  };
}

// Default scene presets (consistent with backend API)
export const DEFAULT_SCENES: SceneConfig[] = [
  {
    id: 'studio-model',
    name: 'Professional Model',
    category: 'model',
    description: 'Product worn by professional model in studio setting'
  },
  {
    id: 'lifestyle-casual',
    name: 'Casual Lifestyle',
    category: 'lifestyle',
    description: 'Product in natural everyday environment'
  },
  {
    id: 'outdoor-adventure',
    name: 'Outdoor Adventure',
    category: 'sport',
    description: 'Product in dynamic outdoor or sports setting'
  },
  {
    id: 'elegant-evening',
    name: 'Elegant Evening',
    category: 'formal',
    description: 'Product in sophisticated formal setting'
  },
  {
    id: 'street-style',
    name: 'Street Style',
    category: 'urban',
    description: 'Product in trendy urban street fashion setting'
  },
  {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    category: 'minimal',
    description: 'Product in clean minimalist environment'
  },
  {
    id: 'custom',
    name: 'Custom Scene',
    category: 'custom',
    description: 'Create your own custom scene description'
  }
];

// 辅助函数：根据场景ID获取场景信息
export function getSceneById(sceneId: SceneType): SceneConfig | undefined {
  return DEFAULT_SCENES.find(scene => scene.id === sceneId);
}

// 辅助函数：根据类别获取场景
export function getScenesByCategory(category: string): SceneConfig[] {
  return DEFAULT_SCENES.filter(scene => scene.category === category);
}

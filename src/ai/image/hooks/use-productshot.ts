'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// 6种专业产品摄影场景类型定义（与 API 保持一致）
export type SceneType =
  | 'studio-white'
  | 'studio-shadow'
  | 'home-lifestyle'
  | 'nature-outdoor'
  | 'table-flatlay'
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
  steps?: number; // 推理步数 (28-50, 默认根据quality)
  seed?: number; // 随机种子 (-1为随机, 固定值可重现)
  guidance_scale?: number; // CFG引导系数 (1.0-10.0, 默认3.5)
  num_images?: number; // 生成图片数量 (1-4, 默认1)
  size?: string; // 图像尺寸 (默认"1024x1024")
  output_format?: 'jpeg' | 'png' | 'webp'; // 输出格式
  // 用户选择的输出比例（例如 '1:1', '9:16'），用于前端裁剪
  aspectRatio?: string;

  // Image input for img2img - NOW REQUIRED
  uploaded_image: File; // 上传的产品图片文件 (必需)

  // NEW: Reference image for dual-image generation (optional)
  reference_image?: File; // 可选的参考背景图片文件

  // Optional additional context instead of product description
  additionalContext?: string; // 额外的场景描述或风格要求

  // Optional product type hint for better detection
  productTypeHint?: 'small' | 'medium' | 'large' | 'auto'; // 产品尺寸提示
}

export interface ProductShotResult {
  success: boolean;
  resultUrl: string;
  scene: string;
  credits_used: number;
  remaining_credits: number;
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
        credentials: 'include', // 确保包含认证 cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available scenes');
      }

      const data = await response.json();
      // 后端返回的数据结构是 { scenes: [...] }，需要转换为 SceneConfig 格式
      const scenes = data.scenes || [];
      const formattedScenes: SceneConfig[] = scenes.map((scene: any) => ({
        id: scene.id,
        name: scene.name,
        category: scene.category,
        description: scene.description || '', // 后端没有 description 字段，使用空字符串
      }));
      setAvailableScenes(formattedScenes);
    } catch (err) {
      console.error('Error fetching scenes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load scenes: ${errorMessage}`);
    }
  };

  function parseAspectRatio(
    aspect?: string
  ): { w: number; h: number } | undefined {
    if (!aspect) return undefined;
    const parts = aspect.split(':');
    if (parts.length !== 2) return undefined;
    const w = Number(parts[0]);
    const h = Number(parts[1]);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return undefined;
    }
    return { w, h };
  }

  // 辅助函数：压缩并将 File 转换为 base64 字符串
  const fileToBase64 = (
    file: File,
    targetAspect?: { w: number; h: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 验证输入
      if (!file) {
        reject(new Error('File is null or undefined'));
        return;
      }

      // 严格验证支持的图片格式
      const supportedFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!supportedFormats.includes(file.type)) {
        reject(
          new Error(
            `Unsupported file type: ${file.type}. Please use ${supportedFormats.join(', ')}. AVIF format is not currently supported.`
          )
        );
        return;
      }

      // 创建压缩canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 目标最长边限制
          const maxSide = 1024;
          const sourceWidth = img.width;
          const sourceHeight = img.height;

          if (targetAspect && targetAspect.w > 0 && targetAspect.h > 0) {
            // 使用 cover 裁剪到目标比例
            const targetRatio = targetAspect.w / targetAspect.h;
            const sourceRatio = sourceWidth / sourceHeight;

            // 计算源裁剪区域
            let cropWidth = sourceWidth;
            let cropHeight = sourceHeight;
            let sx = 0;
            let sy = 0;

            if (sourceRatio > targetRatio) {
              // 源更宽，裁掉左右
              cropWidth = Math.round(sourceHeight * targetRatio);
              sx = Math.round((sourceWidth - cropWidth) / 2);
            } else if (sourceRatio < targetRatio) {
              // 源更高，裁掉上下
              cropHeight = Math.round(sourceWidth / targetRatio);
              sy = Math.round((sourceHeight - cropHeight) / 2);
            }

            // 确定输出像素尺寸（按比例设置最长边为 maxSide）
            let outW = 0;
            let outH = 0;
            if (targetRatio >= 1) {
              outW = maxSide;
              outH = Math.round(maxSide / targetRatio);
            } else {
              outH = maxSide;
              outW = Math.round(maxSide * targetRatio);
            }

            canvas.width = outW;
            canvas.height = outH;
            ctx?.drawImage(
              img,
              sx,
              sy,
              cropWidth,
              cropHeight,
              0,
              0,
              outW,
              outH
            );
          } else {
            // 旧逻辑：保持宽高比压缩到最长边不超过 maxSide
            let width = sourceWidth;
            let height = sourceHeight;
            if (width > height) {
              if (width > maxSide) {
                height = Math.round((height * maxSide) / width);
                width = maxSide;
              }
            } else {
              if (height > maxSide) {
                width = Math.round((width * maxSide) / height);
                height = maxSide;
              }
            }
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
          }

          // 转换为base64，使用JPEG格式以减小文件大小
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

          // 移除 data:image/jpeg;base64, 前缀，只保留 base64 数据
          const base64 = compressedDataUrl.split(',')[1];

          if (!base64) {
            reject(
              new Error('Failed to extract base64 data from compressed image')
            );
            return;
          }

          console.log(
            `📸 Image compressed: ${file.name} (${Math.round(file.size / 1024)}KB → ${Math.round((base64.length * 0.75) / 1024)}KB)`
          );
          resolve(base64);
        } catch (error) {
          reject(
            new Error(
              `Error compressing image: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      // 读取文件并设置图片源
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      reader.readAsDataURL(file);
    });
  };

  // 生成产品照片
  const generateProductShot = async (params: ProductShotRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎬 Generating ProductShot with SiliconFlow:', {
        ...params,
        uploaded_image: params.uploaded_image
          ? `File: ${params.uploaded_image.name} (${params.uploaded_image.size} bytes, ${params.uploaded_image.type})`
          : undefined,
        reference_image: params.reference_image
          ? `File: ${params.reference_image.name} (${params.reference_image.size} bytes, ${params.reference_image.type})`
          : undefined,
        dualImageMode: !!params.reference_image,
      });

      // 验证必需的文件
      if (!params.uploaded_image) {
        throw new Error('Product image is required');
      }

      // 将 File 对象转换为 base64 字符串（按选择的比例进行 cover 裁剪）
      console.log('📸 Converting product image to base64...');
      const image_input = await fileToBase64(
        params.uploaded_image,
        parseAspectRatio(params.aspectRatio)
      );
      console.log(
        `✅ Product image converted: ${image_input.length} characters`
      );

      // 处理可选的reference_image
      let reference_image_base64: string | undefined;
      if (params.reference_image) {
        console.log(
          '🖼️ Processing reference image for dual-image generation...'
        );
        reference_image_base64 = await fileToBase64(params.reference_image);
      }

      // 构建请求数据，将 File 对象替换为 base64 字符串
      const requestData = {
        ...params,
        image_input,
        reference_image: reference_image_base64,
        // 移除 File 对象字段
        uploaded_image: undefined,
      };

      console.log('📤 Request data prepared:', {
        ...requestData,
        image_input: image_input.substring(0, 50) + '...', // 只显示前50个字符
        reference_image: reference_image_base64
          ? reference_image_base64.substring(0, 50) + '...'
          : undefined,
        dualImageMode: !!reference_image_base64,
      });

      console.log('🚀 Sending request to API...');
      const response = await fetch('/api/productshot/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保包含认证 cookies
        body: JSON.stringify(requestData),
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        // 处理不同类型的错误
        if (response.status === 401) {
          throw new Error('Please sign in to generate product shots');
        }
        if (response.status === 402) {
          throw new Error(
            `Insufficient credits. Required: ${data.required}, Current: ${data.current}`
          );
        }
        if (response.status === 400) {
          throw new Error(data.error || 'Invalid request parameters');
        }
        if (response.status === 503) {
          throw new Error(
            data.error ||
              'AI service temporarily unavailable. Please try again later.'
          );
        }
        if (response.status === 408) {
          throw new Error(data.error || 'Request timeout. Please try again.');
        }
        throw new Error(data.error || 'Failed to generate product shot');
      }

      if (!data.success || !data.resultUrl) {
        throw new Error('Generation completed but no result received');
      }

      setResult(data);
      toast.success(
        `Product shot generated successfully! (${data.credits_used} credits used)`
      );
    } catch (err) {
      console.error('ProductShot generation error:', err);
      let errorMessage = 'Unknown error occurred';

      if (err instanceof Error) {
        errorMessage = err.message;
        // 如果是网络错误，显示更多调试信息
        if (err.message.includes('fetch')) {
          console.error('Fetch error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }
      }

      setError(errorMessage);

      // 提供更有用的错误信息
      if (
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Please sign in')
      ) {
        toast.error(
          'Please sign in to generate product shots. Try refreshing the page and logging in again.'
        );
      } else if (errorMessage.includes('Insufficient credits')) {
        toast.error(
          "You don't have enough credits. Please purchase more credits to continue."
        );
      } else if (
        errorMessage.includes('temporarily unavailable') ||
        errorMessage.includes('AI服务暂时不可用')
      ) {
        toast.error(
          'AI service is temporarily unavailable. Please try again in a few minutes.'
        );
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('请求超时')
      ) {
        toast.error(
          'Request timeout. The AI service is taking longer than expected. Please try again.'
        );
      } else if (errorMessage.includes('网络连接问题')) {
        toast.error(
          'Network connection issue. Please check your internet connection and try again.'
        );
      } else {
        toast.error(`ProductShot generation failed: ${errorMessage}`);
      }
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
      const downloadFilename = filename || `productshot-${Date.now()}.png`;

      console.log('🔽 Starting image download:', {
        url,
        filename: downloadFilename,
      });

      // 使用后端代理API进行下载
      const downloadUrl = `/api/download-image?${new URLSearchParams({
        url: url,
        filename: downloadFilename,
      })}`;

      console.log('📡 Using download proxy:', downloadUrl);

      // 创建临时链接并触发下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Image download started!');
    } catch (err) {
      console.error('Download error:', err);

      // 备用方案1：尝试直接下载
      try {
        console.warn('Proxy download failed, trying direct download...');

        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename || `productshot-${Date.now()}.png`;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(downloadUrl);
          toast.success('Image downloaded successfully!');
          return;
        }
      } catch (directError) {
        console.warn('Direct download also failed:', directError);
      }

      // 备用方案2：在新标签页打开
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        'Opening image in new tab - you can right-click to save it'
      );
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

// 6种专业产品摄影场景配置（与后端API保持一致）
export const DEFAULT_SCENES: SceneConfig[] = [
  {
    id: 'custom',
    name: 'Custom Scene',
    category: 'custom',
    description: 'Create your own unique scene description',
  },
  {
    id: 'studio-white',
    name: 'Studio White',
    category: 'studio',
    description: '电商白底图 - 纯净白色背景，完美商业展示',
  },
  {
    id: 'studio-shadow',
    name: 'Studio Shadow',
    category: 'studio',
    description: '质感工作室图 - 专业灯光，突出产品质感',
  },
  {
    id: 'home-lifestyle',
    name: 'Home Lifestyle',
    category: 'lifestyle',
    description: '生活场景 - 温馨家居环境，日常使用情境',
  },
  {
    id: 'nature-outdoor',
    name: 'Nature Outdoor',
    category: 'nature',
    description: '户外自然 - 自然光线，有机环境背景',
  },
  {
    id: 'table-flatlay',
    name: 'Table Flatlay',
    category: 'flatlay',
    description: '桌面俯拍 - 俯视角度，整洁构图',
  },
  {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    category: 'minimal',
    description: '简约美学 - 极简设计，突出产品线条',
  },
];

// 辅助函数：根据场景ID获取场景信息
export function getSceneById(sceneId: SceneType): SceneConfig | undefined {
  return DEFAULT_SCENES.find((scene) => scene.id === sceneId);
}

// 辅助函数：根据类别获取场景
export function getScenesByCategory(category: string): SceneConfig[] {
  return DEFAULT_SCENES.filter((scene) => scene.category === category);
}

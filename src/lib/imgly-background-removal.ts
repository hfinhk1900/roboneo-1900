/**
 * @imgly/background-removal 去背景服务
 * 纯前端去背景，无需服务器处理
 */

import { removeBackground } from '@imgly/background-removal';

export interface ImglyBackgroundRemovalOptions {
  model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
  output?: {
    format: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
  };
  progress?: (progress: string, current: number, total: number, ...args: unknown[]) => void;
}

export interface ImglyBackgroundRemovalResult {
  success: boolean;
  image?: string;
  error?: string;
  processingTime?: number;
}

/**
 * @imgly/background-removal 服务
 */
export class ImglyBackgroundRemovalService {
  private static instance: ImglyBackgroundRemovalService;
  private isModelLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): ImglyBackgroundRemovalService {
    if (!ImglyBackgroundRemovalService.instance) {
      ImglyBackgroundRemovalService.instance = new ImglyBackgroundRemovalService();
    }
    return ImglyBackgroundRemovalService.instance;
  }

  /**
   * 预加载模型
   */
  async preloadModel(): Promise<void> {
    if (this.isModelLoaded) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadModel();
    try {
      await this.loadingPromise;
      this.isModelLoaded = true;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * 加载模型
   */
  private async loadModel(): Promise<void> {
    try {
      console.log('🔄 Starting to load @imgly/background-removal model...');

      // 创建一个小的测试图片来预加载模型
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.fillRect(16, 16, 32, 32);
      }

      const testImage = canvas.toDataURL('image/png');

      // 使用默认配置加载模型
      await removeBackground(testImage, {
        model: 'isnet',
        progress: (progress, current, total) => {
          console.log(`📥 Model loading progress: ${progress} (${current}/${total})`);
        },
        // Optimize ONNX.js configuration for model preloading
        env: {
          wasm: {
            numThreads: 1, // Use single thread to avoid warnings
            simd: true,    // Enable SIMD for better performance
            proxy: true    // Enable proxy for better compatibility
          }
        }
      });

      console.log('✅ @imgly/background-removal model loading completed');
    } catch (error) {
              console.warn('⚠️ Model preloading failed, will load on first use:', error);

      // 记录具体的错误类型以便调试
      if (error instanceof Error) {
        if (error.message.includes('ChunkLoadError')) {
          console.warn('⚠️ Webpack module loading error, may need to refresh page');
        } else if (error.message.includes('Resource metadata not found')) {
          console.warn('⚠️ Model resource not found, check network connection');
        }
      }
    }
  }

  /**
   * 去除图片背景
   */
  async removeBackground(
    imageFile: File | string,
    options: ImglyBackgroundRemovalOptions = {}
  ): Promise<ImglyBackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      console.log('🎯 Starting @imgly/background-removal processing...');

      // 确保模型已加载
      await this.preloadModel();

      const config = {
        model: options.model || 'isnet',
        output: {
          format: options.output?.format || 'image/png',
          quality: options.output?.quality || 0.9
        },
        progress: options.progress || ((progress, current, total) => {
          console.log(`🔄 Processing progress: ${progress} (${current}/${total})`);
        }),
        // Optimize ONNX.js configuration to reduce warnings
        env: {
          wasm: {
            numThreads: 1, // Use single thread to avoid warnings
            simd: true,    // Enable SIMD for better performance
            proxy: true    // Enable proxy for better compatibility
          }
        }
      };

      console.log('⚙️ 配置参数:', config);

      // 添加重试机制和更好的错误处理
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          // 处理图片
          const result = await removeBackground(imageFile, config);

          console.log('✅ @imgly/background-removal processing completed');

          // 处理结果
          if (result instanceof Blob) {
            // 如果结果是 Blob，转换为 base64
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(result);
            });

            const processingTime = Date.now() - startTime;
            console.log(`⏱️ 处理时间: ${processingTime}ms`);

            return {
              success: true,
              image: dataUrl,
              processingTime
            };
          } else {
            throw new Error('Unexpected result type from @imgly/background-removal');
          }
        } catch (retryError) {
          retryCount++;
          console.warn(`⚠️ 第 ${retryCount} 次尝试失败:`, retryError);

          if (retryCount > maxRetries) {
            throw retryError;
          }

          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      throw new Error('所有重试尝试都失败了');

    } catch (error) {
      console.error('❌ @imgly/background-removal 处理失败:', error);

      // 提供用户友好的错误信息
      let errorMessage = '背景移除处理失败';
      if (error instanceof Error) {
        if (error.message.includes('ChunkLoadError') || error.message.includes('webpack')) {
          errorMessage = '模型加载失败，请刷新页面重试';
        } else if (error.message.includes('onnx')) {
          errorMessage = 'AI 模型初始化失败，请检查浏览器兼容性';
        } else if (error.message.includes('Resource metadata not found')) {
          errorMessage = '模型资源加载失败，请检查网络连接';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 检查浏览器兼容性
   */
  checkCompatibility(): {
    webGPU: boolean;
    wasm: boolean;
    webGL: boolean;
    supported: boolean;
  } {
    const webGPU = 'gpu' in navigator;
    const wasm = typeof WebAssembly === 'object';
    const webGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })();

    return {
      webGPU,
      wasm,
      webGL,
      supported: wasm && webGL // 最低要求
    };
  }

  /**
   * 获取推荐模型
   */
  getRecommendedModel(): 'isnet' | 'isnet_fp16' | 'isnet_quint8' {
    const compatibility = this.checkCompatibility();

    if (compatibility.webGPU) {
      return 'isnet'; // WebGPU 支持，使用标准模型
    } else if (compatibility.webGL) {
      return 'isnet_fp16'; // WebGL 支持，使用 FP16 模型
    } else {
      return 'isnet_quint8'; // 基础支持，使用量化模型
    }
  }

  /**
   * 获取推荐设置
   */
  getRecommendedSettings() {
    return {
      model: this.getRecommendedModel(),
      output: {
        format: 'image/png' as const,
        quality: 0.9
      }
    };
  }
}

// 导出单例实例
export const imglyBackgroundRemovalService = ImglyBackgroundRemovalService.getInstance();

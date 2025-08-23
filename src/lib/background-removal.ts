import { removeBackground } from '@imgly/background-removal';

export interface BackgroundRemovalOptions {
  publicPath?: string;
  model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
  output?: {
    format: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
  };
  progress?: (progress: string, current: number, total: number, ...args: unknown[]) => void;
}

export interface BackgroundRemovalResult {
  success: boolean;
  image?: string;
  error?: string;
  processingTime?: number;
}

/**
 * 本地去背景服务
 * 使用 @imgly/background-removal 在浏览器中处理
 */
export class LocalBackgroundRemovalService {
  private static instance: LocalBackgroundRemovalService;
  private isModelLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): LocalBackgroundRemovalService {
    if (!LocalBackgroundRemovalService.instance) {
      LocalBackgroundRemovalService.instance = new LocalBackgroundRemovalService();
    }
    return LocalBackgroundRemovalService.instance;
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
   * Load model
   */
  private async loadModel(): Promise<void> {
    try {
      // Try local path first (most reliable)
      await removeBackground(new Image(), {
        model: 'isnet',
        publicPath: '/models',
        progress: () => {} // Silent loading
      });
    } catch (error) {
      console.warn('Local path failed, trying official CDN:', error);
      try {
        // Try official CDN
        await removeBackground(new Image(), {
          model: 'isnet',
          publicPath: 'https://cdn.img.ly/packages/background-removal/1.7.0/',
          progress: () => {}
        });
      } catch (cdnError) {
        console.warn('Official CDN also failed, trying alternative CDN:', cdnError);
        try {
          // Try alternative CDN
          await removeBackground(new Image(), {
            model: 'isnet',
            publicPath: 'https://unpkg.com/@imgly/background-removal@1.7.0/dist/',
            progress: () => {}
          });
        } catch (altError) {
          console.warn('All paths failed:', altError);
        }
      }
    }
  }

  /**
   * 去除图片背景
   */
  async removeBackground(
    imageFile: File | string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      // 确保模型已加载
      await this.preloadModel();

      const config = {
        model: options.model || 'isnet',
        publicPath: options.publicPath || '/models',
        output: {
          format: options.output?.format || 'image/png',
          quality: options.output?.quality || 0.8
        },
        progress: options.progress || (() => {})
      };

      // Process image
      const result = await removeBackground(imageFile, config);

      // Convert to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot create canvas context');
      }

      // Handle different result types
      if (result instanceof Blob) {
        // If result is Blob, convert to base64
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(result);
        });
        return {
          success: true,
          image: dataUrl,
          processingTime: Date.now() - startTime
        };
      } else if (result && typeof result === 'object' && 'width' in result && 'height' in result) {
        // If result is ImageData-like object
        canvas.width = (result as any).width;
        canvas.height = (result as any).height;
        ctx.putImageData(result as any, 0, 0);
      } else {
        throw new Error('Unexpected result type from background removal');
      }

      const dataUrl = canvas.toDataURL(config.output.format, config.output.quality);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        image: dataUrl,
        processingTime
      };

    } catch (error) {
      console.error('去背景处理失败:', error);

              return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
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
   * Get recommended model size
   */
  getRecommendedModel(): 'isnet' | 'isnet_fp16' | 'isnet_quint8' {
    const compatibility = this.checkCompatibility();

    if (compatibility.webGPU) {
      return 'isnet'; // WebGPU support, use standard model
    } else if (compatibility.webGL) {
      return 'isnet_fp16'; // WebGL support, use FP16 model
    } else {
      return 'isnet_quint8'; // Basic support, use quantized model
    }
  }
}

// 导出单例实例
export const backgroundRemovalService = LocalBackgroundRemovalService.getInstance();

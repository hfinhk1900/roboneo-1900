/**
 * Private Background Removal Service
 * 使用私有 Hugging Face Space 进行背景移除
 */

export interface RembgApiOptions {
  backgroundColor?: string;
  timeout?: number;
  maxSide?: number;
  aspectRatio?: { w: number; h: number }; // 新增：支持宽高比
}

export interface RembgApiResult {
  success: boolean;
  image?: string;
  error?: string;
  processingTime?: number;
  method?: string;
  image_size?: string; // 新增：图片尺寸信息
  remaining_credits?: number; // 新增：剩余积分信息
}

export class RembgApiService {
  private static instance: RembgApiService;

  static getInstance(): RembgApiService {
    if (!RembgApiService.instance) {
      RembgApiService.instance = new RembgApiService();
    }
    return RembgApiService.instance;
  }

  async removeBackground(
    imageFile: File | string,
    options: RembgApiOptions = {}
  ): Promise<RembgApiResult> {
    const startTime = Date.now();

    try {
      console.log('🔄 Starting private background removal...');

      // 转换图片为base64
      let imageBase64: string;
      if (typeof imageFile === 'string') {
        imageBase64 = imageFile;
      } else {
        imageBase64 = await this.fileToBase64(imageFile);
      }

      // 准备表单数据
      const formData = new FormData();
      formData.append('image_data', imageBase64);
      formData.append('max_side', String(options.maxSide || 1600));

      // 新增：传递尺寸信息
      if (options.aspectRatio) {
        formData.append(
          'aspect_ratio',
          `${options.aspectRatio.w}:${options.aspectRatio.h}`
        );
        console.log(
          `📐 Sending aspect ratio: ${options.aspectRatio.w}:${options.aspectRatio.h}`
        );
      }

      console.log('📤 Sending request to private HF Space...');

      // 调用 Vercel API 代理
      const { newIdempotencyKey } = await import('./idempotency-client');
      const response = await fetch('/api/bg/remove-direct', {
        method: 'POST',
        body: formData,
        headers: {
          'Idempotency-Key': newIdempotencyKey(),
        } as any,
        signal: AbortSignal.timeout(options.timeout || 60000),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Private HF Space response received');

      if (result.success && result.image) {
        // 如果需要应用背景颜色
        let finalImage = result.image;
        if (
          options.backgroundColor &&
          options.backgroundColor !== 'transparent'
        ) {
          console.log(
            `🎨 Applying background color: ${options.backgroundColor}`
          );
          finalImage = await this.applyBackgroundColor(
            result.image,
            options.backgroundColor
          );
        }

        const processingTime = Date.now() - startTime;
        console.log(
          `✅ Private background removal completed in ${processingTime}ms`
        );

        return {
          success: true,
          image: finalImage,
          processingTime,
          method: result.method || 'private-hf-space',
          image_size: result.image_size, // 新增：返回图片尺寸信息
          remaining_credits: result.remaining_credits, // 新增：传递剩余积分信息
        };
      }

      throw new Error(result.error || 'Background removal failed');
    } catch (error) {
      console.error('❌ Private background removal error:', error);

      let errorMessage = 'Background removal failed';
      if (error instanceof Error) {
        errorMessage = error.message;

        // 提供用户友好的错误信息
        if (errorMessage.includes('fetch')) {
          errorMessage =
            'Network connection failed. Please check your internet connection.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage =
            'Request timeout. The image may be too large or server is busy.';
        } else if (errorMessage.includes('Network error')) {
          errorMessage =
            'Background removal service temporarily unavailable. Please try again later.';
        }
      }

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private applyBackgroundColor(
    imageDataUrl: string,
    backgroundColor: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error('Canvas not available'));
          return;
        }

        // 填充背景色
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制透明图像
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Image processing failed'));
      img.src = imageDataUrl;
    });
  }

  /**
   * 检查API服务状态
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/bg/remove-direct', {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const rembgApiService = RembgApiService.getInstance();

// SiliconFlow API Provider for FLUX.1-Kontext models
import type { ImageResult } from '../lib/image-types';
import type { GenerateImageResponse } from '../lib/api-types';

export interface ProductShotResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  seed?: number;
  processingTime?: number;
  provider: string;
  model: string;
  error?: string;
}

export class SiliconFlowProvider {
  name = 'siliconflow';
  apiKey: string;
  baseUrl = 'https://api.siliconflow.com/v1';

  supportedStyles = [
    'product-photography',
    'lifestyle-scenes',
    'model-showcase',
    'brand-presentation'
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateProductShot(params: {
    prompt: string;
    model?: string;
    size?: string;
    quality?: 'standard' | 'hd';
    steps?: number;
    seed?: number;
    guidance_scale?: number;
    num_images?: number;
    output_format?: 'jpeg' | 'png' | 'webp';
    image_input?: string; // base64 encoded image for image-to-image
  }): Promise<ProductShotResult> {
    // SiliconFlow API 请求体 - 支持图像输入的完整格式
    const requestBody: any = {
      model: params.model || 'black-forest-labs/FLUX.1-dev',
      prompt: params.prompt,
      prompt_enhancement: false, // 官方文档参数，默认关闭
    };

    // ✅ 正确处理图像输入 - FLUX.1-Kontext-dev 需要图像作为主体
    if (params.image_input) {
      console.log('✅ Processing image input for FLUX.1-Kontext-dev');
      // 根据 SiliconFlow 官方文档，image 参数用于 image-to-image 生成
      requestBody.image = params.image_input;

      // 如果提供了图像，模型应该使用 FLUX.1-Kontext-dev 以获得更好的图像理解能力
      if (params.model?.includes('FLUX.1-dev')) {
        requestBody.model = 'black-forest-labs/FLUX.1-Kontext-dev';
        console.log('🎯 Using FLUX.1-Kontext-dev for better image understanding');
      }

      // 尝试添加一些可能影响比例的参数
      // 注意：这些参数可能不被支持，但不会导致错误
      if (params.guidance_scale) {
        requestBody.guidance_scale = Math.min(params.guidance_scale, 5.0); // 限制在合理范围
        console.log('🎛️ Attempting to set guidance_scale:', requestBody.guidance_scale);
      }

      // 设置默认的适度控制参数
      requestBody.prompt_enhancement = false; // 避免过度增强导致比例失真

    } else {
      console.warn('⚠️ No image input provided - this may not work well with FLUX.1-Kontext-dev');
    }

    // 根据官方文档，重新启用尺寸参数支持
    if (params.size) {
      const [width, height] = params.size.split('x').map(Number);
      if (width && height) {
        requestBody.width = width;
        requestBody.height = height;
        requestBody.image_size = params.size; // 官方文档显示的 image_size 参数
      }
    }

    // 可选的 seed 参数（范围：0-9999999999）
    if (params.seed !== undefined && params.seed >= 0 && params.seed <= 9999999999) {
      requestBody.seed = params.seed;
    }

    // 官方支持的输出格式参数
    if (params.output_format) {
      requestBody.output_format = params.output_format;
    }

    // TODO: 添加更多官方参数支持
    // - prompt_upsampling
    // - safety_tolerance
    // - raw

    console.log('🚀 SiliconFlow request body:', {
      model: requestBody.model,
      hasImage: !!requestBody.image,
      prompt: requestBody.prompt.substring(0, 100) + '...',
      size: requestBody.image_size || `${requestBody.width}x${requestBody.height}`,
      seed: requestBody.seed
    });

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SiliconFlow API 详细错误:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`SiliconFlow API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // 下载图片并保存到R2 productshots文件夹
      let finalResultUrl = data.images[0]?.url;

      if (finalResultUrl) {
        try {
          console.log('📥 Downloading generated image from SiliconFlow...');
          const imageResponse = await fetch(finalResultUrl);
          if (imageResponse.ok) {
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            // 导入存储模块
            const { uploadFile } = await import('../../../storage');

            // 生成文件名
            const timestamp = Date.now();
            const filename = `productshot-${timestamp}.png`;

            console.log('☁️ Uploading to R2 productshots folder...');
            const uploadResult = await uploadFile(
              imageBuffer,
              filename,
              'image/png',
              'productshots'  // 保存到 R2 的 productshots 文件夹
            );

            console.log('✅ Image saved to R2:', uploadResult.url);
            finalResultUrl = uploadResult.url;  // 使用R2的URL
          }
        } catch (uploadError) {
          console.error('⚠️ Failed to save to R2:', uploadError);
          // 如果R2上传失败，仍然返回原始URL
        }
      }

      return {
        taskId: `sf_${Date.now()}`,
        status: 'completed',
        resultUrl: finalResultUrl,
        seed: data.seed,
        processingTime: data.timings?.inference,
        provider: 'siliconflow',
        model: requestBody.model
      };

    } catch (error) {
      console.error('SiliconFlow generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Generation failed: ${errorMessage}`);
    }
  }

  // 为 ProductShot 专门优化的方法
  async generateProductScene(params: {
    productDescription: string;
    sceneType: string;
    additionalContext?: string;
  }): Promise<ProductShotResult> {
    // 构建 FLUX.1-Kontext-dev 优化的提示词
    const optimizedPrompt = this.buildKontextPrompt(
      params.productDescription,
      params.sceneType,
      params.additionalContext
    );

    return await this.generateProductShot({
      prompt: optimizedPrompt,
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      size: '1024x1024',
      quality: 'hd'
    });
  }

  private buildKontextPrompt(
    product: string,
    scene: string,
    context?: string
  ): string {
    // FLUX.1-Kontext-dev 专门优化的提示词构建
    const basePrompt = `professional product photography showing ${product}`;
    const sceneContext = this.getScenePrompt(scene);
    const qualityEnhancements = [
      'high quality commercial photography',
      'perfect lighting and composition',
      'detailed textures and materials',
      'professional studio quality',
      'marketing ready image'
    ].join(', ');

    let finalPrompt = `${basePrompt} ${sceneContext}, ${qualityEnhancements}`;

    if (context) {
      finalPrompt += `, ${context}`;
    }

    return finalPrompt;
  }

  private getScenePrompt(sceneType: string): string {
    const scenePrompts: Record<string, string> = {
      'studio-model': 'worn by professional model in clean studio setting',
      'lifestyle-casual': 'in natural lifestyle environment with casual styling',
      'outdoor-adventure': 'in dynamic outdoor adventure setting',
      'elegant-evening': 'in sophisticated elegant evening environment',
      'street-style': 'in modern urban street style setting',
      'minimalist-clean': 'in minimalist clean professional environment'
    };

    return scenePrompts[sceneType] || scenePrompts['studio-model'];
  }

  // Credits 消耗估算
  estimateCredits(model: string, quality: string): number {
    const baseCosts: Record<string, number> = {
      'black-forest-labs/FLUX.1-dev': 20,
      'FLUX.1-Kontext-dev': 25,
      'black-forest-labs/FLUX.1-schnell': 15,
      'black-forest-labs/FLUX-1.1-pro': 30,
      'black-forest-labs/FLUX-1.1-pro-Ultra': 35
    };

    const qualityMultiplier = quality === 'hd' ? 1.5 : 1.0;
    return Math.ceil((baseCosts[model] || 20) * qualityMultiplier);
  }
}

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
    
    console.log('🎯 SiliconFlow ProductShot generation starting...');
    
    // 临时：暂时使用标准图像生成，忽略图像输入
    // TODO: 实现图像输入功能
    if (params.image_input) {
      console.log('⚠️ Image input provided but temporarily using text-to-image generation');
      // 在提示词中添加关于产品的描述
      params.prompt = `Based on an uploaded product image: ${params.prompt}`;
    }
    
    // 使用标准图像生成API
    return this.generateStandardImage(params);
  }

  // 使用图像编辑API处理有图像输入的请求
  private async generateImageEdit(params: {
    prompt: string;
    model?: string;
    size?: string;
    quality?: 'standard' | 'hd';
    steps?: number;
    seed?: number;
    guidance_scale?: number;
    num_images?: number;
    output_format?: 'jpeg' | 'png' | 'webp';
    image_input: string; // base64 encoded image
  }): Promise<ProductShotResult> {
    
    console.log('✅ Using SiliconFlow image editing API for product shot generation');
    
    try {
      // 在Node.js环境中使用form-data包
      const FormDataNode = (await import('form-data')).default;
      const formData = new FormDataNode();
      
      // 将base64转换为Buffer
      const imageBuffer = Buffer.from(params.image_input, 'base64');
      
      // 添加图像数据
      formData.append('image', imageBuffer, {
        filename: 'product.png',
        contentType: 'image/png'
      });
      formData.append('prompt', params.prompt);
      
      // 根据API文档，图像编辑支持这些模型
      const model = params.model?.includes('gpt-image-1') ? 'gpt-image-1' : 'dall-e-2';
      formData.append('model', model);
      
      if (params.size) {
        formData.append('size', params.size);
      } else {
        formData.append('size', '1024x1024');
      }
      
      if (params.num_images) {
        formData.append('n', params.num_images.toString());
      }
      
      // 设置质量（仅gpt-image-1支持）
      if (model === 'gpt-image-1') {
        const quality = params.quality === 'hd' ? 'high' : 'medium';
        formData.append('quality', quality);
      }
      
      console.log('🚀 SiliconFlow image edit request:', {
        model,
        prompt: params.prompt.substring(0, 100) + '...',
        size: params.size || '1024x1024',
        hasImage: true
      });

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // 不设置 Content-Type，让浏览器自动设置multipart边界
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SiliconFlow image edit API 错误:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`SiliconFlow API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // 下载图片并保存到R2
      let finalResultUrl = data.data?.[0]?.url;

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
        taskId: `sf_edit_${Date.now()}`,
        status: 'completed',
        resultUrl: finalResultUrl,
        seed: data.seed,
        processingTime: Date.now(), // API不返回处理时间
        provider: 'siliconflow',
        model: model
      };
      
    } catch (error) {
      console.error('SiliconFlow image edit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image edit failed: ${errorMessage}`);
    }
  }

  // 标准图像生成API（无图像输入）
  private async generateStandardImage(params: {
    prompt: string;
    model?: string;
    size?: string;
    quality?: 'standard' | 'hd';
    steps?: number;
    seed?: number;
    guidance_scale?: number;
    num_images?: number;
    output_format?: 'jpeg' | 'png' | 'webp';
  }): Promise<ProductShotResult> {
    
    console.log('🎨 Using SiliconFlow standard image generation API');
    
    // SiliconFlow API 请求体
    const requestBody: any = {
      model: params.model || 'recraftv3', // 使用默认模型
      prompt: params.prompt,
      size: params.size || '1024x1024'
    };

    // 可选参数
    if (params.seed !== undefined) {
      requestBody.seed = params.seed;
    }
    
    if (params.steps) {
      requestBody.steps = params.steps;
    }
    
    if (params.guidance_scale) {
      requestBody.guidance = params.guidance_scale;
    }

    console.log('🚀 SiliconFlow standard request:', {
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + '...',
      size: requestBody.size
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
      
      console.log('✅ SiliconFlow API response:', {
        hasData: !!data,
        dataKeys: Object.keys(data || {}),
        images: data.images ? `${data.images.length} images` : 'no images array',
        data_array: data.data ? `${data.data.length} data items` : 'no data array'
      });

      // 下载图片并保存到R2 productshots文件夹
      // 尝试两种可能的响应格式
      let finalResultUrl = data.images?.[0]?.url || data.data?.[0]?.url;

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

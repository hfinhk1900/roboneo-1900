import type { GenerateImageResponse } from '../lib/api-types';
// SiliconFlow API Provider for FLUX.1-Kontext models
import type { ImageResult } from '../lib/image-types';

export interface ProductShotResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  seed?: number;
  processingTime?: number;
  provider: string;
  model: string;
  error?: string;
  storageKey?: string; // R2 storage key for DB assets table
  sizeBytes?: number; // file size in bytes
}

export class SiliconFlowProvider {
  name = 'siliconflow';
  apiKey: string;
  baseUrl = 'https://api.siliconflow.com/v1';
  private requestTimeoutMs: number;

  supportedStyles = [
    'product-photography',
    'lifestyle-scenes',
    'model-showcase',
    'brand-presentation',
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Increase default timeout to 120s to avoid premature AbortError during peak load
    this.requestTimeoutMs = Number(
      process.env.SILICONFLOW_REQUEST_TIMEOUT_MS || 120000
    );
  }

  private async fetchWithTimeoutRetry(
    url: string,
    init: RequestInit & { signal?: AbortSignal },
    timeoutMs: number,
    retries = 1
  ): Promise<Response> {
    try {
      const controller = AbortSignal.timeout(timeoutMs);
      const res = await fetch(url, { ...init, signal: controller });
      return res;
    } catch (err) {
      const isAbort = (err as any)?.name === 'TimeoutError' ||
        (err as any)?.name === 'AbortError' ||
        String(err).includes('timeout');
      if (isAbort && retries > 0) {
        const nextTimeout = Math.round(timeoutMs * 1.5);
        console.warn(
          `SiliconFlow request timed out, retrying once with ${nextTimeout}ms...`
        );
        return this.fetchWithTimeoutRetry(url, init, nextTimeout, retries - 1);
      }
      throw err;
    }
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
    reference_image?: string; // NEW: base64 encoded reference image for dual-image generation
    storageFolder?: string; // NEW: custom storage folder (default: 'productshots')
    watermarkText?: string; // NEW: apply bottom-right watermark text before upload
  }): Promise<ProductShotResult> {
    console.log('🎯 SiliconFlow ProductShot generation starting...');

    // 如果有图像输入，使用 image-to-image 生成
    if (params.image_input) {
      console.log('🖼️ Using image-to-image generation with FLUX.1-Kontext-dev');
      return this.generateImageToImage({
        ...params,
        image_input: params.image_input,
        storageFolder: params.storageFolder,
      });
    }

    // 没有图像输入时使用标准文本生成
    console.log('📝 Using text-to-image generation');
    return this.generateStandardImage(params);
  }

  // 使用 FLUX.1-Kontext-dev 进行 image-to-image 生成
  private async generateImageToImage(params: {
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
    reference_image?: string; // NEW: base64 encoded reference image for dual-image generation
    storageFolder?: string; // NEW: custom storage folder
    watermarkText?: string;
  }): Promise<ProductShotResult> {
    console.log(
      '🎨 Using SiliconFlow image-to-image generation with FLUX.1-Kontext-dev'
    );

    try {
      // 使用 SiliconFlow 的 image-to-image API
      const model = params.model || 'black-forest-labs/FLUX.1-Kontext-dev';

      // 构建请求体 - 只使用SiliconFlow FLUX.1-Kontext-dev支持的参数
      const requestBody: any = {
        model: model,
        prompt: params.prompt,
        image: params.image_input.startsWith('data:')
          ? params.image_input
          : `data:image/png;base64,${params.image_input}`, // 确保有正确的数据前缀
        prompt_enhancement: false, // 禁用提示词增强以保持原始输入
      };

      // 双图支持：回退到reference_image参数
      if (params.reference_image) {
        requestBody.reference_image = params.reference_image.startsWith('data:')
          ? params.reference_image
          : `data:image/png;base64,${params.reference_image}`;
        console.log('🖼️ Dual-image mode: Added reference_image to request');
      }

      // 可选参数
      if (params.seed !== undefined) {
        requestBody.seed = params.seed;
      }

      console.log('🚀 SiliconFlow image-to-image request:', {
        model: requestBody.model,
        prompt: requestBody.prompt.substring(0, 100) + '...',
        prompt_enhancement: requestBody.prompt_enhancement,
        hasImageInput: !!params.image_input,
        hasReferenceImage: !!params.reference_image,
        dualImageMode: !!params.reference_image,
        usingReferenceImage: !!requestBody.reference_image,
        hasSeed: !!requestBody.seed,
      });

      // 添加请求超时和重试机制
      const response = await this.fetchWithTimeoutRetry(
        `${this.baseUrl}/image/generations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.requestTimeoutMs,
        1
      );

      console.log(
        `📡 SiliconFlow API Response: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.error('Failed to read error response text:', textError);
        }

        console.error('SiliconFlow API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        // 特殊处理500错误和60000错误代码
        if (response.status === 500) {
          console.warn('⚠️ SiliconFlow API 服务端错误，可能是临时问题');
          throw new Error(
            'AI服务暂时不可用，请稍后重试。这可能是由于服务器负载过高或临时维护。'
          );
        }

        throw new Error(
          `SiliconFlow API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      let result: any;
      try {
        result = await response.json();
        console.log(
          '📦 SiliconFlow raw response:',
          JSON.stringify(result, null, 2)
        );
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const responseText = await response.text();
        console.error('Response text:', responseText);
        throw new Error(
          `Invalid JSON response from SiliconFlow API: ${jsonError}`
        );
      }

      console.log('✅ SiliconFlow API response:', {
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        images: result.data?.images
          ? `${result.data.images.length} images`
          : 'no images',
        data_array: Array.isArray(result.data)
          ? `${result.data.length} data items`
          : 'not array',
      });

      // 处理 SiliconFlow 响应格式
      let imageUrl: string;
      let seed: number | undefined;

      console.log('🔍 Analyzing response structure...');
      console.log('result.data type:', typeof result.data);
      console.log('result.data:', result.data);

      try {
        if (
          result.data?.images &&
          Array.isArray(result.data.images) &&
          result.data.images.length > 0
        ) {
          // 标准响应格式
          console.log('📋 Using standard response format (result.data.images)');
          imageUrl = result.data.images[0].url;
          seed = result.data.images[0].seed;
        } else if (Array.isArray(result.data) && result.data.length > 0) {
          // 备用响应格式
          console.log(
            '📋 Using alternative response format (result.data array)'
          );
          imageUrl = result.data[0].url;
          seed = result.data[0].seed;
        } else {
          console.error('❌ Unexpected response structure:', {
            hasData: !!result.data,
            dataType: typeof result.data,
            isArray: Array.isArray(result.data),
            dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
            dataKeys: result.data ? Object.keys(result.data) : 'N/A',
          });
          throw new Error('No image data found in SiliconFlow response');
        }

        if (!imageUrl) {
          throw new Error('Image URL is empty or undefined in response');
        }

        console.log(`✅ Extracted image URL: ${imageUrl.substring(0, 100)}...`);
      } catch (extractError) {
        console.error('❌ Error extracting image data:', extractError);
        throw new Error(
          `Failed to extract image data: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`
        );
      }

      // 下载生成的图像并上传到 R2
      console.log('📥 Downloading generated image from SiliconFlow...');
      let imageBuffer: ArrayBuffer;
      try {
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
          throw new Error(
            `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`
          );
        }

        imageBuffer = await imageResponse.arrayBuffer();
        console.log(`✅ Image downloaded: ${imageBuffer.byteLength} bytes`);
      } catch (downloadError) {
        console.error('❌ Error downloading image:', downloadError);
        throw new Error(
          `Failed to download generated image: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`
        );
      }

      // 可选：应用水印（右下角）
      let uploadBuffer = Buffer.from(imageBuffer);
      if (params.watermarkText) {
        try {
          const { applyCornerWatermark } = await import('@/lib/watermark');
          uploadBuffer = await applyCornerWatermark(
            uploadBuffer,
            params.watermarkText,
            {
              fontSizeRatio: 0.045,
              opacity: 0.9,
              margin: 20,
              fill: '#FFFFFF',
              stroke: 'rgba(0,0,0,0.35)',
              strokeWidth: 2,
            }
          );
        } catch (wmError) {
          console.warn(
            'Watermark application failed, uploading original buffer:',
            wmError
          );
        }
      }

      // 上传到 R2
      const storageFolder = params.storageFolder || 'productshots';
      console.log(`☁️ Uploading to R2 ${storageFolder} folder...`);
      let publicUrl: string;
      let storageKey: string | undefined;
      try {
        const { uploadFile } = await import('@/storage');
        const filename = `${crypto.randomUUID()}.png`;
        const uploadResult = await uploadFile(
          uploadBuffer,
          filename,
          'image/png',
          storageFolder
        );
        publicUrl = uploadResult.url;
        storageKey = uploadResult.key;
        console.log(`✅ Image saved to R2: ${publicUrl}`);
      } catch (uploadError) {
        console.error('❌ Error uploading to R2:', uploadError);
        throw new Error(
          `Failed to upload image to storage: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
        );
      }

      return {
        taskId: crypto.randomUUID(),
        status: 'completed',
        resultUrl: publicUrl,
        seed: seed,
        processingTime: Date.now(),
        provider: 'SiliconFlow',
        model: model,
        storageKey,
        sizeBytes: imageBuffer?.byteLength,
      };
    } catch (error) {
      console.error('SiliconFlow image-to-image error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image-to-image generation failed: ${errorMessage}`);
    }
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
    console.log(
      '✅ Using SiliconFlow image editing API for product shot generation'
    );

    try {
      // 在Node.js环境中使用form-data包
      const FormDataNode = (await import('form-data')).default;
      const formData = new FormDataNode();

      // 将base64转换为Buffer
      const imageBuffer = Buffer.from(params.image_input, 'base64');

      // 添加图像数据
      formData.append('image', imageBuffer, {
        filename: 'product.png',
        contentType: 'image/png',
      });
      formData.append('prompt', params.prompt);

      // 根据API文档，图像编辑支持这些模型
      const model = params.model?.includes('gpt-image-1')
        ? 'gpt-image-1'
        : 'dall-e-2';
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
        hasImage: true,
      });

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // 不设置 Content-Type，让浏览器自动设置multipart边界
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SiliconFlow image edit API 错误:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `SiliconFlow API error: ${response.status} - ${errorText}`
        );
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
            const { uploadFile } = await import('@/storage');

            // 生成文件名
            const timestamp = Date.now();
            const filename = `productshot-${timestamp}.png`;

            console.log('☁️ Uploading to R2 productshots folder...');
            const uploadResult = await uploadFile(
              imageBuffer,
              filename,
              'image/png',
              'productshots' // 保存到 R2 的 productshots 文件夹
            );

            console.log('✅ Image saved to R2:', uploadResult.url);
            finalResultUrl = uploadResult.url; // 使用R2的URL
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
        model: model,
      };
    } catch (error) {
      console.error('SiliconFlow image edit error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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
      model: params.model || 'black-forest-labs/FLUX.1-dev', // 使用 FLUX 模型作为默认
      prompt: params.prompt,
      size: params.size || '1024x1024',
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
      size: requestBody.size,
    });

    try {
      const response = await this.fetchWithTimeoutRetry(
        `${this.baseUrl}/images/generations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        this.requestTimeoutMs,
        1
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SiliconFlow API 详细错误:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `SiliconFlow API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      console.log('✅ SiliconFlow API response:', {
        hasData: !!data,
        dataKeys: Object.keys(data || {}),
        images: data.images
          ? `${data.images.length} images`
          : 'no images array',
        data_array: data.data
          ? `${data.data.length} data items`
          : 'no data array',
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
            const { uploadFile } = await import('@/storage');

            // 生成文件名
            const timestamp = Date.now();
            const filename = `productshot-${timestamp}.png`;

            console.log('☁️ Uploading to R2 productshots folder...');
            const uploadResult = await uploadFile(
              imageBuffer,
              filename,
              'image/png',
              'productshots' // 保存到 R2 的 productshots 文件夹
            );

            console.log('✅ Image saved to R2:', uploadResult.url);
            finalResultUrl = uploadResult.url; // 使用R2的URL
            return {
              taskId: `sf_${Date.now()}`,
              status: 'completed',
              resultUrl: finalResultUrl,
              seed: data.seed,
              processingTime: data.timings?.inference,
              provider: 'siliconflow',
              model: requestBody.model,
              storageKey: uploadResult.key,
              sizeBytes: imageBuffer.byteLength,
            };
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
        model: requestBody.model,
      };
    } catch (error) {
      console.error('SiliconFlow generation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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
      quality: 'hd',
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
      'marketing ready image',
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
      'lifestyle-casual':
        'in natural lifestyle environment with casual styling',
      'outdoor-adventure': 'in dynamic outdoor adventure setting',
      'elegant-evening': 'in sophisticated elegant evening environment',
      'street-style': 'in modern urban street style setting',
      'minimalist-clean': 'in minimalist clean professional environment',
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
      'black-forest-labs/FLUX-1.1-pro-Ultra': 35,
    };

    const qualityMultiplier = quality === 'hd' ? 1.5 : 1.0;
    return Math.ceil((baseCosts[model] || 20) * qualityMultiplier);
  }
}

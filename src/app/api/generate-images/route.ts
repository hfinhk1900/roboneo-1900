import type { GenerateImageRequest } from '@/ai/image/lib/api-types';
import type { ProviderKey } from '@/ai/image/lib/provider-config';
import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { createFal } from '@ai-sdk/fal';
import { fireworks } from '@ai-sdk/fireworks';
import { openai } from '@ai-sdk/openai';
import { replicate } from '@ai-sdk/replicate';
import {
  type ImageModel,
  experimental_generateImage as generateImage,
} from 'ai';

import { enforceSameOriginCsrf } from '@/lib/csrf';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Intended to be slightly less than the maximum execution time allowed by the
 * runtime so that we can gracefully terminate our request.
 */
const TIMEOUT_MILLIS = 55 * 1000;

const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_ASPECT_RATIO = '1:1';

const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

const siliconflowProvider = new SiliconFlowProvider(
  process.env.SILICONFLOW_API_KEY!
);

interface ProviderConfig {
  createImageModel: (modelId: string) => ImageModel;
  dimensionFormat: 'size' | 'aspectRatio';
}

const providerConfig: Record<ProviderKey, ProviderConfig> = {
  openai: {
    createImageModel: openai.image,
    dimensionFormat: 'size',
  },
  fireworks: {
    createImageModel: fireworks.image,
    dimensionFormat: 'aspectRatio',
  },
  replicate: {
    createImageModel: replicate.image,
    dimensionFormat: 'size',
  },
  fal: {
    createImageModel: fal.image,
    dimensionFormat: 'size',
  },
  siliconflow: {
    createImageModel: (modelId: string) => ({
      provider: 'siliconflow',
      modelId,
      specificationVersion: 'v1',
      maxImagesPerCall: 1,
      async doGenerate(options: any) {
        const result = await siliconflowProvider.generateProductShot({
          ...options,
          model: modelId,
        });
        if (result.error) {
          throw new Error(result.error);
        }
        // 需要将 ProductShotResult 转换为 ImageModelV1FinishReason
        // 这里简化处理，假设 resultUrl 存在即为成功
        return {
          finishReason: 'success',
          image: result.resultUrl!,
        };
      },
    }),
    dimensionFormat: 'size',
  },
  // Laozhang 使用自定义实现，暂时不在此配置
  laozhang: {
    createImageModel: openai.image, // 临时使用 OpenAI 作为备选
    dimensionFormat: 'size',
  },
};

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMillis: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMillis)
    ),
  ]);
};

export async function POST(req: NextRequest) {
  const csrf = enforceSameOriginCsrf(req);
  if (csrf) return csrf;
  const requestId = Math.random().toString(36).substring(7);
  const {
    prompt,
    provider,
    modelId,
    quality = 'auto',
    outputFormat = 'webp',
    outputCompression,
    background,
    size,
    // 新增：图片编辑相关参数
    inputImage,
    editType = 'generate', // 'generate' | 'edit' | 'variation'
  } = (await req.json()) as GenerateImageRequest & {
    inputImage?: string; // base64 图片数据
    editType?: 'generate' | 'edit' | 'variation';
  };

  try {
    if (!prompt || !provider || !modelId || !providerConfig[provider]) {
      const error = 'Invalid request parameters';
      console.error(`${error} [requestId=${requestId}]`);
      return NextResponse.json({ error }, { status: 400 });
    }

    const config = providerConfig[provider];
    const startstamp = performance.now();

    // 构建图像生成参数
    const generateParams: any = {
      model: config.createImageModel(modelId),
      prompt,
      ...(config.dimensionFormat === 'size'
        ? { size: size || DEFAULT_IMAGE_SIZE }
        : { aspectRatio: DEFAULT_ASPECT_RATIO }),
      ...(provider !== 'openai' && {
        seed: Math.floor(Math.random() * 1000000),
      }),
    };

    // 为 OpenAI gpt-image-1 模型添加特殊参数支持
    if (provider === 'openai' && modelId === 'gpt-image-1') {
      generateParams.providerOptions = {
        openai: {
          quality,
          ...(outputFormat && { output_format: outputFormat }),
          ...(outputCompression && { output_compression: outputCompression }),
          ...(background === 'transparent' && { background: 'transparent' }),
          // 图片编辑功能
          ...(inputImage &&
            editType === 'edit' && {
              image: inputImage, // base64 图片
              mask: undefined, // 可以添加遮罩支持
            }),
          ...(inputImage &&
            editType === 'variation' && {
              image: inputImage,
              n: 1,
            }),
        },
      };
    } else {
      // 其他提供商的配置
      generateParams.providerOptions = {
        vertex: { addWatermark: false },
      };
    }

    // 如果是图片编辑模式，调整API调用方式
    let generatePromise;

    if (provider === 'openai' && inputImage && editType !== 'generate') {
      // 使用 OpenAI 的图片编辑功能
      console.log(
        `Image editing request [editType=${editType}, provider=${provider}, model=${modelId}]`
      );

      try {
        // 直接调用 OpenAI API 进行图片编辑
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/images/edits',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: inputImage,
              prompt: prompt,
              n: 1,
              size: size || '1024x1024',
              response_format: 'b64_json',
              ...(quality && quality !== 'auto' && { quality }),
            }),
          }
        );

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const imageBase64 = openaiData.data[0]?.b64_json;

        if (!imageBase64) {
          throw new Error('No image data received from OpenAI');
        }

        generatePromise = Promise.resolve({
          image: { base64: imageBase64 },
          warnings: [],
        });
      } catch (error) {
        console.error('OpenAI direct API call failed:', error);
        // 降级到常规生成
        generatePromise = generateImage(generateParams);
      }
    } else {
      // 常规图片生成
      generatePromise = generateImage(generateParams);
    }

    const finalResult = await withTimeout(
      generatePromise.then(({ image, warnings }) => {
        if (warnings?.length > 0) {
          console.warn(
            `Warnings [requestId=${requestId}, provider=${provider}, model=${modelId}]: `,
            warnings
          );
        }
        console.log(
          `Completed image request [requestId=${requestId}, provider=${provider}, model=${modelId}, elapsed=${(
            (performance.now() - startstamp) / 1000
          ).toFixed(1)}s].`
        );

        // 解析图像尺寸（从生成的参数中获取）
        const [width, height] = (size || DEFAULT_IMAGE_SIZE)
          .split('x')
          .map(Number);

        return {
          provider,
          image: image.base64,
          width: width || 1024,
          height: height || 1024,
          format: outputFormat || 'webp',
          editType: editType || 'generate',
        };
      }),
      TIMEOUT_MILLIS
    );

    return NextResponse.json(finalResult, {
      status: 'image' in finalResult ? 200 : 500,
    });
  } catch (error) {
    // Log full error detail on the server, but return a generic error message
    // to avoid leaking any sensitive information to the client.
    console.error(
      `Error generating image [requestId=${requestId}, provider=${provider}, model=${modelId}]: `,
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to generate image. Please try again later.',
      },
      { status: 500 }
    );
  }
}

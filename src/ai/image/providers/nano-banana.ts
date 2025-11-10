import crypto from 'node:crypto';
import { Agent } from 'undici';

interface GenerateParams {
  imageBase64: string;
  prompt: string;
  aspectRatio?: string;
  negativePrompt?: string;
  watermarkText?: string;
  seed?: number;
  storageFolder?: string;
  sourceFolder?: string;
  referenceImageBase64?: string;
  sourceUploadUrl?: string | null;
}

interface GenerateResult {
  resultUrl: string;
  storageKey?: string;
  sizeBytes?: number;
  provider: string;
  model: string;
}

type NanoBananaTaskCreateResponse = {
  code?: number;
  message?: string;
  msg?: string;
  data?: { taskId?: string };
};

/**
 * Provider wrapper for Gemini Nano Banana (https://kie.ai/nano-banana)
 * Using Kie.ai's job-based API with task creation and polling
 */
export class NanoBananaProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly model: string;
  private readonly requiresImageUrl: boolean;
  private readonly inlineImageLimitBytes: number;
  private readonly agent?: Agent;

  constructor(apiKey: string, baseUrl?: string, timeoutMs?: number) {
    this.apiKey = apiKey;
    // Use Kie.ai's job-based API endpoint
    this.baseUrl =
      baseUrl?.replace(/\/$/, '') ||
      process.env.NANO_BANANA_BASE_URL ||
      'https://api.kie.ai';
    this.timeoutMs =
      timeoutMs ?? Number(process.env.NANO_BANANA_TIMEOUT_MS || 60000);
    this.pollIntervalMs = Number(
      process.env.NANO_BANANA_POLL_INTERVAL_MS || 5000
    );
    this.model =
      process.env.NANO_BANANA_MODEL?.trim() || 'google/nano-banana-edit';
    this.requiresImageUrl = this.model.includes('nano-banana-edit');
    this.inlineImageLimitBytes = Number(
      process.env.NANO_BANANA_INLINE_IMAGE_LIMIT_BYTES || 15000
    );

    if (process.env.NANO_BANANA_INSECURE_TLS === 'true') {
      this.agent = new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      });
      console.warn(
        '[Nano Banana] TLS verification disabled via NANO_BANANA_INSECURE_TLS'
      );
    }
  }

  private sanitizeBase64(input: string): string {
    if (input.startsWith('data:')) {
      return input;
    }
    return `data:image/png;base64,${input}`;
  }

  private stripBase64Prefix(input: string): string {
    const commaIndex = input.indexOf(',');
    if (commaIndex >= 0) {
      return input.slice(commaIndex + 1);
    }
    return input;
  }

  private withAgent(init?: RequestInit): RequestInit {
    if (!this.agent) {
      return init ?? {};
    }
    return { ...(init ?? {}), dispatcher: this.agent } as RequestInit;
  }

  private async prepareImageInput(
    imageBase64: string,
    options: {
      forceUpload?: boolean;
      sourceFolder?: string;
      existingUrl?: string | null;
    } = {}
  ): Promise<{
    inline?: { image_base64: string; image_data_url: string };
    imageUrl?: string;
  }> {
    const { forceUpload = false, sourceFolder, existingUrl } = options;

    if (existingUrl) {
      return { imageUrl: existingUrl };
    }

    const sanitized = this.sanitizeBase64(imageBase64);
    const rawBase64 = this.stripBase64Prefix(sanitized);

    let buffer: Buffer;
    try {
      buffer = Buffer.from(rawBase64, 'base64');
    } catch (err) {
      console.error('[Nano Banana] Failed to decode base64 image:', err);
      throw new Error('Invalid image data provided');
    }

    if (!forceUpload && buffer.byteLength <= this.inlineImageLimitBytes) {
      return {
        inline: {
          image_base64: rawBase64,
          image_data_url: sanitized,
        },
      };
    }

    try {
      const filename = `${crypto.randomUUID()}.png`;
      const storageFolder =
        sourceFolder?.replace(/\/$/, '') ||
        process.env.NANO_BANANA_SOURCE_FOLDER ||
        'all-generated-images/scream-ai/source';
      const { uploadFile } = await import('@/storage');
      const uploadResult = await uploadFile(
        buffer,
        filename,
        'image/png',
        storageFolder
      );

      return { imageUrl: uploadResult.url };
    } catch (err) {
      console.error(
        '[Nano Banana] Failed to upload source image for external processing:',
        err
      );
      throw new Error('Failed to upload source image');
    }
  }

  public async generateImage(params: GenerateParams): Promise<GenerateResult> {
    const startTime = Date.now();
    const timeoutMs = this.timeoutMs;

    try {
      // Step 1: Create generation task
      const taskId = await this.createGenerationTask(params);
      console.log(`[Nano Banana] Task created: ${taskId}`);

      // Step 2: Poll for completion
      const result = await this.pollForCompletion(
        taskId,
        startTime,
        timeoutMs,
        params
      );
      console.log(`[Nano Banana] Task completed: ${taskId}`);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Nano Banana generation failed: ${message}`);
    }
  }

  private async createGenerationTask(params: GenerateParams): Promise<string> {
    const inputPayload: Record<string, unknown> = {
      prompt: params.prompt,
      image_size: params.aspectRatio || '1:1',
      output_format: 'png',
    };

    if (params.negativePrompt) {
      inputPayload.negative_prompt = params.negativePrompt;
    }

    if (typeof params.seed === 'number') {
      inputPayload.seed = params.seed;
    }

    if (params.imageBase64) {
      const imageInput = await this.prepareImageInput(params.imageBase64, {
        forceUpload: this.requiresImageUrl,
        sourceFolder: params.sourceFolder,
        existingUrl: params.sourceUploadUrl,
      });

      if (this.requiresImageUrl) {
        if (!imageInput.imageUrl) {
          throw new Error('Failed to prepare image URL for edit request');
        }
        inputPayload.image_urls = [imageInput.imageUrl];
        inputPayload.num_images = 1;
        if (params.referenceImageBase64) {
          try {
            const referenceInput = await this.prepareImageInput(
              params.referenceImageBase64,
              { forceUpload: true, sourceFolder: params.sourceFolder }
            );
            if (referenceInput.imageUrl) {
              inputPayload.reference_image_url = referenceInput.imageUrl;
            } else if (referenceInput.inline) {
              inputPayload.reference_image_base64 =
                referenceInput.inline.image_base64;
              inputPayload.reference_image_data_url =
                referenceInput.inline.image_data_url;
            }
          } catch (err) {
            console.warn(
              '[Nano Banana] Failed to prepare reference image, continuing without it:',
              err
            );
          }
        }
      } else if (imageInput.inline) {
        inputPayload.image_base64 = imageInput.inline.image_base64;
        inputPayload.image_data_url = imageInput.inline.image_data_url;
        if (params.referenceImageBase64) {
          try {
            const referenceInput = await this.prepareImageInput(
              params.referenceImageBase64,
              { forceUpload: false, sourceFolder: params.sourceFolder }
            );
            if (referenceInput.inline) {
              inputPayload.reference_image_base64 =
                referenceInput.inline.image_base64;
              inputPayload.reference_image_data_url =
                referenceInput.inline.image_data_url;
            } else if (referenceInput.imageUrl) {
              inputPayload.reference_image_url = referenceInput.imageUrl;
            }
          } catch (err) {
            console.warn(
              '[Nano Banana] Failed to inline reference image, continuing without it:',
              err
            );
          }
        }
      } else if (imageInput.imageUrl) {
        inputPayload.image_url = imageInput.imageUrl;
      }
    }

    const payload = {
      model: this.model,
      input: inputPayload,
    };

    const response = await fetch(
      `${this.baseUrl}/api/v1/jobs/createTask`,
      this.withAgent({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    );

    let bodyText: string | null = null;
    let data: NanoBananaTaskCreateResponse | null = null;
    try {
      bodyText = await response.text();
      data = bodyText
        ? (JSON.parse(bodyText) as NanoBananaTaskCreateResponse)
        : null;
    } catch (err) {
      console.warn(
        '[Nano Banana] Failed to parse task creation response:',
        err
      );
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.msg ||
        bodyText ||
        `Task creation failed (${response.status})`;
      throw new Error(message);
    }

    if (!data) {
      throw new Error('Task creation failed: empty response body');
    }

    if (data.code !== 200) {
      throw new Error(
        `Task creation error: ${
          data.message || data.msg || `code ${data.code}`
        }`
      );
    }

    const taskId = data.data?.taskId;
    if (!taskId) {
      throw new Error('No taskId returned from task creation');
    }

    return taskId;
  }

  private async pollForCompletion(
    taskId: string,
    startTime: number,
    timeoutMs: number,
    params: GenerateParams
  ): Promise<GenerateResult> {
    while (Date.now() - startTime < timeoutMs) {
      const response = await fetch(
        `${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${taskId}`,
        this.withAgent({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to query task status (${response.status})`);
      }

      const data = (await response.json()) as {
        code?: number;
        message?: string;
        data?: {
          state?: string;
          resultJson?: string;
          failMsg?: string;
        };
      };

      if (data.code !== 200) {
        throw new Error(`Query error: ${data.message || 'Unknown error'}`);
      }

      const taskData = data.data;
      if (!taskData) {
        throw new Error('No task data in response');
      }

      const state = taskData.state;

      if (state === 'success') {
        return this.parseTaskResult(taskData.resultJson, params);
      }

      if (state === 'fail') {
        throw new Error(`Task failed: ${taskData.failMsg || 'Unknown error'}`);
      }

      // Still processing, wait and retry
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }

    throw new Error(`Task timeout: not completed within ${timeoutMs}ms`);
  }

  private async parseTaskResult(
    resultJsonStr: string | undefined,
    params: GenerateParams
  ): Promise<GenerateResult> {
    if (!resultJsonStr) {
      throw new Error('No resultJson in task response');
    }

    let resultJson: {
      resultUrls?: string[];
      urls?: string[];
      [key: string]: unknown;
    };
    try {
      resultJson = JSON.parse(resultJsonStr) as {
        resultUrls?: string[];
        urls?: string[];
        [key: string]: unknown;
      };
    } catch (err) {
      throw new Error(`Failed to parse resultJson: ${err}`);
    }

    const imageUrls = resultJson.resultUrls || resultJson.urls || [];
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No image URLs in task result');
    }

    const imageUrl = imageUrls[0];

    // Download the generated image
    const imageRes = await fetch(imageUrl, this.withAgent());
    if (!imageRes.ok) {
      throw new Error(
        `Failed to download generated image: ${imageRes.status} ${imageRes.statusText}`
      );
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    let uploadBuffer: Buffer = Buffer.from(arrayBuffer);

    if (params.watermarkText) {
      try {
        const { applyCornerWatermark } = await import('@/lib/watermark');
        uploadBuffer = await applyCornerWatermark(
          uploadBuffer,
          params.watermarkText,
          {
            widthRatio: 0.24,
            margin: 24,
            opacity: 0.9,
          }
        );
      } catch (err) {
        console.warn(
          '[Nano Banana] Failed to apply watermark to generated image:',
          err
        );
      }
    }

    // Upload to storage
    const filename = `${crypto.randomUUID()}.png`;
    const storageFolder =
      params.storageFolder?.replace(/\/$/, '') ||
      'all-generated-images/scream-ai';

    const { uploadFile } = await import('@/storage');
    const uploadResult = await uploadFile(
      uploadBuffer,
      filename,
      'image/png',
      storageFolder
    );

    return {
      resultUrl: uploadResult.url,
      storageKey: uploadResult.key,
      sizeBytes: uploadBuffer.byteLength,
      provider: 'nano-banana',
      model: this.model,
    };
  }
}

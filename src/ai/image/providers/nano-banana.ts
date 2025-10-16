import crypto from 'node:crypto';

interface GenerateParams {
  imageBase64: string;
  prompt: string;
  aspectRatio?: string;
  negativePrompt?: string;
  watermarkText?: string;
}

interface GenerateResult {
  resultUrl: string;
  storageKey?: string;
  sizeBytes?: number;
  provider: string;
  model: string;
}

/**
 * Provider wrapper for Gemini Nano Banana (https://kie.ai/nano-banana)
 */
export class NanoBananaProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, baseUrl?: string, timeoutMs?: number) {
    this.apiKey = apiKey;
    this.baseUrl =
      baseUrl?.replace(/\/$/, '') ||
      process.env.NANO_BANANA_BASE_URL ||
      'https://api.kie.ai/nano-banana';
    this.timeoutMs =
      timeoutMs ?? Number(process.env.NANO_BANANA_TIMEOUT_MS || 60000);
  }

  private sanitizeBase64(input: string): string {
    if (input.startsWith('data:')) {
      return input;
    }
    return `data:image/png;base64,${input}`;
  }

  public async generateImage(params: GenerateParams): Promise<GenerateResult> {
    const controller = AbortController.prototype.hasOwnProperty('abort')
      ? new AbortController()
      : undefined;

    const timeout = setTimeout(() => {
      controller?.abort();
    }, this.timeoutMs);

    try {
      const payload = {
        model: process.env.NANO_BANANA_MODEL || 'gemini-nano-banana-latest',
        prompt: params.prompt,
        image_base64: this.sanitizeBase64(params.imageBase64),
        aspect_ratio: params.aspectRatio || '1:1',
        negative_prompt:
          params.negativePrompt ||
          'No gender changes, no makeup, no jewelry, no gore, no violence, no weapons, no anatomy distortions.',
      };

      const response = await fetch(`${this.baseUrl}/v1/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller?.signal,
      });

      if (!response.ok) {
        let message = `Nano Banana API error (${response.status})`;
        try {
          const body = await response.text();
          if (body) {
            message += `: ${body}`;
          }
        } catch (err) {
          console.error('Failed to parse Nano Banana error body:', err);
        }
        throw new Error(message);
      }

      const data = (await response.json()) as {
        image_url?: string;
        image_base64?: string;
        id?: string;
        model?: string;
      };

      if (!data.image_url && !data.image_base64) {
        throw new Error('Nano Banana response missing image data');
      }

      let originalBuffer: Buffer;
      if (data.image_base64) {
        const cleaned = data.image_base64.includes(',')
          ? data.image_base64.split(',')[1]
          : data.image_base64;
        originalBuffer = Buffer.from(cleaned, 'base64');
      } else {
        const imageRes = await fetch(String(data.image_url));
        if (!imageRes.ok) {
          throw new Error(
            `Failed to download generated image: ${imageRes.status} ${imageRes.statusText}`
          );
        }
        const arrayBuffer = await imageRes.arrayBuffer();
        originalBuffer = Buffer.from(arrayBuffer);
      }

      let uploadBuffer = originalBuffer;
      if (params.watermarkText) {
        try {
          const { applyCornerWatermark } = await import('@/lib/watermark');
          uploadBuffer = (await applyCornerWatermark(
            originalBuffer,
            params.watermarkText,
            {
              widthRatio: 0.26,
              margin: 32,
              opacity: 0.9,
            }
          )) as Buffer;
        } catch (err) {
          console.warn(
            'Failed to apply watermark, falling back to original buffer:',
            err
          );
          uploadBuffer = originalBuffer;
        }
      }

      const filename = `${crypto.randomUUID()}.png`;
      const storageFolder = 'all-generated-images/scream-ai';

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
        model: data.model || payload.model,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

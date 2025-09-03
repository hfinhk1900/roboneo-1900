/**
 * Production-grade Sticker API - based on OpenAI best practices
 * Endpoint: /api/image-to-sticker
 *
 * Tech Stack:
 * - GPT Image 1 (DALL-E 3): High-quality style transfer with built-in safety moderation
 * - R2 Storage: For persisting generated images
 * - Sharp: For server-side image pre-processing
 */

import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import {
  generateAssetId,
  generateSignedDownloadUrl,
} from '@/lib/asset-management';
import { OPENAI_IMAGE_CONFIG, validateImageFile } from '@/lib/image-validation';
import { getLocalTimestr } from '@/lib/time-utils';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { ensureProductionEnv } from '@/lib/config/validate-env';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import {
  getIdempotencyEntry,
  makeIdempotencyKey,
  setPending,
  setSuccess,
  clearKey,
} from '@/lib/idempotency';

// Style configurations mapping user request to a high-quality, direct-use prompt
export const STYLE_CONFIGS = {
  ios: {
    name: 'iOS Sticker',
    userPrompt:
      "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people's body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove all background completely, making it fully transparent. Include only the full figures with no background elements, ensuring the final image looks like an official iOS emoji sticker with transparent background.",
    imageUrl: '/styles/ios.png',
  },
  pixel: {
    name: 'Pixel Art',
    userPrompt:
      'Learn the Pixel Art style and transform objects in the photo into sticker avatars in this style. Mimic the body shape, face shape, skin tone, facial features and expressions. Keep the facial decorations, hairstyle and hair accessories, clothing, accessories, expressions, and poses consistent with the original image. Remove background and include only the complete figure, ensuring the final image looks like a character in Pixel Art style.',
    imageUrl: '/styles/pixel.png',
  },
  lego: {
    name: 'LEGO',
    userPrompt:
      'Learn the LEGO Minifigure style and turn the people in the photo into sticker avatars in this style. Mimic the body shape, face shape, skin tone, facial features and expressions. Keep the facial decorations, hairstyle and hair accessories, clothing, accessories, expressions, and poses consistent with the original image. Remove background and include only the complete figure, ensuring the final image looks like a character in LEGO Minifigure style.',
    imageUrl: '/styles/lego.png',
  },
  snoopy: {
    name: 'Snoopy',
    userPrompt:
      "Learn the Peanuts comic strip style and turn the person in the photo into a sticker avatar in that style. Recreate the person's body shape, face shape, skin tone, facial features, and expression. Keep all the details in the image—facial accessories, hairstyle and hair accessories, clothing, other accessories, facial expression, and pose—the same. Remove background and include only the full figure to ensure the final image looks like an official Peanuts-style character.",
    imageUrl: '/styles/snoopy.png',
  },
};

type StickerStyle = keyof typeof STYLE_CONFIGS;

/**
 * Pre-processes an image to be a square RGBA PNG compatible with OpenAI
 */
async function preprocessToSquareRGBA(inputBuffer: Buffer): Promise<{
  processedBuffer: Buffer;
  base64Data: string;
  metadata: {
    originalSize: { width: number; height: number };
    finalSize: { width: number; height: number };
    format: string;
  };
} | null> {
  try {
    const sharp = (await import('sharp')).default;
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const targetSize = 1024;

    console.log('📊 Original image:', {
      format: metadata.format,
      size: `${metadata.width}x${metadata.height}`,
      fileSize: `${Math.round(inputBuffer.length / 1024)}KB`,
    });

    const processedImage = image
      .resize(targetSize, targetSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        compressionLevel: 6,
        adaptiveFiltering: true,
        force: true,
      });

    const finalBuffer = await (metadata.hasAlpha
      ? processedImage
      : processedImage.ensureAlpha()
    ).toBuffer();

    if (finalBuffer.length > 4 * 1024 * 1024) {
      throw new Error('Image is too large after processing (> 4MB)');
    }

    console.log('✅ Preprocessing complete:', {
      finalSize: `${targetSize}x${targetSize}`,
      fileSize: `${Math.round(finalBuffer.length / 1024)}KB`,
    });

    return {
      processedBuffer: finalBuffer,
      base64Data: `data:image/png;base64,${finalBuffer.toString('base64')}`,
      metadata: {
        originalSize: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
        finalSize: { width: targetSize, height: targetSize },
        format: metadata.format || 'unknown',
      },
    };
  } catch (error) {
    console.error('❌ Preprocessing failed:', error);
    return null;
  }
}

/**
 * Core style transfer using GPT Image 1
 */
async function gptStyleTransfer(
  base64Data: string,
  prompt: string,
  apiKey: string
): Promise<string | null> {
  try {
    console.log('🎨 Calling GPT Image 1 for style transfer...');
    const formData = new FormData();
    const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
    formData.append(
      'image',
      new Blob([imageBuffer], { type: 'image/png' }),
      'image.png'
    );
    formData.append('prompt', prompt);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('quality', 'medium'); // Medium quality for balanced performance and cost
    formData.append('background', 'transparent'); // Ensure transparent background

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GPT Image 1 API failed:', errorText);
      return null;
    }

    const data = await response.json();
    const stickerBase64 = data.data?.[0]?.b64_json;

    if (!stickerBase64) {
      console.error('❌ No sticker b64_json data received.');
      console.error('Full OpenAI response:', JSON.stringify(data, null, 2));
      return null;
    }

    console.log('✅ GPT Image 1 generation successful.');
    return stickerBase64;
  } catch (error) {
    console.error('❌ GPT Image 1 exception:', error);
    return null;
  }
}

/**
 * Main API handler
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    ensureProductionEnv();
    const csrf = enforceSameOriginCsrf(req);
    if (csrf) return csrf;
    console.log('🚀 Starting sticker generation...');

    // Development mode: return mock response to avoid API calls and authentication
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.MOCK_API === 'true'
    ) {
      console.log('🧪 Development mode: returning mock sticker response');
      const formData = await req.formData();
      const style = (formData.get('style') as string) || 'ios';

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Return a local test image URL
      const mockImageUrl = '/debug-output/test_snoopy_1754371168455.png';

      return NextResponse.json({
        url: mockImageUrl,
        style: style,
        processTime: '2.0s',
        mock: true,
      });
    }

    // 1. Check user authentication and credits
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limit per user
    {
      const { generatePerUserPerMin } = getRateLimitConfig();
      const rl = await checkRateLimit(`rl:sticker:${session.user.id}`, generatePerUserPerMin, 60);
      if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    // Idempotency-Key (best-effort) & Pre-deduct credits (skip in mock mode)
    const idemKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
    let idStoreKey: string | null = null;
    if (idemKey) {
      const userId = session.user.id;
      idStoreKey = makeIdempotencyKey('sticker_generate', userId, idemKey);
      const entry = getIdempotencyEntry(idStoreKey);
      if (entry?.status === 'success') {
        return NextResponse.json(entry.response);
      }
      if (entry?.status === 'pending') {
        return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
      }
      setPending(idStoreKey);
    }

    // Pre-deduct credits (skip in mock mode)
    let preDeducted = false;
    let remainingAfterDeduct: number | undefined = undefined;
    const isMock =
      process.env.NODE_ENV === 'development' && process.env.MOCK_API === 'true';
    if (!isMock) {
      const { deductCreditsAction } = await import('@/actions/credits-actions');
      const deduct = await deductCreditsAction({
        userId: session.user.id,
        amount: CREDITS_PER_IMAGE,
      });
      if (!deduct?.data?.success) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: CREDITS_PER_IMAGE,
            current: deduct?.data?.data?.currentCredits ?? 0,
          },
          { status: 402 }
        );
      }
      preDeducted = true;
      remainingAfterDeduct = deduct?.data?.data?.remainingCredits;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get('imageFile') as File;
    const style = (formData.get('style') as string) || 'ios';

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // ✅ Add file validation
    console.log('🔍 Validating file...');
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      console.log(`❌ File validation failed: ${validation.error}`);
      return NextResponse.json(
        {
          error: validation.error || 'Invalid file format or size',
        },
        { status: 400 }
      );
    }

    // Additional file size check for server-side safety
    if (imageFile.size > OPENAI_IMAGE_CONFIG.maxFileSize) {
      const maxSizeMB = OPENAI_IMAGE_CONFIG.maxFileSize / 1024 / 1024;
      return NextResponse.json(
        {
          error: `File size exceeds the ${maxSizeMB}MB limit`,
        },
        { status: 400 }
      );
    }

    // Check file type
    if (!OPENAI_IMAGE_CONFIG.allowedFileTypes.includes(imageFile.type as any)) {
      return NextResponse.json(
        {
          error: `File type not supported. Please use ${OPENAI_IMAGE_CONFIG.allowedFileTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `✅ File validation passed: ${imageFile.name} (${Math.round(imageFile.size / 1024)}KB, ${imageFile.type})`
    );

    if (!(style in STYLE_CONFIGS)) {
      return NextResponse.json(
        {
          error: `Invalid style. Supported: ${Object.keys(STYLE_CONFIGS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 1. Preprocess Image
    const originalBuffer = Buffer.from(await imageFile.arrayBuffer());
    const preprocessed = await preprocessToSquareRGBA(originalBuffer);
    if (!preprocessed) {
      return NextResponse.json(
        { error: 'Failed to preprocess image' },
        { status: 500 }
      );
    }

    // 2. Get pre-defined high-quality prompt (skips GPT-4o optimization)
    const prompt = STYLE_CONFIGS[style as StickerStyle].userPrompt;
    console.log(`✅ Using direct prompt for style: ${style}`);

    // 3. Style Transfer
    const stickerBase64 = await gptStyleTransfer(
      preprocessed.base64Data,
      prompt,
      apiKey
    );
    if (!stickerBase64) {
      return NextResponse.json(
        { error: 'Failed to generate sticker with GPT Image 1' },
        { status: 500 }
      );
    }

    // 4. Upload to R2 (with optional watermark for free users)
    console.log('☁️ Uploading sticker to R2...');
    const stickerBuffer = Buffer.from(stickerBase64, 'base64');

    // 4.1 Subscription check
    let isSubscribed = false;
    try {
      const { getActiveSubscriptionAction } = await import('@/actions/get-active-subscription');
      const sub = await getActiveSubscriptionAction({ userId: session.user.id });
      isSubscribed = !!sub?.data?.data;
    } catch {}

    let uploadBuffer = stickerBuffer;
    if (!isSubscribed) {
      try {
        const { applyCornerWatermark } = await import('@/lib/watermark');
        uploadBuffer = await applyCornerWatermark(stickerBuffer, 'ROBONEO.ART', {
          fontSizeRatio: 0.05,
          opacity: 0.9,
          margin: 18,
          fill: '#FFFFFF',
          stroke: 'rgba(0,0,0,0.35)',
          strokeWidth: 2,
        });
      } catch (wmError) {
        console.warn('Sticker watermark application failed:', wmError);
      }
    }
    const filename = `${style}-${nanoid()}.png`;
    const uploadResult = await uploadFile(
      uploadBuffer,
      filename,
      'image/png',
      'stickers'
    );
    const r2Url = uploadResult.url;
    const storageKey = uploadResult.key || r2Url;
    console.log(`✅ Upload successful! URL: ${r2Url}`);

    // 5. Already pre-deducted

    // 6. 创建资产记录
    if (!r2Url) {
      throw new Error('Failed to generate image URL');
    }

    const assetId = generateAssetId();
    const fileName = filename;

    // 写入 assets 表
    const db = await getDb();
    await db.insert(assets).values({
      id: assetId,
      key: storageKey,
      filename: fileName,
      content_type: 'image/png',
      size: uploadBuffer.length,
      user_id: session.user.id,
      metadata: JSON.stringify({
        source: 'image-to-sticker',
        style: style,
        original_size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
        created_at: getLocalTimestr(),
        watermarked: !isSubscribed,
      }),
    });

    // 7. 生成签名下载URL
    const downloadUrl = generateSignedDownloadUrl(assetId, 'inline', 3600);

    const elapsed = Date.now() - startTime;
    console.log(
      `🎉 Sticker generation complete! Total time: ${Math.round(elapsed / 1000)}s`
    );

    console.log('✅ Image to Sticker asset created:', {
      asset_id: assetId,
      user_id: session.user.id,
      file_name: fileName,
      expires_at: downloadUrl.expires_at,
    });

    // 8. 返回结果（完全脱敏）
    const payload = {
      success: true,
      asset_id: assetId,
      url: downloadUrl.url, // 前端使用的URL字段
      download_url: downloadUrl.url,
      expires_at: downloadUrl.expires_at,
      style: style,
      size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: remainingAfterDeduct ?? undefined,
      credits_sufficient: true,
      from_cache: false,
    } as const;
    if (typeof idStoreKey === 'string') setSuccess(idStoreKey, payload);
    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      await logAIOperation({
        userId: session.user.id,
        operation: 'sticker',
        mode: style,
        creditsUsed: CREDITS_PER_IMAGE,
        status: 'success',
      });
    } catch {}
    return NextResponse.json(payload);
  } catch (error) {
    console.error('❌ Sticker generation failed:', error);
    // Refund if pre-deducted
    try {
      const isMock =
        process.env.NODE_ENV === 'development' && process.env.MOCK_API === 'true';
      if (!isMock) {
        const { getDb } = await import('@/db');
        const { user, creditsTransaction } = await import('@/db/schema');
        const { eq, sql } = await import('drizzle-orm');
        const db = await getDb();
        const sess = await (await import('@/lib/auth')).auth.api.getSession({
          headers: req.headers as any,
        });
        if (preDeducted && sess?.user?.id) {
          await db
            .update(user)
            .set({
              credits: sql`${user.credits} + ${CREDITS_PER_IMAGE}`,
              updatedAt: new Date(),
            })
            .where(eq(user.id, sess.user.id));
          try {
            const remainingRows = await db
              .select({ credits: user.credits })
              .from(user)
              .where(eq(user.id, sess.user.id))
              .limit(1);
            const remaining = remainingRows[0]?.credits ?? undefined;
            if (typeof remaining === 'number') {
              const { randomUUID } = await import('crypto');
              await db.insert(creditsTransaction).values({
                id: randomUUID(),
                user_id: sess.user.id,
                type: 'refund',
                amount: CREDITS_PER_IMAGE,
                balance_before: remaining - CREDITS_PER_IMAGE,
                balance_after: remaining,
                description: 'AI generation refund (sticker)',
              } as any);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to refund credits after error:', e);
    }

    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      const sess = await (await import('@/lib/auth')).auth.api.getSession({
        headers: req.headers as any,
      });
      if (sess?.user?.id) {
        await logAIOperation({
          userId: sess.user.id,
          operation: 'sticker',
          mode: 'style',
          creditsUsed: CREDITS_PER_IMAGE,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    } catch {}

    if (typeof idStoreKey === 'string') clearKey(idStoreKey);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Production-grade Sticker API',
    version: '2.0.0',
    styles: Object.keys(STYLE_CONFIGS),
  });
}

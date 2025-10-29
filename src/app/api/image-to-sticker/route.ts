/**
 * Production-grade Sticker API - Nano Banana (KIE) integration
 * Endpoint: /api/image-to-sticker
 *
 * Tech Stack:
 * - KIE Nano Banana Edit API: 高质量图像风格化，支持 job 轮询
 * - R2 Storage: For persisting generated images
 * - Sharp: For server-side image pre-processing
*/

import { NanoBananaProvider } from '@/ai/image/providers/nano-banana';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { generateAssetId } from '@/lib/asset-management';
import { buildAssetUrls } from '@/lib/asset-links';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import { ensureProductionEnv } from '@/lib/config/validate-env';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import {
  clearKey,
  getIdempotencyEntry,
  makeIdempotencyKey,
  setPending,
  setSuccess,
} from '@/lib/idempotency';
import { OPENAI_IMAGE_CONFIG, validateImageFile } from '@/lib/image-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { getLocalTimestr } from '@/lib/time-utils';
import { type NextRequest, NextResponse } from 'next/server';
import {
  STICKER_STYLE_CONFIGS,
  type StickerStyle,
} from '@/features/sticker/style-config';

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
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png({
        compressionLevel: 6,
        adaptiveFiltering: true,
        force: true,
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } });

    const finalBuffer = await processedImage.toBuffer();

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
 * Main API handler
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let preDeducted = false;
  let remainingAfterDeduct: number | undefined = undefined;
  let idStoreKey: string | null = null;
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
      const rl = await checkRateLimit(
        `rl:sticker:${session.user.id}`,
        generatePerUserPerMin,
        60
      );
      if (!rl.allowed)
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
    }
    // Idempotency-Key (best-effort) & Pre-deduct credits (skip in mock mode)
    const idemKey =
      req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
    if (idemKey) {
      const userId = session.user.id;
      idStoreKey = makeIdempotencyKey('sticker_generate', userId, idemKey);
      const entry = await getIdempotencyEntry(idStoreKey);
      if (entry?.status === 'success') {
        return NextResponse.json(entry.response);
      }
      if (entry?.status === 'pending') {
        return NextResponse.json(
          { error: 'Duplicate request' },
          { status: 409 }
        );
      }
      await setPending(idStoreKey);
    }

    // Pre-deduct credits (skip in mock mode)
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

    const apiKey = process.env.NANO_BANANA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const imageFile = (formData.get('imageFile') ||
      formData.get('image')) as File | null;
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

    if (!(style in STICKER_STYLE_CONFIGS)) {
      return NextResponse.json(
        {
          error: `Invalid style. Supported: ${Object.keys(STICKER_STYLE_CONFIGS).join(', ')}`,
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
    const prompt = STICKER_STYLE_CONFIGS[style as StickerStyle].userPrompt;
    console.log(`✅ Using direct prompt for style: ${style}`);

    // 3. Determine subscription for watermark handling
    let isSubscribed = false;
    try {
      const { getActiveSubscriptionAction } = await import(
        '@/actions/get-active-subscription'
      );
      const sub = await getActiveSubscriptionAction({
        userId: session.user.id,
      });
      isSubscribed = !!sub?.data?.data;
      console.log(`🔍 Subscription check for user ${session.user.id}:`, {
        hasSubscription: isSubscribed,
        subData: sub?.data?.data ? 'Present' : 'None',
      });
    } catch (subError) {
      console.error('❌ Subscription check failed:', subError);
      // Keep isSubscribed = false as default for safety
    }

    // 4. 调用 Nano Banana (KIE) 生成贴纸
    const provider = new NanoBananaProvider(apiKey);
    console.log('🎨 Sending sticker request to Nano Banana (KIE)...');
    const generation = await provider.generateImage({
      prompt,
      imageBase64: preprocessed.base64Data,
      aspectRatio: '1:1',
      storageFolder: 'all-generated-images/stickers',
      sourceFolder: 'all-uploaded-images/stickers',
      watermarkText: isSubscribed ? undefined : 'ROBONEO.ART',
    });

    if (!generation.resultUrl) {
      return NextResponse.json(
        { error: 'Failed to generate sticker with AI service' },
        { status: 500 }
      );
    }

    console.log('✅ Nano Banana generation complete:', {
      provider: generation.provider,
      model: generation.model,
      storageKey: generation.storageKey,
      sizeBytes: generation.sizeBytes,
    });

    // 5. Already pre-deducted

    // 6. 创建资产记录
    const assetId = generateAssetId();
    const assetKey =
      generation.storageKey ||
      generation.resultUrl.split('/').pop() ||
      `${assetId}.png`;
    const assetFilename = `${assetId}.png`;

    // 写入 assets 表
    const db = await getDb();
    await db.insert(assets).values({
      id: assetId,
      key: assetKey,
      filename: assetFilename,
      content_type: 'image/png',
      size: generation.sizeBytes ?? 0,
      user_id: session.user.id,
      metadata: JSON.stringify({
        source: 'image-to-sticker',
        style,
        original_size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
        created_at: getLocalTimestr(),
        watermarked: !isSubscribed,
        provider: generation.provider,
        model: generation.model,
      }),
    });

    // 7. 生成可用于客户端的访问链接
    const assetLinks = await buildAssetUrls({
      assetId,
      assetKey,
      filename: assetFilename,
      contentType: 'image/png',
      expiresIn: 300,
      displayMode: 'inline',
    });
    const responseUrl = assetLinks.stableUrl;

    const elapsed = Date.now() - startTime;
    console.log(
      `🎉 Sticker generation complete! Total time: ${Math.round(elapsed / 1000)}s`
    );

    console.log('✅ Image to Sticker asset created:', {
      asset_id: assetId,
      user_id: session.user.id,
      storage_key: assetKey,
      result_url: generation.resultUrl,
      file_name: assetFilename,
      expires_at: assetLinks.expiresAt,
    });

    // 8. 返回结果（完全脱敏）
    const payload = {
      success: true,
      data: {
        output_image_url: responseUrl,
        asset_id: assetId,
        expires_at: assetLinks.expiresAt,
        stable_url: assetLinks.stableUrl,
        style,
        size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
        credits_used: CREDITS_PER_IMAGE,
        remaining_credits: remainingAfterDeduct ?? undefined,
      },
      url: responseUrl,
      download_url: assetLinks.signedDownloadUrl,
      stable_url: assetLinks.stableUrl,
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
        process.env.NODE_ENV === 'development' &&
        process.env.MOCK_API === 'true';
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

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    let statusCode = 500;
    let userMessage = errorMessage;

    if (
      errorMessage.includes(
        'Client network socket disconnected before secure TLS connection was established'
      )
    ) {
      statusCode = 503;
      userMessage =
        'Sticker service connection failed. Please verify network/firewall settings or retry shortly.';
    } else if (
      errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.includes('AbortError')
    ) {
      statusCode = 408;
      userMessage = 'Sticker generation timeout. Please try again.';
    }

    return NextResponse.json({ error: userMessage, details: errorMessage }, {
      status: statusCode,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Production-grade Sticker API',
    version: '2.0.0',
    styles: Object.keys(STICKER_STYLE_CONFIGS),
  });
}

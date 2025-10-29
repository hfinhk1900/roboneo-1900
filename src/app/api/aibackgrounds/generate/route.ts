import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getDb } from '@/db';
import { assets, user } from '@/db/schema';
import { generateAssetId } from '@/lib/asset-management';
import { buildAssetUrls } from '@/lib/asset-links';
import {
  decodeBase64Image,
  linkUploadedAsset,
  storeUploadedImage,
  type StoreUploadedImageResult,
} from '@/lib/uploaded-image';
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
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// PRESET_COLORS removed - solid color functionality uses different API (/api/bg/remove-direct)

// AI Background 风格预设
const BACKGROUND_STYLES = {
  'gradient-abstract': {
    name: 'Abstract Gradient',
    prompt:
      'smooth gradient background, modern abstract colors, soft transitions, clean aesthetic, vibrant color blending',
  },
  'texture-fabric': {
    name: 'Fabric Texture',
    prompt:
      'luxurious silk fabric background, smooth golden fabric texture, elegant material draping, soft fabric folds, premium textile surface',
  },
  'nature-blur': {
    name: 'Nature Blur',
    prompt:
      'natural blurred background, bokeh effect, soft focus nature scene, warm ambient light, garden atmosphere',
  },
  'urban-blur': {
    name: 'Urban Blur',
    prompt:
      'blurred urban background, soft city lights, bokeh street scene, modern atmosphere',
  },
  'wood-surface': {
    name: 'Wood Surface',
    prompt:
      'wooden surface background, natural wood grain texture, warm brown tones, table surface, rustic wooden table',
  },
  'marble-stone': {
    name: 'Marble Stone',
    prompt:
      'marble stone background, elegant natural patterns, luxury surface texture, neutral colors, premium marble surface',
  },
  'fabric-cloth': {
    name: 'Soft Fabric',
    prompt:
      'soft fabric background, silk or cotton texture, gentle folds and draping, elegant material',
  },
  'paper-vintage': {
    name: 'Vintage Paper',
    prompt:
      'vintage paper background, aged texture, warm cream tones, subtle aging effects',
  },
  custom: {
    name: 'Custom Background',
    prompt: '', // Will be filled by user input
  },
} as const;

type BackgroundType = keyof typeof BACKGROUND_STYLES;

interface AIBackgroundRequest {
  // Required: Product image (base64 encoded)
  image_input: string;

  // Background mode: only 'background' for AI-generated backgrounds (solid color uses different API)
  backgroundMode: 'background';

  // For background style mode
  backgroundType?: BackgroundType;
  customBackgroundDescription?: string;

  // Optional generation parameters
  quality?: 'standard' | 'hd';
  steps?: number;
  seed?: number;
  guidance_scale?: number;
  size?: string;
  output_format?: 'jpeg' | 'png' | 'webp';
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let backgroundMode: 'background' | undefined;
  let idStoreKey: string | null = null;
  const clientIp = getClientIp(request);
  try {
    ensureProductionEnv();
    const csrf = enforceSameOriginCsrf(request);
    if (csrf) return csrf;
    // 1. 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = session.user.id;

    // Rate limit per user
    {
      const { generatePerUserPerMin } = getRateLimitConfig();
      const rl = await checkRateLimit(
        `rl:aibg:${userId}`,
        generatePerUserPerMin,
        60
      );
      if (!rl.allowed)
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
    }

    // Idempotency-Key support (best-effort, in-memory)
    const idemKey =
      request.headers.get('idempotency-key') ||
      request.headers.get('Idempotency-Key');
    if (idemKey) {
      idStoreKey = makeIdempotencyKey(
        'aibg_generate',
        userId as string,
        idemKey
      );
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
      setPending(idStoreKey);
    }

    // 2. 解析请求参数
    const body: AIBackgroundRequest = await request.json();
    const {
      image_input,
      backgroundType,
      customBackgroundDescription,
      quality = 'standard',
      steps,
      seed,
      guidance_scale,
      size,
      output_format,
    } = body;
    backgroundMode = body.backgroundMode;

    // 3. 验证必需参数
    if (!image_input) {
      return NextResponse.json(
        { error: 'Product image is required' },
        { status: 400 }
      );
    }

    // 3.1 限制 base64 图片大小（近似计算）
    try {
      const base64Part = image_input.includes(',')
        ? image_input.split(',')[1]
        : image_input;
      const approxBytes = Math.floor((base64Part.length * 3) / 4);
      const limit = Number(
        process.env.MAX_GENERATE_IMAGE_BYTES || 5 * 1024 * 1024
      );
      if (approxBytes > limit) {
        return NextResponse.json(
          { error: 'Image too large', limitBytes: limit },
          { status: 413 }
        );
      }
    } catch {}

    let uploadSource: StoreUploadedImageResult | null = null;
    try {
      const decodedUpload = decodeBase64Image(image_input, 'image/png');
      uploadSource = await storeUploadedImage({
        buffer: decodedUpload.buffer,
        contentType: decodedUpload.contentType,
        userId,
        tool: 'ai-backgrounds',
      });
    } catch (error) {
      console.warn('Failed to store uploaded AI background source:', error);
    }

    if (!backgroundMode || backgroundMode !== 'background') {
      return NextResponse.json(
        { error: 'Invalid background mode. Must be "background"' },
        { status: 400 }
      );
    }

    // 验证背景模式参数
    if (!backgroundType) {
      return NextResponse.json(
        { error: 'Background type is required' },
        { status: 400 }
      );
    }

    if (!BACKGROUND_STYLES[backgroundType]) {
      return NextResponse.json(
        { error: 'Invalid background type' },
        { status: 400 }
      );
    }

    if (backgroundType === 'custom' && !customBackgroundDescription?.trim()) {
      return NextResponse.json(
        {
          error:
            'Custom background description is required when using custom background type',
        },
        { status: 400 }
      );
    }

    // 4. 预检查系统配置（在扣费前检查，避免用户被错误扣费）
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('SiliconFlow API key not configured');
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    // 校验存储配置（提前失败，避免扣费后才发现配置问题）
    try {
      const required = [
        'STORAGE_REGION',
        'STORAGE_ENDPOINT',
        'STORAGE_ACCESS_KEY_ID',
        'STORAGE_SECRET_ACCESS_KEY',
        'STORAGE_BUCKET_NAME',
      ];
      const missing = required.filter((k) => !process.env[k]);
      if (missing.length && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Storage not configured', missing },
          { status: 500 }
        );
      }
    } catch {}

    // 5. 预扣费（原子），失败则直接返回402
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deduct = await deductCreditsAction({
      userId,
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

    // 6. 初始化 SiliconFlow 提供商
    const provider = new SiliconFlowProvider(apiKey);

    // 7. 构建提示词 (AI生成背景模式)
    const styleConfig = BACKGROUND_STYLES[backgroundType!];
    console.log(
      `🎯 Using background style: ${backgroundType} (${styleConfig.name})`
    );

    let backgroundPrompt: string;
    if (backgroundType === 'custom' && customBackgroundDescription) {
      backgroundPrompt = customBackgroundDescription;
      console.log('🎨 Using custom background description');
    } else {
      backgroundPrompt = styleConfig.prompt;
      console.log(`🎨 Style: ${styleConfig.name}`);
    }

    let finalPrompt = `replace the background with ${backgroundPrompt}, keep the main subject exactly as it is, create a seamless and natural background integration`;

    // 添加通用质量提升词
    const qualityEnhancements = [
      'high quality image processing',
      'professional photo editing',
      'clean edge detection',
      'maintain object clarity and details',
      'perfect background replacement',
      'commercial quality result',
    ];

    finalPrompt += `, ${qualityEnhancements.join(', ')}`;

    console.log('🤖 AI Background generation prompt:', {
      mode: backgroundMode,
      backgroundType: backgroundType || 'N/A',
      prompt: finalPrompt.substring(0, 100) + '...',
    });

    // 8. 设置生成参数
    const selectedModel = 'black-forest-labs/FLUX.1-Kontext-dev';
    const selectedSteps = steps ?? 30;
    const generationParams = {
      prompt: finalPrompt,
      model: selectedModel,
      size: size || '1024x1024',
      quality,
      steps: selectedSteps,
      seed,
      guidance_scale: guidance_scale || 3.5,
      output_format: output_format || 'png',
      image_input,
    };

    console.log('🚀 Generating AI Background with SiliconFlow:', {
      model: generationParams.model,
      size: generationParams.size,
      quality: generationParams.quality,
      steps: generationParams.steps,
      hasImageInput: !!image_input,
    });

    // 9. 调用 AI 生成 - 使用专门的 aibackgrounds 存储文件夹
    // 订阅检查：未订阅加水印
    let isSubscribed = false;
    try {
      const { getActiveSubscriptionAction } = await import(
        '@/actions/get-active-subscription'
      );
      const sub = await getActiveSubscriptionAction({ userId });
      isSubscribed = !!sub?.data?.data;
    } catch {}

    const result = await provider.generateProductShot({
      ...generationParams,
      storageFolder: 'all-generated-images/ai-backgrounds', // 使用专门的存储文件夹
      watermarkText: isSubscribed ? undefined : 'ROBONEO.ART',
    });

    // 10. 已预扣费，无需再次扣费

    // 11. 创建资产记录
    if (!result.resultUrl) {
      throw new Error('Failed to generate image URL');
    }

    const assetId = generateAssetId();
    const fileName = result.resultUrl.split('/').pop() || 'aibackground.png';

    // 写入 assets 表
    const db = await getDb();
    await db.insert(assets).values({
      id: assetId,
      key: result.storageKey || fileName,
      filename: fileName,
      content_type: 'image/png',
      size: result.sizeBytes || 0,
      user_id: session.user.id,
      metadata: JSON.stringify({
        source: 'aibg',
        mode: backgroundMode,
        backgroundType: backgroundType || null,
        provider: result.provider,
        model: result.model,
        watermarked: !isSubscribed,
        upload_asset_id: uploadSource?.assetId ?? null,
        client_ip: clientIp,
      }),
    });

    if (uploadSource) {
      await linkUploadedAsset(uploadSource.assetId, assetId);
    }

    // 12. 生成访问链接
    const assetLinks = await buildAssetUrls({
      assetId,
      assetKey: result.storageKey || fileName,
      filename: fileName,
      contentType: 'image/png',
      expiresIn: 300,
      displayMode: 'inline',
    });
    const responseUrl = assetLinks.stableUrl;

    console.log('✅ AI Background asset created:', {
      asset_id: assetId,
      user_id: userId,
      file_name: fileName,
      expires_at: assetLinks.expiresAt,
    });

    // Log AI operation success
    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      await logAIOperation({
        userId,
        operation: 'aibg',
        mode: backgroundType || 'style',
        creditsUsed: CREDITS_PER_IMAGE,
        status: 'success',
      });
    } catch {}

    // 13. 返回结果（完全脱敏）
    const payload = {
      success: true,
      asset_id: assetId,
      download_url: assetLinks.signedDownloadUrl,
      public_url: responseUrl,
      stable_url: assetLinks.stableUrl,
      expires_at: assetLinks.expiresAt,
      backgroundMode,
      backgroundType: backgroundType || null,
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deduct?.data?.data?.remainingCredits ?? undefined,
      credits_sufficient: true,
      from_cache: false,
      upload_asset_id: uploadSource?.assetId ?? null,
    } as const;
    if (idStoreKey) setSuccess(idStoreKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('AI Background generation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // 根据错误类型返回不同的HTTP状态码和用户友好的消息
    let statusCode = 500;
    let userMessage = 'Generation failed';

    if (errorMessage.includes('AI service is temporarily unavailable')) {
      statusCode = 503;
      userMessage =
        'AI service is temporarily unavailable, please try again later';
    } else if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('AbortError')
    ) {
      statusCode = 408;
      userMessage = '请求超时，请重试';
    } else if (errorMessage.includes('网络')) {
      statusCode = 503;
      userMessage = '网络连接问题，请检查网络后重试';
    }

    // 失败：回滚预扣费
    try {
      const db = await getDb();
      const updated = await db
        .update(user)
        .set({
          credits: sql`${user.credits} + ${CREDITS_PER_IMAGE}`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId as string));
      try {
        const remainingRows = await db
          .select({ credits: user.credits })
          .from(user)
          .where(eq(user.id, userId as string))
          .limit(1);
        const remaining = remainingRows[0]?.credits ?? undefined;
        if (typeof remaining === 'number') {
          const { creditsTransaction } = await import('@/db/schema');
          const { randomUUID } = await import('crypto');
          await db.insert(creditsTransaction).values({
            id: randomUUID(),
            user_id: userId as string,
            type: 'refund',
            amount: CREDITS_PER_IMAGE,
            balance_before: remaining - CREDITS_PER_IMAGE,
            balance_after: remaining,
            description: 'AI generation refund (aibg)',
          } as any);
        }
      } catch {}
    } catch (e) {
      console.error('Failed to refund credits after error:', e);
    }

    // Log AI operation failure (only if userId is available)
    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      if (userId) {
        await logAIOperation({
          userId,
          operation: 'aibg',
          mode: backgroundMode ?? 'unknown',
          creditsUsed: CREDITS_PER_IMAGE,
          status: 'failed',
          errorMessage: errorMessage,
        });
      }
    } catch {}

    if (typeof idStoreKey === 'string') clearKey(idStoreKey);
    return NextResponse.json(
      {
        error: userMessage,
        details: errorMessage,
        provider: 'SiliconFlow',
        suggestion:
          'If the problem persists, please try again later or contact technical support',
      },
      { status: statusCode }
    );
  }
}

// GET 方法用于获取可用的背景样式
export async function GET() {
  // 获取所有背景样式
  const allStyles = Object.entries(BACKGROUND_STYLES).map(([id, config]) => ({
    id,
    name: config.name,
  }));

  return NextResponse.json({
    backgroundStyles: allStyles,
    // presetColors removed - solid color functionality uses different API (/api/bg/remove-direct)
  });
}

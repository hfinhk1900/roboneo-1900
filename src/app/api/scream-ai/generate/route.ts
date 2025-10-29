import { randomUUID } from 'node:crypto';

import { NanoBananaProvider } from '@/ai/image/providers/nano-banana';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getDb } from '@/db';
import { assets, creditsTransaction, screamAiHistory, user } from '@/db/schema';
import {
  IDENTITY_SUFFIX,
  NEGATIVE_PROMPT,
  SCREAM_PRESET_MAP,
} from '@/features/scream-ai/constants';
import { generateAssetId } from '@/lib/asset-management';
import { buildAssetUrls } from '@/lib/asset-links';
import { auth } from '@/lib/auth';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import { ensureProductionEnv } from '@/lib/config/validate-env';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface GenerateRequestBody {
  image_input: string;
  preset_id: string;
  aspect_ratio?: string;
  custom_prompt?: string;
}

interface GenerateResponse {
  success: boolean;
  asset_id: string;
  view_url: string;
  download_url: string;
  stable_url?: string;
  direct_url?: string | null;
  expires_at: number;
  preset_id: string;
  preset_name: string;
  aspect_ratio: string;
  credits_used: number;
  remaining_credits?: number;
  watermarked: boolean;
}

export async function POST(request: NextRequest) {
  ensureProductionEnv();
  const csrf = enforceSameOriginCsrf(request);
  if (csrf) return csrf;

  let deductSucceeded = false;
  let userIdRef: string | null = null;

  try {
    const { auth: authServer } = await import('@/lib/auth');
    const session = await authServer.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    userIdRef = userId;

    const rateConfig = getRateLimitConfig();
    const rl = await checkRateLimit(
      `rl:scream-ai:${userId}`,
      rateConfig.generatePerUserPerMin,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = (await request.json()) as GenerateRequestBody;
    const { image_input, preset_id, aspect_ratio, custom_prompt } = body;

    if (!image_input) {
      return NextResponse.json(
        { error: 'Image input is required' },
        { status: 400 }
      );
    }
    if (!preset_id) {
      return NextResponse.json(
        { error: 'preset_id is required' },
        { status: 400 }
      );
    }

    const preset = SCREAM_PRESET_MAP.get(preset_id);
    if (!preset) {
      return NextResponse.json({ error: 'Invalid preset_id' }, { status: 400 });
    }

    // Validate size ≤ 10MB
    try {
      const base64Part = image_input.includes(',')
        ? image_input.split(',')[1]
        : image_input;
      const approxBytes = Math.floor((base64Part.length * 3) / 4);
      const limit = 10 * 1024 * 1024;
      if (approxBytes > limit) {
        return NextResponse.json(
          { error: 'Image too large', limitBytes: limit },
          { status: 413 }
        );
      }
    } catch (err) {
      console.warn('Failed to estimate image size for scream-ai:', err);
    }

    // Deduct credits up front
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
    deductSucceeded = true;

    const apiKey = process.env.NANO_BANANA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const provider = new NanoBananaProvider(apiKey);

    // Determine subscription (watermark)
    let isSubscribed = false;
    try {
      const { getActiveSubscriptionAction } = await import(
        '@/actions/get-active-subscription'
      );
      const sub = await getActiveSubscriptionAction({ userId });
      isSubscribed = !!sub?.data?.data;
    } catch (err) {
      console.warn('Failed to determine subscription for scream-ai:', err);
    }

    // Build final prompt with optional custom prompt
    let finalPrompt = preset.prompt.trim();
    if (custom_prompt && custom_prompt.trim().length > 0) {
      finalPrompt = `${finalPrompt}\n\nAdditional details: ${custom_prompt.trim()}`;
    }
    finalPrompt = `${finalPrompt}\n\n${IDENTITY_SUFFIX}`.trim();
    const aspectRatio = aspect_ratio || '1:1';

    const generation = await provider.generateImage({
      prompt: finalPrompt,
      imageBase64: image_input,
      aspectRatio,
      negativePrompt: NEGATIVE_PROMPT,
      watermarkText: isSubscribed ? undefined : 'ROBONEO.ART',
      sourceFolder: 'all-uploaded-images/scream-ai',
    });

    if (!generation.resultUrl) {
      throw new Error('Failed to generate image URL');
    }

    const assetId = generateAssetId();
    const db = await getDb();

    await db.insert(assets).values({
      id: assetId,
      key:
        generation.storageKey ||
        generation.resultUrl.split('/').pop() ||
        `${assetId}.png`,
      filename: `${assetId}.png`,
      content_type: 'image/png',
      size: generation.sizeBytes ?? 0,
      user_id: userId,
      metadata: JSON.stringify({
        source: 'scream-ai',
        presetId: preset.id,
        presetName: preset.name,
        provider: generation.provider,
        model: generation.model,
        aspectRatio,
        watermarked: !isSubscribed,
      }),
    });

    const assetLinks = await buildAssetUrls({
      assetId,
      assetKey:
        generation.storageKey ||
        generation.resultUrl.split('/').pop() ||
        `${assetId}.png`,
      filename: `${assetId}.png`,
      contentType: 'image/png',
      expiresIn: 300,
      displayMode: 'inline',
    });
    const viewUrl = assetLinks.stableUrl;
    const downloadUrl = assetLinks.directUrl ?? assetLinks.signedDownloadUrl;

    await db.insert(screamAiHistory).values({
      id: randomUUID(),
      userId,
      url: viewUrl,
      presetId: preset.id,
      aspectRatio,
      assetId,
      watermarked: !isSubscribed,
      createdAt: new Date(),
    });

    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      await logAIOperation({
        userId,
        operation: 'scream-ai',
        mode: preset.id,
        creditsUsed: CREDITS_PER_IMAGE,
        status: 'success',
      });
    } catch (err) {
      console.warn('Failed to log AI operation (scream-ai):', err);
    }

    const response: GenerateResponse = {
      success: true,
      asset_id: assetId,
      view_url: viewUrl,
      download_url: downloadUrl,
      stable_url: assetLinks.stableUrl,
      direct_url: assetLinks.directUrl,
      expires_at: assetLinks.expiresAt,
      preset_id: preset.id,
      preset_name: preset.name,
      aspect_ratio: aspectRatio,
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deduct?.data?.data?.remainingCredits ?? undefined,
      watermarked: !isSubscribed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scream AI generation error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    let userMessage = 'Generation failed';

    if (message.includes('Unauthorized')) {
      statusCode = 401;
      userMessage = 'Please log in to continue';
    } else if (message.includes('Too many requests')) {
      statusCode = 429;
      userMessage = 'Rate limit exceeded, please retry later';
    } else if (message.includes('temporarily unavailable')) {
      statusCode = 503;
      userMessage = 'AI service temporarily unavailable, try again soon';
    } else if (message.includes('timeout') || message.includes('AbortError')) {
      statusCode = 408;
      userMessage = 'Generation timed out, please retry';
    } else if (message.includes('Image too large')) {
      statusCode = 413;
      userMessage = message;
    }

    if (deductSucceeded && userIdRef) {
      try {
        const db = await getDb();
        await db
          .update(user)
          .set({
            credits: sql`${user.credits} + ${CREDITS_PER_IMAGE}`,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userIdRef));

        try {
          const balanceRows = await db
            .select({ credits: user.credits })
            .from(user)
            .where(eq(user.id, userIdRef))
            .limit(1);
          const remaining = balanceRows[0]?.credits ?? null;
          if (typeof remaining === 'number') {
            await db.insert(creditsTransaction).values({
              id: randomUUID(),
              user_id: userIdRef,
              type: 'refund',
              amount: CREDITS_PER_IMAGE,
              balance_before: remaining - CREDITS_PER_IMAGE,
              balance_after: remaining,
              description: 'AI generation refund (scream-ai)',
              created_at: new Date(),
            } as any);
          }
        } catch (err) {
          console.warn('Failed to record refund transaction:', err);
        }
      } catch (refundError) {
        console.error(
          'Failed to refund credits after scream-ai error:',
          refundError
        );
      }
    }

    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      if (userIdRef) {
        await logAIOperation({
          userId: userIdRef,
          operation: 'scream-ai',
          mode: 'error',
          creditsUsed: 0,
          status: 'failed',
          errorMessage: message,
        });
      }
    } catch (err) {
      console.warn('Failed to log AI operation failure:', err);
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}

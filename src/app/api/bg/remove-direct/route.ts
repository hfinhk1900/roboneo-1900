// src/app/api/bg/remove-direct/route.ts
// Vercel API 路由 - 代理到私有 HF Space

import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getLocalTimestr } from '@/lib/time-utils';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import {
  getIdempotencyEntry,
  makeIdempotencyKey,
  setPending,
  setSuccess,
  clearKey,
} from '@/lib/idempotency';

// 使用全局速率限制工具 '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const csrf = enforceSameOriginCsrf(req);
    if (csrf) return csrf;
    // 速率限制检查（分布式/内存）
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || 'unknown';
    const { bgRemovePerIpPerMin } = getRateLimitConfig();
    const rl = await checkRateLimit(`bg:remove:${ip}`, bgRemovePerIpPerMin, 60);
    if (!rl.allowed) {
      console.warn(`🚫 Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 1. 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      console.warn('🚫 Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // Idempotency-Key support (best-effort)
    const idemKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
    let idStoreKey: string | null = null;
    if (idemKey) {
      idStoreKey = makeIdempotencyKey('bg_remove_direct', userId, idemKey);
      const entry = getIdempotencyEntry(idStoreKey);
      if (entry?.status === 'success') {
        return NextResponse.json(entry.response);
      }
      if (entry?.status === 'pending') {
        return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
      }
      setPending(idStoreKey);
    }

    // Pre-deduct credits (atomic); refund on failure later
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

    console.log('🔄 Proxying request to private HF Space...');

    // 检查环境变量配置
    const HF_SPACE_URL = process.env.HF_SPACE_URL;
    const HF_SPACE_TOKEN = process.env.HF_SPACE_TOKEN;

    if (!HF_SPACE_URL) {
      console.error('❌ HF Space URL configuration missing');
      return NextResponse.json(
        {
          error: 'HF Space configuration missing',
          details:
            'Please configure HF_SPACE_URL in Vercel environment variables',
        },
        { status: 500 }
      );
    }

    // 获取请求数据
    const formData = await req.formData();

    // 记录请求信息（不记录敏感数据）
    const imageData = formData.get('image_data') as string;
    const maxSide = formData.get('max_side') as string;
    const aspectRatio = formData.get('aspect_ratio') as string; // 新增：获取宽高比

    console.log(
      `📤 Processing image, max_side: ${maxSide}, aspect_ratio: ${aspectRatio}`
    );
    console.log(
      `📊 Image data size: ${imageData ? imageData.length : 0} characters`
    );

    // 限制图片大小（基于base64长度的近似计算）
    if (imageData) {
      const base64Part = imageData.includes(',')
        ? imageData.split(',')[1]
        : imageData;
      const approxBytes = Math.floor((base64Part.length * 3) / 4);
      const limit = Number(process.env.MAX_BG_REMOVE_IMAGE_BYTES || 5 * 1024 * 1024); // 5MB 默认
      if (approxBytes > limit) {
        console.warn('🚫 Image too large for bg remove:', {
          approxBytes,
          limit,
        });
        return NextResponse.json(
          { error: 'Image too large', limitBytes: limit },
          { status: 413 }
        );
      }
    }

    // 转发到 HF Space (支持公有和私有)
    const headers: Record<string, string> = {
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
    };

    // 如果配置了 token，则添加 Authorization header (私有空间)
    if (HF_SPACE_TOKEN) {
      headers.Authorization = `Bearer ${HF_SPACE_TOKEN}`;
      console.log('🔐 Using private HF Space with authentication');
    } else {
      console.log('🌐 Using public HF Space without authentication');
    }

    const response = await fetch(`${HF_SPACE_URL}/remove-bg-direct`, {
      method: 'POST',
      headers,
      body: formData,
      // 设置超时时间
      signal: AbortSignal.timeout(60000), // 60秒超时
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HF Space API error (${response.status}):`, errorText);

      return NextResponse.json(
        {
          error: 'Background removal failed',
          details: errorText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // 解析成功响应
    const result = await response.json();

    console.log('✅ Background removal successful');
    console.log(`⏱️ Processing time: ${result.processing_time}s`);
    console.log(`📐 Image size: ${result.image_size}`);

    // 7. 对未订阅用户结果图加右下角水印（若返回的是data URL）
    let watermarkedResult = result;
    try {
      const { getActiveSubscriptionAction } = await import('@/actions/get-active-subscription');
      const sub = await getActiveSubscriptionAction({ userId });
      const isSubscribed = !!sub?.data?.data;
      if (!isSubscribed && result?.image && typeof result.image === 'string' && result.image.startsWith('data:image')) {
        const { applyCornerWatermark } = await import('@/lib/watermark');
        // 将 data URL 转为 Buffer
        const base64Part = result.image.split(',')[1];
        const buffer = Buffer.from(base64Part, 'base64');
        const wmBuffer = await applyCornerWatermark(buffer, 'ROBONEO.ART', {
          fontSizeRatio: 0.045,
          opacity: 0.9,
          margin: 18,
          fill: '#FFFFFF',
          stroke: 'rgba(0,0,0,0.35)',
          strokeWidth: 2,
        });
        const wmDataUrl = `data:image/png;base64,${wmBuffer.toString('base64')}`;
        watermarkedResult = { ...result, image: wmDataUrl };
      }
    } catch (wmErr) {
      console.warn('BG remove watermark step skipped:', wmErr);
    }

    // 返回结果
    const payload = {
      ...watermarkedResult,
      // 添加积分信息
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deduct?.data?.data?.remainingCredits || 0,
      // 添加一些元数据
      proxy_timestamp: getLocalTimestr(),
      proxy_version: '1.0.0',
    } as const;
    if (typeof idStoreKey === 'string') setSuccess(idStoreKey, payload);
    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      await logAIOperation({
        userId,
        operation: 'bgremove',
        mode: 'remove-direct',
        creditsUsed: CREDITS_PER_IMAGE,
        status: 'success',
      });
    } catch {}
    return NextResponse.json(payload);
  } catch (error) {
    console.error('❌ Vercel proxy error:', error);

    // 区分不同类型的错误
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Request timeout',
            details: 'Background removal took too long',
          },
          { status: 408 }
        );
      }

      if (error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: 'Network error',
            details: 'Failed to connect to background removal service',
          },
          { status: 503 }
        );
      }
    }

    // Refund credits on failure
    try {
      const { getDb } = await import('@/db');
      const { user } = await import('@/db/schema');
      const { eq, sql } = await import('drizzle-orm');
      const db = await getDb();
      await db
        .update(user)
        .set({ credits: sql`${user.credits} + ${CREDITS_PER_IMAGE}`, updatedAt: new Date() })
        .where(eq(user.id, userId));
    } catch (e) {
      console.error('Failed to refund credits after error:', e);
    }

    if (typeof idStoreKey === 'string') clearKey(idStoreKey);
    try {
      const { logAIOperation } = await import('@/lib/ai-log');
      await logAIOperation({
        userId,
        operation: 'bgremove',
        mode: 'remove-direct',
        creditsUsed: CREDITS_PER_IMAGE,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch {}
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 可选：添加 GET 方法用于健康检查
export async function GET() {
  const base: Record<string, any> = {
    status: 'healthy',
    service: 'Background Removal Proxy',
    timestamp: getLocalTimestr(),
  };
  if (process.env.NODE_ENV !== 'production') {
    base.hf_space_configured = !!process.env.HF_SPACE_URL;
    base.hf_space_private = !!process.env.HF_SPACE_TOKEN;
  }
  return NextResponse.json(base);
}

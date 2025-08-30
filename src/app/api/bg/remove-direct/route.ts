// src/app/api/bg/remove-direct/route.ts
// Vercel API 路由 - 代理到私有 HF Space

import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getLocalTimestr } from '@/lib/time-utils';
import { type NextRequest, NextResponse } from 'next/server';

// 简单的内存速率限制（生产环境建议使用 Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟窗口
  const maxRequests = 10; // 每分钟最多10次请求

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 速率限制检查
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    if (!checkRateLimit(ip)) {
      console.warn(`🚫 Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
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

    // 7. 扣减 Credits - 成功生成后
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: session.user.id,
      amount: CREDITS_PER_IMAGE,
    });

    if (deductResult?.data?.success) {
      console.log(
        `💰 Deducted ${CREDITS_PER_IMAGE} credits for Solid Color background removal. Remaining: ${deductResult.data.data?.remainingCredits}`
      );
    } else {
      console.warn(
        '⚠️ Failed to deduct credits, but background removal was successful'
      );
    }

    // 返回结果
    return NextResponse.json({
      ...result,
      // 添加积分信息
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deductResult?.data?.data?.remainingCredits || 0,
      // 添加一些元数据
      proxy_timestamp: getLocalTimestr(),
      proxy_version: '1.0.0',
    });
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
  return NextResponse.json({
    status: 'healthy',
    service: 'Background Removal Proxy',
    timestamp: getLocalTimestr(),
    hf_space_configured: !!process.env.HF_SPACE_URL,
    hf_space_private: !!process.env.HF_SPACE_TOKEN,
  });
}

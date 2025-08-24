// src/app/api/bg/remove-direct/route.ts
// Vercel API 路由 - 代理到私有 HF Space

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Proxying request to private HF Space...');

    // 检查环境变量配置
    const HF_SPACE_URL = process.env.HF_SPACE_URL;
    const HF_SPACE_TOKEN = process.env.HF_SPACE_TOKEN;

    if (!HF_SPACE_URL || !HF_SPACE_TOKEN) {
      console.error('❌ HF Space configuration missing');
      return NextResponse.json(
        {
          error: 'HF Space configuration missing',
          details:
            'Please configure HF_SPACE_URL and HF_SPACE_TOKEN in Vercel environment variables',
        },
        { status: 500 }
      );
    }

    // 获取请求数据
    const formData = await req.formData();

    // 记录请求信息（不记录敏感数据）
    const imageData = formData.get('image_data') as string;
    const maxSide = formData.get('max_side') as string;

    console.log(`📤 Processing image, max_side: ${maxSide}`);
    console.log(
      `📊 Image data size: ${imageData ? imageData.length : 0} characters`
    );

    // 转发到私有 HF Space
    const response = await fetch(`${HF_SPACE_URL}/remove-bg-direct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_SPACE_TOKEN}`,
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
      },
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

    console.log(`✅ Background removal successful`);
    console.log(`⏱️ Processing time: ${result.processing_time}s`);
    console.log(`📐 Image size: ${result.image_size}`);

    // 返回结果
    return NextResponse.json({
      ...result,
      // 添加一些元数据
      proxy_timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
    hf_space_configured: !!(
      process.env.HF_SPACE_URL && process.env.HF_SPACE_TOKEN
    ),
  });
}

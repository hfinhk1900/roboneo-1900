import { verifySignedUrl } from '@/lib/signed-url';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'productshot.png';

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // 验证签名URL（如果包含签名参数）
    if (imageUrl.includes('signature=')) {
      const isValid = verifySignedUrl(imageUrl);
      if (!isValid) {
        console.warn(
          'Download access denied: Invalid or expired signature URL'
        );
        return NextResponse.json(
          { error: 'Access denied - Invalid or expired URL' },
          { status: 403 }
        );
      }
      console.log('✅ Signed URL verified for download');
    } else {
      // 对于非签名URL，验证是否来自可信的源（R2 存储）
      const allowedDomains = [
        'pub-cfc94129019546e1887e6add7f39ef74.r2.dev',
        'api.siliconflow.com',
        'img.recraft.ai',
      ];

      const urlDomain = new URL(imageUrl).hostname;
      if (!allowedDomains.some((domain) => urlDomain.includes(domain))) {
        return NextResponse.json(
          { error: 'Unauthorized image source' },
          { status: 403 }
        );
      }
    }

    console.log(`📥 Proxying image download: ${imageUrl}`);

    // 获取图片
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get('content-type') || 'image/png';

    // 创建响应并设置下载头部
    const response = new NextResponse(imageBuffer);

    response.headers.set('Content-Type', contentType);
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    response.headers.set('Content-Length', imageBuffer.byteLength.toString());

    // 设置 CORS 头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`✅ Image download proxy successful: ${filename}`);

    return response;
  } catch (error) {
    console.error('Image download proxy error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to download image', details: errorMessage },
      { status: 500 }
    );
  }
}

// 支持 OPTIONS 请求（用于 CORS 预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

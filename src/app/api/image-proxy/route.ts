import { NextRequest, NextResponse } from 'next/server';
import { verifySignedUrl } from '@/lib/signed-url';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // 验证签名URL
    const isValid = verifySignedUrl(imageUrl);
    if (!isValid) {
      console.warn('Image proxy access denied: Invalid or expired URL');
      return NextResponse.json(
        { error: 'Access denied - Invalid or expired URL' },
        { status: 403 }
      );
    }

    // 获取图片内容
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // 获取图片内容类型
    const contentType = response.headers.get('content-type') || 'image/png';

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();

    // 返回图片，设置适当的缓存头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // 1小时缓存
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

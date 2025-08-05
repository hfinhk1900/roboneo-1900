import { NextRequest, NextResponse } from 'next/server';

// 简化版本，直接返回重定向到实际图片URL
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;

    // 对于外部URL，直接重定向
    if (key.includes('http')) {
      return NextResponse.redirect(key);
    }

    // 对于占位符，返回一个简单的响应
    if (key === 'placeholder.png') {
      return new NextResponse('Placeholder image not found', { status: 404 });
    }

    // 对于其他情况，返回 404
    return new NextResponse('Image not found', { status: 404 });

  } catch (error) {
    console.error('Error in proxy-image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const runtime = 'edge';

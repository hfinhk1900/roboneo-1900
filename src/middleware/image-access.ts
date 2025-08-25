import { NextRequest, NextResponse } from 'next/server';
import { verifySignedUrl } from '@/lib/signed-url';

/**
 * 图片访问控制中间件
 * 验证签名URL和用户权限
 */
export async function imageAccessMiddleware(
  request: NextRequest,
  imageKey: string
): Promise<NextResponse | null> {
  try {
    const url = request.url;
    const signature = request.nextUrl.searchParams.get('signature');
    const expires = request.nextUrl.searchParams.get('expires');
    const uid = request.nextUrl.searchParams.get('uid');

    // 如果没有签名参数，拒绝访问
    if (!signature || !expires) {
      console.warn('Image access denied: Missing signature or expires parameter');
      return NextResponse.json(
        { error: 'Access denied - Invalid URL' },
        { status: 403 }
      );
    }

    // 验证签名URL
    const isValid = verifySignedUrl(url, uid || undefined);
    if (!isValid) {
      console.warn('Image access denied: Invalid signature or expired URL');
      return NextResponse.json(
        { error: 'Access denied - Invalid or expired URL' },
        { status: 403 }
      );
    }

    // 验证通过，允许访问
    console.log(`Image access granted for key: ${imageKey}, user: ${uid || 'anonymous'}`);
    return null;

  } catch (error) {
    console.error('Image access middleware error:', error);
    return NextResponse.json(
      { error: 'Access denied - Server error' },
      { status: 500 }
    );
  }
}

/**
 * 检查图片访问权限
 */
export function checkImageAccess(
  url: string,
  userId?: string
): boolean {
  return verifySignedUrl(url, userId);
}

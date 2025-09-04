import { generateSignedDownloadUrl } from '@/lib/asset-management';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRateLimitConfig } from '@/lib/config/rate-limit';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const csrf = enforceSameOriginCsrf(request);
    if (csrf) return csrf;
    // 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 速率限制用户刷新行为
    {
      const { signPerUserPerMin } = getRateLimitConfig();
      const rl = await checkRateLimit(`rl:sign:${session.user.id}`, signPerUserPerMin, 60);
      if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { asset_id, display_mode = 'inline', expires_in = 3600 } = body;

    if (!asset_id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // 优先从数据库读取资产信息
    const db = await getDb();
    const rows = await db.select().from(assets).where(eq(assets.id, asset_id)).limit(1);
    const record = rows[0];
    if (!record) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (record.user_id !== session.user.id) {
      console.warn('Unauthorized asset access attempt:', {
        user_id: session.user.id,
        asset_user_id: record.user_id,
        asset_id,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 生成新的签名下载URL
    const signedUrl = generateSignedDownloadUrl(
      asset_id,
      display_mode as 'inline' | 'attachment',
      expires_in
    );

    console.log('✅ Generated new download URL:', {
      asset_id,
      user_id: session.user.id,
      display_mode,
      expires_in,
    });

    return NextResponse.json({
      url: signedUrl.url,
      expires_at: signedUrl.expires_at,
    });
  } catch (error) {
    console.error('Sign download URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

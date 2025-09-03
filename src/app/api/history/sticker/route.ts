import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { stickerHistory, assets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { generateSignedDownloadUrl } from '@/lib/asset-management';

// GET /api/history/sticker?limit=20&refresh_urls=true
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const refreshUrls = searchParams.get('refresh_urls') === 'true';

    const baseQuery = db
      .select()
      .from(stickerHistory)
      .where(eq(stickerHistory.userId, session.user.id))
      .orderBy(desc(stickerHistory.createdAt));

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    const rows = limitParam
      ? await baseQuery.limit(Math.min(Math.max(Number(limitParam), 1), 1000))
      : await baseQuery;

    // 如果需要刷新URL，检查metadata中的asset_id并生成新的签名URL
    const items = refreshUrls ? await Promise.all(
      rows.map(async (row: any) => {
        // 检查是否有asset_id在metadata中
        const assetId = row.metadata?.asset_id;
        if (assetId) {
          try {
            // 验证资产仍然属于用户
            const assetRows = await db
              .select()
              .from(assets)
              .where(eq(assets.id, assetId))
              .limit(1);

            if (assetRows.length > 0 && assetRows[0].user_id === session.user.id) {
              // 生成新的签名URL
              const signed = generateSignedDownloadUrl(assetId, 'inline', 3600);
              return {
                ...row,
                url: signed.url,
                asset_id: assetId
              };
            }
          } catch (error) {
            console.error(`Failed to refresh URL for asset ${assetId}:`, error);
          }
        }
        return row;
      })
    ) : rows;

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/history/sticker error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

// POST /api/history/sticker
// body: { asset_id: string; style: string } | { url: string; style: string } (兼容旧格式)
export async function POST(request: NextRequest) {
  try {
    const csrf = enforceSameOriginCsrf(request);
    if (csrf) return csrf;
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { asset_id, url, style } = body;
    if (!style) {
      return NextResponse.json(
        { error: 'Style is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    let finalUrl: string;
    let finalAssetId: string | undefined;

    // 优先使用 asset_id，这是新的推荐方式
    if (asset_id) {
      // 校验资产归属
      const assetRows = await db
        .select()
        .from(assets)
        .where(eq(assets.id, asset_id))
        .limit(1);
      if (assetRows.length === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      if (assetRows[0].user_id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // 生成新的签名URL，每次都刷新过期时间
      const signed = generateSignedDownloadUrl(asset_id, 'inline', 3600);
      finalUrl = signed.url;
      finalAssetId = asset_id;
    } else if (url) {
      // 兼容旧格式，直接使用URL
      finalUrl = url;
    } else {
      return NextResponse.json(
        { error: 'Either asset_id or url is required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    // 保存历史记录，包含asset_id以便后续查询
    await db
      .insert(stickerHistory)
      .values({
        id,
        userId: session.user.id,
        url: finalUrl,
        style,
        createdAt,
        // 如果有asset_id，保存到metadata中以便后续使用
        ...(finalAssetId && { metadata: { asset_id: finalAssetId } })
      });

    return NextResponse.json({
      id,
      url: finalUrl,
      style,
      createdAt,
      asset_id: finalAssetId
    });
  } catch (error) {
    console.error('POST /api/history/sticker error:', error);
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    );
  }
}

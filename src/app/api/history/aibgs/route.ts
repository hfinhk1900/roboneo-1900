import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { aibgHistory, assets } from '@/db/schema';
import { generateSignedDownloadUrl } from '@/lib/asset-management';
import { auth } from '@/lib/auth';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const refreshUrls = searchParams.get('refresh_urls') === 'true';

    let query = db
      .select()
      .from(aibgHistory)
      .where(eq(aibgHistory.userId, session.user.id))
      .orderBy(desc(aibgHistory.createdAt));

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    if (limit) {
      query = query.limit(Number.parseInt(limit));
    }

    const items = await query;

    // Convert legacy signed URLs to stable view URLs
    const converted = await Promise.all(
      items.map(async (item: any) => {
        if (item.url && item.url.startsWith('/api/assets/download')) {
          try {
            const urlObj = new URL(item.url, 'http://localhost');
            const assetId = urlObj.searchParams.get('asset_id');
            if (assetId) {
              const assetRows = await db
                .select()
                .from(assets)
                .where(eq(assets.id, assetId))
                .limit(1);
              if (
                assetRows.length > 0 &&
                assetRows[0].user_id === session.user.id
              ) {
                return {
                  ...item,
                  url: `/api/assets/${assetId}`,
                  asset_id: assetId,
                };
              }
            }
          } catch (error) {
            console.error('Failed to convert URL for history item:', error);
          }
        }
        return item;
      })
    );

    return NextResponse.json({ items: converted });
  } catch (error) {
    console.error('Error fetching aibg history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = enforceSameOriginCsrf(request);
    if (csrf) return csrf;
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();
    const { url, mode, style, asset_id } = body;

    // 支持两种模式：直接传URL或传asset_id
    let finalUrl = url;
    let finalAssetId = asset_id;

    if (asset_id) {
      // 验证asset_id归属
      const assetRecord = await db
        .select()
        .from(assets)
        .where(eq(assets.id, asset_id))
        .limit(1);

      if (assetRecord.length === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      const asset = assetRecord[0];
      if (asset.user_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Asset access denied' },
          { status: 403 }
        );
      }

      // 生成新的签名URL
      const signed = generateSignedDownloadUrl(asset_id, 'inline', 3600);
      finalUrl = signed.url;
      finalAssetId = asset_id;
    } else if (!url) {
      return NextResponse.json(
        { error: 'URL or asset_id is required' },
        { status: 400 }
      );
    }

    if (!mode || !style) {
      return NextResponse.json(
        { error: 'Mode and style are required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    await db.insert(aibgHistory).values({
      id,
      userId: session.user.id,
      url: finalUrl,
      mode,
      style,
      createdAt,
    });

    return NextResponse.json({
      id,
      url: finalUrl,
      mode,
      style,
      createdAt,
      asset_id: finalAssetId,
    });
  } catch (error) {
    console.error('Error creating aibg history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { getDb } from '@/db';
import { assets, watermarkHistory } from '@/db/schema';
import { buildAssetUrls } from '@/lib/asset-links';
import { auth } from '@/lib/auth';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
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
    const limit = Number.parseInt(searchParams.get('limit') || '50');

    const items = await db
      .select()
      .from(watermarkHistory)
      .where(eq(watermarkHistory.userId, session.user.id))
      .orderBy(desc(watermarkHistory.createdAt))
      .limit(Math.min(Math.max(limit, 1), 200));

    // 如果需要刷新URL，检查并刷新过期的签名URL
    const processedItems = await Promise.all(
      items.map(async (item: any) => {
        const urlToCheck = item.processedImageUrl || item.url;
        if (urlToCheck?.startsWith('/api/assets/download')) {
          try {
            const urlObj = new URL(urlToCheck, 'http://localhost');
            const assetId = urlObj.searchParams.get('asset_id');
            if (assetId) {
              const assetRows = await db
                .select()
                .from(assets)
                .where(eq(assets.id, assetId))
                .limit(1);
              if (assetRows[0]?.user_id === session.user.id) {
                return {
                  ...item,
                  processedImageUrl: `/api/assets/${assetId}`,
                  asset_id: assetId,
                };
              }
            }
          } catch (error) {
            console.error('Failed to convert URL for watermark item:', error);
          }
        }
        return {
          ...item,
          asset_id: item.assetId ?? item.asset_id ?? null,
        };
      })
    );

    const enriched = await Promise.all(
      processedItems.map(async (item: any) => {
        const assetId = item.asset_id || item.assetId;
        if (assetId) {
          try {
            const links = await buildAssetUrls({ assetId, expiresIn: 300 });
            return {
              ...item,
              asset_id: assetId,
              download_url: links.attachmentDownloadUrl,
            };
          } catch (error) {
            console.warn('Failed to build watermark download URL:', error);
          }
        }
        return item;
      })
    );

    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error('Error fetching watermark history:', error);
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

    const {
      originalImageUrl,
      processedImageUrl,
      method,
      watermarkType,
      quality,
      assetId,
    } = await request.json();

    // 验证必需字段
    if (!originalImageUrl || !processedImageUrl || !method) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: originalImageUrl, processedImageUrl, method',
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const historyId = nanoid();

    let finalProcessedUrl = processedImageUrl;
    let finalAssetId: string | undefined;

    if (assetId) {
      const assetRows = await db
        .select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (assetRows.length === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      if (assetRows[0].user_id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      finalProcessedUrl = `/api/assets/${assetId}`;
      finalAssetId = assetId;
    }

    await db.insert(watermarkHistory).values({
      id: historyId,
      userId: session.user.id,
      originalImageUrl,
      processedImageUrl: finalProcessedUrl,
      assetId: finalAssetId ?? null,
      method,
      watermarkType: watermarkType || null,
      quality: quality || null,
    });

    console.log(`✅ Watermark history item ${historyId} created successfully`);

    return NextResponse.json({
      success: true,
      id: historyId,
      processedImageUrl: finalProcessedUrl,
      asset_id: finalAssetId,
    });
  } catch (error) {
    console.error('Error creating watermark history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

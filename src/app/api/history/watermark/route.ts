import { getDb } from '@/db';
import { assets, watermarkHistory } from '@/db/schema';
import { generateSignedDownloadUrl } from '@/lib/asset-management';
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
    const refreshUrls = searchParams.get('refresh_urls') === 'true';
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
        return item;
      })
    );

    return NextResponse.json({ items: processedItems });
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

    await db.insert(watermarkHistory).values({
      id: historyId,
      userId: session.user.id,
      originalImageUrl,
      processedImageUrl,
      method,
      watermarkType: watermarkType || null,
      quality: quality || null,
    });

    console.log(`✅ Watermark history item ${historyId} created successfully`);

    return NextResponse.json({
      success: true,
      id: historyId,
    });
  } catch (error) {
    console.error('Error creating watermark history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

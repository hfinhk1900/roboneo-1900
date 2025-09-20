import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { assets, profilePictureHistory } from '@/db/schema';
import { generateSignedDownloadUrl } from '@/lib/asset-management';
import { auth } from '@/lib/auth';
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

    const baseQuery = db
      .select()
      .from(profilePictureHistory)
      .where(eq(profilePictureHistory.userId, session.user.id))
      .orderBy(desc(profilePictureHistory.createdAt));

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    const items =
      limit !== null
        ? await baseQuery.limit(Number.parseInt(limit, 10))
        : await baseQuery;

    // 将旧的签名URL转换为稳定的查看URL
    const stableItems = await Promise.all(
      items.map(async (item: any) => {
        if (item.url?.startsWith('/api/assets/download')) {
          try {
            const urlObj = new URL(item.url, 'http://localhost');
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
                  url: `/api/assets/${assetId}`,
                  asset_id: assetId,
                };
              }
            }
          } catch (error) {
            console.error(
              'Failed to convert URL for profile picture item:',
              error
            );
          }
        }
        return item;
      })
    );

    return NextResponse.json({ items: stableItems });
  } catch (error) {
    console.error('Error fetching profile picture history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();
    const { url, style, asset_id, aspectRatio } = body as {
      url?: string;
      style?: string;
      asset_id?: string;
      aspectRatio?: string;
    };

    if (!style) {
      return NextResponse.json({ error: 'style is required' }, { status: 400 });
    }

    // 如果客户端传来 asset_id，则根据资产生成签名URL并落库
    let finalUrl = url;
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
      const signed = generateSignedDownloadUrl(asset_id, 'inline', 3600);
      finalUrl = signed.url;
    }

    if (!finalUrl) {
      return NextResponse.json(
        { error: 'Either asset_id or url is required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    await db.insert(profilePictureHistory).values({
      id,
      userId: session.user.id,
      url: finalUrl,
      style,
      aspectRatio,
      createdAt,
    });
    return NextResponse.json({
      id,
      url: finalUrl,
      style,
      aspectRatio,
      createdAt,
    });
  } catch (error) {
    console.error('Error creating profile picture history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

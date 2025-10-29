import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { assets, productshotHistory } from '@/db/schema';
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

    const baseQuery = db
      .select()
      .from(productshotHistory)
      .where(eq(productshotHistory.userId, session.user.id))
      .orderBy(desc(productshotHistory.createdAt));

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    const items =
      limit !== null
        ? await baseQuery.limit(Number.parseInt(limit, 10))
        : await baseQuery;

    // Convert legacy signed URLs to stable view URLs
    const converted = await Promise.all(
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
                  assetId,
                };
              }
            }
          } catch (error) {
            console.error('Failed to convert URL for productshot item:', error);
          }
        }
        return {
          ...item,
          asset_id: item.assetId ?? item.asset_id ?? null,
        };
      })
    );

    return NextResponse.json({ items: converted });
  } catch (error) {
    console.error('Error fetching productshot history:', error);
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
    const { url, scene, asset_id } = body as {
      url?: string;
      scene?: string;
      asset_id?: string;
    };

    if (!scene) {
      return NextResponse.json({ error: 'scene is required' }, { status: 400 });
    }

    // 如果客户端传来 asset_id，则根据资产生成签名URL并落库
    let finalUrl = url;
    let finalAssetId: string | undefined;
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
      finalUrl = `/api/assets/${asset_id}`;
      finalAssetId = asset_id;
    }

    if (!finalUrl) {
      return NextResponse.json(
        { error: 'Either asset_id or url is required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    await db.insert(productshotHistory).values({
      id,
      userId: session.user.id,
      url: finalUrl,
      assetId: finalAssetId ?? null,
      scene,
      createdAt,
    });
    return NextResponse.json({
      id,
      url: finalUrl,
      scene,
      createdAt,
      asset_id: finalAssetId,
    });
  } catch (error) {
    console.error('Error creating productshot history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

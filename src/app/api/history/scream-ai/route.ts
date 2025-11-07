import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { assets, screamAiHistory } from '@/db/schema';
import { buildAssetUrls } from '@/lib/asset-links';
import { auth } from '@/lib/auth';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import {
  deleteServerCache,
  getServerCache,
  setServerCache,
} from '@/lib/server-cache';
import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');

    const db = await getDb();
    const cacheKey = `history:scream-ai:${session.user.id}`;
    const cached = getServerCache<{ items: any[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    const query = db
      .select()
      .from(screamAiHistory)
      .where(eq(screamAiHistory.userId, session.user.id))
      .orderBy(desc(screamAiHistory.createdAt));

    const rows =
      limitParam !== null ? await query.limit(Number(limitParam)) : await query;

    const items = await Promise.all(
      rows.map(async (row) => {
        const assetId = row.assetId ?? null;
        const stableUrl = assetId ? `/api/assets/${assetId}` : row.url;
        let downloadUrl = stableUrl;
        if (assetId) {
          try {
            const links = await buildAssetUrls({ assetId, expiresIn: 300 });
            downloadUrl = links.attachmentDownloadUrl;
          } catch (error) {
            console.warn('Failed to build scream-ai download URL:', error);
          }
        }
        return {
          ...row,
          url: stableUrl,
          download_url: downloadUrl,
          asset_id: assetId,
        };
      })
    );

    const payload = { items };
    setServerCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to fetch scream-ai history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const body = (await request.json()) as {
      asset_id?: string;
      url?: string;
      preset_id: string;
      aspect_ratio?: string;
      watermarked?: boolean;
    };

    if (!body.preset_id) {
      return NextResponse.json(
        { error: 'preset_id is required' },
        { status: 400 }
      );
    }

    let finalUrl = body.url;
    if (body.asset_id) {
      const assetRows = await db
        .select()
        .from(assets)
        .where(eq(assets.id, body.asset_id))
        .limit(1);
      if (!assetRows.length) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      if (assetRows[0].user_id !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      finalUrl = `/api/assets/${body.asset_id}`;
    }

    if (!finalUrl) {
      return NextResponse.json(
        { error: 'Either asset_id or url is required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    await db.insert(screamAiHistory).values({
      id,
      userId: session.user.id,
      url: finalUrl,
      presetId: body.preset_id,
      aspectRatio: body.aspect_ratio,
      assetId: body.asset_id ?? null,
      watermarked: body.watermarked ?? true,
      createdAt,
    });

    deleteServerCache(`history:scream-ai:${session.user.id}`);

    return NextResponse.json({
      id,
      url: finalUrl,
      preset_id: body.preset_id,
      aspect_ratio: body.aspect_ratio,
      asset_id: body.asset_id ?? null,
      createdAt,
    });
  } catch (error) {
    console.error('Failed to create scream-ai history record:', error);
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    );
  }
}

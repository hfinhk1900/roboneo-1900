import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { stickerHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/history/sticker?limit=20
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

    let query = db
      .select()
      .from(stickerHistory)
      .where(eq(stickerHistory.userId, session.user.id))
      .orderBy(desc(stickerHistory.createdAt));

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    if (limitParam) {
      const limit = Math.min(Math.max(Number(limitParam), 1), 1000); // 提高最大限制到1000
      query = query.limit(limit);
    }

    const rows = await query;

    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error('GET /api/history/sticker error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

// POST /api/history/sticker
// body: { url: string; style: string }
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, style } = body || {};
    if (!url || !style) {
      return NextResponse.json(
        { error: 'Missing url or style' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const id = randomUUID();
    const createdAt = new Date();

    await db
      .insert(stickerHistory)
      .values({ id, userId: session.user.id, url, style, createdAt });

    return NextResponse.json({ id, url, style, createdAt });
  } catch (error) {
    console.error('POST /api/history/sticker error:', error);
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    );
  }
}

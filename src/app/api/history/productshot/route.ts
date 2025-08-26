import { randomUUID } from 'crypto';
import { db } from '@/db';
import { productshotHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = db
      .select()
      .from(productshotHistory)
      .where(eq(productshotHistory.userId, session.user.id))
      .orderBy(productshotHistory.createdAt);

    // 如果没有指定limit，则不限制数量，返回所有历史记录
    if (limit) {
      query = query.limit(Number.parseInt(limit));
    }

    const items = await query;

    return NextResponse.json({ items });
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
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, scene } = body;

    if (!url || !scene) {
      return NextResponse.json(
        { error: 'URL and scene are required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date();

    await db
      .insert(productshotHistory)
      .values({
        id,
        userId: session.user.id,
        url,
        scene,
        createdAt,
      });

    return NextResponse.json({ id, url, scene, createdAt });
  } catch (error) {
    console.error('Error creating productshot history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

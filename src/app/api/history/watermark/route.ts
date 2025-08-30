import { getDb } from '@/db';
import { watermarkHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
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
    const items = await db
      .select()
      .from(watermarkHistory)
      .where(eq(watermarkHistory.userId, session.user.id))
      .orderBy(desc(watermarkHistory.createdAt))
      .limit(50); // 限制返回最近50条记录

    return NextResponse.json({ items });
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
        { error: 'Missing required fields: originalImageUrl, processedImageUrl, method' },
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

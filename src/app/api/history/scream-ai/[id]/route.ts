import { getDb } from '@/db';
import { screamAiHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: { id: string };
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { id } = context.params;

    await db
      .delete(screamAiHistory)
      .where(
        and(
          eq(screamAiHistory.id, id),
          eq(screamAiHistory.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scream-ai history item:', error);
    return NextResponse.json(
      { error: 'Failed to delete history item' },
      { status: 500 }
    );
  }
}

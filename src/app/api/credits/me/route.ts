import { auth } from '@/lib/auth';
import { type NextRequest, NextResponse } from 'next/server';

// Lightweight endpoint to fetch current user's credits
// Uses session data to avoid heavy server actions on first paint.
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const credits = (session.user as any)?.credits ?? 0;
    return NextResponse.json({ success: true, data: { credits } });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to get credits',
      },
      { status: 500 }
    );
  }
}

import { getDb } from '@/db';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 管理员查找用户 - 通过邮箱查找用户ID
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // 查找用户
    const db = await getDb();
    const userData = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: userData[0].id,
      user: userData[0],
    });
  } catch (error) {
    console.error('❌ Failed to find user:', error);
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
  }
}

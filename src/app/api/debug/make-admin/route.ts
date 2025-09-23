import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

// ⚠️ 仅用于本地开发测试！生产环境应删除此API
export async function POST(request: NextRequest) {
  // 仅在开发环境允许
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This API is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();

    // 查找用户
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 更新用户角色为admin
    await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));

    console.log(`✅ User ${email} has been granted admin role`);

    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin`,
      user: {
        id: existingUser[0].id,
        email: existingUser[0].email,
        name: existingUser[0].name,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('❌ Make admin error:', error);
    return NextResponse.json(
      {
        error: 'Failed to make user admin',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

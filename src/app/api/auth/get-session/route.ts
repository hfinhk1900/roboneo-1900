import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { auth } = await import('@/lib/auth');

  const raw = await auth.api.getSession({
    headers: req.headers as any,
  });

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
  } as Record<string, string>;

  if (!raw?.user) {
    // 兼容客户端：返回 null 而不是自定义字段
    return NextResponse.json(
      { session: null, user: null },
      { status: 200, headers }
    );
  }

  // 最小化敏感字段，保留常用显示字段
  const safeUser = {
    id: raw.user.id,
    name: raw.user.name,
    email: (raw.user as any).email,
    image: raw.user.image ? `/api/avatar/${raw.user.id}` : undefined,
    emailVerified: Boolean(raw.user.emailVerified),
    role: (raw.user as any).role,
    credits: (raw.user as any).credits,
  };

  const safeSession = {
    // 保留可能被客户端依赖的字段，去除 token/ip/userAgent/customerId 等敏感信息
    id: raw.session?.id,
    userId: raw.session?.userId,
    createdAt: raw.session?.createdAt,
    updatedAt: raw.session?.updatedAt,
    expiresAt: raw.session?.expiresAt,
  };

  return NextResponse.json(
    {
      session: safeSession,
      user: safeUser,
    },
    { status: 200, headers }
  );
}

import { createHash } from 'crypto';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>();
  const publicUrl = process.env.STORAGE_PUBLIC_URL;
  if (publicUrl) {
    try {
      hosts.add(new URL(publicUrl).host);
    } catch {}
  }
  // Common OAuth avatar hosts (safe to proxy)
  hosts.add('lh3.googleusercontent.com');
  hosts.add('avatars.githubusercontent.com');
  hosts.add('secure.gravatar.com');
  hosts.add('www.gravatar.com');
  return hosts;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next.js 15 async params

    const db = await getDb();
    const rows = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    const imageUrl = rows[0]?.image || '';
    if (!imageUrl) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    let target: URL;
    try {
      target = new URL(imageUrl, 'http://localhost');
    } catch {
      return NextResponse.json(
        { error: 'Invalid avatar URL' },
        { status: 400 }
      );
    }

    // Only proxy allowed hosts to avoid SSRF; others return 403
    const allowedHosts = getAllowedHosts();
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }
    // If URL is relative (starts with '/'), serve from public directly without fetch
    if (!target.host) {
      try {
        const res = await fetch(target.toString());
        if (!res.ok) {
          return NextResponse.json(
            { error: 'Avatar fetch failed' },
            { status: 502 }
          );
        }
        const buf = await res.arrayBuffer();
        const etag =
          '"' + createHash('sha1').update(Buffer.from(buf)).digest('hex') + '"';
        const ifNone = req.headers.get('if-none-match');
        if (ifNone && ifNone === etag) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              ETag: etag,
              'Cache-Control':
                'public, max-age=3600, stale-while-revalidate=60',
            },
          });
        }
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': res.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
            ETag: etag,
          },
        });
      } catch {
        return NextResponse.json(
          { error: 'Avatar fetch error' },
          { status: 502 }
        );
      }
    }

    if (!allowedHosts.has(target.host)) {
      return NextResponse.json(
        { error: 'Avatar host not allowed' },
        { status: 403 }
      );
    }

    // Proxy fetch
    const resp = await fetch(target.toString(), {
      headers: {
        // Prevent caching at origin of private URLs; we handle caching here
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) {
      return NextResponse.json(
        { error: 'Avatar upstream error' },
        { status: 502 }
      );
    }
    const buf = await resp.arrayBuffer();
    const etag =
      '"' + createHash('sha1').update(Buffer.from(buf)).digest('hex') + '"';
    const ifNone = req.headers.get('if-none-match');
    if (ifNone && ifNone === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
        },
      });
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
        ETag: etag,
      },
    });
  } catch (error) {
    console.error('Avatar route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

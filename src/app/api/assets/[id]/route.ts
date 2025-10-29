import { createHash } from 'crypto';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { getFile, getFileSignedUrl } from '@/storage';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next.js 15 async params

    // Require authenticated session
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lookup asset
    const db = await getDb();
    const rows = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);
    const asset = rows[0];
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const isOwner = asset.user_id === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Try to generate direct signed URL for storage
    if (asset.key) {
      try {
        const signedUrl = await getFileSignedUrl(asset.key, {
          responseDisposition: `inline; filename="${asset.filename}"`,
          responseContentType: asset.content_type || undefined,
          expiresIn: 5 * 60,
        });
        return NextResponse.redirect(signedUrl, 302);
      } catch (error) {
        console.error('Asset view signed URL error:', error);
      }
    }

    // Fetch file content from storage
    const data = await getFile(asset.key);

    // ETag handling (content-based strong ETag)
    const etag = '"' + createHash('sha256').update(data).digest('hex') + '"';
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=86400, stale-while-revalidate=60',
        },
      });
    }

    // Prepare response
    const resp = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': asset.content_type || 'application/octet-stream',
        'Content-Length': data.byteLength.toString(),
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=60',
        ETag: etag,
        'Last-Modified': (asset as any).created_at
          ? new Date((asset as any).created_at).toUTCString()
          : new Date().toUTCString(),
        'Content-Disposition': `inline; filename="${asset.filename}"`,
      },
    });

    return resp;
  } catch (error) {
    console.error('Asset view error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

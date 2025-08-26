import { createHmac } from 'crypto';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset_id = searchParams.get('asset_id');
    const exp = searchParams.get('exp');
    const sig = searchParams.get('sig');
    const disp =
      (searchParams.get('disp') as 'inline' | 'attachment') || 'inline';

    // 验证必需参数
    if (!asset_id || !exp || !sig) {
      console.warn('Asset download: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const expiresAt = Number.parseInt(exp);
    const currentTime = Math.floor(Date.now() / 1000);

    // 检查URL是否过期
    if (currentTime > expiresAt) {
      console.warn('Asset download: URL expired', {
        asset_id,
        expiresAt,
        currentTime,
      });
      return NextResponse.json(
        { error: 'Download URL has expired' },
        { status: 410 }
      );
    }

    // 验证签名
    const secret = process.env.URL_SIGNING_SECRET || 'default-secret-key';
    const dataToSign = `${asset_id}|${expiresAt}|${disp}`;
    const expectedSignature = createHmac('sha256', secret).update(dataToSign).digest('base64url');

    if (sig !== expectedSignature) {
      console.warn('Asset download: Invalid signature', { asset_id });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 从数据库获取资产信息
    const db = await getDb();
    const assetRecord = await db
      .select()
      .from(assets)
      .where(eq(assets.id, asset_id))
      .limit(1);

    if (assetRecord.length === 0) {
      console.warn('Asset download: Asset not found in database', { asset_id });
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const assetMetadata = assetRecord[0];

    console.log('✅ Asset download verified:', {
      asset_id,
      filename: assetMetadata.filename,
      content_type: assetMetadata.content_type,
      display_mode: disp,
    });

    // 从 R2 获取文件
    const r2Url = `${process.env.R2_PUBLIC_URL}/${assetMetadata.key}`;
    const response = await fetch(r2Url);
    if (!response.ok) {
      console.error('Asset download: Failed to fetch file from R2', {
        asset_id,
        key: assetMetadata.key,
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: 'Failed to fetch file from R2' },
        { status: 500 }
      );
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = assetMetadata.content_type || 'application/octet-stream';

    // 创建响应
    const downloadResponse = new NextResponse(fileBuffer);

    // 设置响应头
    downloadResponse.headers.set('Content-Type', contentType);
    downloadResponse.headers.set(
      'Content-Length',
      fileBuffer.byteLength.toString()
    );

    // 设置缓存控制
    downloadResponse.headers.set(
      'Cache-Control',
      'private, max-age=120, stale-while-revalidate=30'
    );

    // 设置ETag（基于文件内容）
    const etag = `"${Buffer.from(fileBuffer).toString('base64').substring(0, 8)}"`;
    downloadResponse.headers.set('ETag', etag);

    // 设置最后修改时间
    const lastModified = new Date(assetMetadata.created_at).toUTCString();
    downloadResponse.headers.set('Last-Modified', lastModified);

    // 设置Content-Disposition
    const filename = assetMetadata.filename;
    const contentDisposition =
      disp === 'attachment'
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`;
    downloadResponse.headers.set('Content-Disposition', contentDisposition);

    // 设置CORS头
    downloadResponse.headers.set('Access-Control-Allow-Origin', '*');
    downloadResponse.headers.set('Access-Control-Allow-Methods', 'GET');
    downloadResponse.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type'
    );

    console.log('✅ Asset download successful:', {
      asset_id,
      file_name: filename,
      size: fileBuffer.byteLength,
      content_type: contentType,
    });

    return downloadResponse;
  } catch (error) {
    console.error('Asset download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（用于CORS预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

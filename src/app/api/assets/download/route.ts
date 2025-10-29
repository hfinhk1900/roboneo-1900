import { createHash, createHmac } from 'crypto';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { getAssetMetadata as getLocalAssetMetadata } from '@/lib/asset-management';
import { getFileSignedUrl } from '@/storage';
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
    const secret = process.env.URL_SIGNING_SECRET;
    if (!secret) {
      console.error('Asset download: URL_SIGNING_SECRET not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }
    const dataToSign = `${asset_id}|${expiresAt}|${disp}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(dataToSign)
      .digest('base64url');

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

    // 如果数据库没有，尝试从本地元数据（仅开发环境兜底）读取
    let assetMetadata: any | null = assetRecord[0] || null;
    let r2Url: string | null = null;

    if (!assetMetadata && process.env.NODE_ENV !== 'production') {
      const local = await getLocalAssetMetadata(asset_id);
      if (!local) {
        console.warn('Asset download: Asset not found (db and local)', {
          asset_id,
        });
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // 兼容使用本地元数据文件的旧流程：直接用 original_url 代理返回
      console.log('⚠️ Using local asset metadata fallback for download', {
        asset_id,
      });
      r2Url = local.original_url;

      // 构造最小化的元数据对象以便后续头信息设置
      assetMetadata = {
        filename: local.file_name || 'asset.png',
        content_type: local.content_type || 'application/octet-stream',
        created_at: new Date(local.created_at * 1000).toISOString(),
      };
    }

    let signedUrl: string | null = null;

    // 优先尝试生成直连的存储签名URL，以绕过 Vercel 带宽
    if (assetMetadata?.key) {
      try {
        const expiresIn = Math.max(
          60,
          Math.min((expiresAt - currentTime) || 3600, 24 * 60 * 60)
        );
        signedUrl = await getFileSignedUrl(assetMetadata.key, {
          expiresIn,
          responseDisposition:
            disp === 'attachment'
              ? `attachment; filename="${assetMetadata.filename}"`
              : `inline; filename="${assetMetadata.filename}"`,
          responseContentType: assetMetadata.content_type || undefined,
        });
      } catch (error) {
        console.error('Asset download: Failed to generate direct signed URL', {
          asset_id,
          error,
        });
      }
    }

    if (signedUrl) {
      console.log('🔁 Redirecting asset download to storage signed URL', {
        asset_id,
        display_mode: disp,
      });
      return NextResponse.redirect(signedUrl, 302);
    }

    console.log('✅ Asset download verified (fallback path):', {
      asset_id,
      filename: assetMetadata.filename,
      content_type: assetMetadata.content_type,
      display_mode: disp,
    });

    // 从 R2 获取文件（若为本地回退模式则直接使用 original_url）
    if (!r2Url) {
      // 使用 STORAGE_PUBLIC_URL 而不是 R2_PUBLIC_URL
      const publicUrl =
        process.env.STORAGE_PUBLIC_URL || process.env.R2_PUBLIC_URL;
      if (!publicUrl) {
        console.error('Asset download: STORAGE_PUBLIC_URL not configured');
        return NextResponse.json(
          { error: 'Storage configuration error' },
          { status: 500 }
        );
      }

      if (!assetMetadata.key) {
        console.error('Asset download: Missing storage key', { asset_id });
        return NextResponse.json(
          { error: 'Asset storage key not found' },
          { status: 500 }
        );
      }

      r2Url = `${publicUrl}/${assetMetadata.key}`;
    }

    console.log('📥 Fetching asset from R2:', {
      asset_id,
      key: assetMetadata.key,
      r2Url: r2Url.substring(0, 100) + '...',
    });

    const response = await fetch(r2Url);
    if (!response.ok) {
      console.error('Asset download: Failed to fetch file from R2', {
        asset_id,
        key: assetMetadata.key,
        status: response.status,
        statusText: response.statusText,
        r2Url: r2Url.substring(0, 100) + '...',
      });
      return NextResponse.json(
        { error: 'Failed to fetch file from storage' },
        { status: 500 }
      );
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType =
      assetMetadata.content_type || 'application/octet-stream';

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

    // 设置ETag（基于内容的强校验）
    const hash = createHash('sha256')
      .update(Buffer.from(fileBuffer))
      .digest('hex');
    downloadResponse.headers.set('ETag', `"${hash}"`);

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

    // 设置CORS（仅允许白名单来源；缺省不开放通配符）
    const origin = request.headers.get('origin') || '';
    const allowed = (process.env.DOWNLOAD_ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (origin && allowed.includes(origin)) {
      downloadResponse.headers.set('Access-Control-Allow-Origin', origin);
      downloadResponse.headers.set('Vary', 'Origin');
      downloadResponse.headers.set('Access-Control-Allow-Methods', 'GET');
      downloadResponse.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type'
      );
    }

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
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.DOWNLOAD_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const headers: Record<string, string> = {};
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return new NextResponse(null, {
    status: 200,
    headers,
  });
}

// 支持OPTIONS请求（用于CORS预检）
// (duplicate removed) legacy wildcard OPTIONS handler was removed in favor of whitelist handler above

import {
  getAssetMetadata,
  verifyDownloadSignature,
  parseDownloadUrl
} from '@/lib/asset-management';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asset_id = searchParams.get('asset_id');
    const exp = searchParams.get('exp');
    const sig = searchParams.get('sig');
    const disp = searchParams.get('disp') as 'inline' | 'attachment' || 'inline';

    // 验证必需参数
    if (!asset_id || !exp || !sig) {
      console.warn('Asset download: Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const expiresAt = parseInt(exp);
    const currentTime = Math.floor(Date.now() / 1000);

    // 检查URL是否过期
    if (currentTime > expiresAt) {
      console.warn('Asset download: URL expired', { asset_id, expiresAt, currentTime });
      return NextResponse.json(
        { error: 'Download URL has expired' },
        { status: 410 }
      );
    }

    // 验证签名
    const isValidSignature = verifyDownloadSignature(asset_id, expiresAt, sig, disp);
    if (!isValidSignature) {
      console.warn('Asset download: Invalid signature', { asset_id });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 获取资产元数据
    const assetMetadata = await getAssetMetadata(asset_id);
    if (!assetMetadata) {
      console.warn('Asset download: Asset not found', { asset_id });
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    console.log('✅ Asset download verified:', {
      asset_id,
      file_name: assetMetadata.file_name,
      content_type: assetMetadata.content_type,
      display_mode: disp
    });

    // 从原始URL获取文件
    const response = await fetch(assetMetadata.original_url);
    if (!response.ok) {
      console.error('Asset download: Failed to fetch original file', {
        asset_id,
        status: response.status,
        statusText: response.statusText
      });
      return NextResponse.json(
        { error: 'Failed to fetch file' },
        { status: 500 }
      );
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = assetMetadata.content_type || response.headers.get('content-type') || 'application/octet-stream';

    // 创建响应
    const downloadResponse = new NextResponse(fileBuffer);

    // 设置响应头
    downloadResponse.headers.set('Content-Type', contentType);
    downloadResponse.headers.set('Content-Length', fileBuffer.byteLength.toString());

    // 设置缓存控制
    downloadResponse.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30');

    // 设置ETag（基于文件内容）
    const etag = `"${Buffer.from(fileBuffer).toString('base64').substring(0, 8)}"`;
    downloadResponse.headers.set('ETag', etag);

    // 设置最后修改时间
    const lastModified = new Date(assetMetadata.created_at * 1000).toUTCString();
    downloadResponse.headers.set('Last-Modified', lastModified);

    // 设置Content-Disposition
    const filename = assetMetadata.file_name;
    const contentDisposition = disp === 'attachment'
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;
    downloadResponse.headers.set('Content-Disposition', contentDisposition);

    // 设置CORS头
    downloadResponse.headers.set('Access-Control-Allow-Origin', '*');
    downloadResponse.headers.set('Access-Control-Allow-Methods', 'GET');
    downloadResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log('✅ Asset download successful:', {
      asset_id,
      file_name: filename,
      size: fileBuffer.byteLength,
      content_type: contentType
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

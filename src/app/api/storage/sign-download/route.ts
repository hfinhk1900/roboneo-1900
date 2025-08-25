import {
  getAssetMetadata,
  generateSignedDownloadUrl
} from '@/lib/asset-management';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { asset_id, display_mode = 'inline', expires_in = 3600 } = body;

    if (!asset_id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // 获取资产元数据
    const assetMetadata = await getAssetMetadata(asset_id);
    if (!assetMetadata) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // 验证用户权限（只能访问自己的资产）
    if (assetMetadata.user_id !== session.user.id) {
      console.warn('Unauthorized asset access attempt:', {
        user_id: session.user.id,
        asset_user_id: assetMetadata.user_id,
        asset_id
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 生成新的签名下载URL
    const signedUrl = generateSignedDownloadUrl(
      asset_id,
      display_mode as 'inline' | 'attachment',
      expires_in
    );

    console.log('✅ Generated new download URL:', {
      asset_id,
      user_id: session.user.id,
      display_mode,
      expires_in
    });

    return NextResponse.json({
      url: signedUrl.url,
      expires_at: signedUrl.expires_at
    });

  } catch (error) {
    console.error('Sign download URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

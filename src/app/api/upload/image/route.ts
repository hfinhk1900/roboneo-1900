import { createHmac, randomUUID } from 'crypto';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/storage';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const csrf = enforceSameOriginCsrf(request);
  if (csrf) return csrf;
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageData, filename, contentType = 'image/png' } = body;

    if (!imageData || !filename) {
      return NextResponse.json(
        { error: 'Missing imageData or filename' },
        { status: 400 }
      );
    }

    // 验证 base64 数据格式
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileId = randomUUID();
    const fileExtension = contentType.split('/')[1] || 'png';
    const originalKey = `aibg/${fileId}.${fileExtension}`;

    // 将 base64 转换为 Buffer
    const base64Data = imageData.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 上传到 R2 使用现有的存储系统
    let uploadResult;
    let storageKey;
    
    try {
      uploadResult = await uploadFile(
        imageBuffer,
        filename,
        contentType,
        'aibg' // 指定文件夹
      );

      // 使用上传结果中的信息
      storageKey = uploadResult.key; // 使用上传后的存储键
      // Do not expose public R2 URL in API response
      
      console.log('✅ File uploaded successfully:', uploadResult);
    } catch (error) {
      console.error('Failed to upload to R2:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }

    // 保存到数据库
    const db = await getDb();
    const assetId = randomUUID();

    await db.insert(assets).values({
      id: assetId,
      key: storageKey, // 使用上传后的存储键
      filename,
      content_type: contentType,
      size: imageBuffer.length,
      user_id: session.user.id,
      metadata: JSON.stringify({
        source: 'aibg-solid-color',
        mode: 'color',
        uploaded_at: new Date().toISOString(),
      }),
    });

    // 生成签名下载 URL 用于下载功能
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24小时有效期
    const signature = createHmac(
      'sha256',
      process.env.URL_SIGNING_SECRET || 'default-secret-key'
    )
      .update(`${assetId}|${expiresAt}|inline`)
      .digest('base64url');

    const downloadUrl = `/api/assets/download?asset_id=${assetId}&exp=${expiresAt}&sig=${signature}&disp=inline`;
    const viewUrl = `/api/assets/${assetId}`;

    return NextResponse.json({
      success: true,
      assetId,
      viewUrl, // 稳定查看URL（推荐用于显示）
      downloadUrl, // 签名下载 URL（用于下载）
      key: storageKey, // 使用上传后的存储键
      size: imageBuffer.length,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

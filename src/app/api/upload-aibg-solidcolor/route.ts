import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/lib/auth';

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION!,
  endpoint: process.env.STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const originalFileName = formData.get('originalFileName') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName ? originalFileName.split('.').pop() || 'png' : 'png';
    const fileName = `aibackgrounsolidcolor/${session.user.id}/${timestamp}-${randomId}.${fileExtension}`;

    // 将 base64 转换为 Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: imageFile.type,
      Metadata: {
        userId: session.user.id,
        originalFileName: originalFileName || 'unknown',
        processedAt: new Date().toISOString(),
        processingType: 'background-removal-solid-color'
      }
    });

    await s3Client.send(uploadCommand);

    // 生成访问 URL
    const url = `${process.env.STORAGE_PUBLIC_URL}/${fileName}`;

    console.log(`✅ AIBG Solid Color 图片已上传到 R2: ${fileName}`);

    return NextResponse.json({
      success: true,
      url: url,
      fileName: fileName,
      message: 'Image uploaded successfully to R2'
    });

  } catch (error) {
    console.error('❌ AIBG Solid Color 上传到 R2 失败:', error);
    return NextResponse.json(
      { error: 'Failed to upload image to R2' },
      { status: 500 }
    );
  }
}

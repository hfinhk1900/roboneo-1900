import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import {
  generateAssetId,
  generateSignedDownloadUrl,
} from '@/lib/asset-management';
import { type NextRequest, NextResponse } from 'next/server';

interface WatermarkRemoveRequest {
  // Required: Product image (base64 encoded)
  image_input: string;

  // Optional generation parameters
  quality?: 'standard' | 'hd';
  steps?: number;
  seed?: number;
  guidance_scale?: number;
  size?: string;
  output_format?: 'jpeg' | 'png' | 'webp';
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🎯 Watermark remove request from user: ${session.user.id}`);

    // 2. 解析请求数据
    const body = (await request.json()) as WatermarkRemoveRequest;
    const {
      image_input,
      quality = 'standard',
      steps = 30,
      seed,
      guidance_scale = 3.5,
      size = '1024x1024',
      output_format = 'png',
    } = body;

    if (!image_input) {
      return NextResponse.json(
        { error: 'Missing image_input parameter' },
        { status: 400 }
      );
    }

    console.log('📝 Watermark remove parameters:', {
      quality,
      steps,
      size,
      output_format,
      hasImageInput: !!image_input,
    });

    // 3. 检查用户Credits余额
    console.log(`💳 Checking credits for user: ${session.user.id}`);
    const { getUserCreditsAction } = await import('@/actions/credits-actions');
    const creditsResult = await getUserCreditsAction({
      userId: session.user.id,
    });

    if (!creditsResult?.data?.success) {
      return NextResponse.json(
        {
          error: 'Failed to check credits',
          details:
            creditsResult?.data?.error || 'Unable to verify user credits',
        },
        { status: 500 }
      );
    }

    const currentCredits = creditsResult.data.data?.credits || 0;

    if (currentCredits < CREDITS_PER_IMAGE) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDITS_PER_IMAGE,
          current: currentCredits,
        },
        { status: 402 }
      );
    }

    console.log(
      `💳 User ${session.user.id} has ${currentCredits} credits, proceeding with watermark removal...`
    );

    // 4. 初始化 SiliconFlow 提供商
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.warn('SiliconFlow API key not configured');
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const provider = new SiliconFlowProvider(apiKey);

    // 5. 构建水印去除提示词
    const finalPrompt = 'remove the watermark of the image';

    // 添加通用质量提升词
    const qualityEnhancements = [
      'high quality image processing',
      'professional photo editing',
      'clean watermark removal',
      'maintain image clarity and details',
      'preserve original quality',
      'commercial quality result',
      'seamless watermark elimination',
    ];

    const enhancedPrompt = `${finalPrompt}, ${qualityEnhancements.join(', ')}`;

    console.log('🤖 Watermark removal prompt:', {
      prompt: enhancedPrompt.substring(0, 100) + '...',
    });

    // 6. 设置生成参数
    const generationParams = {
      prompt: enhancedPrompt,
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      size,
      quality,
      steps,
      seed,
      guidance_scale,
      output_format,
      image_input,
    };

    console.log('🚀 Generating watermark removal with SiliconFlow:', {
      model: generationParams.model,
      size: generationParams.size,
      quality: generationParams.quality,
      steps: generationParams.steps,
      hasImageInput: !!image_input,
    });

    // 7. 调用 AI 生成 - 使用专门的 watermarks 存储文件夹
    const result = await provider.generateProductShot({
      ...generationParams,
      storageFolder: 'watermarks', // 使用专门的存储文件夹
    });

    // 8. 扣减 Credits - 成功生成后
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: session.user.id,
      amount: CREDITS_PER_IMAGE,
    });

    if (deductResult?.data?.success) {
      console.log(
        `💰 Deducted ${CREDITS_PER_IMAGE} credits for watermark removal. Remaining: ${deductResult.data.data?.remainingCredits}`
      );
    } else {
      console.warn(
        '⚠️ Failed to deduct credits, but watermark removal was generated successfully'
      );
    }

    // 9. 创建资产记录
    if (!result.resultUrl) {
      throw new Error('Failed to generate image URL');
    }

    const assetId = generateAssetId();
    const fileName =
      result.resultUrl.split('/').pop() || 'watermark-removed.png';

    // 写入 assets 表
    const db = await getDb();
    await db.insert(assets).values({
      id: assetId,
      key: result.storageKey || fileName,
      filename: fileName,
      content_type: 'image/png',
      size: result.sizeBytes || 0,
      user_id: session.user.id,
      metadata: JSON.stringify({
        source: 'watermark',
        operation: 'remove',
        provider: result.provider,
        model: result.model,
      }),
    });

    // 10. 生成签名下载URL
    const downloadUrl = generateSignedDownloadUrl(assetId, 'inline', 3600);

    console.log('✅ Watermark removal asset created:', {
      asset_id: assetId,
      user_id: session.user.id,
      file_name: fileName,
      expires_at: downloadUrl.expires_at,
    });

    // 11. 返回结果（完全脱敏）
    return NextResponse.json({
      success: true,
      asset_id: assetId,
      download_url: downloadUrl.url,
      public_url: downloadUrl.url, // 兼容前端显示
      expires_at: downloadUrl.expires_at,
      operation: 'watermark_removal',
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deductResult?.data?.data?.remainingCredits ?? 0,
      credits_sufficient: true,
      from_cache: false,
    });
  } catch (error) {
    console.warn('Watermark removal error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // 根据错误类型返回不同的HTTP状态码和用户友好的消息
    let statusCode = 500;
    let userMessage = 'Watermark removal failed';

    if (errorMessage.includes('AI服务暂时不可用')) {
      statusCode = 503;
      userMessage = 'AI服务暂时不可用，请稍后重试';
    } else if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('AbortError')
    ) {
      statusCode = 408;
      userMessage = '请求超时，请重试';
    } else if (errorMessage.includes('网络')) {
      statusCode = 503;
      userMessage = '网络连接问题，请检查网络后重试';
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: errorMessage,
        provider: 'SiliconFlow',
        suggestion: '如果问题持续存在，请稍后重试或联系技术支持',
      },
      { status: statusCode }
    );
  }
}

// GET 方法用于获取服务状态
export async function GET() {
  return NextResponse.json({
    service: 'watermark-removal',
    status: 'available',
    model: 'black-forest-labs/FLUX.1-Kontext-dev',
    provider: 'SiliconFlow',
    credits_per_image: CREDITS_PER_IMAGE,
  });
}

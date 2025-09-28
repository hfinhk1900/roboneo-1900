import { getActiveSubscriptionAction } from '@/actions/get-active-subscription';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { getSession } from '@/lib/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 调试Sticker水印功能的API端点
 * 仅限管理员或当前用户使用
 */
export async function POST(request: NextRequest) {
  const csrf = enforceSameOriginCsrf(request);
  if (csrf) return csrf;

  try {
    // 验证用户身份
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 权限检查：只允许管理员或用户自己查看
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to debug this user' },
        { status: 403 }
      );
    }

    console.log(
      `🔍 Debugging sticker watermark for user ${userId}, action: ${action}`
    );

    switch (action) {
      case 'checkSubscriptionForWatermark': {
        console.log('📋 Checking subscription status for watermark logic...');

        // 模拟 image-to-sticker API 中的订阅检查逻辑
        let isSubscribed = false;
        let subscriptionData = null;
        let error = null;

        try {
          const sub = await getActiveSubscriptionAction({
            userId: userId,
          });

          subscriptionData = sub?.data;
          isSubscribed = !!sub?.data?.data;

          console.log('订阅检查结果:', {
            success: sub?.data?.success,
            hasData: !!sub?.data?.data,
            isSubscribed,
          });
        } catch (subscriptionError) {
          console.error('订阅状态检查失败:', subscriptionError);
          error =
            subscriptionError instanceof Error
              ? subscriptionError.message
              : 'Unknown error';
        }

        return NextResponse.json({
          success: true,
          action: 'checkSubscriptionForWatermark',
          userId,
          subscriptionCheck: {
            isSubscribed,
            shouldApplyWatermark: !isSubscribed,
            subscriptionData,
            error,
          },
          watermarkConfig: {
            text: 'ROBONEO.ART',
            widthRatio: 0.32,
            opacity: 0.95,
            margin: 24,
          },
          explanation: {
            logic:
              'If isSubscribed = false, watermark will be applied to sticker',
            expected: isSubscribed
              ? 'No watermark (subscribed user)'
              : 'Watermark applied (free user)',
          },
        });
      }

      case 'testWatermarkFunction': {
        console.log('🎨 Testing watermark function...');

        try {
          // 测试水印函数是否可用
          const { applyCornerWatermark } = await import('@/lib/watermark');

          // 创建一个简单的测试图片buffer（1x1 像素的PNG）
          const testBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
            0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
            0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
            0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
            0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
            0x82,
          ]);

          // 尝试应用水印
          const watermarkedBuffer = await applyCornerWatermark(
            testBuffer,
            'ROBONEO.ART',
            {
              widthRatio: 0.4,
              margin: 8,
              opacity: 0.95,
            }
          );

          const watermarkApplied = watermarkedBuffer.length > testBuffer.length;

          return NextResponse.json({
            success: true,
            action: 'testWatermarkFunction',
            watermarkTest: {
              functionAvailable: true,
              originalSize: testBuffer.length,
              watermarkedSize: watermarkedBuffer.length,
              watermarkApplied,
              message: watermarkApplied
                ? 'Watermark function is working correctly'
                : 'Watermark may not have been applied correctly',
            },
          });
        } catch (watermarkError) {
          console.error('水印函数测试失败:', watermarkError);
          return NextResponse.json({
            success: false,
            action: 'testWatermarkFunction',
            error:
              watermarkError instanceof Error
                ? watermarkError.message
                : 'Unknown error',
            watermarkTest: {
              functionAvailable: false,
              message: 'Watermark function failed',
            },
          });
        }
      }

      default: {
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('❌ Debug sticker watermark error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick watermark debug
export async function GET(request: NextRequest) {
  const csrf = enforceSameOriginCsrf(request);
  if (csrf) return csrf;

  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    // 权限检查
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to debug this user' },
        { status: 403 }
      );
    }

    // 快速检查当前用户的水印应该应用情况
    let isSubscribed = false;
    try {
      const sub = await getActiveSubscriptionAction({ userId });
      isSubscribed = !!sub?.data?.data;
    } catch (error) {
      console.error('订阅状态检查失败:', error);
    }

    return NextResponse.json({
      success: true,
      userId,
      isSubscribed,
      shouldApplyWatermark: !isSubscribed,
      watermarkExpected: isSubscribed
        ? 'No watermark'
        : 'Watermark should be applied',
      debugInstructions: {
        testSubscription: `POST /api/debug/sticker-watermark {"userId": "${userId}", "action": "checkSubscriptionForWatermark"}`,
        testWatermarkFunction: `POST /api/debug/sticker-watermark {"userId": "${userId}", "action": "testWatermarkFunction"}`,
        browserConsole: `testFreeUserWatermark('user@example.com')`,
      },
      apiLogic: {
        description: 'Image to Sticker watermark logic',
        steps: [
          '1. Check user subscription with getActiveSubscriptionAction',
          '2. If isSubscribed = false, apply watermark using applyCornerWatermark',
          '3. Upload watermarked buffer to R2 storage',
        ],
        potentialIssues: [
          'Subscription check returning wrong result',
          'Watermark function throwing error (caught silently)',
          'Watermark colors/opacity making it invisible',
          'Image format compatibility issues',
        ],
      },
    });
  } catch (error) {
    console.error('❌ Quick debug error:', error);
    return NextResponse.json(
      {
        error: 'Quick debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

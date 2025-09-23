import { auth } from '@/lib/auth';
import { type NextRequest, NextResponse } from 'next/server';

// 🔧 快速水印测试API - 验证修复后的功能
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 测试修复后的订阅状态检查
    let subscriptionResult = null;
    let subscriptionError = null;

    try {
      const { getActiveSubscriptionAction } = await import(
        '@/actions/get-active-subscription'
      );
      const sub = await getActiveSubscriptionAction({ userId });
      subscriptionResult = {
        success: sub?.data?.success,
        hasSubscription: !!sub?.data?.data,
        subscriptionData: sub?.data?.data,
      };
    } catch (error) {
      subscriptionError =
        error instanceof Error ? error.message : 'Unknown error';
    }

    // 测试水印函数可用性
    let watermarkFunctionTest = null;
    try {
      const { applyCornerWatermark } = await import('@/lib/watermark');
      // 创建一个小的测试图片buffer
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      const watermarkedBuffer = await applyCornerWatermark(testBuffer, 'TEST', {
        fontSizeRatio: 0.1,
      });

      watermarkFunctionTest = {
        available: true,
        testSuccessful: watermarkedBuffer.length > testBuffer.length,
        originalSize: testBuffer.length,
        watermarkedSize: watermarkedBuffer.length,
      };
    } catch (error) {
      watermarkFunctionTest = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const shouldShowWatermark = !subscriptionResult?.hasSubscription;

    return NextResponse.json({
      success: true,
      userId,
      currentTime: new Date().toISOString(),

      // 用户状态
      userStatus: {
        hasSubscription: subscriptionResult?.hasSubscription || false,
        shouldShowWatermark,
        watermarkExpected: shouldShowWatermark
          ? 'Yes - watermark should appear'
          : 'No - premium user',
      },

      // 订阅检查结果
      subscriptionCheck: {
        success: !subscriptionError,
        result: subscriptionResult,
        error: subscriptionError,
      },

      // 水印函数测试
      watermarkFunction: watermarkFunctionTest,

      // 修复说明
      bugFixInfo: {
        description:
          'Fixed getActiveSubscriptionAction to use correct userId parameter',
        previousBug: 'Always checked session.user.id instead of passed userId',
        impact:
          'All users were treated as subscribed users, no watermarks applied',
        fix: 'Now correctly checks the specific userId subscription status',
      },

      // 测试建议
      testInstructions: {
        forFreeUsers: [
          '1. Generate an Image to Sticker',
          '2. Check bottom-right corner for white "ROBONEO.ART" text',
          '3. Try other AI features (Profile Picture, Productshot, etc.)',
        ],
        forPremiumUsers: [
          '1. No watermark should appear on generated images',
          '2. Create a test free account to verify watermarks work',
        ],
      },
    });
  } catch (error) {
    console.error('❌ Watermark test API error:', error);
    return NextResponse.json(
      {
        error: 'Watermark test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

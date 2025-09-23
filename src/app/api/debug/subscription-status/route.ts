import { getActiveSubscriptionAction } from '@/actions/get-active-subscription';
import { getDb } from '@/db';
import { payment } from '@/db/schema';
import { enforceSameOriginCsrf } from '@/lib/csrf';
import { getSession } from '@/lib/server';
import { eq, desc } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * 订阅状态调试API
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

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing userId or action' },
        { status: 400 }
      );
    }

    // 权限检查：只允许管理员或用户自己查看
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to debug this user' },
        { status: 403 }
      );
    }

    console.log(`🔍 Debugging subscription status for user ${userId}, action: ${action}`);

    switch (action) {
      case 'getActiveSubscription': {
        console.log('📋 Fetching active subscription...');
        const result = await getActiveSubscriptionAction({ userId });
        
        return NextResponse.json({
          success: true,
          action: 'getActiveSubscription',
          data: result?.data,
          hasActiveSubscription: !!result?.data?.data,
          subscriptionDetails: result?.data?.data || null,
        });
      }

      case 'getAllPayments': {
        console.log('📋 Fetching all payment records...');
        const db = await getDb();
        const payments = await db
          .select()
          .from(payment)
          .where(eq(payment.userId, userId))
          .orderBy(desc(payment.createdAt));

        return NextResponse.json({
          success: true,
          action: 'getAllPayments',
          totalRecords: payments.length,
          payments: payments.map(p => ({
            id: p.id,
            subscriptionId: p.subscriptionId,
            customerId: p.customerId,
            priceId: p.priceId,
            status: p.status,
            type: p.type,
            interval: p.interval,
            periodStart: p.periodStart?.toISOString(),
            periodEnd: p.periodEnd?.toISOString(),
            cancelAtPeriodEnd: p.cancelAtPeriodEnd,
            trialStart: p.trialStart?.toISOString(),
            trialEnd: p.trialEnd?.toISOString(),
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
        });
      }

      case 'checkStripeStatus': {
        console.log('🔄 Checking Stripe real-time status...');
        
        // 首先获取用户的订阅记录
        const db = await getDb();
        const userPayments = await db
          .select()
          .from(payment)
          .where(eq(payment.userId, userId))
          .orderBy(desc(payment.createdAt));

        if (userPayments.length === 0) {
          return NextResponse.json({
            success: true,
            action: 'checkStripeStatus',
            message: 'No payment records found for this user',
            stripeChecks: [],
          });
        }

        // 检查每个订阅的Stripe状态
        const stripeChecks = [];
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        for (const paymentRecord of userPayments) {
          if (paymentRecord.subscriptionId) {
            try {
              console.log(`🔍 Checking Stripe subscription: ${paymentRecord.subscriptionId}`);
              const stripeSubscription = await stripe.subscriptions.retrieve(
                paymentRecord.subscriptionId
              );

              stripeChecks.push({
                subscriptionId: paymentRecord.subscriptionId,
                localStatus: paymentRecord.status,
                stripeStatus: stripeSubscription.status,
                statusMatch: paymentRecord.status === stripeSubscription.status,
                stripeCancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                localCancelAtPeriodEnd: paymentRecord.cancelAtPeriodEnd,
                stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                localPeriodEnd: paymentRecord.periodEnd?.toISOString(),
                stripeUpdated: new Date(stripeSubscription.created * 1000).toISOString(),
                localUpdated: paymentRecord.updatedAt.toISOString(),
              });
            } catch (stripeError) {
              console.error(`❌ Error checking Stripe subscription ${paymentRecord.subscriptionId}:`, stripeError);
              stripeChecks.push({
                subscriptionId: paymentRecord.subscriptionId,
                localStatus: paymentRecord.status,
                stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown error',
                statusMatch: false,
              });
            }
          }
        }

        return NextResponse.json({
          success: true,
          action: 'checkStripeStatus',
          totalChecks: stripeChecks.length,
          stripeChecks,
          summary: {
            totalSubscriptions: userPayments.filter(p => p.subscriptionId).length,
            statusMismatches: stripeChecks.filter(check => !check.statusMatch).length,
            stripeErrors: stripeChecks.filter(check => check.stripeError).length,
          },
        });
      }

      default: {
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('❌ Debug subscription status error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick status check
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

    // 快速状态检查
    const activeSubResult = await getActiveSubscriptionAction({ userId });
    
    return NextResponse.json({
      success: true,
      userId,
      hasActiveSubscription: !!activeSubResult?.data?.data,
      subscriptionSummary: activeSubResult?.data?.data ? {
        id: activeSubResult.data.data.id,
        status: activeSubResult.data.data.status,
        type: activeSubResult.data.data.type,
        interval: activeSubResult.data.data.interval,
      } : null,
      debugInstructions: {
        browserConsole: `debugSubscriptionStatus('${userId}')`,
        apiEndpoint: '/api/debug/subscription-status',
      }
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

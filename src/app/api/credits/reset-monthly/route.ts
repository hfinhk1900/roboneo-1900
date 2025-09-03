import {
  getCreditsForPlan,
  getPlanIdFromPriceId,
} from '@/config/credits-config';
import { getDb } from '@/db';
import { payment, user } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { enforceSameOriginCsrf } from '@/lib/csrf';

/**
 * API endpoint for resetting monthly credits
 * This should be called by a cron job or similar automated system
 *
 * Example usage:
 * POST /api/credits/reset-monthly
 * Headers: { "Authorization": "Bearer your-api-key" }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = enforceSameOriginCsrf(req);
  if (csrf) return csrf;
  try {
    // In production, you should verify the API key here
    const authHeader = req.headers.get('authorization');
    const expectedApiKey = process.env.CRON_API_KEY; // Add this to your .env file

    if (expectedApiKey && authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting monthly credits reset...');

    const db = await getDb();
    let usersUpdated = 0;

    // Get all active subscriptions
    const activeSubscriptions = await db
      .select({
        userId: payment.userId,
        priceId: payment.priceId,
        status: payment.status,
        subscriptionId: payment.subscriptionId,
      })
      .from(payment)
      .where(
        and(eq(payment.type, 'subscription'), eq(payment.status, 'active'))
      );

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    // Process each subscription
    for (const subscription of activeSubscriptions) {
      try {
        // Get plan ID from price ID
        const planId = getPlanIdFromPriceId(subscription.priceId);
        if (!planId) {
          console.warn(`No plan ID found for price ${subscription.priceId}`);
          continue;
        }

        // Get credits configuration
        const creditsConfig = getCreditsForPlan(planId);
        if (!creditsConfig || creditsConfig.resetType !== 'monthly') {
          console.log(
            `Skipping user ${subscription.userId} - plan ${planId} doesn't have monthly reset`
          );
          continue;
        }

        // Reset user's credits
        await db
          .update(user)
          .set({
            credits: creditsConfig.monthlyCredits,
            updatedAt: new Date(),
          })
          .where(eq(user.id, subscription.userId));

        console.log(
          `✅ Reset credits for user ${subscription.userId} to ${creditsConfig.monthlyCredits} (plan: ${planId})`
        );
        usersUpdated++;
      } catch (error) {
        console.error(
          `Error resetting credits for user ${subscription.userId}:`,
          error
        );
        // Continue processing other users even if one fails
      }
    }

    console.log(
      `🎉 Monthly credits reset completed. Updated ${usersUpdated} users.`
    );

    return NextResponse.json({
      success: true,
      message: 'Monthly credits reset completed',
      usersUpdated,
    });
  } catch (error) {
    console.error('Error in monthly credits reset:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset monthly credits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

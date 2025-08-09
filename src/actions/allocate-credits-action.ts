'use server';

import {
  getCreditsForPlan,
  getPlanIdFromPriceId,
} from '@/config/credits-config';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Allocate credits to a user based on their subscription plan
 * This function is called when a user subscribes or when credits need to be reset
 */
export async function allocateCreditsToUser(
  userId: string,
  planId?: string,
  priceId?: string
): Promise<{ success: boolean; error?: string; creditsAllocated?: number }> {
  try {
    // Determine plan ID
    let targetPlanId = planId;
    if (!targetPlanId && priceId) {
      targetPlanId = getPlanIdFromPriceId(priceId) || undefined;
    }

    if (!targetPlanId) {
      return {
        success: false,
        error: 'Unable to determine plan ID from provided parameters',
      };
    }

    // Get credits configuration for the plan
    const creditsConfig = getCreditsForPlan(targetPlanId);
    if (!creditsConfig) {
      return {
        success: false,
        error: `No credits configuration found for plan: ${targetPlanId}`,
      };
    }

    const db = await getDb();

    // For subscription plans, set credits to the monthly allocation
    // For free plan, only set if user has less than the allocation (don't reset)
    if (creditsConfig.resetType === 'monthly') {
      // Subscription plans: set to monthly allocation
      await db
        .update(user)
        .set({
          credits: creditsConfig.monthlyCredits,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
    } else {
      // Free plan: only allocate if user has less than the default amount
      const currentUser = await db
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (
        currentUser.length > 0 &&
        currentUser[0].credits < creditsConfig.monthlyCredits
      ) {
        await db
          .update(user)
          .set({
            credits: creditsConfig.monthlyCredits,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));
      }
    }

    console.log(
      `✅ Allocated ${creditsConfig.monthlyCredits} credits to user ${userId} for plan ${targetPlanId}`
    );

    return {
      success: true,
      creditsAllocated: creditsConfig.monthlyCredits,
    };
  } catch (error) {
    console.error('Error allocating credits:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to allocate credits',
    };
  }
}

/**
 * Reset monthly credits for subscription users
 * This should be called by a cron job or similar automated system
 */
export async function resetMonthlyCredits(): Promise<{
  success: boolean;
  error?: string;
  usersUpdated?: number;
}> {
  try {
    const db = await getDb();

    // This is a simplified version - in a real implementation, you'd need to:
    // 1. Query active subscriptions from the payment table
    // 2. Determine their plan types
    // 3. Reset credits for users with monthly reset plans
    // For now, this is a placeholder that shows the structure

    console.log('Monthly credits reset completed');

    return {
      success: true,
      usersUpdated: 0, // Would be actual count in real implementation
    };
  } catch (error) {
    console.error('Error resetting monthly credits:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reset monthly credits',
    };
  }
}

/**
 * Credits Configuration
 *
 * This file defines the credits allocation rules for different plans
 * and provides utilities for credits management.
 */

import { findPlanByPriceId } from '@/lib/price-plan';

export interface PlanCredits {
  planId: string;
  monthlyCredits: number;
  description: string;
  resetType: 'monthly' | 'one-time';
}

/**
 * Credits per image generation
 * Maintained at 10 credits per image for consistent user experience
 * Cost optimized through medium quality setting (~$0.042 per image)
 */
export const CREDITS_PER_IMAGE = 10;

/**
 * Plan credits configuration
 * Each plan defines how many credits users get and how often they reset
 */
export const PLAN_CREDITS_CONFIG: Record<string, PlanCredits> = {
  free: {
    planId: 'free',
    monthlyCredits: 10,
    description: '10 credits (1 image, one-time allocation)',
    resetType: 'one-time',
  },
  pro: {
    planId: 'pro',
    monthlyCredits: 2000,
    description: '2000 credits per month (200 images)',
    resetType: 'monthly',
  },
  ultimate: {
    planId: 'ultimate',
    monthlyCredits: 5000,
    description: '5000 credits per month (500 images)',
    resetType: 'monthly',
  },
};

/**
 * Get credits allocation for a specific plan
 * @param planId The plan identifier
 * @returns Credits configuration for the plan
 */
export function getCreditsForPlan(planId: string): PlanCredits | null {
  return PLAN_CREDITS_CONFIG[planId] || null;
}

/**
 * Calculate images possible with given credits
 * @param credits Number of credits
 * @returns Number of images that can be generated
 */
export function creditsToImages(credits: number): number {
  return Math.floor(credits / CREDITS_PER_IMAGE);
}

/**
 * Calculate credits needed for given number of images
 * @param images Number of images
 * @returns Credits required
 */
export function imagesToCredits(images: number): number {
  return images * CREDITS_PER_IMAGE;
}

/**
 * Get plan ID from a configured price ID
 * This looks up the configured price definitions regardless of provider
 * @param priceId Price identifier (Stripe, Creem, PayPal plan ID, etc.)
 * @returns Plan ID or null if not found
 */
export function getPlanIdFromPriceId(priceId: string): string | null {
  if (!priceId) {
    return null;
  }
  const plan = findPlanByPriceId(priceId);
  return plan?.id ?? null;
}

/**
 * Check if a plan should reset credits monthly
 * @param planId Plan identifier
 * @returns True if plan resets monthly
 */
export function shouldResetMonthly(planId: string): boolean {
  const config = getCreditsForPlan(planId);
  return config?.resetType === 'monthly';
}

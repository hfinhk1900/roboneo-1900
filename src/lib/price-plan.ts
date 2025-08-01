import { websiteConfig } from '@/config/website';
import {
  PaymentTypes,
  PlanIntervals,
  type Price,
  type PricePlan,
} from '@/payment/types';

/**
 * Get all price plans (without translations, like name/description/features)
 * NOTICE: This function can be used in server or client components.
 * @returns Array of price plans
 */
export const getAllPricePlans = (): PricePlan[] => {
  return Object.values(websiteConfig.price.plans);
};

/**
 * Find a price plan by plan ID
 * @param planId Plan ID to find
 * @returns Plan object or undefined if not found
 */
export function findPlanByPlanId(planId: string): PricePlan | undefined {
  console.log(`findPlanByPlanId: Looking for plan with ID ${planId}`);
  console.log(
    `findPlanByPlanId: Available plans: ${Object.keys(websiteConfig.price.plans).join(', ')}`
  );

  const plan = websiteConfig.price.plans[planId];
  console.log(`findPlanByPlanId: Found plan: ${plan ? 'Yes' : 'No'}`);

  return plan;
}

/**
 * Find a price in a plan by price ID
 * @param planId Plan ID to search in
 * @param priceId Price ID to find
 * @returns Price object or undefined if not found
 */
export function findPriceInPlan(
  planId: string,
  priceId: string
): Price | undefined {
  console.log(
    `findPriceInPlan: Looking for price ${priceId} in plan ${planId}`
  );

  const plan = findPlanByPlanId(planId);
  if (!plan) {
    console.log(`findPriceInPlan: Plan ${planId} not found`);
    return undefined;
  }

  // Find price by price ID
  const price = plan.prices.find((p) => p.priceId === priceId);
  console.log(`findPriceInPlan: Found price: ${price ? 'Yes' : 'No'}`);
  if (price) {
    console.log(
      `findPriceInPlan: Price details: ${price.type}, ${price.interval}, ${price.amount}`
    );
  }

  return price;
}

/**
 * Find a price for monthly subscription in a plan
 * @param planId Plan ID to search in
 * @returns Price object or undefined if not found
 */
export function findMonthlyPriceInPlan(planId: string): Price | undefined {
  const plan = findPlanByPlanId(planId);
  if (!plan) {
    return undefined;
  }

  return plan.prices.find(
    (p) =>
      p.type === PaymentTypes.SUBSCRIPTION &&
      p.interval === PlanIntervals.MONTH &&
      !p.disabled
  );
}

/**
 * Find a price for yearly subscription in a plan
 * @param planId Plan ID to search in
 * @returns Price object or undefined if not found
 */
export function findYearlyPriceInPlan(planId: string): Price | undefined {
  const plan = findPlanByPlanId(planId);
  if (!plan) {
    return undefined;
  }

  return plan.prices.find(
    (p) =>
      p.type === PaymentTypes.SUBSCRIPTION &&
      p.interval === PlanIntervals.YEAR &&
      !p.disabled
  );
}

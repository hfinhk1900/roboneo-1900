'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getPricePlans } from '@/config/price-config';
import { cn } from '@/lib/utils';
import {
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type PricePlan,
} from '@/payment/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PricingCard } from './pricing-card';

interface PricingTableProps {
  metadata?: Record<string, string>;
  currentPlan?: PricePlan | null;
  className?: string;
}

/**
 * Pricing Table Component
 *
 * 1. Displays all pricing plans with interval selection tabs for subscription plans,
 * free plans and one-time purchase plans are always displayed
 * 2. If a plan is disabled, it will not be displayed in the pricing table
 * 3. If a price is disabled, it will not be displayed in the pricing table
 */
export function PricingTable({
  metadata,
  currentPlan,
  className,
}: PricingTableProps) {
  const t = useTranslations('PricingPage');
  const [interval, setInterval] = useState<PlanInterval>(PlanIntervals.YEAR);
  const [isClient, setIsClient] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get price plans with translations
  const pricePlans = getPricePlans();
  const plans = Object.values(pricePlans);

  // Current plan ID for comparison
  const currentPlanId = currentPlan?.id || null;

  // Filter plans into free, subscription and one-time plans
  const freePlans = plans.filter((plan) => plan.isFree && !plan.disabled);

  const subscriptionPlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.SUBSCRIPTION
      )
  );

  const oneTimePlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.ONE_TIME
      )
  );

  // Check if any plan has a monthly price option
  const hasMonthlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some(
      (price) =>
        price.type === PaymentTypes.SUBSCRIPTION &&
        price.interval === PlanIntervals.MONTH
    )
  );

  // Check if any plan has a yearly price option
  const hasYearlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some(
      (price) =>
        price.type === PaymentTypes.SUBSCRIPTION &&
        price.interval === PlanIntervals.YEAR
    )
  );

  const handleIntervalChange = (value: string) => {
    setInterval(value as PlanInterval);
  };

  if (!isClient) {
    return <div className="h-48 w-full" />; // Simple placeholder until client-side render
  }

  return (
    <div className={cn('flex flex-col gap-12', className)}>
      {/* Show interval toggle if there are subscription plans */}
      {(hasMonthlyOption || hasYearlyOption) &&
        subscriptionPlans.length > 0 && (
          <div className="flex justify-center items-center mt-8">
            <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-sm border border-gray-200">
              {/* Annually Button - Left Side */}
              {hasYearlyOption && (
                <button
                  onClick={() => handleIntervalChange('year')}
                  className={cn(
                    'relative flex items-center space-x-2 rounded-full px-6 py-2 text-base font-semibold transition-all duration-300 focus:outline-none cursor-pointer',
                    interval === 'year'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  <span>{t('annually')}</span>
                  {interval === 'year' && (
                    <span
                      className="text-sm font-medium text-primary-foreground px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#FFF3C5', color: '#1f2937' }}
                    >
                      {t('save20')}
                    </span>
                  )}
                </button>
              )}

              {/* Monthly Button - Right Side */}
              {hasMonthlyOption && (
                <button
                  onClick={() => handleIntervalChange('month')}
                  className={cn(
                    'relative rounded-full px-6 py-2 text-base font-semibold transition-all duration-300 focus:outline-none cursor-pointer',
                    interval === 'month'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  {t('monthly')}
                </button>
              )}
            </div>
          </div>
        )}

      {/* Calculate total number of visible plans */}
      {(() => {
        const totalVisiblePlans =
          freePlans.length + subscriptionPlans.length + oneTimePlans.length;
        return (
          <div
            className={cn(
              'grid gap-6',
              // Universal solution that handles any number of cards
              totalVisiblePlans === 1 && 'grid-cols-1 max-w-lg mx-auto w-full',
              totalVisiblePlans === 2 &&
                'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto w-full',
              totalVisiblePlans === 3 &&
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto w-full',
              totalVisiblePlans === 4 &&
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
              totalVisiblePlans >= 5 &&
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            )}
          >
            {/* Render free plans (always visible) */}
            {freePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
              />
            ))}

            {/* Render subscription plans with the selected interval */}
            {subscriptionPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                interval={interval}
                paymentType={PaymentTypes.SUBSCRIPTION}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
              />
            ))}

            {/* Render one-time plans (always visible) */}
            {oneTimePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                paymentType={PaymentTypes.ONE_TIME}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
              />
            ))}
          </div>
        );
      })()}

      {/* Price disclaimer */}
      <div className="flex justify-center mt-1">
        <p className="text-base text-muted-foreground">{t('disclaimer')}</p>
      </div>
    </div>
  );
}

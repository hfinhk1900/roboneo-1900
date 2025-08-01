'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocalePathname } from '@/i18n/navigation';
import { formatPrice } from '@/lib/formatter';
import { cn } from '@/lib/utils';
import {
  type PaymentType,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type Price,
  type PricePlan,
} from '@/payment/types';
import { CheckCircleIcon, XCircleIcon, Zap, HandCoins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoginWrapper } from '../auth/login-wrapper';
import { CheckoutButton } from './create-checkout-button';

interface PricingCardProps {
  plan: PricePlan;
  interval?: PlanInterval; // 'month' or 'year'
  paymentType?: PaymentType; // 'subscription' or 'one_time'
  metadata?: Record<string, string>;
  className?: string;
  isCurrentPlan?: boolean;
}

/**
 * Get the appropriate price object for the selected interval and payment type
 * @param plan The price plan
 * @param interval The selected interval (month or year)
 * @param paymentType The payment type (SUBSCRIPTION or one_time)
 * @returns The price object or undefined if not found
 */
function getPriceForPlan(
  plan: PricePlan,
  interval?: PlanInterval,
  paymentType?: PaymentType
): Price | undefined {
  if (plan.isFree) {
    // Free plan has no price
    return undefined;
  }

  // non-free plans must have a price
  return plan.prices.find((price) => {
    if (paymentType === PaymentTypes.ONE_TIME) {
      return price.type === PaymentTypes.ONE_TIME;
    }
    return (
      price.type === PaymentTypes.SUBSCRIPTION && price.interval === interval
    );
  });
}

/**
 * Pricing Card Component
 *
 * Displays a single pricing plan with features and action button
 */
export function PricingCard({
  plan,
  interval,
  paymentType,
  metadata,
  className,
  isCurrentPlan = false,
}: PricingCardProps) {
  const t = useTranslations('PricingPage.PricingCard');
  const price = getPriceForPlan(plan, interval, paymentType);
  const currentUser = useCurrentUser();
  const currentPath = useLocalePathname();
  // console.log('pricing card, currentPath', currentPath);

  // generate formatted price and price label
  let formattedPrice = '';
  let originalPrice = '';
  let priceLabel = '';
  let yearlyInfo = '';

  if (plan.isFree) {
    formattedPrice = t('freePrice');
  } else if (price && price.amount > 0) {
    // price is available
    if (interval === PlanIntervals.MONTH) {
      formattedPrice = formatPrice(price.amount, price.currency);
      priceLabel = t('perMonth');
    } else if (interval === PlanIntervals.YEAR) {
      // 获取月付价格作为原价
      const monthlyPrice = plan.prices.find(p => p.interval === PlanIntervals.MONTH);
      if (monthlyPrice) {
        originalPrice = formatPrice(monthlyPrice.amount, monthlyPrice.currency);
        // 显示年付月均价格（年付总价÷12）
        const yearlyMonthlyPrice = Math.round(price.amount / 12);
        formattedPrice = formatPrice(yearlyMonthlyPrice, price.currency);
        priceLabel = t('perMonth');

        // 计算年付信息和节省金额
        const yearlyTotal = formatPrice(price.amount, price.currency);
        const savingsAmount = (monthlyPrice.amount * 12) - price.amount;
        const savingsPercentage = Math.round((savingsAmount / (monthlyPrice.amount * 12)) * 100);
        yearlyInfo = `Billed ${yearlyTotal} yearly - Save ${savingsPercentage}%`;
      } else {
      const monthlyPrice = Math.round(price.amount / 12);
      formattedPrice = formatPrice(monthlyPrice, price.currency);
      priceLabel = t('perMonth');
      }
    } else {
      formattedPrice = formatPrice(price.amount, price.currency);
    }
  } else {
    formattedPrice = t('notAvailable');
  }

  // check if plan is not free and has a price
  const isPaidPlan = !plan.isFree && !!price;
  // check if plan has a trial period, period is greater than 0
  const hasTrialPeriod = price?.trialPeriodDays && price.trialPeriodDays > 0;

  return (
    <Card
      className={cn(
        'flex flex-col h-full bg-white',
        plan.recommended && 'relative border-amber-400 shadow-lg shadow-amber-100 dark:shadow-amber-900/20',
        isCurrentPlan &&
          'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20',
        className
      )}
    >
      {/* show popular badge if plan is recommended */}
      {plan.recommended && (
        <span
          className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-sm font-medium border
        bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 shadow-sm"
        >
          {t('popular')}
        </span>
      )}

      {/* show current plan badge if plan is current plan */}
      {isCurrentPlan && (
        <span
          className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-sm font-medium border
        bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800 shadow-sm"
        >
          {t('currentPlan')}
        </span>
      )}

      <CardHeader>
        <CardTitle>
          <h3 className="font-medium">{plan.name}</h3>
        </CardTitle>

        {/* show price and price label */}
        {interval === PlanIntervals.YEAR && originalPrice ? (
          <div className="my-4">
            {/* 显示原价（划掉）和优惠价 */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-gray-400 line-through">
                {originalPrice}
              </span>
              <span className="text-4xl font-semibold">
                {formattedPrice}
              </span>
              {priceLabel && <span className="text-2xl">{priceLabel}</span>}
            </div>
          </div>
        ) : (
        <div className="flex items-baseline gap-2">
          <span className="my-4 block text-4xl font-semibold">
            {formattedPrice}
          </span>
          {priceLabel && <span className="text-2xl">{priceLabel}</span>}
        </div>
        )}

        {/* 显示年付节省信息 */}
        {interval === PlanIntervals.YEAR && yearlyInfo && (
          <p className="text-base text-muted-foreground -mt-2 mb-2">
            {yearlyInfo}
          </p>
        )}

        <CardDescription>
          <p className="text-base">{plan.description}</p>
        </CardDescription>

        {/* show action buttons based on plans */}
        {plan.isFree ? (
          currentUser ? (
            <Button
              variant="outline"
              className="mt-4 w-full disabled"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--primary)'
              }}
            >
              {t('getStartedForFree')}
            </Button>
          ) : (
            <LoginWrapper mode="modal" asChild callbackUrl={currentPath}>
              <Button
                variant="outline"
                className="mt-4 w-full cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderColor: 'var(--primary)'
                }}
              >
                {t('getStartedForFree')}
              </Button>
            </LoginWrapper>
          )
        ) : isCurrentPlan ? (
          <Button
            disabled
            className="mt-4 w-full bg-blue-100 dark:bg-blue-800
          text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700"
          >
            {t('yourCurrentPlan')}
          </Button>
        ) : isPaidPlan ? (
          currentUser ? (
            <CheckoutButton
              userId={currentUser.id}
              planId={plan.id}
              priceId={price.priceId}
              metadata={metadata}
              className="mt-4 w-full cursor-pointer"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--primary)'
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {plan.isLifetime
                  ? t('getLifetimeAccess')
                  : plan.id === 'free'
                    ? t('getStartedForFree')
                    : plan.id === 'pro'
                      ? t('getPro')
                      : plan.id === 'ultimate'
                        ? t('getUltimate')
                        : plan.id === 'premium'
                          ? t('upgradeToPremium')
                          : t('getStarted')
                }
                <Zap className="w-4 h-4" />
              </div>
            </CheckoutButton>
          ) : (
            <LoginWrapper mode="modal" asChild callbackUrl={currentPath}>
              <Button
                variant="default"
                className="mt-4 w-full cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderColor: 'var(--primary)'
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  {plan.id === 'free'
                    ? t('getStartedForFree')
                    : plan.id === 'pro'
                      ? t('getPro')
                      : plan.id === 'ultimate'
                        ? t('getUltimate')
                        : plan.id === 'premium'
                          ? t('upgradeToPremium')
                          : t('getStarted')
                  }
                  <Zap className="w-4 h-4" />
                </div>
              </Button>
            </LoginWrapper>
          )
        ) : (
          <Button disabled className="mt-4 w-full">
            {t('notAvailable')}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <hr className="border-dashed" />

        {/* show refund policy for paid subscription plans */}
        {isPaidPlan && paymentType === PaymentTypes.SUBSCRIPTION && (
          <div className="my-4">
            <p className="text-sm text-muted-foreground text-center">
              Cancel anytime. 7 days refund.
            </p>
          </div>
        )}

        {/* show trial period if it exists */}
        {hasTrialPeriod && (
          <div className="my-4">
            <span
              className="inline-block px-2.5 py-1.5 text-sm font-medium rounded-md
            bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-sm"
            >
              {t('daysTrial', { days: price.trialPeriodDays as number })}
            </span>
          </div>
        )}

        {/* show features of this plan */}
        <ul className="list-outside space-y-4 text-base">
          {plan.features?.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircleIcon className="size-4 text-green-500 dark:text-green-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* show limits of this plan */}
        <ul className="list-outside space-y-4 text-base">
          {plan.limits?.map((limit, i) => (
            <li key={i} className="flex items-center gap-2">
              {limit.toLowerCase().includes('save') || limit.toLowerCase().includes('省') ? (
                <HandCoins className="size-4 text-amber-500 dark:text-amber-400" />
              ) : (
              <XCircleIcon className="size-4 text-gray-500 dark:text-gray-400" />
              )}
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

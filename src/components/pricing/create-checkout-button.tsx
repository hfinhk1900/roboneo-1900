'use client';

import { createCheckoutAction } from '@/actions/create-checkout-session';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  userId: string;
  planId: string;
  priceId: string;
  metadata?: Record<string, string>;
  variant?:
    | 'default'
    | 'outline'
    | 'destructive'
    | 'secondary'
    | 'ghost'
    | 'link'
    | null;
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Checkout Button
 *
 * This client component creates a Stripe checkout session and redirects to it
 * It's used to initiate the checkout process for a specific plan and price.
 *
 * NOTICE: Login is required when using this button.
 */
export function CheckoutButton({
  userId,
  planId,
  priceId,
  metadata,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CheckoutButtonProps) {
  const t = useTranslations('PricingPage.CheckoutButton');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      console.log('Creating checkout with:', { userId, planId, priceId });

      // 添加硬编码的价格ID映射以解决环境变量问题
      let actualPriceId = priceId;

      // 如果priceId是空或undefined，则使用硬编码的价格ID
      if (!actualPriceId || actualPriceId === 'undefined' || actualPriceId === 'null') {
        // 根据planId和元数据确定应该使用哪个价格ID
        const defaultPrices = {
          pro: {
            month: 'price_1RpypQ51DiSYNsnGiKkRXeva',
            year: 'price_1Rq05X51DiSYNsnG2BIOow3Y'
          },
          ultimate: {
            month: 'price_1Rpypy51DiSYNsnGuPxDoPw5',
            year: 'price_1Rq05q51DiSYNsnGaNSxEWxi'
          }
        };

        // 默认使用月度价格
        const interval = metadata?.interval || 'month';

        if (planId === 'pro') {
          actualPriceId = defaultPrices.pro[interval as 'month' | 'year'];
          console.log(`Using default Pro ${interval} price:`, actualPriceId);
        } else if (planId === 'ultimate') {
          actualPriceId = defaultPrices.ultimate[interval as 'month' | 'year'];
          console.log(`Using default Ultimate ${interval} price:`, actualPriceId);
        }
      }

      console.log('Final price ID being used:', actualPriceId);

      const mergedMetadata = metadata ? { ...metadata } : {};

      // add promotekit_referral to metadata if enabled promotekit affiliate
      if (websiteConfig.features.enablePromotekitAffiliate) {
        const promotekitReferral =
          typeof window !== 'undefined'
            ? (window as any).promotekit_referral
            : undefined;
        if (promotekitReferral) {
          console.log(
            'create checkout button, promotekitReferral:',
            promotekitReferral
          );
          mergedMetadata.promotekit_referral = promotekitReferral;
        }
      }

      // add affonso_referral to metadata if enabled affonso affiliate
      if (websiteConfig.features.enableAffonsoAffiliate) {
        const affonsoReferral =
          typeof document !== 'undefined'
            ? (() => {
                const match = document.cookie.match(
                  /(?:^|; )affonso_referral=([^;]*)/
                );
                return match ? decodeURIComponent(match[1]) : null;
              })()
            : null;
        if (affonsoReferral) {
          console.log(
            'create checkout button, affonsoReferral:',
            affonsoReferral
          );
          mergedMetadata.affonso_referral = affonsoReferral;
        }
      }

      // Create checkout session using server action
      const result = await createCheckoutAction({
        userId,
        planId,
        priceId: actualPriceId, // Use the determined actualPriceId
        metadata:
          Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      });

      console.log('Checkout result:', JSON.stringify(result, null, 2));

      // Redirect to checkout page
      if (result?.data?.success && result.data.data?.url) {
        window.location.href = result.data.data?.url;
      } else {
        console.error('Create checkout session error, result:', result);
        toast.error(t('checkoutFailed'));
      }
    } catch (error) {
      console.error('Create checkout session error:', error);
      toast.error(t('checkoutFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          {t('loading')}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

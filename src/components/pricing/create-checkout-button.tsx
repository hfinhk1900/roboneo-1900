'use client';

import { createCheckoutAction } from '@/actions/create-checkout-session';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  style?: React.CSSProperties;
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
  style,
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

      console.log('Using price ID from environment variables:', priceId);

      if (
        !priceId ||
        typeof priceId !== 'string' ||
        priceId.trim().length === 0
      ) {
        console.error('Checkout aborted: priceId is missing or empty.');
        toast.error(t('checkoutFailed'));
        return;
      }

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
        priceId,
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
      style={style}
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

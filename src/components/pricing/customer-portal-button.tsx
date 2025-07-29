'use client';

import { createPortalAction } from '@/actions/create-customer-portal-session';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface CustomerPortalButtonProps {
  userId: string;
  returnUrl?: string;
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
 * Customer Portal Button
 *
 * This client component opens the Stripe customer portal
 * It's used to let customers manage their billing, subscriptions, and payment methods
 *
 * NOTICE: Login is required when using this button.
 */
export function CustomerPortalButton({
  userId,
  returnUrl,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CustomerPortalButtonProps) {
  const t = useTranslations('Dashboard.settings.billing.CustomerPortalButton');
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      console.log(`尝试为用户 ${userId} 创建客户门户会话`);

      // Create customer portal session using server action
      const result = await createPortalAction({
        userId,
        returnUrl,
      });

      console.log('客户门户创建结果:', result);

      // Redirect to customer portal
      if (result?.data?.success && result.data.data?.url) {
        console.log(`成功获取客户门户URL，准备重定向到: ${result.data.data.url}`);
        window.location.href = result.data.data?.url;
      } else {
        console.error('创建客户门户失败，返回结果:', JSON.stringify(result, null, 2));
        if (result?.data?.error) {
          toast.error(`${t('createCustomerPortalFailed')}: ${result.data.error}`);
        } else {
          toast.error(t('createCustomerPortalFailed'));
        }
      }
    } catch (error) {
      console.error('创建客户门户时发生错误:', error);
      toast.error(t('createCustomerPortalFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className, 'cursor-pointer')}
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

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, any>) => {
        render: (selector: HTMLElement | string) => void;
      };
    };
  }
}

interface PayPalSubscribeButtonProps {
  planId: string;
  clientId: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * PayPal subscription button wrapper
 *
 * Handles loading the PayPal SDK script on the client and renders
 * the subscription button for a given plan ID.
 */
export function PayPalSubscribeButton({
  planId,
  clientId,
  className,
  style,
}: PayPalSubscribeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!planId || !clientId) {
      setLoadError('Missing PayPal configuration.');
      return;
    }

    let isMounted = true;

    const renderButton = () => {
      if (!isMounted || !window.paypal || !containerRef.current) {
        return;
      }

      try {
        containerRef.current.innerHTML = '';
        window.paypal
          .Buttons({
            style: {
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe',
            },
            createSubscription(_: Record<string, unknown>, actions: any) {
              return actions.subscription.create({
                plan_id: planId,
              });
            },
            onApprove(data: Record<string, any>) {
              const subscriptionId = data?.subscriptionID as string | undefined;
              if (subscriptionId) {
                toast.success('PayPal subscription activated.', {
                  description: `Subscription ID: ${subscriptionId}`,
                });
              } else {
                toast.success('PayPal subscription approved.');
              }
            },
            onError(error: unknown) {
              console.error('PayPal subscription error:', error);
              toast.error(
                'Unable to complete PayPal checkout. Please try again.'
              );
            },
          })
          .render(containerRef.current);
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('PayPal button render error:', error);
        if (isMounted) {
          setLoadError('Unable to render PayPal button.');
          toast.error(
            'Failed to render PayPal button. Please refresh and try again.'
          );
        }
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk]'
    );

    if (existingScript) {
      const handleLoad = () => {
        renderButton();
      };

      if (window.paypal) {
        renderButton();
      } else {
        existingScript.addEventListener('load', handleLoad, { once: true });
      }

      return () => {
        isMounted = false;
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&vault=true&intent=subscription`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.dataset.paypalClientId = clientId;

    const handleLoad = () => {
      renderButton();
    };

    const handleError = () => {
      console.error('Failed to load PayPal SDK script.');
      if (isMounted) {
        setLoadError('Unable to load PayPal SDK script.');
        toast.error(
          'Unable to load PayPal. Please check your network and try again.'
        );
      }
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError, { once: true });
    document.body.appendChild(script);

    return () => {
      isMounted = false;
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [planId, clientId]);

  if (loadError || !planId || !clientId) {
    return (
      <Button
        disabled
        className={cn('w-full cursor-not-allowed opacity-60', className)}
        style={style}
      >
        PayPal unavailable
      </Button>
    );
  }

  return (
    <div className={cn('w-full', className)} style={style}>
      {!isReady && (
        <Button disabled className="mb-2 w-full" variant="outline">
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Loading PayPal…
        </Button>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

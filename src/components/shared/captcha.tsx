'use client';

import { FormMessage } from '@/components/ui/form';
import { websiteConfig } from '@/config/website';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { forwardRef, useMemo, useState } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

const Turnstile = dynamic(
  () => import('@marsidev/react-turnstile').then((mod) => mod.Turnstile),
  {
    ssr: false,
  }
);

type Props = Omit<ComponentProps<typeof Turnstile>, 'siteKey'> & {
  validationError?: string;
};

/**
 * Captcha component for Cloudflare Turnstile
 */
export const Captcha = forwardRef<TurnstileInstance | undefined, Props>(
  ({ validationError, options: optionsProp, ...props }, ref) => {
  const turnstileEnabled = websiteConfig.features.enableTurnstileCaptcha;
  if (!turnstileEnabled || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    console.error('Captcha, NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set');
    return null;
  }

  const locale = useLocale();
  const [initialWidth] = useState<number | undefined>(() =>
    typeof window !== 'undefined' ? window.innerWidth : undefined
  );
  const viewportWidth = initialWidth;
  const preferCompact = viewportWidth !== undefined && viewportWidth < 360;

  const mergedOptions = useMemo(() => {
    const baseSize = optionsProp?.size ?? 'flexible';
    return {
      ...(optionsProp ?? {}),
      size: baseSize,
      language: optionsProp?.language ?? locale,
      theme: optionsProp?.theme ?? 'light',
    } satisfies NonNullable<ComponentProps<typeof Turnstile>['options']>;
  }, [locale, optionsProp]);

  const scale = preferCompact && viewportWidth
    ? Math.min(Math.max(viewportWidth / 300, 0.75), 1)
    : 1;

  return turnstileEnabled ? (
    <div className="w-full">
      <div className="flex w-full justify-center">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: 300,
            maxWidth: '100%',
            overflow: 'hidden',
            margin: '0 auto',
            height: 65,
          }}
        >
          <Turnstile
            ref={ref}
            options={mergedOptions}
            style={{ width: 300, height: 65 }}
            {...props}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          />
        </div>
      </div>

      {validationError && (
        <FormMessage className="text-red-500 mt-2">
          {validationError}
        </FormMessage>
      )}
    </div>
  ) : null;
}
);

Captcha.displayName = 'Captcha';

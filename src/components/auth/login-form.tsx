'use client';

import { validateCaptchaAction } from '@/actions/validate-captcha';
import { AuthCard } from '@/components/auth/auth-card';
import { Captcha } from '@/components/shared/captcha';
import { FormError } from '@/components/shared/form-error';
import { FormSuccess } from '@/components/shared/form-success';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { websiteConfig } from '@/config/website';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { refreshCreditsSnapshot } from '@/lib/credits-utils';
import { getTurnstileErrorMessage } from '@/lib/turnstile-errors';
import { getUrlWithLocaleInCallbackUrl } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { SocialLoginButton } from './social-login-button';

export interface LoginFormProps {
  className?: string;
  callbackUrl?: string;
}

export const LoginForm = ({
  className,
  callbackUrl: propCallbackUrl,
}: LoginFormProps) => {
  const t = useTranslations('AuthPage.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const paramCallbackUrl = searchParams.get('callbackUrl');
  // Use prop callback URL or param callback URL if provided, otherwise use the default login redirect
  const locale = useLocale();
  const defaultCallbackUrl = getUrlWithLocaleInCallbackUrl(
    DEFAULT_LOGIN_REDIRECT,
    locale
  );
  const callbackUrl = propCallbackUrl || paramCallbackUrl || defaultCallbackUrl;
  console.log('login form, callbackUrl', callbackUrl);

  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // turnstile captcha schema
  const turnstileEnabled = websiteConfig.features.enableTurnstileCaptcha;
  const envSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaActive =
    turnstileEnabled && !!envSiteKey && envSiteKey !== 'YOUR_SITE_KEY_HERE';
  const captchaSchema = captchaActive
    ? z.string().min(1, '请完成验证码验证')
    : z.string().optional();

  const LoginSchema = z.object({
    email: z.string().email({
      message: t('emailRequired'),
    }),
    password: z.string().min(1, {
      message: t('passwordRequired'),
    }),
    captchaToken: captchaSchema,
  });

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      captchaToken: '',
    },
  });

  const captchaToken = useWatch({
    control: form.control,
    name: 'captchaToken',
  });

  const captchaRef = useRef<TurnstileInstance | undefined>(undefined);

  const handleCaptchaSuccess = (token: string) => {
    form.setValue('captchaToken', token, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.clearErrors('captchaToken');
    setError('');
  };

  const handleCaptchaReset = (message?: string) => {
    form.setValue('captchaToken', '', {
      shouldDirty: true,
      shouldValidate: true,
    });
    try {
      captchaRef.current?.reset();
    } catch (resetError) {
      console.warn('Failed to reset Turnstile widget (login):', resetError);
    }
    if (message) {
      form.setError('captchaToken', {
        type: 'manual',
        message,
      });
    } else {
      form.clearErrors('captchaToken');
    }
    if (message) {
      setError(message);
    }
  };

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    if (captchaActive && !values.captchaToken) {
      setError('请先完成验证码验证。');
      return;
    }
    // Validate captcha token if enabled
    if (captchaActive && values.captchaToken) {
      const captchaResult = await validateCaptchaAction({
        captchaToken: values.captchaToken,
      });

      if (!captchaResult?.data?.success || !captchaResult?.data?.valid) {
        console.error('login, captcha invalid:', values.captchaToken);
        const errorMessage =
          captchaResult?.data?.error || '验证码无效，请重试。';
        setError(errorMessage);
        return;
      }
    }
    // 1. if callbackUrl is provided, user will be redirected to the callbackURL after login successfully.
    // if user email is not verified, a new verification email will be sent to the user with the callbackURL.
    // 2. if callbackUrl is not provided, we should redirect manually in the onSuccess callback.
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: callbackUrl,
      },
      {
        onRequest: (ctx) => {
          // console.log("login, request:", ctx.url);
          setIsPending(true);
          setError('');
          setSuccess('');
        },
        onResponse: (ctx) => {
          // console.log("login, response:", ctx.response);
          setIsPending(false);
        },
        onSuccess: (ctx) => {
          console.log('login, success:', ctx.data);
          // Refresh credits snapshot after successful login
          try {
            void refreshCreditsSnapshot();
          } catch {}
          setSuccess('Login successful');
          router.push(callbackUrl || '/');
        },
        onError: (ctx) => {
          console.error('login, error:', ctx.error);
          setError(`${ctx.error.status}: ${ctx.error.message}`);
        },
      }
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <AuthCard
      headerLabel={t('welcomeBack')}
      bottomButtonLabel={t('signUpHint')}
      bottomButtonHref={`${Routes.Register}`}
      className={cn('', className)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="name@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>{t('password')}</FormLabel>
                    <Button
                      size="sm"
                      variant="link"
                      asChild
                      className="px-0 font-normal text-muted-foreground"
                    >
                      <LocaleLink
                        href={`${Routes.ForgotPassword}`}
                        className="text-xs hover:underline hover:underline-offset-4 hover:text-primary"
                      >
                        {t('forgotPassword')}
                      </LocaleLink>
                    </Button>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="******"
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                        disabled={isPending}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="size-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? t('hidePassword') : t('showPassword')}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error || urlError || undefined} />
          <FormSuccess message={success} />
          {captchaActive && (
            <Captcha
              ref={captchaRef}
              onSuccess={handleCaptchaSuccess}
              onExpire={() => handleCaptchaReset('验证码已过期，请重新验证。')}
              onTimeout={() =>
                handleCaptchaReset('验证码超时，请重新点击验证。')
              }
              onError={(reason) => {
                const message = getTurnstileErrorMessage(reason);
                console.warn('Turnstile error on login:', reason);
                handleCaptchaReset(message || '验证码校验失败，请重试。');
              }}
              validationError={form.formState.errors.captchaToken?.message}
            />
          )}
          <Tooltip open={captchaActive && !captchaToken ? undefined : false}>
            <TooltipTrigger asChild>
              <Button
                disabled={isPending || (captchaActive && !captchaToken)}
                size="lg"
                type="submit"
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                <span>{t('signIn')}</span>
              </Button>
            </TooltipTrigger>
            {captchaActive && !captchaToken && (
              <TooltipContent sideOffset={6}>
                Please complete verification first
              </TooltipContent>
            )}
          </Tooltip>
        </form>
      </Form>
      <div className="mt-4">
        <SocialLoginButton
          callbackUrl={callbackUrl}
          disabled={captchaActive && !captchaToken}
        />
      </div>
    </AuthCard>
  );
};

'use client';

import { validateCaptchaAction } from '@/actions/validate-captcha';
import { AuthCard } from '@/components/auth/auth-card';
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
import { authClient } from '@/lib/auth-client';
import { getTurnstileErrorMessage } from '@/lib/turnstile-errors';
import { getUrlWithLocaleInCallbackUrl } from '@/lib/urls/urls';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Captcha } from '../shared/captcha';
import { SocialLoginButton } from './social-login-button';

interface RegisterFormProps {
  callbackUrl?: string;
}

export const RegisterForm = ({
  callbackUrl: propCallbackUrl,
}: RegisterFormProps) => {
  const t = useTranslations('AuthPage.register');
  const searchParams = useSearchParams();
  const paramCallbackUrl = searchParams.get('callbackUrl');
  // Use prop callback URL or param callback URL if provided, otherwise use the default login redirect
  const locale = useLocale();
  const defaultCallbackUrl = getUrlWithLocaleInCallbackUrl(
    DEFAULT_LOGIN_REDIRECT,
    locale
  );
  const callbackUrl = propCallbackUrl || paramCallbackUrl || defaultCallbackUrl;
  console.log('register form, callbackUrl', callbackUrl);

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
    ? z.string().min(1, 'Please complete captcha verification')
    : z.string().optional();

  const RegisterSchema = z.object({
    email: z.string().email({
      message: t('emailRequired'),
    }),
    password: z.string().min(1, {
      message: t('passwordRequired'),
    }),
    name: z.string().min(1, {
      message: t('nameRequired'),
    }),
    captchaToken: captchaSchema,
  });

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
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
      console.warn('Failed to reset Turnstile widget (register):', resetError);
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

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    // Validate captcha token if turnstile is enabled
    if (captchaActive && !values.captchaToken) {
      const msg = 'Please complete captcha verification first.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (captchaActive && values.captchaToken) {
      const captchaResult = await validateCaptchaAction({
        captchaToken: values.captchaToken,
      });

      if (!captchaResult?.data?.success || !captchaResult?.data?.valid) {
        console.error('register, captcha invalid:', values.captchaToken);
        const errorMessage = captchaResult?.data?.error || t('captchaInvalid');
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
    }

    // 1. if requireEmailVerification is true, callbackURL will be used in the verification email,
    // the user will be redirected to the callbackURL after the email is verified.
    // 2. if requireEmailVerification is false, the user will not be redirected to the callbackURL,
    // we should redirect to the callbackURL manually in the onSuccess callback.
    try {
      await authClient.signUp.email(
        {
          email: values.email,
          password: values.password,
          name: values.name,
          callbackURL: callbackUrl,
        },
        {
          onRequest: (ctx) => {
            console.log('register, request:', ctx.url);
            setIsPending(true);
            setError('');
            setSuccess('');
          },
          onResponse: (ctx) => {
            console.log('register, response:', ctx.response);
            setIsPending(false);
          },
          onSuccess: (ctx) => {
            const msg = t('checkEmail');
            setSuccess(msg);
            toast.success(msg);

            if (websiteConfig.features.enableAffonsoAffiliate) {
              console.log('register, affonso affiliate:', values.email);
              // @ts-ignore
              window?.Affonso?.signup?.(values.email);
            }
          },
          onError: (ctx) => {
            // Graceful error mapping for duplicate email & generic errors
            const anyErr: any = ctx?.error ?? {};
            const resp: any = (ctx as any)?.response;
            const status =
              anyErr.status ?? anyErr.code ?? anyErr.statusCode ?? resp?.status;
            let message: string = anyErr.message ?? '';

            // Try to decode common duplicate scenarios
            const lower = String(message).toLowerCase();
            if (!message || message === '[object Object]') {
              if (status === 409) {
                message =
                  'An account with this email already exists. Please sign in or reset your password.';
              } else if (status === 400) {
                message =
                  'Invalid registration data. Please check the fields and try again.';
              } else if (status === 403) {
                message =
                  'Request was forbidden. Please check your domain and try again.';
              } else if (status === 429) {
                message =
                  'Too many attempts. Please wait a moment and try again.';
              } else {
                message =
                  'Sign up failed. Please try again or use a different email.';
              }
            } else if (
              lower.includes('exist') ||
              lower.includes('duplicate') ||
              lower.includes('unique')
            ) {
              message =
                'An account with this email already exists. Please sign in or reset your password.';
            }

            setError(message);
            toast.error(message);

            // Log a compact, useful error for debugging, but avoid noisy empty objects
            try {
              const parts: string[] = [];
              if (status) parts.push(`status=${status}`);
              if (resp?.url) parts.push(`url=${resp.url}`);
              if (anyErr && Object.keys(anyErr).length) {
                parts.push(`err=${JSON.stringify(anyErr)}`);
              }
              if (parts.length) {
                console.error(`register error: ${parts.join(' ')}`);
              } else {
                console.warn('register error: no extra error details received');
              }
            } catch {}
          },
        }
      );
    } catch (e) {
      const fallback =
        'Sign up request failed. Please check your network and try again.';
      console.error('register, unhandled error:', e);
      setIsPending(false);
      setError(fallback);
      toast.error(fallback);
    }
  };

  const onInvalid = (errors: FieldErrors<z.infer<typeof RegisterSchema>>) => {
    // Provide a visible error message at the top to avoid user confusion
    const firstError = Object.values(errors)[0];
    const msg =
      (firstError as any)?.message ||
      form.formState.errors?.email?.message ||
      form.formState.errors?.password?.message ||
      form.formState.errors?.name?.message ||
      (captchaActive && !captchaToken ? 'Please complete captcha verification first.' : '') ||
      'Please check the required fields';
    setError(String(msg));
    if (msg) toast.error(String(msg));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <AuthCard
      headerLabel={t('createAccount')}
      bottomButtonLabel={t('signInHint')}
      bottomButtonHref={`${Routes.Login}`}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} placeholder="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormLabel>{t('password')}</FormLabel>
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
          <FormError message={error} />
          <FormSuccess message={success} />
          {captchaActive && (
            <Captcha
              ref={captchaRef}
              onSuccess={handleCaptchaSuccess}
              onExpire={() => handleCaptchaReset('Captcha expired, please verify again.')}
              onTimeout={() =>
                handleCaptchaReset('Captcha timeout, please click to verify again.')
              }
              onError={(reason) => {
                const message = getTurnstileErrorMessage(reason);
                console.warn('Turnstile error on register:', reason);
                handleCaptchaReset(message || 'Captcha verification failed, please try again.');
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
                className="cursor-pointer w-full flex items-center justify-center gap-2"
              >
                {isPending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                <span>{t('signUp')}</span>
              </Button>
            </TooltipTrigger>
            {captchaActive && !captchaToken && (
              <TooltipContent sideOffset={6}>Please complete verification first</TooltipContent>
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

import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { WebsiteConfig } from '@/types';

// Choose payment provider via env; default to Stripe
const paymentProvider =
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'creem' ? 'creem' : 'stripe';

// Resolve price IDs based on provider
const PRO_MONTHLY_PRICE_ID =
  paymentProvider === 'creem'
    ? process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!;
const PRO_YEARLY_PRICE_ID =
  paymentProvider === 'creem'
    ? process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!;
const ULTIMATE_MONTHLY_PRICE_ID =
  paymentProvider === 'creem'
    ? process.env.NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_MONTHLY!;
const ULTIMATE_YEARLY_PRICE_ID =
  paymentProvider === 'creem'
    ? process.env.NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_YEARLY!;

/**
 * website config, without translations
 *
 * docs:
 * https://mksaas.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  metadata: {
    theme: {
      defaultTheme: 'default',
      enableSwitch: true,
    },
    mode: {
      defaultMode: 'system',
      enableSwitch: true,
    },
    images: {
      ogImage: '/og.png',
      logoLight: '/favicon.svg',
      logoDark: '/favicon.svg',
    },
    social: {
      github: 'https://github.com/MkSaaSHQ',
      twitter: 'https://mksaas.link/twitter',
      blueSky: 'https://mksaas.link/bsky',
      discord: 'https://mksaas.link/discord',
      mastodon: 'https://mksaas.link/mastodon',
      linkedin: 'https://mksaas.link/linkedin',
      youtube: 'https://mksaas.link/youtube',
    },
  },
  features: {
    enableDiscordWidget: false,
    enableUpgradeCard: true,
    enableAffonsoAffiliate: false,
    enablePromotekitAffiliate: false,
    enableDatafastRevenueTrack: false,
    enableTurnstileCaptcha: true,
  },
  routes: {
    defaultLoginRedirect: '/',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: false,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: {
        flag: '🇺🇸',
        name: 'English',
      },
      // zh: {
      //   flag: '🇨🇳',
      //   name: '中文',
      // },
    },
  },
  blog: {
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  mail: {
    provider: 'resend',
    fromEmail: 'Roboneo Art <hi@roboneo.art>',
    supportEmail: 'Roboneo Art <hi@roboneo.art>',
  },
  newsletter: {
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  storage: {
    provider: 's3',
  },
  payment: {
    provider: paymentProvider,
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
        recommended: false,
        disabled: false,
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: PRO_MONTHLY_PRICE_ID,
            amount: 1000, // $10.00
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: PRO_YEARLY_PRICE_ID,
            amount: 9600, // $96.00 ($8/month)
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        recommended: false,
      },
      ultimate: {
        id: 'ultimate',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: ULTIMATE_MONTHLY_PRICE_ID,
            amount: 2000, // $20.00
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: ULTIMATE_YEARLY_PRICE_ID,
            amount: 19200, // $192.00 ($16/month)
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        recommended: true,
      },
    },
  },
};

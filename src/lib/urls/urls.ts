import { websiteConfig } from '@/config/website';
import { routing } from '@/i18n/routing';
import type { Locale } from 'next-intl';

const PRODUCTION_BASE_URL = 'https://roboneo.art';

function normalizeBaseUrl(candidate: string): string {
  try {
    const parsed = new URL(candidate);
    let hostname = parsed.hostname.toLowerCase();

    if (hostname === 'www.roboneo.art') {
      parsed.hostname = 'roboneo.art';
      hostname = 'roboneo.art';
    }

    const shouldForceHttps =
      hostname === 'roboneo.art' ||
      (parsed.protocol === 'http:' &&
        hostname !== 'localhost' &&
        !hostname.endsWith('.local'));

    if (shouldForceHttps) {
      parsed.protocol = 'https:';
    }

    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return candidate.replace(/\/$/, '');
  }
}

/**
 * Get the base URL of the application
 */
export function getBaseUrl(): string {
  // On client side, use window.location.origin if available
  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }

  // Check for explicit base URL first
  const envBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_BASE_URL;
  }

  // In Vercel preview/development, fall back to deployment URL
  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  // Fallback to localhost for development
  return normalizeBaseUrl(`http://localhost:${process.env.PORT ?? 3000}`);
}

/**
 * Check if the locale should be appended to the URL
 */
export function shouldAppendLocale(locale?: Locale | null): boolean {
  return !!locale && locale !== routing.defaultLocale && locale !== 'default';
}

/**
 * Get the URL of the application with the locale appended
 */
export function getUrlWithLocale(url: string, locale?: Locale | null): string {
  const currentBaseUrl = getBaseUrl();
  return shouldAppendLocale(locale)
    ? `${currentBaseUrl}/${locale}${url}`
    : `${currentBaseUrl}${url}`;
}

/**
 * Adds locale to the callbackURL parameter in authentication URLs
 *
 * Example:
 * Input: http://localhost:3000/api/auth/reset-password/token?callbackURL=/auth/reset-password
 * Output: http://localhost:3000/api/auth/reset-password/token?callbackURL=/zh/auth/reset-password
 *
 * http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/dashboard
 * Output: http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/zh/dashboard
 *
 * @param url - The original URL with callbackURL parameter
 * @param locale - The locale to add to the callbackURL
 * @returns The URL with locale added to callbackURL if necessary
 */
export function getUrlWithLocaleInCallbackUrl(
  url: string,
  locale: Locale
): string {
  // If we shouldn't append locale, return original URL
  if (!shouldAppendLocale(locale)) {
    return url;
  }

  try {
    // Parse the URL
    const urlObj = new URL(url);

    // Check if there's a callbackURL parameter
    const callbackURL = urlObj.searchParams.get('callbackURL');

    if (callbackURL) {
      // Only modify the callbackURL if it doesn't already include the locale
      if (!callbackURL.match(new RegExp(`^/${locale}(/|$)`))) {
        // Add locale to the callbackURL
        const localizedCallbackURL = callbackURL.startsWith('/')
          ? `/${locale}${callbackURL}`
          : `/${locale}/${callbackURL}`;

        // Update the search parameter
        urlObj.searchParams.set('callbackURL', localizedCallbackURL);
      }
    }

    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to parse URL for locale insertion:', url, error);
    return url;
  }
}

/**
 * Get the URL of the image, if the image is a relative path, it will be prefixed with the base URL
 * @param image - The image URL
 * @returns The URL of the image
 */
export function getImageUrl(image: string): string {
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  if (image.startsWith('/')) {
    return `${getBaseUrl()}${image}`;
  }
  return `${getBaseUrl()}/${image}`;
}

/**
 * Get the Stripe dashboard customer URL
 * @param customerId - The Stripe customer ID
 * @returns The Stripe dashboard customer URL
 */
export function getStripeDashboardCustomerUrl(customerId: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `https://dashboard.stripe.com/test/customers/${customerId}`;
  }
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

/**
 * Get the payment provider dashboard customer URL
 * Falls back to Stripe dashboard if provider is 'stripe', otherwise returns '#'
 */
export function getPaymentDashboardCustomerUrl(customerId: string): string {
  const provider = websiteConfig.payment.provider;
  if (provider === 'stripe') {
    return getStripeDashboardCustomerUrl(customerId);
  }
  // TODO: Add Creem dashboard customer URL once available
  return '#';
}

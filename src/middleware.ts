import { betterFetch } from '@better-fetch/fetch';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { LOCALES, routing } from './i18n/routing';
import type { Session } from './lib/auth-types';
import { getPostLoginRedirectUrl, isAdmin } from './lib/auth-utils';
import { getBaseUrl } from './lib/urls/urls';
import {
  DEFAULT_LOGIN_REDIRECT,
  adminOnlyRoutes,
  protectedRoutes,
  routesNotAllowedByLoggedInUsers,
} from './routes';

const intlMiddleware = createMiddleware(routing);

/**
 * 1. Next.js middleware
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * 2. Better Auth middleware
 * https://www.better-auth.com/docs/integrations/next#middleware
 *
 * In Next.js middleware, it's recommended to only check for the existence of a session cookie
 * to handle redirection. To avoid blocking requests by making API or database calls.
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  console.log('>> middleware start, pathname', nextUrl.pathname);

  // 仅在需要鉴权的路由执行会话检查，避免为普通营销/工具页增加延迟
  const pathnameWithoutLocale = getPathnameWithoutLocale(
    nextUrl.pathname,
    LOCALES
  );
  const matches = (routes: readonly string[]) =>
    routes.some((route) =>
      new RegExp(`^${route}$`).test(pathnameWithoutLocale)
    );
  const needsAuthCheck =
    matches(protectedRoutes) ||
    matches(adminOnlyRoutes) ||
    matches(routesNotAllowedByLoggedInUsers);

  let session: Session | null = null;
  if (needsAuthCheck) {
    try {
      const { data: sessionData } = await betterFetch<Session>(
        '/api/auth/get-session',
        {
          baseURL: getBaseUrl(),
          headers: {
            cookie: req.headers.get('cookie') || '',
          },
        }
      );
      session = sessionData;
    } catch (error) {
      console.error(
        'Middleware auth check failed:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  const isLoggedIn = !!session;

  // console.log('middleware, isLoggedIn', isLoggedIn);

  // pathnameWithoutLocale computed above

  // If the route can not be accessed by logged in users, redirect if the user is logged in
  if (isLoggedIn) {
    const isNotAllowedRoute = routesNotAllowedByLoggedInUsers.some((route) =>
      new RegExp(`^${route}$`).test(pathnameWithoutLocale)
    );
    if (isNotAllowedRoute) {
      const redirectUrl = getPostLoginRedirectUrl(session?.user);
      console.log(
        '<< middleware end, not allowed route, already logged in, redirecting to',
        redirectUrl
      );
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }
  }

  // Check if the route is admin-only
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    new RegExp(`^${route}$`).test(pathnameWithoutLocale)
  );

  // If trying to access admin route without being admin, redirect
  if (isAdminOnlyRoute) {
    if (!isLoggedIn) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      console.log(
        '<< middleware end, admin route, not logged in, redirecting to login'
      );
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
    }

    if (!isAdmin(session?.user)) {
      console.log(
        '<< middleware end, admin route, not admin user, redirecting to home'
      );
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    new RegExp(`^${route}$`).test(pathnameWithoutLocale)
  );
  // console.log('middleware, isProtectedRoute', isProtectedRoute);

  // If the route is a protected route, redirect to login if user is not logged in
  if (!isLoggedIn && isProtectedRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    console.log(
      '<< middleware end, not logged in, redirecting to login, callbackUrl',
      callbackUrl
    );
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Check for blocked documentation pages
  const blockedDocsPaths = [
    '/docs/comparisons',
    '/docs/customisation',
    '/docs/', // root docs page
    '/docs/internationalization',
    '/docs/manual-installation',
    '/docs/markdown',
    '/docs/search',
    '/docs/static-export',
    '/docs/theme',
    '/docs/what-is-fumadocs',
    '/docs/components',
    '/docs/layouts',
    '/docs/mdx',
  ];
  
  const isBlockedDocsPath = blockedDocsPaths.some((blockedPath) => {
    // Exact match for specific paths
    if (pathnameWithoutLocale === blockedPath) return true;
    
    // Match subdirectories (e.g., /docs/components/*)
    if (blockedPath.endsWith('/') || 
        (blockedPath === '/docs/components' && pathnameWithoutLocale.startsWith('/docs/components/')) ||
        (blockedPath === '/docs/layouts' && pathnameWithoutLocale.startsWith('/docs/layouts/')) ||
        (blockedPath === '/docs/mdx' && pathnameWithoutLocale.startsWith('/docs/mdx/'))) {
      return true;
    }
    
    return false;
  });
  
  if (isBlockedDocsPath) {
    console.log('<< middleware end, blocked docs path, returning 404');
    return new NextResponse(null, { status: 404 });
  }

  // Apply intlMiddleware for all routes
  console.log('<< middleware end, applying intlMiddleware');
  const res = intlMiddleware(req);

  // Security headers (lightweight defaults)
  try {
    if (process.env.NODE_ENV === 'production') {
      res.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Keep CSP opt-in to avoid breaking existing assets; enable via env
    if (process.env.ENABLE_CSP === 'true') {
      const csp = [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "connect-src 'self' https:",
        "font-src 'self' https: data:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
      ].join('; ');
      res.headers.set('Content-Security-Policy', csp);
    }
    // Minimal Permissions-Policy to reduce surface
    res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
  } catch {}

  return res;
}

/**
 * Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
 */
function getPathnameWithoutLocale(pathname: string, locales: string[]): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})/`);
  return pathname.replace(localePattern, '/');
}

/**
 * Next.js internationalized routing
 * specify the routes the middleware applies to
 *
 * https://next-intl.dev/docs/routing#base-path
 */
export const config = {
  // Keep intlMiddleware active for all non-static paths so locale routing works
  // Auth checks inside middleware are already guarded by `needsAuthCheck`
  matcher: [
    // Match all pathnames except for
    // - if they start with `/api`, `/_next` or `/_vercel`
    // - if they contain a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

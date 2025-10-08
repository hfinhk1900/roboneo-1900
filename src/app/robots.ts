import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/urls/urls';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',
          '/_next/*',
          '/settings/*',
          '/dashboard/*',
          '/admin/*',
          '/*.json$',
          '/auth/*',
          '/ai/*',
          '/blocks/*',
          '/magicui',
          '/waitlist',
          '/changelog',
          '/my-library',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/*',
          '/_next/*',
          '/settings/*',
          '/dashboard/*',
          '/admin/*',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/magic*.png', '/showcase*.png', '/ios-*.png', '/hero-*.png'],
        disallow: ['/debug-output/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

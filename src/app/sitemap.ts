import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Routes } from '@/routes';
import type { MetadataRoute } from 'next';
import type { Locale } from 'next-intl';
import { getBaseUrl } from '../lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/**
 * static routes for sitemap, you may change the routes for your own
 */
const staticRoutes: Href[] = [
  Routes.Root,
  Routes.Pricing,
  Routes.About,
  Routes.Contact,
  Routes.Waitlist,
  Routes.Changelog,
  Routes.PrivacyPolicy,
  Routes.TermsOfService,
  Routes.CookiePolicy,
  Routes.RefundPolicy,
  Routes.AISticker,
  Routes.ProductShot,
  Routes.AIBackground,
  Routes.RemoveWatermark,
  Routes.ProfilePictureMaker,
  '/my-library' as Href,
  Routes.MagicuiBlocks,
  Routes.AIText,
  Routes.AIVideo,
  Routes.AIAudio,
  // Block library category pages
  Routes.HeroBlocks,
  Routes.LogoCloudBlocks,
  Routes.FeaturesBlocks,
  Routes.IntegrationsBlocks,
  Routes.ContentBlocks,
  Routes.StatsBlocks,
  Routes.TeamBlocks,
  Routes.TestimonialsBlocks,
  Routes.CallToActionBlocks,
  Routes.FooterBlocks,
  Routes.PricingBlocks,
  Routes.ComparatorBlocks,
  Routes.FAQBlocks,
  Routes.LoginBlocks,
  Routes.SignupBlocks,
  Routes.ForgotPasswordBlocks,
  Routes.ContactBlocks,
];

/**
 * Generate a sitemap for the website
 *
 * https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 * https://github.com/javayhu/cnblocks/blob/main/app/sitemap.ts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapList: MetadataRoute.Sitemap = []; // final result

  // add static routes
  sitemapList.push(
    ...staticRoutes.flatMap((route) => {
      return routing.locales.map((locale) => ({
        url: getUrl(route, locale),
        lastModified: new Date(),
        priority: 1,
        changeFrequency: 'weekly' as const,
      }));
    })
  );

  // blog disabled for MVP: skip categories

  // blog disabled for MVP: skip paginated blog list pages

  // blog disabled for MVP: skip paginated category pages

  // blog disabled for MVP: skip posts

  // docs 未上线，暂不生成对应 sitemap 条目，避免返回 404/fallback 页面

  return sitemapList;
}

function getUrl(href: Href, locale: Locale) {
  const pathname = getLocalePathname({ locale, href });
  return getBaseUrl() + pathname;
}

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#sitemap
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/src/app/sitemap.ts
 */
function getEntries(href: Href) {
  return routing.locales.map((locale) => ({
    url: getUrl(href, locale),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((cur) => [cur, getUrl(href, cur)])
      ),
    },
  }));
}

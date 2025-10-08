import { websiteConfig } from '@/config/website';
import { Routes } from '@/routes';
import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/urls/urls';

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency'];

interface RouteConfig {
  path: Routes;
  changeFrequency: ChangeFrequency;
  priority: number;
  lastModified: string;
}

const normalizedBaseUrl = getBaseUrl().replace(/\/$/, '');

const stableLastModified = '2025-10-08T03:07:59.000Z';

const canonicalRoutes: RouteConfig[] = [
  // 首页 - 最高优先级
  {
    path: Routes.Root,
    changeFrequency: 'weekly',
    priority: 1,
    lastModified: stableLastModified,
  },
  // 核心AI工具页面 - 高优先级
  {
    path: Routes.AISticker,
    changeFrequency: 'weekly',
    priority: 0.9,
    lastModified: stableLastModified,
  },
  {
    path: Routes.ProductShot,
    changeFrequency: 'weekly',
    priority: 0.9,
    lastModified: stableLastModified,
  },
  {
    path: Routes.AIBackground,
    changeFrequency: 'weekly',
    priority: 0.9,
    lastModified: stableLastModified,
  },
  {
    path: Routes.RemoveWatermark,
    changeFrequency: 'weekly',
    priority: 0.85,
    lastModified: stableLastModified,
  },
  {
    path: Routes.ProfilePictureMaker,
    changeFrequency: 'weekly',
    priority: 0.85,
    lastModified: stableLastModified,
  },
  // 营销页面 - 中等优先级
  {
    path: Routes.Pricing,
    changeFrequency: 'monthly',
    priority: 0.8,
    lastModified: stableLastModified,
  },
  {
    path: Routes.About,
    changeFrequency: 'monthly',
    priority: 0.6,
    lastModified: stableLastModified,
  },
  {
    path: Routes.Contact,
    changeFrequency: 'monthly',
    priority: 0.5,
    lastModified: stableLastModified,
  },
  // 法律页面 - 低优先级
  {
    path: Routes.PrivacyPolicy,
    changeFrequency: 'yearly',
    priority: 0.3,
    lastModified: stableLastModified,
  },
  {
    path: Routes.TermsOfService,
    changeFrequency: 'yearly',
    priority: 0.3,
    lastModified: stableLastModified,
  },
  {
    path: Routes.RefundPolicy,
    changeFrequency: 'yearly',
    priority: 0.3,
    lastModified: stableLastModified,
  },
  {
    path: Routes.CookiePolicy,
    changeFrequency: 'yearly',
    priority: 0.3,
    lastModified: stableLastModified,
  },
];

const localeKeys = Object.keys(websiteConfig.i18n.locales);
const defaultLocale = websiteConfig.i18n.defaultLocale;
const hasMultipleLocales = localeKeys.length > 1;

function buildAbsoluteUrl(path: string): string {
  if (!path || path === '/') {
    return `${normalizedBaseUrl}/`;
  }
  return `${normalizedBaseUrl}${path}`;
}

function buildAlternates(path: string) {
  if (!hasMultipleLocales) {
    return undefined;
  }

  const languages: Record<string, string> = {};
  const localePath = path === '/' ? '/' : path;

  for (const locale of localeKeys) {
    const prefix = locale === defaultLocale ? '' : `/${locale}`;
    languages[locale] = `${normalizedBaseUrl}${prefix}${localePath}`;
  }

  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return canonicalRoutes.map(
    ({ path, changeFrequency, priority, lastModified }) => ({
      url: buildAbsoluteUrl(path),
      lastModified,
      changeFrequency,
      priority,
      alternates: buildAlternates(path),
    })
  );
}

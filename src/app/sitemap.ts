import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/urls/urls';

/**
 * Optimized sitemap focused on core user value pages
 * SEO-friendly with differentiated priorities and change frequencies
 */

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  alternates?: {
    languages: {
      en: string;
    };
  };
}

const baseUrl = getBaseUrl();
const lastMod = '2025-09-25';

const coreRoutes: SitemapEntry[] = [
  // Core pages
  {
    url: `${baseUrl}/`,
    lastModified: lastMod,
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${baseUrl}/pricing`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/about`,
    lastModified: lastMod,
    changeFrequency: 'monthly',
    priority: 0.6,
  },

  // Tool detail pages (long-tail SEO)
  {
    url: `${baseUrl}/sticker`,
    lastModified: lastMod,
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${baseUrl}/productshot`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.85,
  },
  {
    url: `${baseUrl}/aibackgrounds`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/remove-watermark`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${baseUrl}/profile-picture-maker`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.8,
  },

  // Policies
  {
    url: `${baseUrl}/privacy`,
    lastModified: lastMod,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${baseUrl}/terms`,
    lastModified: lastMod,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

/**
 * Generate optimized sitemap for RoboNeo AI
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return coreRoutes.map((route) => ({
    url: route.url,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        en: route.url,
      },
    },
  }));
}

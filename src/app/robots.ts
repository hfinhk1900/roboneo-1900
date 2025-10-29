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
          '/api/',
          '/_next/',
          '/settings/',
          '/dashboard/',
          '/admin/',
          '/auth/',
          '/*.json$',
          '/test-bg-removal',
          // 阻止模板未使用的路由
          '/blog',
          '/blog/',
          '/docs',
          '/docs/',
          '/ai/text',
          '/ai/text/',
          '/ai/video',
          '/ai/video/',
          '/ai/audio',
          '/ai/audio/',
          '/ai/image',
          '/ai/image/',
          '/changelog',
          '/changelog/',
          '/waitlist',
          '/waitlist/',
          '/magicui',
          '/magicui/',
          '/blocks',
          '/blocks/',
          '/my-library',
          '/my-library/',
        ],
      },
      {
        userAgent: 'Googlebot',
        disallow: [
          '/api/',
          '/_next/',
          '/settings/',
          '/dashboard/',
          '/admin/',
          '/auth/',
          '/my-library',
          '/my-library/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['*.png', '*.jpg', '*.jpeg', '*.webp', '/images/'],
        disallow: ['/debug-output/', '/api/'],
      },
      // 阻止 AI 训练爬虫（保护内容版权）
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'Google-Extended',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

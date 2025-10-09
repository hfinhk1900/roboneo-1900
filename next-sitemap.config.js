/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://roboneo.art',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/privacy',
    '/terms',
    '/refund',
    '/cookie',
    '/manifest.webmanifest',
    '/test-bg-removal',
  ],
  transform: async (_config, path) => ({
    loc: path,
    lastmod: new Date().toISOString(),
  }),
  additionalPaths: async (config) => {
    const importantPaths = [
      '/',
      '/sticker',
      '/productshot',
      '/aibackgrounds',
      '/profile-picture-maker',
      '/remove-watermark',
      '/pricing',
      '/about',
      '/contact',
    ];

    return Promise.all(
      importantPaths.map((path) => config.transform(config, path))
    );
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/_next',
          '/settings',
          '/dashboard',
          '/admin',
          '/auth',
          '/blog',
          '/docs',
          '/ai/text',
          '/ai/video',
          '/ai/audio',
          '/ai/image',
          '/changelog',
          '/waitlist',
          '/magicui',
          '/blocks',
          '/my-library',
          '/cookie',
          '/test-bg-removal',
        ],
      },
    ],
  },
};

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://roboneo.art',
  generateRobotsTxt: false,
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
      '/scream-ai',
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
};

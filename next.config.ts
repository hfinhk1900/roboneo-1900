import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';
// Optional: bundle analyzer (enabled when ANALYZE=true)
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (c) => c;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = createAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
} catch {}
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * https://nextjs.org/docs/app/api-reference/config/next-config-js
 */
const nextConfig: NextConfig = {
  // Docker standalone output
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),

  /* config options here */
  devIndicators: false,

  // 确保 Fumadocs 相关依赖被正确编译，避免本地 dev 模式缺失 vendor chunk
  transpilePackages: ['fumadocs-core', 'fumadocs-ui'],

  // Set development server port to 3000
  experimental: {
    // serverComponentsExternalPackages has been moved to serverExternalPackages
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  serverExternalPackages: [],

  // https://nextjs.org/docs/architecture/nextjs-compiler#remove-console
  // Remove all console.* calls in production only
  compiler: {
    // removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    // https://vercel.com/docs/image-optimization/managing-image-optimization-costs#minimizing-image-optimization-costs
    // https://nextjs.org/docs/app/api-reference/components/image#unoptimized
    // vercel has limits on image optimization, 1000 images per month
    // 为了节省 Vercel 带宽，My Image Library 功能禁用图片优化代理
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-cfc94129019546e1887e6add7f39ef74.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
      {
        protocol: 'https',
        hostname: 'tokensceshi.oss-ap-southeast-1.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
    ],
  },
};

/**
 * You can specify the path to the request config file or use the default one (@/i18n/request.ts)
 *
 * https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#next-config
 */
const withNextIntl = createNextIntlPlugin();

/**
 * https://fumadocs.dev/docs/ui/manual-installation
 * https://fumadocs.dev/docs/mdx/plugin
 */
const withMDX = createMDX();

const mergedConfig = withBundleAnalyzer(withMDX(withNextIntl(nextConfig)));

// 兼容 Next.js 15：部分插件会附带已废弃的 `turbopack` 配置，显式清理以避免警告
const { turbopack, ...finalConfig } = mergedConfig as any;

export default finalConfig;

'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// 示例图像数据 - 5张图片左右对称布局
const SHOWCASE_IMAGES = [
  // 左侧图片
  {
    id: 'left-top',
    src: '/home/home-hero.png',
    alt: 'AI Image Processing Example',
    className: 'rounded-2xl',
    position: 'left-top',
  },
  {
    id: 'left-bottom',
    src: '/home/home-hero-1.png',
    alt: 'Background Removal Demo',
    className: 'rounded-2xl',
    position: 'left-bottom',
  },
  // 中间大图
  {
    id: 'center-main',
    src: '/home/home-hero-4.png',
    alt: 'AI Generated Showcase',
    className: 'rounded-2xl',
    position: 'center',
  },
  // 右侧图片
  {
    id: 'right-top',
    src: '/home/home-hero-2.png',
    alt: 'Portrait Enhancement',
    className: 'rounded-2xl',
    position: 'right-top',
  },
  {
    id: 'right-bottom',
    src: '/home/home-hero-3.png',
    alt: 'Style Transfer Demo',
    className: 'rounded-2xl',
    position: 'right-bottom',
  },
];

// 合作伙伴 logo 数据
const PARTNER_LOGOS = [
  { name: 'FLUX', src: '/partners/flux.png' },
  { name: 'Google DeepMind', src: '/partners/deepmind.png' },
  { name: 'ByteDance', src: '/partners/bytedance.png' },
  { name: 'Runway', src: '/partners/runway.png' },
  { name: 'KLING', src: '/partners/kling.png' },
];

export default function HomeHeroSection() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero content */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Roboneo AI Image Suite
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600"
          >
            From photo to finished visual in one place. Image to Sticker,
            Product Shots, AI Background, and Watermark Removal, with more tools
            added regularly.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full text-base px-8 h-[50px]"
            >
              <Link href="/#generator">Create Sticker</Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="rounded-full text-base px-8 h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Link href="/#generator">
                <SparklesIcon className="mr-2 h-5 w-5" />
                Start creating for free
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Image showcase grid - 5张图片左右对称布局 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 max-w-6xl mx-auto px-4">
            {/* 左侧图片列 */}
            <div className="flex flex-col gap-2 sm:gap-4">
              {SHOWCASE_IMAGES.filter((img) =>
                img.position?.startsWith('left')
              ).map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8, x: -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className={image.className}
                >
                  <div className="relative w-[100px] h-[75px] sm:w-[140px] sm:h-[105px] md:w-[180px] md:h-[135px] lg:w-[200px] lg:h-[150px] bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100px, (max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <div class="text-gray-400 text-sm text-center p-4">
                              ${image.alt}
                            </div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 中间大图 */}
            {SHOWCASE_IMAGES.filter((img) => img.position === 'center').map(
              (image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className={image.className}
                >
                  <div className="relative w-[150px] sm:w-[200px] md:w-[250px] lg:w-[300px] rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={300}
                      height={300}
                      className="w-full h-auto"
                      sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, (max-width: 1024px) 250px, 300px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <div class="text-gray-400 text-sm text-center p-4">
                            ${image.alt}
                          </div>
                        </div>
                      `;
                      }}
                    />
                  </div>
                </motion.div>
              )
            )}

            {/* 右侧图片列 */}
            <div className="flex flex-col gap-2 sm:gap-4">
              {SHOWCASE_IMAGES.filter((img) =>
                img.position?.startsWith('right')
              ).map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className={image.className}
                >
                  <div className="relative w-[100px] h-[75px] sm:w-[140px] sm:h-[105px] md:w-[180px] md:h-[135px] lg:w-[200px] lg:h-[150px] bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100px, (max-width: 768px) 140px, (max-width: 1024px) 180px, 200px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <div class="text-gray-400 text-sm text-center p-4">
                              ${image.alt}
                            </div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Powered by section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <p className="text-sm font-medium text-gray-500 mb-8">Powered by</p>

          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center justify-center h-8"
              >
                {/* Placeholder for partner logos */}
                <div className="px-4 py-2 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                  {partner.name}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

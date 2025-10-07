'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { SVGProps } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 合作伙伴 logo 数据
const PARTNER_LOGOS = [
  { name: 'Partner 1', src: '/home/power01.svg' },
  { name: 'Partner 2', src: '/home/power02.svg' },
  { name: 'Partner 3', src: '/home/power03.svg' },
  { name: 'Partner 4', src: '/home/power04.svg' },
  { name: 'Partner 5', src: '/home/power05.svg' },
  { name: 'Partner 6', src: '/home/power06.svg' },
];

const LightningIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M13 2L3 14h7l-2 8L21 10h-7Z" />
  </svg>
);

export default function HomeHeroSection() {
  return (
    <section
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero content */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900"
          >
            RoboNeo AI Creative Content Studio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-4 sm:mt-6 max-w-2xl lg:max-w-3xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 px-4"
          >
            AI tools for image, video, and audio creation for creators and brands.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6"
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full text-[14px] px-6 sm:px-8 h-[48px] sm:h-[50px]"
            >
              <Link href="/sticker">Create Sticker</Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto rounded-full text-[14px] px-6 sm:px-8 h-[48px] sm:h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Link href="#all-tools">
                <LightningIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start for free
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Image showcase grid - 保持凸字形布局，响应式缩放 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="flex items-center justify-center max-w-6xl mx-auto px-1 sm:px-4 h-[160px] sm:h-[280px] lg:h-[358px] gap-1 sm:gap-3 lg:gap-4">
            {/* 左侧图片组 */}
            <div className="flex flex-col justify-between h-full gap-1 sm:gap-3 lg:gap-4 items-end">
              {/* 左上角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative"
              >
                <div className="relative w-[60px] h-[62px] sm:w-[126px] sm:h-[130px] lg:w-[168px] lg:h-[174px] rounded-md sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <Image
                    src="/home/home-hero.png"
                    alt="RoboNeo AI Image Processing Example"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 60px, (max-width: 1024px) 126px, 168px"
                  />
                </div>
              </motion.div>

              {/* 左下角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative"
              >
                <div className="relative w-[120px] h-[60px] sm:w-[252px] sm:h-[126px] lg:w-[336px] lg:h-[168px] rounded-md sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <Image
                    src="/home/home-hero-1.png"
                    alt="RoboNeo AI Background Removal Demo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 252px, 336px"
                  />
                </div>
              </motion.div>
            </div>

            {/* 中间大图 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative mx-0.5 sm:mx-2"
            >
              <div className="relative w-[96px] h-[128px] sm:w-[202px] sm:h-[268px] lg:w-[270px] lg:h-[358px] rounded-md sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Image
                  src="/home/home-hero-4.png"
                  alt="RoboNeo AI Generated Showcase"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 202px, 270px"
                />
              </div>
            </motion.div>

            {/* 右侧图片组 */}
            <div className="flex flex-col justify-between h-full gap-1 sm:gap-3 lg:gap-4 items-start">
              {/* 右上角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative"
              >
                <div className="relative w-[60px] h-[62px] sm:w-[126px] sm:h-[130px] lg:w-[168px] lg:h-[174px] rounded-md sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <Image
                    src="/home/home-hero-2.png"
                    alt="Portrait Enhancement"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 60px, (max-width: 1024px) 126px, 168px"
                  />
                </div>
              </motion.div>

              {/* 右下角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative"
              >
                <div className="relative w-[120px] h-[60px] sm:w-[252px] sm:h-[126px] lg:w-[336px] lg:h-[168px] rounded-md sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <Image
                    src="/home/home-hero-3.png"
                    alt="Style Transfer Demo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 252px, 336px"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Powered by section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 lg:mt-20 text-center"
        >
          <p className="text-sm font-medium text-gray-400 mb-6 lg:mb-8">
            Powered by
          </p>

          <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 flex-wrap opacity-60 px-4">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center justify-center h-6 sm:h-7 lg:h-8"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={40}
                  height={40}
                  className="h-6 sm:h-7 lg:h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

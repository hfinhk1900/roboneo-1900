'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
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
              <Link href="/sticker">Create Sticker</Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="rounded-full text-base px-8 h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              <Link href="#all-tools">
                <SparklesIcon className="mr-2 h-5 w-5" />
                Start creating for free
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Image showcase grid - 凸字形布局 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="flex items-center justify-center max-w-6xl mx-auto px-4 h-[358px] gap-4">
            {/* 左侧图片组 */}
            <div className="flex flex-col justify-between h-full gap-4 items-end">
              {/* 左上角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative"
              >
                <div
                  className="relative w-[168px] h-[174px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ aspectRatio: 'auto' }}
                >
                  <Image
                    src="/home/home-hero.png"
                    alt="AI Image Processing Example"
                    fill
                    className="object-cover"
                    sizes="168px"
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
                <div
                  className="relative w-[336px] h-[168px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ aspectRatio: '2/1' }}
                >
                  <Image
                    src="/home/home-hero-1.png"
                    alt="Background Removal Demo"
                    fill
                    className="object-cover"
                    sizes="336px"
                  />
                </div>
              </motion.div>
            </div>

            {/* 中间大图 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative mx-2"
            >
              <div
                className="relative w-[270px] h-[358px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{ aspectRatio: 'auto' }}
              >
                <Image
                  src="/home/home-hero-4.png"
                  alt="AI Generated Showcase"
                  fill
                  className="object-cover"
                  sizes="270px"
                />
              </div>
            </motion.div>

            {/* 右侧图片组 */}
            <div className="flex flex-col justify-between h-full gap-4 items-start">
              {/* 右上角图片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative"
              >
                <div
                  className="relative w-[168px] h-[174px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ aspectRatio: 'auto' }}
                >
                  <Image
                    src="/home/home-hero-2.png"
                    alt="Portrait Enhancement"
                    fill
                    className="object-cover"
                    sizes="168px"
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
                <div
                  className="relative w-[336px] h-[168px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ aspectRatio: '2/1' }}
                >
                  <Image
                    src="/home/home-hero-3.png"
                    alt="Style Transfer Demo"
                    fill
                    className="object-cover"
                    sizes="336px"
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
          className="mt-20 text-center"
        >
          <p className="text-sm font-medium text-gray-400 mb-8">Powered by</p>

          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner.name}
                className="flex items-center justify-center h-8"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={40}
                  height={40}
                  className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { OptimizedImage } from '@/components/seo/optimized-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Image, Palette, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function TextToImageHeroSection() {
  const stats = [
    { value: '4', label: 'AI Tools' },
    { value: '10M+', label: 'Images Created' },
    { value: '100+', label: 'Art Styles' },
    { value: 'Free', label: 'To Start' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F5F5] via-white to-white px-4 py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 transform">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 blur-3xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Creative Suite</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
                Transform Text into
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  Stunning Visuals
                </span>
              </h1>
              <p className="text-xl text-muted-foreground lg:text-2xl">
                One platform, four powerful AI tools. Create art, product
                photos, stickers, and custom images from simple text prompts.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="group" asChild>
                <Link href="#tools">
                  Explore All Tools
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ai/image">Try AI Art Generator</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="space-y-1"
                >
                  <div className="text-2xl font-bold text-foreground lg:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-lg">
              {/* Floating cards preview */}
              <div className="relative h-[500px]">
                {/* Main card */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut' as const,
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                >
                  <div className="relative h-80 w-72 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 p-1">
                    <div className="h-full w-full rounded-xl bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">
                          AI Art Generator
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-40 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400" />
                        <div className="space-y-2">
                          <div className="h-2 w-3/4 rounded bg-gray-200" />
                          <div className="h-2 w-1/2 rounded bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating mini cards */}
                <motion.div
                  animate={{
                    y: [0, 10, 0],
                    rotate: [-5, -5, -5],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut' as const,
                  }}
                  className="absolute left-0 top-20"
                >
                  <div className="h-32 w-28 rounded-xl bg-gradient-to-br from-green-400/80 to-emerald-400/80 p-3 shadow-lg">
                    <Image className="mb-2 h-5 w-5 text-white" />
                    <div className="text-xs font-medium text-white">
                      Sticker Maker
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    rotate: [5, 5, 5],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut' as const,
                  }}
                  className="absolute right-0 top-10"
                >
                  <div className="h-32 w-28 rounded-xl bg-gradient-to-br from-orange-400/80 to-red-400/80 p-3 shadow-lg">
                    <Palette className="mb-2 h-5 w-5 text-white" />
                    <div className="text-xs font-medium text-white">
                      Product Shot
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 12, 0],
                    rotate: [3, 3, 3],
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut' as const,
                  }}
                  className="absolute bottom-20 right-10"
                >
                  <div className="h-28 w-24 rounded-xl bg-gradient-to-br from-purple-400/80 to-pink-400/80 p-3 shadow-lg">
                    <Sparkles className="mb-2 h-4 w-4 text-white" />
                    <div className="text-xs font-medium text-white">
                      AI Images
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

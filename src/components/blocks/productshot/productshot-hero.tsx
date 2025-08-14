'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  CameraIcon,
  Package2Icon,
  SparklesIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductShotHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="text-center sm:mx-auto lg:mr-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Product Photography
              <span className="text-blue-500">→</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            Create Professional
            <span className="relative">
              <span className="relative bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {' '}
                Product Photos{' '}
              </span>
            </span>
            <br />
            in Seconds with AI
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground"
          >
            Transform text descriptions into stunning e-commerce product photos.
            No camera, no studio, no photographer needed. Perfect for Amazon
            listings, Shopify stores, and marketing campaigns.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-x-4"
          >
            <Link href="#generator">
              <Button size="lg" className="group">
                Start Creating Now
                <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#showcase">
              <Button size="lg" variant="outline">
                <CameraIcon className="mr-2 h-4 w-4" />
                View Examples
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 text-center"
          >
            <div>
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Products Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">60s</div>
              <div className="text-sm text-gray-600">Average Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">User Rating</div>
            </div>
          </motion.div>
        </div>

        {/* Hero Image Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 flow-root sm:mt-24"
        >
          <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {/* Sample product images */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package2Icon className="h-16 w-16 text-purple-500/50" />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium">
                  Studio Shot
                </div>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CameraIcon className="h-16 w-16 text-blue-500/50" />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium">
                  Lifestyle
                </div>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon className="h-16 w-16 text-green-500/50" />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium">
                  3D Render
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

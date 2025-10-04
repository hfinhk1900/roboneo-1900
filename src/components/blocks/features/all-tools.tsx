'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ToolCard {
  id: string;
  title: string;
  image: string;
  alt: string;
  href: string;
}

const tools: ToolCard[] = [
  {
    id: 'image-to-sticker',
    title: 'Image to Sticker',
    image: '/home/all-tools01.png',
    alt: 'RoboNeo Image to Sticker - Convert photos to stickers',
    href: '/sticker',
  },
  {
    id: 'product-shots',
    title: 'Product Shots',
    image: '/home/all-tools02.png',
    alt: 'RoboNeo Product Shots - AI product photography',
    href: '/productshot',
  },
  {
    id: 'ai-backgrounds',
    title: 'AI Backgrounds',
    image: '/home/all-tools03.png',
    alt: 'RoboNeo AI Backgrounds - Generate stunning backgrounds',
    href: '/aibackgrounds',
  },
  {
    id: 'remove-watermark',
    title: 'Remove Watermark',
    image: '/home/all-tools04.png',
    alt: 'RoboNeo Remove Watermark - Clean your images',
    href: '/remove-watermark',
  },
  {
    id: 'profile-picture',
    title: 'Profile Picture Maker',
    image: '/home/all-tools05.png',
    alt: 'RoboNeo Profile Picture Maker - Create professional avatars',
    href: '/profile-picture-maker',
  },
];

export default function AllToolsSection() {
  return (
    <section id="all-tools" className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-black mb-2">All Tools</h2>
          <p className="text-gray-600 text-base">
            Explore RoboNeo AI's complete suite of image tools designed to help
            you create professional visuals effortlessly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={tool.href}
                className="group bg-neutral-100 rounded-3xl p-4 sm:p-6 h-[240px] sm:h-[280px] md:h-[320px] lg:h-[337px] overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center"
              >
                {/* Tool Title */}
                <div className="text-center mb-4 sm:mb-6 h-12 sm:h-16 flex items-center justify-center">
                  <h3 className="text-base sm:text-lg font-bold text-black leading-tight px-2">
                    {tool.title}
                  </h3>
                </div>

                {/* Tool Image */}
                <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] lg:w-[166px] lg:h-[166px] mx-auto mb-4 sm:mb-6 rounded-2xl overflow-hidden">
                  <Image
                    src={tool.image}
                    alt={tool.alt}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 140px, 166px"
                  />
                </div>

                {/* Arrow Icon */}
                <div className="flex items-center justify-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center group-hover:bg-yellow-500 transition-colors duration-300">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

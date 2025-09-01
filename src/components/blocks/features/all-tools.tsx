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
    alt: 'Image to Sticker - Convert photos to stickers',
    href: '/sticker',
  },
  {
    id: 'product-shots',
    title: 'Product Shots',
    image: '/home/all-tools02.png',
    alt: 'Product Shots - AI product photography',
    href: '/productshot',
  },
  {
    id: 'ai-backgrounds',
    title: 'AI Backgrounds',
    image: '/home/all-tools03.png',
    alt: 'AI Backgrounds - Generate stunning backgrounds',
    href: '/aibackgrounds',
  },
  {
    id: 'remove-watermark',
    title: 'Remove Watermark',
    image: '/home/all-tools04.png',
    alt: 'Remove Watermark - Clean your images',
    href: '/remove-watermark',
  },
  {
    id: 'profile-picture',
    title: 'Profile Picture Maker',
    image: '/home/all-tools05.png',
    alt: 'Profile Picture Maker - Create professional avatars',
    href: '/profile-picture-maker',
  },
];

export default function AllToolsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-black mb-2">All Tools</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={tool.href}
                className="group block bg-neutral-100 rounded-3xl p-6 h-[337px] relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Tool Title */}
                <div className="text-center mb-6 h-16 flex items-center justify-center">
                  <h3 className="text-lg font-bold text-black leading-tight">
                    {tool.title}
                  </h3>
                </div>

                {/* Tool Image */}
                <div className="relative w-[166px] h-[166px] mx-auto mb-0 rounded-2xl overflow-hidden bg-white">
                  <Image
                    src={tool.image}
                    alt={tool.alt}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="166px"
                  />
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center group-hover:bg-yellow-500 transition-colors duration-300">
                    <ArrowRight className="w-4 h-4 text-black" />
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

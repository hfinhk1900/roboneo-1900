'use client';

import { motion } from 'framer-motion';

export default function PlatformOverviewSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-[28px] font-bold text-black mb-8 text-center">
            How RoboNeo AI Works for Your Creative Workflow
          </h2>

          <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed text-center">
            <p className="mb-6">
              RoboNeo AI is designed around four core creative workflows that
              address common visual content challenges. Each tool uses
              specialized AI models trained for specific tasks, ensuring optimal
              results for different types of image processing needs.
            </p>

            <p className="mb-6">
              Our Sticker Maker automatically handles background removal and
              edge optimization with RoboNeo AI, converting any photo into a
              clean, transparent sticker suitable for digital use. The Product
              Studio generates multiple scene variations from product photos,
              helping businesses create diverse marketing materials from single
              source images.
            </p>

            <p className="mb-6">
              The RoboNeo AI Background tool seamlessly replaces image
              environments while maintaining realistic lighting and perspective.
              Our Watermark Removal feature uses advanced algorithms to cleanly
              eliminate unwanted text or logos from images without leaving
              artifacts.
            </p>

            <p className="mb-6">
              RoboNeo AI operates on a credit-based system where each successful
              generation consumes credits. This approach provides predictable
              costs and allows users to scale their usage based on actual needs.
              The platform supports various output formats and resolutions
              suitable for web, print, and digital marketing applications.
            </p>

            <p>
              Whether you're a creator or business, RoboNeo AI delivers
              professional results every time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import React from 'react';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools';

import { RemoveWatermarkGeneratorSection } from '@/components/blocks/remove-watermark/remove-watermark-generator';

export const metadata: Metadata = {
  title: 'Remove Image Watermark - RoboNeo Art',
  description:
    'Intelligently remove watermarks from images with AI-powered precision. Support for text watermarks, logos, and complex overlays.',
  keywords:
    'remove watermark, image processing, AI watermark removal, clean images, restore photos',
  openGraph: {
    title: 'Remove Image Watermark - RoboNeo Art',
    description:
      'Intelligently remove watermarks from images with AI-powered precision. Support for text watermarks, logos, and complex overlays.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remove Image Watermark - RoboNeo Art',
    description:
      'Intelligently remove watermarks from images with AI-powered precision. Support for text watermarks, logos, and complex overlays.',
  },
};

export default function RemoveWatermarkPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <RemoveWatermarkGeneratorSection />
      <ExploreMoreToolsSection />
    </main>
  );
}

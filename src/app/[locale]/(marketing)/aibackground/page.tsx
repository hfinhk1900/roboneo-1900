import React from 'react';
import { Metadata } from 'next';

import { AIBackgroundGeneratorSection } from '@/components/blocks/aibg/aibg-generator';

export const metadata: Metadata = {
  title: 'AI Background - RoboNeo Art',
  description: 'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
  keywords: 'AI Background, background removal, image processing, transparent background',
  openGraph: {
    title: 'AI Background - RoboNeo Art',
    description: 'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Background - RoboNeo Art',
    description: 'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
  },
};

export default function AIBackgroundPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <AIBackgroundGeneratorSection />
    </main>
  );
}

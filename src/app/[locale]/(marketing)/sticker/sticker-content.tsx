'use client';

import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import ImageShowcaseSection from '@/components/blocks/features/image-showcase';
import StepsShowcaseSection from '@/components/blocks/features/steps-showcase';
import dynamic from 'next/dynamic';

const StickerGenerator = dynamic(
  () => import('@/components/blocks/sticker/sticker-generator'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] flex items-center justify-center">
        Loading…
      </div>
    ),
  }
);

export default function StickerPageContent() {
  return (
    <div className="flex flex-col">
      {/* Main Sticker Generator Section */}
      <StickerGenerator />

      {/* Steps Showcase Section */}
      <StepsShowcaseSection />

      {/* Image Gallery & AI Features Section */}
      <ImageShowcaseSection />

      {/* Explore More AI Tools Section */}
      <ExploreMoreToolsSection />
    </div>
  );
}

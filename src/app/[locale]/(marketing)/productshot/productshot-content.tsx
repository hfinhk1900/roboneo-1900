'use client';

import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
const PhotostockGallery = dynamic(
  () => import('@/components/shared/photostock-gallery'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[30vh] flex items-center justify-center">
        Loading…
      </div>
    ),
  }
);
import dynamic from 'next/dynamic';

const ProductShotGeneratorSection = dynamic(
  () => import('@/components/blocks/productshot/productshot-generator'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] flex items-center justify-center">
        Loading…
      </div>
    ),
  }
);

export default function ProductShotPageContent() {
  return (
    <div className="flex flex-col bg-white">
      {/* Main Generator Section */}
      <ProductShotGeneratorSection />

      {/* Showcase Gallery */}
      <PhotostockGallery />

      {/* Explore More Tools (copied from Image to Sticker section) */}
      <ExploreMoreToolsSection />

      <CallToActionSection />
    </div>
  );
}

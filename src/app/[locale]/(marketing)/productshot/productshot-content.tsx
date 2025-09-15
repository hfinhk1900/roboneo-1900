'use client';

import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import PhotostockGallery from '@/components/shared/photostock-gallery';
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
    </div>
  );
}

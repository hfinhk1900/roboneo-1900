'use client';

import { KeyBenefits } from '@/components/shared/key-benefits';
import { ShowcaseGallery } from '@/components/shared/showcase-gallery';
import MoreAITools from '@/components/more-ai-tools';

export default function ImageShowcaseSection() {
  return (
    <div>
      {/* Gallery Section */}
      <ShowcaseGallery className="bg-[#f5f5f5]" />

      {/* Key Benefits Section */}
      <KeyBenefits className="bg-white" />

      {/* More AI Tools Section */}
      <MoreAITools />
    </div>
  );
}

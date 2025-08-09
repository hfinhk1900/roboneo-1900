'use client';

import AIMagicFeatures from '@/components/ai-magic-features';
import MoreAITools from '@/components/more-ai-tools';
import { KeyBenefits } from '@/components/shared/key-benefits';
import { ShowcaseGallery } from '@/components/shared/showcase-gallery';

export default function ImageShowcaseSection() {
  return (
    <div>
      {/* Gallery Section */}
      <ShowcaseGallery className="bg-[#f5f5f5]" />

      {/* Key Benefits Section */}
      <KeyBenefits className="bg-white" />

      {/* More AI Tools Section */}
      <MoreAITools />

      {/* AI Magic Features Section */}
      <AIMagicFeatures />
    </div>
  );
}

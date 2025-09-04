'use client';

// import MoreAITools from '@/components/more-ai-tools'; // Removed
import { KeyBenefits } from '@/components/shared/key-benefits';
import { ShowcaseGallery } from '@/components/shared/showcase-gallery';

export default function ImageShowcaseSection() {
  return (
    <div>
      {/* Gallery Section */}
      <ShowcaseGallery className="bg-[#f5f5f5]" />

      {/* Key Benefits Section - Hidden */}
      {/* <KeyBenefits className="bg-white" /> */}

      {/* More AI Tools Section - Removed */}
      {/* <MoreAITools /> */}

      {/* AI Magic Features Section - Removed */}
      {/* <AIMagicFeatures /> */}
    </div>
  );
}

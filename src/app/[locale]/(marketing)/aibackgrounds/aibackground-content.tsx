'use client';

import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import dynamic from 'next/dynamic';

const AIBackgroundGeneratorSection = dynamic(
  () =>
    import('@/components/blocks/aibg/aibg-generator').then(
      (m) => m.AIBackgroundGeneratorSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] flex items-center justify-center">
        Loading…
      </div>
    ),
  }
);

export default function AIBackgroundPageContent() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <AIBackgroundGeneratorSection />
      <ExploreMoreToolsSection />
      <CallToActionSection />
    </main>
  );
}

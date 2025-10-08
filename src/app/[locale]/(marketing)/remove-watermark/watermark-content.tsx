'use client';

import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import dynamic from 'next/dynamic';

const RemoveWatermarkGeneratorSection = dynamic(
  () =>
    import(
      '@/components/blocks/remove-watermark/remove-watermark-generator'
    ).then((m) => m.RemoveWatermarkGeneratorSection),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] flex items-center justify-center">
        Loading…
      </div>
    ),
  }
);

export default function RemoveWatermarkPageContent() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <RemoveWatermarkGeneratorSection />
      <ExploreMoreToolsSection />
      <CallToActionSection />
    </main>
  );
}

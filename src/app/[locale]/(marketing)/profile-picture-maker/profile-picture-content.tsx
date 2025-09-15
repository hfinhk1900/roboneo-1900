'use client';

import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import dynamic from 'next/dynamic';

const ProfilePictureMakerGenerator = dynamic(
  () =>
    import(
      '@/components/blocks/profile-picture-maker/profile-picture-maker-generator'
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

export default function ProfilePictureMakerPageContent() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <ProfilePictureMakerGenerator />
      <ExploreMoreToolsSection />
    </main>
  );
}

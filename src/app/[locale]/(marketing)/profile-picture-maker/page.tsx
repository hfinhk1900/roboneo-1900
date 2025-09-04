import ProfilePictureMakerGenerator from '@/components/blocks/profile-picture-maker/profile-picture-maker-generator';
import { constructMetadata } from '@/lib/metadata';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    title:
      'AI Profile Picture Maker | Professional Headshots Generator | RoboNeo',
    description:
      'Transform your photos into professional profile pictures with AI. Generate business headshots, clean portraits, and elegant monochrome styles instantly. Perfect for LinkedIn, resumes, and social profiles.',
    canonicalUrl: '/profile-picture-maker',
    openGraph: {
      title: 'AI Profile Picture Maker - Professional Headshots Generator',
      description:
        'Create stunning professional profile pictures with AI. Transform any photo into business-ready headshots with multiple style options.',
      type: 'website',
      images: [
        {
          url: '/og-profile-picture-maker.jpg',
          width: 1200,
          height: 630,
          alt: 'AI Profile Picture Maker Preview',
        },
      ],
    },
  });
}

export default function ProfilePictureMakerPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <ProfilePictureMakerGenerator />
      <ExploreMoreToolsSection />
    </main>
  );
}

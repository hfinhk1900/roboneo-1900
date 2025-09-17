import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import ProfilePictureMakerPageContent from './profile-picture-content';

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
    image: '/og-profile-picture-maker.jpg',
  });
}

export default function ProfilePictureMakerPage() {
  return <ProfilePictureMakerPageContent />;
}

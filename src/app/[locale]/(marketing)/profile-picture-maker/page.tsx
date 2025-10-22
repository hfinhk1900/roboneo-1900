import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import ProfilePictureMakerPageContent from './profile-picture-content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    title:
      'AI Profile Picture Maker | Professional Headshots Generator | RoboNeo',
    description:
      'Transform your photos into professional profile pictures with AI. Generate business headshots, clean portraits, and elegant monochrome styles instantly. Perfect for LinkedIn, resumes, and social profiles.',
    canonicalUrl: getUrlWithLocale('/profile-picture-maker', locale),
    image: '/og-profile-picture-maker.jpg',
  });
}

export default function ProfilePictureMakerPage() {
  return <ProfilePictureMakerPageContent />;
}

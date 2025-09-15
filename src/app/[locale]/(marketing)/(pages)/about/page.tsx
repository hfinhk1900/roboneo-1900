import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import AboutPageContent from './about-content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  return constructMetadata({
    title: 'About Us - Roboneo',
    description:
      'Learn about Roboneo, the browser-based AI image suite that turns photos into finished visuals in just a few clicks. Built by a passionate team for creators worldwide.',
    canonicalUrl: getUrlWithLocale('/about', locale),
  });
}

export default function AboutPage() {
  return <AboutPageContent />;
}

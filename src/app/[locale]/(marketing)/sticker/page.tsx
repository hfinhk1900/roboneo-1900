import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools';
import ImageShowcaseSection from '@/components/blocks/features/image-showcase';
import StepsShowcaseSection from '@/components/blocks/features/steps-showcase';
import StickerGenerator from '@/components/blocks/sticker/sticker-generator';
import { StructuredData } from '@/components/seo/structured-data';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { generateViewport } from '@/lib/viewport';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export { generateViewport };

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title:
      'AI Image to Sticker Generator - Create Amazing Stickers from Photos',
    description:
      'Transform your photos into beautiful stickers with AI. Create iOS style stickers, pixel art, LEGO minifigures and more. Free AI sticker maker.',
    canonicalUrl: getUrlWithLocale('/sticker', locale),
  });
}

interface StickerPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function StickerPage(props: StickerPageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations('HomePage');

  return (
    <>
      <StructuredData type="website" />
      <div className="flex flex-col">
        {/* Main Sticker Generator Section */}
        <StickerGenerator />

        {/* Steps Showcase Section */}
        <StepsShowcaseSection />

        {/* Image Gallery & AI Features Section */}
        <ImageShowcaseSection />

        {/* Explore More AI Tools Section */}
        <ExploreMoreToolsSection />
      </div>
    </>
  );
}

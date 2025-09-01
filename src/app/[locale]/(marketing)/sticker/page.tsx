import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import ImageShowcaseSection from '@/components/blocks/features/image-showcase';
import StepsShowcaseSection from '@/components/blocks/features/steps-showcase';
import PricingSection from '@/components/blocks/pricing/pricing';
import StickerGenerator from '@/components/blocks/sticker/sticker-generator';
import TestimonialsSection from '@/components/blocks/testimonials/testimonials';
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
      <StructuredData type="faq" />
      <div className="flex flex-col">
        {/* Main Sticker Generator Section */}
        <StickerGenerator />

        {/* Steps Showcase Section */}
        <StepsShowcaseSection />

        {/* Image Gallery & AI Features Section */}
        <ImageShowcaseSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <FaqSection />

        {/* Call to Action Section */}
        <CallToActionSection />

        {/* Testimonials Section */}
        <TestimonialsSection />
      </div>
    </>
  );
}

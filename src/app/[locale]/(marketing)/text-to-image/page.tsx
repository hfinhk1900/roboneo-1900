import TextToImageComparisonSection from '@/components/blocks/text-to-image/comparison';
import TextToImageCTASection from '@/components/blocks/text-to-image/cta';
import TextToImageFAQSection from '@/components/blocks/text-to-image/faq';
import TextToImageFeaturesSection from '@/components/blocks/text-to-image/features';
import TextToImageGallerySection from '@/components/blocks/text-to-image/gallery';
import TextToImageHeroSection from '@/components/blocks/text-to-image/hero';
import TextToImageToolsSection from '@/components/blocks/text-to-image/tools-showcase';
import { NewsletterCard } from '@/components/newsletter/newsletter-card';
import { StructuredData } from '@/components/seo/structured-data';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;

  return constructMetadata({
    title: 'AI Text to Image Generator | Free Text to Art Converter | RoboNeo',
    description:
      'Transform text to stunning images with our AI text to image generator. Create art, product photos, stickers, and more from text prompts. 4 powerful AI tools in one platform. Try free!',
    canonicalUrl: getUrlWithLocale('/text-to-image', locale),
  });
}

interface TextToImagePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function TextToImagePage(props: TextToImagePageProps) {
  const params = await props.params;
  const { locale } = params;

  // JSON-LD structured data for better SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RoboNeo AI Text to Image Generator',
    description:
      'Transform text prompts into stunning images with multiple AI tools',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2456',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe JSON-LD structured data for SEO
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col">
        {/* Hero Section with main value proposition */}
        <TextToImageHeroSection />

        {/* Showcase of 4 Text to Image Tools */}
        <TextToImageToolsSection />

        {/* Key Features Section */}
        <TextToImageFeaturesSection />

        {/* Comparison Table */}
        <TextToImageComparisonSection />

        {/* Gallery Showcase */}
        <TextToImageGallerySection />

        {/* FAQ Section */}
        <TextToImageFAQSection />

        {/* Call to Action */}
        <TextToImageCTASection />

        {/* Newsletter */}
        <NewsletterCard />
      </div>
    </>
  );
}

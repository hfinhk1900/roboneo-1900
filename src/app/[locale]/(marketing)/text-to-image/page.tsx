import TextToImageHeroSection from '@/components/blocks/text-to-image/hero';
import TextToImageToolsSection from '@/components/blocks/text-to-image/tools-showcase';
import TextToImageFeaturesSection from '@/components/blocks/text-to-image/features';
import TextToImageComparisonSection from '@/components/blocks/text-to-image/comparison';
import TextToImageGallerySection from '@/components/blocks/text-to-image/gallery';
import TextToImageFAQSection from '@/components/blocks/text-to-image/faq';
import TextToImageCTASection from '@/components/blocks/text-to-image/cta';
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
    description: 'Transform text to stunning images with our AI text to image generator. Create art, product photos, stickers, and more from text prompts. 4 powerful AI tools in one platform. Try free!',
    keywords: 'AI text to image generator, text to art converter, AI image generation from text, free text to image AI, prompt to image creator, text description to picture, AI art generator from words, text to visual converter online, generate images from text prompts, text to image AI tools',
    canonicalUrl: getUrlWithLocale('/text-to-image', locale),
    openGraph: {
      title: 'AI Text to Image Generator - Transform Words into Visual Art',
      description: 'Create stunning images from text with 4 powerful AI tools. Generate art, product photos, stickers, and more instantly.',
      type: 'website',
      images: [
        {
          url: '/og-text-to-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AI Text to Image Generator Preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Text to Image Generator | RoboNeo',
      description: 'Transform text prompts into stunning visuals with 4 powerful AI tools.',
      images: ['/og-text-to-image.jpg'],
    },
    alternates: {
      canonical: '/text-to-image',
    },
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
    description: 'Transform text prompts into stunning images with multiple AI tools',
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

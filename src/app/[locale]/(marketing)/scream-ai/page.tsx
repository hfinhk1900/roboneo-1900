import { BreadcrumbSchema, StructuredData } from '@/components/seo/structured-data';
import type { Metadata } from 'next';
import ScreamAIPageContent from './scream-ai-content';

const pageUrl = 'https://roboneo.art/scream-ai';
const ogImage = 'https://roboneo.art/og.png';

export const metadata: Metadata = {
  title:
    'Scream AI Horror Image Generator | Suspenseful Cinematic Scenes | RoboNeo',
  description:
    'Scream AI turns any portrait into a suspenseful cinematic still. Upload a photo, choose a horror preset, and generate a Ghost Face inspired thriller moment in seconds. Preserve identity, keep things PG-13, and remove watermarks with a paid plan.',
  keywords:
    'scream ai, scream ai generator, horror ai image, thriller ai portrait, ghost face inspired ai, suspense ai photo editor, scary ai background, scream ai cinematic stills, halloween ai art, scream ai marketing tool',
  openGraph: {
    title: 'Scream AI — Create Suspenseful Horror Scenes from Any Portrait',
    description:
      'Use Scream AI to craft Ghost Face inspired thrillers while keeping subject identity intact. Perfect for campaigns, storytellers, and horror fans.',
    url: pageUrl,
    siteName: 'RoboNeo Art',
    type: 'article',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'Scream AI horror image generator hero artwork',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scream AI Horror Image Generator | RoboNeo',
    description:
      'Generate cinematic horror portraits with Scream AI. Upload, select a preset, and download your suspenseful still.',
    images: [ogImage],
  },
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ScreamAIPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Scream AI Horror Image Generator',
    description:
      'Discover how Scream AI converts any portrait into a cinematic Ghost Face thriller with identity-safe presets, PG-13 controls, and fast web rendering.',
    image: [ogImage],
    datePublished: '2024-12-01T00:00:00.000Z',
    dateModified: '2024-12-01T00:00:00.000Z',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    author: {
      '@type': 'Organization',
      name: 'RoboNeo Art Team',
      url: 'https://roboneo.art',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RoboNeo Art',
      url: 'https://roboneo.art',
      logo: {
        '@type': 'ImageObject',
        url: 'https://roboneo.art/favicon.svg',
      },
    },
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Scream AI Generator',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: pageUrl,
    image: ogImage,
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with watermark-protected horror previews.',
      },
      {
        '@type': 'Offer',
        price: '10',
        priceCurrency: 'USD',
        description: 'Pro subscription removes watermarks and unlocks HD exports.',
      },
    ],
    featureList: [
      'Ghost Face inspired horror presets',
      'Identity-preserving portrait rendering',
      'Fast 30–60 second generation times',
      'Downloadable PNGs with optional watermark removal',
      'Creative prompt controls for lighting and placement',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '2450',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RoboNeo Art',
      url: 'https://roboneo.art',
    },
  };

  return (
    <>
      <StructuredData type="article" data={articleJsonLd} />
      <StructuredData type="product" data={productJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://roboneo.art/' },
          { name: 'Tools', url: 'https://roboneo.art/#features' },
          { name: 'Scream AI', url: pageUrl },
        ]}
      />
      <ScreamAIPageContent />
    </>
  );
}

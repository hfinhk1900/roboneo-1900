import ProductShotFeaturesSection from '@/components/blocks/productshot/productshot-features';
import ProductShotGeneratorSection from '@/components/blocks/productshot/productshot-generator';
import {
  ProductShotBenefitsSection,
  ProductShotCTASection,
  ProductShotShowcaseSection,
} from '@/components/blocks/productshot/productshot-placeholders';
import MoreAITools from '@/components/more-ai-tools';
import { StructuredData } from '@/components/seo/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'AI Product Photography Generator | Create Professional Product Shots Instantly | RoboNeo',
  description:
    'Generate stunning e-commerce product photos with AI. Transform text to product images instantly. No photography skills needed. Perfect for online stores, Amazon listings, and marketing. Try free!',
  keywords:
    'AI product photography, product shot generator, text to product image, e-commerce product photos, AI product image generator, professional product photography online, 3D product visualization, automated product photography, product mockup generator, instant product photos',
  openGraph: {
    title: 'AI Product Photography Generator - Create Instant Product Shots',
    description:
      'Transform text descriptions into professional e-commerce product photos with AI. No camera or studio needed.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Product Photography Generator | RoboNeo',
    description:
      'Create professional product shots instantly with AI. Perfect for e-commerce.',
  },
  alternates: {
    canonical: '/productshot',
  },
};

export default function ProductShotPage() {
  return (
    <>
      <StructuredData type="product" />
      <div className="flex flex-col bg-white">
        {/* Main Generator Section */}
        <ProductShotGeneratorSection />

        {/* Showcase Gallery */}
        <ProductShotShowcaseSection />

        {/* Benefits Section */}
        <ProductShotBenefitsSection />

        {/* Features Section */}
        <ProductShotFeaturesSection />

        {/* More AI Tools */}
        <MoreAITools />

        {/* CTA Section */}
        <ProductShotCTASection />
      </div>
    </>
  );
}

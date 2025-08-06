import ProductShotSection from '@/components/blocks/productshot/productshot-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Shot Generator - Create Stunning Product Images with AI | RoboNeo',
  description: 'Generate professional product photos from text descriptions. Perfect for e-commerce, marketing materials, and social media content.',
  keywords: 'ai product photography, text to product image, product shot generator, ai product photos, e-commerce photography',
};

export default function ProductShotPage() {
  return (
    <main className="overflow-hidden py-12 bg-[#F5F5F5] min-h-screen">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center sm:mx-auto lg:mr-auto mb-12">
          <h1 className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl">
            Create Professional Product Shots with AI
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Transform your product descriptions into stunning, professional-grade images perfect for e-commerce and marketing.
          </p>
        </div>
        
        <ProductShotSection />
      </div>
    </main>
  );
}

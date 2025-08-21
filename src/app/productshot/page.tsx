import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import ProductShotFeaturesSection from '@/components/blocks/productshot/productshot-features';
import ProductShotGenerator from '@/components/blocks/productshot/productshot-generator';
import ProductShotHero from '@/components/blocks/productshot/productshot-hero';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'AI Product Photography Generator | Create Professional Product Shots Instantly | RoboNeo',
  description:
    'Transform your products into stunning professional photos with AI. Generate high-quality e-commerce product photography in seconds. No camera or photography skills needed.',
  keywords:
    'AI product photography, product photo generator, e-commerce photography, automated product shots, AI background removal, product image creator, professional product photos, instant product photography, AI product imaging, commercial photography AI',
  openGraph: {
    title: 'AI Product Photography Generator - RoboNeo',
    description:
      'Create professional product photos instantly with AI. Perfect for e-commerce, Amazon, Shopify, and social media.',
    images: ['/images/productshot-og.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Product Photography Generator - RoboNeo',
    description:
      'Transform products into professional photos with AI in seconds.',
    images: ['/images/productshot-twitter.jpg'],
  },
  alternates: {
    canonical: 'https://roboneo.com/productshot',
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RoboNeo Product Shot Generator',
  applicationCategory: 'PhotographyApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '2450',
  },
  operatingSystem: 'Web Browser',
  description:
    'AI-powered product photography generator for e-commerce and marketing',
};

export default function ProductShotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section with key benefits */}
      <ProductShotHero />

      {/* Main Product Shot Generator */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
              Automated Product Photography - No Camera Needed
            </span>
            <h1
              className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl"
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              }}
            >
              Product Shots
            </h1>
            <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
              Transform product descriptions into professional scene photography
            </p>
          </div>

          {/* What is AI Product Photography Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What is AI Product Scene Generation?
            </h2>
            <p className="text-gray-600 mb-4">
              AI product scene generation uses FLUX.1-Kontext technology to
              create professional product photography by placing your products
              in contextual scenes. Our advanced AI understands product
              descriptions and generates realistic lifestyle photography with
              perfect lighting, composition, and styling.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              How AI Product Scene Generation Works
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Describe your product or upload a product image</li>
              <li>
                Choose from professional scene types (studio, lifestyle,
                outdoor, etc.)
              </li>
              <li>
                FLUX.1-Kontext AI generates contextual product photography
              </li>
              <li>
                Get high-quality results with realistic lighting and composition
              </li>
              <li>Download professional images ready for any marketing use</li>
            </ol>
          </div>

          <ProductShotGenerator />

          {/* Use Cases Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Perfect for Every E-commerce Need
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Amazon & Marketplaces
                </h3>
                <p className="text-gray-600">
                  Generate white background product photos that meet Amazon's
                  strict image requirements. Create main images, lifestyle
                  shots, and infographics.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">
                  E-commerce Websites
                </h3>
                <p className="text-gray-600">
                  Produce consistent product photography for Shopify,
                  WooCommerce, and other platforms. Maintain brand consistency
                  across your entire catalog.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Social Media Marketing
                </h3>
                <p className="text-gray-600">
                  Create eye-catching product images for Instagram, Facebook,
                  Pinterest. Generate lifestyle shots that drive engagement and
                  sales.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">Print & Catalogs</h3>
                <p className="text-gray-600">
                  Export high-resolution product photos for print materials,
                  catalogs, and packaging. 4K quality suitable for any
                  professional use.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose AI Over Traditional Product Photography
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <strong>90% Cost Reduction:</strong> No photographer fees,
                  studio rental, or equipment costs
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <strong>Instant Results:</strong> Generate photos in seconds
                  instead of days or weeks
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <strong>Unlimited Variations:</strong> Create multiple styles
                  and angles from a single product
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <strong>Consistent Quality:</strong> Professional results
                  every time, no skill required
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <strong>Scale Effortlessly:</strong> Process hundreds of
                  products simultaneously
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <ProductShotFeaturesSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* CTA Section */}
      <CallToActionSection />
    </>
  );
}

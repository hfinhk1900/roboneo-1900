import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'product' | 'article' | 'faq';
  data?: any;
}

export function StructuredData({
  type = 'website',
  data,
}: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Roboneo AI',
          alternateName: 'Roboneo',
          url: 'https://roboneo.art',
          logo: 'https://roboneo.art/favicon.svg',
          description:
            'Roboneo AI - Transform photos into iOS-style stickers and create stunning AI-generated images. Free AI art generator with text-to-image and image-to-sticker features.',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '2450',
          },
          creator: {
            '@type': 'Organization',
            name: 'Roboneo AI',
            url: 'https://roboneo.art',
          },
          keywords: [
            'roboneo',
            'roboneo ai',
            'ai sticker maker',
            'ios sticker generator',
            'photo to sticker',
            'ai image generator',
            'text to image ai',
            'free ai art generator',
            'anime converter',
            'ai headshot generator',
          ],
        };

      case 'product':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Roboneo AI Image Generator',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          offers: [
            {
              '@type': 'Offer',
              name: 'Free Plan',
              price: '0',
              priceCurrency: 'USD',
              description: '10 free credits for new users',
            },
            {
              '@type': 'Offer',
              name: 'Pro Plan',
              price: '10',
              priceCurrency: 'USD',
              description: '2000 credits per month',
            },
            {
              '@type': 'Offer',
              name: 'Ultimate Plan',
              price: '20',
              priceCurrency: 'USD',
              description: '5000 credits per month',
            },
          ],
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '2450',
          },
          featureList: [
            'iOS-style sticker generation',
            'Photo to anime converter',
            'Text to image generation',
            'Background removal',
            'High-resolution downloads',
            'Commercial usage rights',
          ],
        };

      case 'article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'RoboNeo AI — Build Viral AI Tools Fast',
          description:
            'Learn how RoboNeo AI helps you launch AI-powered creators and marketing workflows in minutes with ready-to-use SaaS foundations.',
          image: ['https://roboneo.art/og.png'],
          datePublished: '2024-01-01T00:00:00.000Z',
          dateModified: '2024-01-01T00:00:00.000Z',
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': 'https://roboneo.art',
          },
          author: {
            '@type': 'Organization',
            name: 'RoboNeo',
            url: 'https://roboneo.art',
          },
          publisher: {
            '@type': 'Organization',
            name: 'RoboNeo',
            url: 'https://roboneo.art',
            logo: {
              '@type': 'ImageObject',
              url: 'https://roboneo.art/favicon.svg',
            },
          },
        };

      case 'faq':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is Roboneo AI free to use?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! New users receive 20 free credits to create watermark-free, high-resolution images or stickers. After that, you can purchase credits or upgrade to Pro/Ultimate plans.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I use Roboneo AI images for commercial projects?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely. All content created with paid plans or credit packs can be used commercially. Free-tier images are for personal use only.',
              },
            },
            {
              '@type': 'Question',
              name: 'How fast does Roboneo AI generate images?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Most images are generated in under 1 minute. Paid users get priority processing with speeds up to 5x faster.',
              },
            },
            {
              '@type': 'Question',
              name: 'What makes Roboneo AI different from other generators?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Roboneo specializes in iOS-style stickers with automatic background removal, white outlines, and transparent PNGs ready for messaging apps.',
              },
            },
          ],
        };

      default:
        return {};
    }
  };

  const structuredData = data ?? getStructuredData();

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe use for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="afterInteractive"
    />
  );
}

// Breadcrumb Schema Component
export function BreadcrumbSchema({
  items,
}: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe use for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      strategy="afterInteractive"
    />
  );
}

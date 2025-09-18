import AISuperchargeToolsSection from '@/components/blocks/features/ai-supercharge-tools';
import AllToolsSection from '@/components/blocks/features/all-tools';
import HomeHeroSection from '@/components/blocks/hero/home-hero';
import dynamic from 'next/dynamic';

// 懒加载非首屏组件
const CallToActionSection = dynamic(
  () => import('@/components/blocks/calltoaction/calltoaction'),
  {
    loading: () => <div className="h-64 bg-gray-50 animate-pulse" />,
  }
);

const FaqSection = dynamic(() => import('@/components/blocks/faqs/faqs'), {
  loading: () => <div className="h-96 bg-white animate-pulse" />,
});

const PricingSection = dynamic(
  () => import('@/components/blocks/pricing/pricing'),
  {
    loading: () => <div className="h-screen bg-gray-50 animate-pulse" />,
  }
);

const TestimonialsSection = dynamic(
  () => import('@/components/blocks/testimonials/testimonials'),
  {
    loading: () => <div className="h-64 bg-white animate-pulse" />,
  }
);
const SHOW_TESTIMONIALS = false;
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
    title: t('title'),
    description: t('description'),
    canonicalUrl: getUrlWithLocale('', locale),
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage(props: HomePageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations('HomePage');

  return (
    <>
      <StructuredData type="website" />
      <StructuredData type="faq" />
      <div className="flex flex-col">
        <HomeHeroSection />

        <AllToolsSection />

        <AISuperchargeToolsSection />

        <PricingSection />

        <FaqSection />

        <CallToActionSection />

        {SHOW_TESTIMONIALS && <TestimonialsSection />}
      </div>
    </>
  );
}

import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import ImageShowcaseSection from '@/components/blocks/features/image-showcase';
import StepsShowcaseSection from '@/components/blocks/features/steps-showcase';
import HeroSection from '@/components/blocks/hero/hero';
import PricingSection from '@/components/blocks/pricing/pricing';
import TestimonialsSection from '@/components/blocks/testimonials/testimonials';
import { NewsletterCard } from '@/components/newsletter/newsletter-card';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

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
      <div className="flex flex-col">
        <HeroSection />

        <StepsShowcaseSection />

        <ImageShowcaseSection />

        <PricingSection />

        <FaqSection />

        <CallToActionSection />

        <TestimonialsSection />

        <NewsletterCard />
      </div>
    </>
  );
}

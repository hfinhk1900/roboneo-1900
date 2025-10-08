import { CustomPage } from '@/components/page/custom-page';
import { constructMetadata } from '@/lib/metadata';
import { pagesSource } from '@/lib/source';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const page = pagesSource.getPage(['refund-policy'], locale);

  if (!page) {
    console.warn(
      `generateMetadata, page not found for refund-policy, locale: ${locale}`
    );
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: page.data.title + ' | ' + t('title'),
    description: page.data.description,
    canonicalUrl: getUrlWithLocale('/refund', locale),
    noIndex: true,
  });
}

export default async function RefundPolicyPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const locale = params.locale as string;
  const page = pagesSource.getPage(['refund-policy'], locale);

  if (!page) {
    notFound();
  }

  return <CustomPage page={page} />;
}

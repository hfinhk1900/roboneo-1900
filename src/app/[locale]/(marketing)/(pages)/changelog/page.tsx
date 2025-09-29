import Container from '@/components/layout/container';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import '@/styles/mdx.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({ locale, namespace: 'ChangelogPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    canonicalUrl: getUrlWithLocale('/changelog', locale),
  });
}

export default async function ChangelogPage(_props: NextPageProps) {
  return (
    <Container className="py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
        <p className="text-lg text-muted-foreground">
          Last updated on September 2, 2025. We&apos;re preparing a refreshed
          changelog that highlights upcoming product improvements, feature
          launches, and key fixes. Check back soon to see what&apos;s new.
        </p>
      </div>
    </Container>
  );
}

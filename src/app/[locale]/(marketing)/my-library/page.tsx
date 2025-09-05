import MyImageLibrary from '@/components/blocks/library/my-image-library';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// 禁用预取以节省带宽
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('MyImageLibrary');

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metadata.title'),
      description: t('metadata.description'),
    },
  };
}

export default function MyLibraryPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <MyImageLibrary />
    </div>
  );
}

import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://roboneo.art/',
  },
};

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}

import type { Metadata } from 'next';
import AIBackgroundPageContent from './aibackground-content';

export const metadata: Metadata = {
  title: 'AI Backgrounds - RoboNeo Art',
  description:
    'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
  keywords:
    'AI Backgrounds, background removal, image processing, transparent background',
  openGraph: {
    title: 'AI Backgrounds - RoboNeo Art',
    description:
      'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Backgrounds - RoboNeo Art',
    description:
      'Intelligently remove image backgrounds with support for transparent and custom color backgrounds',
  },
  alternates: {
    canonical: 'https://roboneo.art/aibackgrounds',
  },
};

export default function AIBackgroundPage() {
  return <AIBackgroundPageContent />;
}

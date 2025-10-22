import { StructuredData } from '@/components/seo/structured-data';
import type { Metadata } from 'next';
import ScreamAIPageContent from './scream-ai-content';

export const metadata: Metadata = {
  title:
    'Scream AI Horror Image Generator | Suspenseful Cinematic Scenes | RoboNeo',
  description:
    'Scream AI turns any portrait into a suspenseful cinematic still. Upload a photo, choose a horror preset, and generate a Ghost Face inspired thriller moment in seconds. Preserve identity, keep things PG-13, and remove watermarks with a paid plan.',
  keywords:
    'scream ai, scream ai generator, horror ai image, thriller ai portrait, ghost face inspired ai, suspense ai photo editor, scary ai background, scream ai cinematic stills, halloween ai art, scream ai marketing tool',
  openGraph: {
    title: 'Scream AI — Create Suspenseful Horror Scenes from Any Portrait',
    description:
      'Use Scream AI to craft Ghost Face inspired thrillers while keeping subject identity intact. Perfect for campaigns, storytellers, and horror fans.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scream AI Horror Image Generator | RoboNeo',
    description:
      'Generate cinematic horror portraits with Scream AI. Upload, select a preset, and download your suspenseful still.',
  },
  alternates: {
    canonical: 'https://roboneo.art/scream-ai',
  },
};

export default function ScreamAIPage() {
  return (
    <>
      <StructuredData type="article" />
      <ScreamAIPageContent />
    </>
  );
}

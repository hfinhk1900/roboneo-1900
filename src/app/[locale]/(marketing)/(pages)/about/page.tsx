import Container from '@/components/layout/container';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  return constructMetadata({
    title: 'About Us',
    description:
      'Roboneo is a browser-based AI image suite that turns photos into finished visuals in just a few clicks.',
    canonicalUrl: getUrlWithLocale('/about', locale),
  });
}

export default function AboutPage() {
  return (
    <Container className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">About Us</h1>
        <div className="prose prose-neutral dark:prose-invert">
          <p>
            Roboneo is a browser-based AI image suite that turns photos into
            finished visuals in just a few clicks. With tools like Image to
            Sticker, Product Shots, AI Backgrounds, Object Cleanup, and Profile
            Picture Maker, creators and sellers can produce studio-grade
            results—no apps, no learning curve.
          </p>
          <p>
            We keep pricing simple (start with 10 credits on sign-up) and we
            respect your privacy: your images are never used to train our
            models. Built by a small, focused team, our mission is to make
            professional, share-ready visuals accessible to everyone.
          </p>
          <p>
            Questions or ideas? Reach us at
            {' '}<a href="mailto:hi@roboneo.art">hi@roboneo.art</a>
          </p>
        </div>
      </div>
    </Container>
  );
}

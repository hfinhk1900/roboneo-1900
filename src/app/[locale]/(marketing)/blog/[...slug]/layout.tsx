import Container from '@/components/layout/container';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

// Prevent indexing until blog content is ready
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      'max-image-preview': 'none',
    },
  },
};

export default function BlogPostLayout({ children }: PropsWithChildren) {
  return (
    <Container className="py-8 px-4">
      <div className="mx-auto">{children}</div>
    </Container>
  );
}

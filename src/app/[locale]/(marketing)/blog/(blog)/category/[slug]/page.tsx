import { notFound } from 'next/navigation';

// Generate all static params for SSG (locale + category)
export function generateStaticParams() {
  return [];
}

// Generate metadata for each static category page (locale + category)
export async function generateMetadata() {
  return {};
}

interface BlogCategoryPageProps {
  params: Promise<any>;
}

export default function BlogCategoryPage() {
  notFound();
}

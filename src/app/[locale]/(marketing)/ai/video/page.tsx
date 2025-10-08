import { notFound } from 'next/navigation';

// Keep unreleased AI video tooling hidden behind a 404 to avoid exposing
// placeholder marketing copy via direct URLs or search.
export default function AIVideoPage() {
  notFound();
}

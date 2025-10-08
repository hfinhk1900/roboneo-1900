import { notFound } from 'next/navigation';

// Block gallery pages are internal development helpers and should not be
// accessible from production. Return 404 for any direct access.
export default function BlockCategoryPage() {
  notFound();
}

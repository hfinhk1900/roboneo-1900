import { notFound } from 'next/navigation';

// Hide the placeholder changelog page until real release notes are available.
export default function ChangelogPage() {
  notFound();
}

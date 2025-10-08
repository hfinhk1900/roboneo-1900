import { notFound } from 'next/navigation';

// Waitlist page is not linked in the current navigation; serve a 404 until it
// becomes part of the product launch flow.
export default function WaitlistPage() {
  notFound();
}

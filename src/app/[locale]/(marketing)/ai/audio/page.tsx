import { notFound } from 'next/navigation';

// The AI audio route is gated until the feature launches. Returning 404 keeps
// template copy from being indexed or shared through direct links.
export default function AIAudioPage() {
  notFound();
}

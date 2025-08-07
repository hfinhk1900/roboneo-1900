import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TextToImageCTASection() {
  return (
    <section className="px-4 py-20 bg-gradient-to-r from-primary to-purple-600">
      <div className="mx-auto max-w-4xl text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Start Creating?</h2>
        <p className="text-xl mb-8 text-white/90">
          Join millions of creators using AI to transform ideas into stunning visuals
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/ai/image">
            Start Generating Free
          </Link>
        </Button>
      </div>
    </section>
  );
}

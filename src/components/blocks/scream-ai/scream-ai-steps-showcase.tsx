'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Step = {
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    title: '1. Upload your photo',
    description:
      'Drop a selfie or portrait (JPG/PNG/WebP). Scream AI detects faces and prepares your image for clean composition.',
  },
  {
    title: '2. Pick a preset or describe your scene',
    description:
      'Choose from Y2K bedroom, hallway, porch, theater, or party mirror. You can also write a short prompt—Ghostface AI silhouettes, dim corridors, projector glow, rainy nights.',
  },
  {
    title: '3. Generate & download',
    description:
      'Click create and let Scream AI render your horror photo. Save in high quality for TikTok, Instagram, or X. No gore, no weapons—just cinematic suspense.',
  },
];

export default function ScreamAIStepsShowcase({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={cn('bg-white py-16', className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:px-8">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            How to Create Ghostface AI Photos with Scream AI
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600 md:text-lg">
            Three quick steps to turn any portrait into a suspenseful, Ghostface-inspired image without altering identity or crossing the gore line.
          </p>
        </div>
        <ScrollArea className="w-full rounded-3xl border border-gray-200 bg-gray-50">
          <ol className="grid gap-6 p-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-transparent bg-white px-6 py-5 shadow-sm transition hover:border-red-200 hover:shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </ScrollArea>
        <div className="text-center">
          <Button asChild size="lg">
            <a href="#scream-ai-generator">Generate with Scream AI</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

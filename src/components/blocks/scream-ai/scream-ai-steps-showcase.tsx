'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const STEPS = [
  {
    title: '1. Upload a portrait',
    description:
      'Pick a clear photo (JPG, PNG, or WebP up to 10MB). Front-facing shots with visible facial features produce the best results.',
  },
  {
    title: '2. Choose a preset',
    description:
      'Select one of the six pre-built horror scenes. Each prompt was tuned to deliver cinematic suspense while keeping identity intact.',
  },
  {
    title: '3. Set aspect ratio',
    description:
      'Match your output to the channel—square for social feeds, 16:9 for video thumbnails, 9:16 for stories, and more.',
  },
  {
    title: '4. Generate & review',
    description:
      'Scream AI calls Gemini Nano Banana behind the scenes, applies optional watermarks, and stores results in your library with history entries.',
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
            Scream AI workflow at a glance
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600 md:text-lg">
            From upload到下载，全流程不到一分钟。保持团队一致的悬疑风格，把更多时间留给创意与分发。
          </p>
        </div>
        <ScrollArea className="w-full rounded-3xl border border-gray-200 bg-gray-50">
          <ol className="grid gap-6 p-8 md:grid-cols-2">
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
            <a href="#scream-ai-generator">Start using Scream AI</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

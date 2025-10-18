'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShieldIcon, SparklesIcon, ZapIcon } from 'lucide-react';

const FEATURES = [
  {
    title: 'Identity Safe',
    description:
      'Every Scream AI preset appends the Identity & Safety Suffix, so faces, hair, and outfits stay true to your upload while only the atmosphere changes.',
    icon: ShieldIcon,
  },
  {
    title: 'Preset Crafted',
    description:
      'Six cinematic horror prompts tuned for Ghost Face inspired suspense. No prompt engineering required—just select a preset and generate.',
    icon: SparklesIcon,
  },
  {
    title: 'Watermark Control',
    description:
      'Free accounts receive a subtle RoboNeo watermark; upgrade to produce clean, watermark-free stills for campaigns and storytelling.',
    icon: ZapIcon,
  },
];

export default function ScreamAIFeaturesShowcase({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={cn('bg-[#08080c] py-16 text-white', className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-3 lg:px-8">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="border-white/10 bg-white/5 text-white transition hover:border-red-400/40 hover:bg-white/10"
          >
            <CardContent className="flex flex-col gap-4 p-6">
              <feature.icon className="h-8 w-8 text-red-400" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-200">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

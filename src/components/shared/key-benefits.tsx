'use client';

import { cn } from '@/lib/utils';
import { Aperture, Waypoints, Store, Zap } from 'lucide-react';

interface KeyBenefitsProps {
  className?: string;
}

const benefits = [
  {
    icon: Zap,
    title: 'Lightning-Fast, One-Click Stickers',
    description:
      "Drag & drop, click Generate, done. RoboNeo AI's GPU-accelerated engine converts any image to sticker format in under three seconds, so you can respond to trends while they're still trending.",
  },
  {
    icon: Aperture,
    title: 'Pixel-Perfect Cut-outs',
    description:
      'A proprietary vision-transformer model detects hair strands, fur, and fine product edges with sub-pixel accuracy. Each sticker exports as a transparent PNG/WebP that stays razor-sharp on 4x-zoomed retina screens.',
  },
  {
    icon: Waypoints,
    title: 'Share-Ready Everywhere',
    description:
      'Stickers export at the ideal 512 × 512 px for iMessage, WhatsApp, Telegram, Discord, Shopify, and more. Built-in presets let you bulk-resize or switch to SVG and WebP in one click—delivering pixel-perfect stickers across all your channels.',
  },
  {
    icon: Store,
    title: 'Free Credits & Commercial Use',
    description:
      'New accounts get free generations, no credit card required. All outputs come with a royalty-free license, so you can print, sell, or embed your RoboNeo stickers without legal headaches.',
  },
];

export function KeyBenefits({ className }: KeyBenefitsProps) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="uppercase tracking-wider text-gradient_indigo-purple font-semibold font-mono">
            Key Benefits
          </p>
          <h2 className="text-balance text-[32px] font-bold text-foreground">
            Why RoboNeo Beats Manual Editing
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="space-y-4">
                {/* Icon with yellow circular background */}
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400">
                    <IconComponent className="h-6 w-6 text-gray-900" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/seo/optimized-image';

interface ShowcaseGalleryProps {
  className?: string;
}

const showcaseImages = [
  {
    src: '/showcase01.png',
    alt: 'Roboneo AI Sticker Example - Woman with smartphone iOS style sticker',
  },
  {
    src: '/showcase02.png',
    alt: 'Roboneo AI Generated Sticker - Cartoon character in pixel art style',
  },
  {
    src: '/showcase03.png',
    alt: 'Roboneo Photo to Sticker - Woman portrait transformed to sticker',
  },
  {
    src: '/showcase04.png',
    alt: 'Roboneo AI Pet Sticker - Dog photo converted to cute sticker',
  },
];

export function ShowcaseGallery({ className }: ShowcaseGalleryProps) {
  return (
    <section className={cn('py-16', className)}>
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <p className="uppercase tracking-wider text-gradient_indigo-purple font-semibold font-mono">
            Gallery
          </p>
          <h2 className="text-balance text-4xl font-bold text-foreground">
            Real Stickers Made with RoboNeo
          </h2>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseImages.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index < 2} // Priority load for first 2 images
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

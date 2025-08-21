'use client';

import { OptimizedImage } from '@/components/seo/optimized-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SparklesIcon } from 'lucide-react';

interface ShowcaseGalleryProps {
  className?: string;
  onStyleSelect?: (style: string) => void;
  onScrollToHero?: () => void;
}

// Real showcase images from R2 Storage - Landing-sticker folder
const showcaseImages = [
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker01-ios.webp',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker02-snoopy.webp',
    alt: 'RoboNeo AI generated sticker - Snoopy style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'snoopy',
    styleLabel: 'Snoopy Style',
    ctaText: 'Try Snoopy Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker03-snoopy.webp',
    alt: 'RoboNeo AI generated sticker - Snoopy style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'snoopy',
    styleLabel: 'Snoopy Style',
    ctaText: 'Try Snoopy Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker04-pixel.webp',
    alt: 'RoboNeo AI generated sticker - Pixel art style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'pixel',
    styleLabel: 'Pixel Art Style',
    ctaText: 'Try Pixel Art',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker05-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker06-ios.jpeg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker07-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker08-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker09-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker10-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker11-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker12-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker13-ios.jpeg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker14-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker15-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker16-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
  },
];

export function ShowcaseGallery({
  className,
  onStyleSelect,
  onScrollToHero,
}: ShowcaseGalleryProps) {
  const handleImageClick = (style: string) => {
    // Call hero functions if available
    if (typeof window !== 'undefined') {
      if ((window as any).heroStyleSelect) {
        (window as any).heroStyleSelect(style);
      }
      if ((window as any).heroScrollToHero) {
        (window as any).heroScrollToHero();
      }
    }

    // Also call props if provided (for backward compatibility)
    if (onStyleSelect) {
      onStyleSelect(style);
    }
    if (onScrollToHero) {
      onScrollToHero();
    }
  };

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

        {/* Gallery Grid - Responsive uniform spacing layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4 lg:gap-x-6 lg:gap-y-6">
          {showcaseImages.map((image, index) => (
            <div
              key={index}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
                image.aspectRatio,
                image.className
              )}
              onClick={() => handleImageClick(image.style)}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index < 4} // Priority load for first 4 images
              />

              {/* Hover overlay with CTA */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                <div className="text-center">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200 transform translate-y-2 group-hover:translate-y-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image.style);
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {image.ctaText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

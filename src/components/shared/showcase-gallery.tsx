'use client';

import { OptimizedImage } from '@/components/seo/optimized-image';
import { cn } from '@/lib/utils';

interface ShowcaseGalleryProps {
  className?: string;
}

// Real showcase images from R2 Storage - Landing-sticker folder
const showcaseImages = [
  // Original local showcase images
  {
    src: '/showcase01.webp',
    alt: 'RoboNeo AI generated sticker - woman smartphone iOS style by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: '/showcase02.webp',
    alt: 'RoboNeo AI cartoon sticker - pixel art character created with roboneo ai technology',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: '/showcase03.webp',
    alt: 'RoboNeo photo to sticker transformation - woman portrait converted by roboneo ai',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: '/showcase04.webp',
    alt: 'RoboNeo AI pet sticker - dog photo transformed to cute sticker with roboneo',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  // R2 Storage images from Landing-sticker folder
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG39.jpg',
    alt: 'RoboNeo AI creative sticker - character transformation powered by roboneo artificial intelligence',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG40.jpg',
    alt: 'RoboNeo AI artistic portrait sticker - style conversion using roboneo ai generator',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG41.jpg',
    alt: 'RoboNeo AI professional sticker - photo transformation technology by roboneo',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG42.jpg',
    alt: 'RoboNeo AI modern digital art sticker - created with roboneo ai design tools',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG43.jpg',
    alt: 'RoboNeo AI cartoon character sticker - creative design by roboneo ai platform',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG44.jpg',
    alt: 'RoboNeo AI vibrant illustration sticker - colorful design with roboneo technology',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG45.jpg',
    alt: 'RoboNeo AI dynamic pose sticker - character transformation using roboneo ai',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG46.jpg',
    alt: 'RoboNeo AI fantasy character sticker - magical style created by roboneo',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-WechatIMG47.jpg',
    alt: 'RoboNeo AI emoji style sticker - expressive character by roboneo ai generator',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-image_1%203.jpeg',
    alt: 'RoboNeo AI detailed artistic sticker - high quality rendering with roboneo',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-image_3%202.jpeg',
    alt: 'RoboNeo AI professional quality sticker - premium conversion by roboneo ai',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-sticker/sticker-image_5.png',
    alt: 'RoboNeo AI transparent sticker - high quality PNG format by roboneo technology',
    aspectRatio: 'aspect-[4/5]',
    className: '',
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

        {/* Gallery Grid - Responsive uniform spacing layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4 lg:gap-x-6 lg:gap-y-6">
          {showcaseImages.map((image, index) => (
            <div
              key={index}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                image.aspectRatio,
                image.className
              )}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index < 4} // Priority load for first 4 images
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Additional content hint */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Showcasing the versatility of RoboNeo AI - from iOS emoji style to
            pixel art, LEGO style, and magical transformations. Each sticker
            maintains perfect quality and transparency for seamless sharing
            across all platforms.
          </p>
        </div>
      </div>
    </section>
  );
}

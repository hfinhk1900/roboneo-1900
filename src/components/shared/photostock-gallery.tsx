'use client';

import { OptimizedImage } from '@/components/seo/optimized-image';
import { cn } from '@/lib/utils';

interface PhotostockGalleryProps {
  className?: string;
}

// Static ProductShot showcase images from R2 Storage - Landing-photostock folder
const productShotImages = [
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps01.png',
    alt: 'RoboNeo AI professional product photography - wireless headphones with studio lighting',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps02.jpg',
    alt: 'RoboNeo AI lifestyle product shot - smartwatch in modern home setting',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps03.png',
    alt: 'RoboNeo AI minimalist product photography - smartphone with clean background',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps04.png',
    alt: 'RoboNeo AI outdoor product shot - camera equipment in natural setting',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps05.jpg',
    alt: 'RoboNeo AI creative product styling - laptop with professional lighting',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps06.jpg',
    alt: 'RoboNeo AI elegant product display - jewelry with premium background',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps07.jpg',
    alt: 'RoboNeo AI dynamic product shot - sports equipment with action styling',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps08.jpg',
    alt: 'RoboNeo AI commercial photography - fashion accessories with studio setup',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps09.jpg',
    alt: 'RoboNeo AI product showcase - home appliances with lifestyle context',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps10.jpg',
    alt: 'RoboNeo AI artistic product photography - beauty products with creative lighting',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps11.jpg',
    alt: 'RoboNeo AI professional product display - electronics with technical styling',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps12.jpg',
    alt: 'RoboNeo AI modern product shot - furniture with interior design context',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps13.jpg',
    alt: 'RoboNeo AI innovative product photography - gadgets with futuristic background',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps14.jpg',
    alt: 'RoboNeo AI premium product styling - luxury goods with elegant presentation',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps15.jpg',
    alt: 'RoboNeo AI versatile product shot - accessories with adaptable styling',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock/ps16.jpg',
    alt: 'RoboNeo AI comprehensive product photography - complete product range showcase',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
];

export default function PhotostockGallery({
  className,
}: PhotostockGalleryProps) {
  return (
    <section className={cn('py-16', className)}>
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <p className="uppercase tracking-wider text-gradient_indigo-purple font-semibold font-mono">
            Gallery
          </p>
          <h2 className="text-balance text-4xl font-bold text-foreground">
            Real Product Shots Made with RoboNeo
          </h2>
        </div>

        {/* Gallery Grid - Responsive uniform spacing layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4 lg:gap-x-6 lg:gap-y-6">
          {productShotImages.map((image, index) => (
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
      </div>
    </section>
  );
}

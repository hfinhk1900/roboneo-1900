'use client';

import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface ToolCard {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
}

const tools: ToolCard[] = [
  {
    title: 'Image to Sticker',
    description:
      'Turn any photo into a crisp sticker with precise cutouts and a transparent background.',
    image: '/sticker/Explore01.webp',
    imageAlt: 'Image to Sticker demo',
    href: '/sticker',
  },
  {
    title: 'Product Shots',
    description:
      'Generate studio-quality product photos with on-brand backgrounds, lighting, and shadows, no shoot needed.',
    image: '/sticker/Explore02.webp',
    imageAlt: 'Product Shots demo',
    href: '/productshot',
  },
  {
    title: 'AI Backgrounds',
    description:
      "Generate realistic AI backgrounds that match your scene's lighting and perspective in seconds.",
    image: '/sticker/Explore03.webp',
    imageAlt: 'AI Backgrounds demo',
    href: '/aibackgrounds',
  },
  {
    title: 'Remove Watermark',
    description:
      'Remove watermarks and timestamps from licensed images with clean, natural inpainting.',
    image: '/sticker/Explore04.webp',
    imageAlt: 'Remove Watermark demo',
    href: '/remove-watermark',
  },
  {
    title: 'Profile Picture Maker',
    description:
      'Create polished, on-brand profile photos with subtle retouching and platform-ready crops.',
    image: '/sticker/Explore05.webp',
    imageAlt: 'Profile Picture Maker demo',
    href: '/profile-picture-maker',
  },
];

export default function ExploreMoreToolsSection() {
  const pathname = useLocalePathname();
  // Filter out the current tool based on pathname (locale-agnostic)
  const filtered = tools.filter((tool) => {
    return !(pathname === tool.href || pathname.startsWith(`${tool.href}/`));
  });

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h2 className="text-center text-2xl sm:text-3xl lg:text-[32px] font-bold text-black mb-8 lg:mb-10">
          Explore more AI tools
        </h2>

        {/* Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {(filtered.length ? filtered : tools).map((tool, index) => (
            <LocaleLink
              key={index}
              href={tool.href}
              className="group bg-gray-50 rounded-3xl overflow-hidden w-full min-h-[400px] sm:min-h-[420px] lg:min-h-[460px] relative hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Title */}
              <div className="pt-4 sm:pt-6 px-4">
                <h3 className="text-base sm:text-lg lg:text-[18px] font-bold text-black text-center leading-tight">
                  {tool.title}
                </h3>
              </div>

              {/* Image */}
              <div className="flex justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-[166px] lg:h-[166px] rounded-2xl overflow-hidden">
                  <Image
                    src={tool.image}
                    alt={tool.imageAlt}
                    width={166}
                    height={166}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    quality={85}
                    placeholder="blur"
                    blurDataURL="data:image/webp;base64,UklGRpoAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSDIAAAARL0AmbZurmr57yyIiqE8oiG0bejIYEQTgqiDA9vqnsUSI6H+oAERp2HZ65qP/VIAWAFZQOCBCAAAA8AEAnQEqEAAIAAVAfCWkAALp8sF8rgRgAP7o9FDvMCkMde9PK7euH5M1m6VWoDXf2FkP3BqV0ZYbO6NA/VFIAAAA"
                    sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 166px"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 px-3 sm:px-4 pb-14 sm:pb-16">
                <p className="text-xs sm:text-sm lg:text-[14px] text-black text-center leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Arrow Button */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center group-hover:bg-yellow-500 transition-colors duration-300">
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </div>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}

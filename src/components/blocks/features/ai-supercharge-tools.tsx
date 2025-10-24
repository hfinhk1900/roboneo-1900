'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Custom SVG Icons
const StickerIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
    <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h.01" />
    <path d="M16 13h.01" />
    <path d="M10 16s.8 1 2 1c1.3 0 2-1 2-1" />
  </svg>
);

const PackageIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
    <path d="M12 22V12" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <path d="m7.5 4.27 9 5.15" />
  </svg>
);

const AIBackgroundIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 11H3V6C3 4.34314 4.34326 3 6 3H18C19.6567 3 21 4.34314 21 6V11H22C22.5522 11 23 11.4477 23 12C23 12.5523 22.5522 13 22 13H21V18C21 19.6569 19.6567 21 18 21H6C4.34326 21 3 19.6569 3 18V13H2C1.44775 13 1 12.5523 1 12C1 11.4477 1.44775 11 2 11ZM18 5H6C5.44775 5 5 5.44769 5 6V11H19V6C19 5.44769 18.5522 5 18 5ZM16.2929 13H13.7071L7.70711 19H10.2929L16.2929 13ZM11.7071 19L17.7071 13H19V14.2929L14.2929 19H11.7071ZM15.7071 19H18C18.5522 19 19 18.5523 19 18V15.7071L15.7071 19ZM6.29289 19L12.2929 13H9.70711L5 17.7071V18C5 18.5523 5.44775 19 6 19H6.29289ZM5 16.2929L8.29289 13H5V16.2929Z"
      fill="currentColor"
    />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 21a6 6 0 0 0-12 0" />
    <circle cx="12" cy="11" r="4" />
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>
);

const WatermarkRemovalIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

const GhostMaskIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3c-3.5 0-6.5 2.7-6.5 6v8.5c0 .8.6 1.5 1.4 1.5.9 0 1.6-.7 1.6-1.5 0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0 .8.7 1.5 1.6 1.5.8 0 1.4-.7 1.4-1.5V9c0-3.3-3-6-6-6Z" />
    <circle cx="9.5" cy="11" r="1" />
    <circle cx="14.5" cy="11" r="1" />
    <path d="M10 14c.6.5 1.3.8 2 .8s1.4-.3 2-.8" />
  </svg>
);

interface ToolFeature {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  icon: React.ComponentType<{ className?: string }>;
  demoImage: string;
  demoImageAlt: string;
}

const toolFeatures: ToolFeature[] = [
  {
    id: 'image-to-sticker',
    title: 'Image to Sticker',
    description:
      'Turn any photo into an iOS-style 3D sticker with RoboNeo AI. Create clean outline and transparent PNG, ready for iMessage, WhatsApp, Telegram, and more. Keep pose, expression, clothing, and accessories consistent with the original.',
    buttonText: 'Create Sticker',
    buttonLink: '/sticker',
    icon: StickerIcon,
    demoImage: '/home/tool-list-image-to-sticker.png',
    demoImageAlt: 'Image to Sticker demo showing different sticker styles',
  },
  {
    id: 'product-shots',
    title: 'Product Shots',
    description:
      'Generate studio-quality product photos with RoboNeo AI. Create lifestyle scenes from a prompt or reference image, perfect for ads, PDPs, and social posts. RoboNeo AI ensures consistent lighting and composition, right in your browser.',
    buttonText: 'Generate Product Shot',
    buttonLink: '/productshot',
    icon: PackageIcon,
    demoImage: '/home/tool-list-product-shots.png',
    demoImageAlt:
      'Product shots demo showing various product photography styles',
  },
  {
    id: 'ai-backgrounds',
    title: 'AI Backgrounds',
    description:
      "Place your subject against clean studio backdrops with RoboNeo AI. Create on-brand lifestyle settings with AI-generated backgrounds that match the scene's lighting and perspective. RoboNeo AI handles everything, no manual masking needed.",
    buttonText: 'Create AI Background',
    buttonLink: '/aibackgrounds',
    icon: AIBackgroundIcon,
    demoImage: '/home/tool-list-ai-backgrounds.png',
    demoImageAlt: 'AI Backgrounds demo showing various background options',
  },
  {
    id: 'profile-picture',
    title: 'Profile Picture Maker',
    description:
      'Turn any selfie into a polished, on-brand profile photo in seconds. RoboNeo AI adds gentle retouching, flattering lighting, and clean studio or brand-color backdrops. Generate a consistent set for LinkedIn, Instagram, X, and Discord with platform-ready crops.',
    buttonText: 'Create Profile Picture',
    buttonLink: '/profile-picture-maker',
    icon: ProfileIcon,
    demoImage: '/home/tool-list-prodile-pic-maker.png',
    demoImageAlt:
      'Profile Picture Maker demo showing professional headshot variations',
  },
  {
    id: 'watermark-removal',
    title: 'Watermark Removal',
    description:
      'Erase watermarks, timestamps, and light logos from images you own or are licensed to edit—no tedious manual retouching. RoboNeo AI reconstructs underlying details with context-aware inpainting, preserving texture, edges, and lighting for clean, natural results. Use only on content you have permission to modify.',
    buttonText: 'Remove Watermark',
    buttonLink: '/remove-watermark',
    icon: WatermarkRemovalIcon,
    demoImage: '/home/tool-list-watermark-removal.png',
    demoImageAlt: 'Watermark Removal demo showing before and after comparison',
  },
  {
    id: 'scream-ai',
    title: 'Scream AI',
    description:
      'Drop any portrait into Scream AI and transform it into a Ghost Face inspired suspense still. Identity-safe prompts maintain expressions, while horror lighting, rain, and VHS texture dial up the tension for campaigns and storytellers.',
    buttonText: 'Launch Scream AI',
    buttonLink: '/scream-ai',
    icon: GhostMaskIcon,
    demoImage: '/home/tool-list-scream-ai.png',
    demoImageAlt: 'Scream AI suspenseful portrait demo',
  },
];

export default function AISuperchargeToolsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          <h2 className="text-[28px] font-bold text-black mb-6">
            AI Supercharges Your Photo Creation with RoboNeo
          </h2>
          <p className="text-[16px] text-gray-600 leading-relaxed">
            Speed up your image workflow with RoboNeo AI—focused tools for Image
            to Sticker, Product Shots, AI Backgrounds, and Object Cleanup.
            Pre-tuned models automate styling, composition, and rendering to
            deliver clean, consistent results in seconds. Work directly in your
            browser with RoboNeo AI. Start with 10 credits, upgrade anytime.
          </p>
        </motion.div>

        {/* Tool Features */}
        <div className="space-y-10">
          {toolFeatures.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Content */}
                <div className="space-y-6">
                  {/* Title with Icon */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <tool.icon className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-[28px] font-bold text-black">
                      {tool.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[16px] text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Button */}
                  <Link
                    href={tool.buttonLink}
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6 py-3 rounded-2xl transition-colors duration-300"
                  >
                    {tool.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Demo Image */}
                <div className="relative">
                  <div className="relative w-full h-[280px] md:h-[350px] rounded-2xl overflow-hidden">
                    <Image
                      src={tool.demoImage}
                      alt={tool.demoImageAlt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

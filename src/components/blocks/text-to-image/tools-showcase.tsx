'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  Image,
  Palette,
  ShoppingBag,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  href: string;
  badge?: string;
  gradient: string;
  examples: string[];
}

const tools: Tool[] = [
  {
    id: 'product-shots',
    title: 'Product Shots',
    description:
      'Generate photoreal ads & e-commerce shots from a single prompt.',
    icon: <ShoppingBag className="h-6 w-6" />,
    features: [
      'Professional lighting',
      'Multiple backgrounds',
      '360° views',
      'Marketing ready',
    ],
    href: '/productshot',
    badge: 'New',
    gradient: 'from-orange-500 to-red-500',
    examples: [
      'Product listings',
      'Amazon photos',
      'Social media ads',
      'Catalog images',
    ],
  },
  {
    id: 'poster-craft',
    title: 'AI Headshot',
    description: 'Create professional photographs with AI technology.',
    icon: <Image className="h-6 w-6" />,
    features: [
      'Editable text layers',
      'Social media templates',
      'Print-ready formats',
      'Brand consistency',
    ],
    href: '/ai/poster',
    gradient: 'from-blue-500 to-purple-500',
    examples: [
      'Event posters',
      'Social media posts',
      'Marketing flyers',
      'Announcements',
    ],
  },
  {
    id: 'avatar-forge',
    title: 'AI Character',
    description: 'Turn any selfie into anime, chibi, Lego or cartoon avatars.',
    icon: <Wand2 className="h-6 w-6" />,
    features: [
      'Multiple avatar styles',
      'Instant transformation',
      'High quality output',
      'Profile ready',
    ],
    href: '/ai/sticker',
    badge: 'Most Popular',
    gradient: 'from-green-500 to-emerald-500',
    examples: [
      'Anime avatars',
      'Chibi characters',
      'Cartoon portraits',
      'LEGO style',
    ],
  },
  {
    id: 'scene-dreamer',
    title: 'AI Anime Art',
    description: 'Create stunning AI anime art and illustrations in seconds.',
    icon: <Palette className="h-6 w-6" />,
    features: [
      'Cinematic quality',
      'Mood board creation',
      'Concept art styles',
      'Scene composition',
    ],
    href: '/ai/illustrator',
    gradient: 'from-purple-500 to-pink-500',
    examples: [
      'Movie concepts',
      'Game environments',
      'Storyboards',
      'Visual narratives',
    ],
  },
];

export default function TextToImageToolsSection() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <section id="tools" className="px-4 py-20 bg-white">
      <div className="mx-auto max-w-7xl">
        <HeaderSection
          title="Four Powerful Text to Image Tools"
          titleAs="h2"
          subtitle="Everything You Need to Create Visual Content"
          subtitleAs="h3"
          subtitleClassName="text-2xl lg:text-3xl font-bold text-foreground"
          description="From artistic illustrations to product photography, our AI-powered tools cover all your visual content needs."
          descriptionAs="p"
          descriptionClassName="max-w-3xl text-lg text-muted-foreground"
        />

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:gap-10">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              onHoverStart={() => setHoveredTool(tool.id)}
              onHoverEnd={() => setHoveredTool(null)}
            >
              <Card
                className={cn(
                  'relative h-full overflow-hidden transition-all duration-300',
                  hoveredTool === tool.id && 'shadow-2xl scale-[1.02]'
                )}
              >
                {/* Gradient Border Effect */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 transition-opacity duration-300',
                    hoveredTool === tool.id && 'opacity-100'
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r p-[2px]',
                      tool.gradient
                    )}
                  >
                    <div className="h-full w-full bg-white rounded-lg" />
                  </div>
                </div>

                <CardContent className="relative p-6 lg:p-8">
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r text-white',
                          tool.gradient
                        )}
                      >
                        {tool.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {tool.title}
                        </h3>
                        {tool.badge && (
                          <Badge className="mt-1" variant="secondary">
                            {tool.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-muted-foreground">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6 space-y-3">
                    <div className="text-sm font-medium text-foreground">
                      Key Features:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {tool.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Zap className="h-3 w-3 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-foreground mb-2">
                      Use Cases:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tool.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      'group w-full bg-gradient-to-r text-white',
                      tool.gradient
                    )}
                    asChild
                  >
                    <Link href={tool.href}>
                      Try {tool.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-lg text-muted-foreground">
            Not sure which tool to use? Start with our AI Art Generator and
            explore from there!
          </p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/ai/image">
              Get Started Free
              <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Shield, 
  Globe, 
  Sparkles, 
  Gauge, 
  Palette,
  Download,
  RefreshCw,
  Lock,
  Users,
  Brain,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

const features: Feature[] = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Lightning Fast Generation',
    description: 'Get your images in seconds, not minutes. Our optimized AI models deliver results instantly.',
    highlight: true
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'Advanced AI Models',
    description: 'Powered by state-of-the-art AI including Stable Diffusion, DALL-E, and custom models.',
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: '100+ Art Styles',
    description: 'From photorealistic to abstract, anime to oil painting - explore endless creative possibilities.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Safe & Ethical',
    description: 'Built-in content filtering ensures safe, appropriate results for all users.',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: 'High Resolution Downloads',
    description: 'Export your creations in HD quality, perfect for printing or professional use.',
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: 'Unlimited Variations',
    description: 'Generate multiple versions from the same prompt to find your perfect image.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Multi-Language Support',
    description: 'Create images using prompts in multiple languages for global accessibility.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Commercial License',
    description: 'Use generated images for commercial projects without licensing worries.',
    highlight: true
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Privacy First',
    description: 'Your prompts and images are private. We never share or use your data.',
  }
];

export default function TextToImageFeaturesSection() {
  return (
    <section className="px-4 py-20 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl">
        <HeaderSection
          title="Why Choose Our Text to Image Platform?"
          titleAs="h2"
          subtitle="Built for Creators, Powered by AI"
          subtitleAs="h3"
          subtitleClassName="text-2xl lg:text-3xl font-bold text-foreground"
          description="Experience the future of content creation with features designed to make your workflow faster, easier, and more creative."
          descriptionAs="p"
          descriptionClassName="max-w-3xl text-lg text-muted-foreground"
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className={cn(
                "group relative rounded-2xl p-6 transition-all duration-300",
                feature.highlight 
                  ? "bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20" 
                  : "bg-white border border-border hover:shadow-lg"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                feature.highlight
                  ? "bg-gradient-to-r from-primary to-purple-500 text-white"
                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"
              )}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>

              {/* Highlight badge */}
              {feature.highlight && (
                <div className="absolute -top-3 right-6">
                  <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-8 text-white lg:p-12"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h3 className="mb-4 text-2xl font-bold lg:text-3xl">
                Start Creating Without Limits
              </h3>
              <p className="mb-6 text-white/90 lg:text-lg">
                Join millions of creators using AI to bring their ideas to life. 
                No design skills required - just describe what you want to see.
              </p>
              <ul className="space-y-3">
                {[
                  'Free credits to start',
                  'No credit card required',
                  'Instant access to all tools',
                  'Community support'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-white" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
                <div className="text-3xl font-bold">10M+</div>
                <div className="text-sm text-white/80">Images Created</div>
              </div>
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
                <div className="text-3xl font-bold">500K+</div>
                <div className="text-sm text-white/80">Active Users</div>
              </div>
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
                <div className="text-3xl font-bold">4.9/5</div>
                <div className="text-sm text-white/80">User Rating</div>
              </div>
              <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-white/80">Available</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

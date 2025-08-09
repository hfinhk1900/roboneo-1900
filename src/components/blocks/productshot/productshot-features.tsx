'use client';

import {
  Camera,
  Clock,
  DollarSign,
  Globe,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    name: 'Instant Generation',
    description:
      'Get professional product photos in 60 seconds or less. No waiting for photographers or studio time.',
    icon: Clock,
  },
  {
    name: 'Cost-Effective',
    description:
      'Save 90% compared to traditional product photography. No equipment, studio, or photographer fees.',
    icon: DollarSign,
  },
  {
    name: 'Multiple Styles',
    description:
      'Choose from studio, lifestyle, 3D, and gradient styles. Perfect for every marketing need.',
    icon: Camera,
  },
  {
    name: 'High Resolution',
    description:
      'Export images up to 4K resolution. Perfect for print materials and large displays.',
    icon: Sparkles,
  },
  {
    name: 'Platform Ready',
    description:
      'Optimized for Amazon, Shopify, eBay, and social media. Meet all marketplace requirements.',
    icon: Globe,
  },
  {
    name: 'Secure & Private',
    description:
      'Your product data is encrypted and never shared. Full ownership of generated images.',
    icon: ShieldCheck,
  },
];

export default function ProductShotFeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            Why Choose Our AI
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Professional Product Photography Made Simple
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Everything you need to create stunning product images that convert
            visitors into customers
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <feature.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Briefcase, Camera, Palette, Users } from 'lucide-react';

interface UseCase {
  icon: React.ElementType;
  title: string;
  description: string;
  examples: string[];
}

const useCases: UseCase[] = [
  {
    icon: Users,
    title: 'Content Creators',
    description:
      'Use RoboNeo AI to build consistent brand assets for social media and community engagement.',
    examples: [
      'Create branded stickers for social media engagement',
      'Generate profile pictures for multiple platforms',
      'Develop visual elements for community building',
    ],
  },
  {
    icon: Briefcase,
    title: 'E-commerce Businesses',
    description:
      'Leverage RoboNeo AI to transform limited product photography into diverse marketing materials.',
    examples: [
      'Generate multiple scene variations from single product photos',
      'Create lifestyle contexts without additional photo shoots',
      'Test different presentation styles for marketing campaigns',
    ],
  },
  {
    icon: Camera,
    title: 'Marketing Professionals',
    description:
      'Rapidly adapt existing imagery for different contexts and platforms.',
    examples: [
      'Adapt campaign assets for different marketing channels',
      'Remove unwanted elements from licensed imagery',
      'Create variations suited to different platform requirements',
    ],
  },
  {
    icon: Palette,
    title: 'Small Businesses',
    description:
      'Create professional marketing materials without design expertise or expensive services.',
    examples: [
      'Generate professional product presentations',
      'Create branded visual content for marketing',
      'Develop consistent visual identity across platforms',
    ],
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-[28px] font-bold text-black mb-6">
            Common RoboNeo AI Applications for Creative Professionals
          </h2>
          <p className="text-[16px] text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Discover how different professionals integrate RoboNeo AI into their
            workflows for efficient visual content creation and enhanced
            productivity across various creative applications.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <useCase.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {useCase.title}
                </h3>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {useCase.description}
              </p>

              <ul className="space-y-2">
                {useCase.examples.map((example, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-500"
                  >
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

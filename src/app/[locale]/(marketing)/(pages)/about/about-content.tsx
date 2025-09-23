'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  LockIcon,
  MailIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const companyValues = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Innovation',
    description:
      'We leverage cutting-edge AI technology to make professional image editing accessible to everyone, no matter their skill level.',
  },
  {
    icon: LockIcon,
    title: 'Privacy First',
    description:
      'Your images are never used to train our models. We respect your privacy and keep your creative work secure.',
  },
  {
    icon: ZapIcon,
    title: 'Simple & Fast',
    description:
      'Turn photos into studio-grade visuals in just a few clicks. No complex software, no learning curve required.',
  },
  {
    icon: UsersIcon,
    title: 'Creator Focused',
    description:
      'Built for creators, sellers, and businesses who need professional visuals without the professional price tag.',
  },
  {
    icon: HeartIcon,
    title: 'Passionate Team',
    description:
      'Our small, focused team is dedicated to making visual creation accessible and enjoyable for everyone.',
  },
  {
    icon: StarIcon,
    title: 'Quality Excellence',
    description:
      'We strive for excellence in every tool we build, ensuring consistent, professional results that exceed expectations every time.',
  },
];

export default function AboutPageContent() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ backgroundColor: '#F5F5F5' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <HeaderSection
                title="About Roboneo"
                titleAs="h1"
                titleClassName="text-sm"
                subtitle="Transforming Visual Creation with AI"
                subtitleAs="h2"
                subtitleClassName="text-4xl lg:text-5xl font-bold text-gray-900"
                description="We're on a mission to make professional, share-ready visuals accessible to everyone through the power of AI."
                descriptionAs="p"
                descriptionClassName="max-w-3xl text-lg text-gray-600"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Button
                asChild
                size="lg"
                className="rounded-full text-base px-8 h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                <Link href="/">
                  <SparklesIcon className="mr-2 h-5 w-5" />
                  Try Our Tools
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full text-base px-8 h-[50px]"
              >
                <Link href="/contact">
                  <MailIcon className="mr-2 h-5 w-5" />
                  Get in Touch
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Our Story
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Roboneo started with a simple observation: creating
                  professional visuals shouldn't require expensive software or
                  years of training. We saw creators, entrepreneurs, and small
                  businesses struggling with complex tools when all they wanted
                  was to make their photos look amazing.
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  That's why we built a browser-based AI image suite that turns
                  photos into finished visuals in just a few clicks. From Image
                  to Sticker and Product Shots to AI Backgrounds and Watermark
                  Removal, our tools deliver studio-grade results without the
                  studio-grade complexity.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
                  <Image
                    src="/about/about01.png"
                    alt="Our Story - AI Innovation"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What Drives Us
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
              Our values guide everything we do, from product development to
              customer support.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {companyValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-2xl p-8 bg-white border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <value.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Mission
            </h2>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              To democratize professional visual creation by making AI-powered
              image editing tools accessible, affordable, and easy to use for
              creators worldwide.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 lg:p-12"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Simple Pricing, Powerful Results
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We believe great tools should be accessible. That's why we keep
                pricing simple— start with 10 free credits on sign-up, no hidden
                fees, no complex subscriptions.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full text-base px-8 h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Let's Create Together
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
              Have questions, ideas, or feedback? We'd love to hear from you.
              Our team is always ready to help you create amazing visuals.
            </p>

            <div className="mt-10 flex items-center justify-center gap-6">
              <Button
                asChild
                size="lg"
                className="rounded-full text-base px-8 h-[50px] bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                <Link href="/contact">
                  <MailIcon className="mr-2 h-5 w-5" />
                  Contact Us
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              Built by a small, focused team with ❤️ for creators everywhere
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

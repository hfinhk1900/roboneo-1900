import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';

export default function AIMagicFeatures() {
  return (
    <section className="py-16 md:py-32 bg-white">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-20">
        {/* Section Header */}
        <div className="text-center space-y-6">
          <h2 className="text-balance text-4xl font-bold lg:text-5xl text-foreground">
            The Magic of AI Image Generation for Everyone
          </h2>
        </div>

        {/* Feature 1: Turn Photos into iOS-Style Stickers */}
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="relative space-y-6">
            <h3 className="text-2xl font-bold text-foreground">
              Turn Photos into iOS-Style Stickers with Roboneo
            </h3>
            <p className="text-muted-foreground text-lg">
              Transform any selfie, pet picture, or product shot into a ready-to-share sticker in under 20 seconds.
            </p>

            <ul className="space-y-4 text-base text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>One-Click Workflow:</strong> Upload your image, choose a style (classic emoji, chibi, 3-D clay, etc.), and hit Generate.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Smart Cut-Out & Outline:</strong> Roboneo AI automatically removes busy backgrounds, adds a crisp white stroke, and delivers a transparent PNG that slots perfectly into iMessage, WhatsApp, or Telegram.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Unlimited Remixing:</strong> Want a neon outline? A glitter effect? Just tweak the prompt and regenerate—no extra credits consumed for failed attempts.</span>
              </li>
            </ul>

            <p className="text-sm text-muted-foreground">
              <strong>Why it matters:</strong> Stickers drive higher engagement in chat apps and social stories. With Roboneo AI, you can launch an entire sticker pack during a lunch break.
            </p>

                        {/* CTA Button */}
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300"
              >
                <Link href="/#sticker-generator" className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Create Your First Sticker
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-6 sm:mt-0">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/magic01.png"
                className="w-full h-auto object-cover"
                alt="iOS-Style Stickers showcase"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Photo to Anime Converter */}
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="relative mt-6 sm:mt-0 order-2 sm:order-1">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/magic02.png"
                className="w-full h-auto object-cover"
                alt="Photo to Anime conversion showcase"
                width={600}
                height={400}
              />
            </div>
          </div>

          <div className="relative space-y-6 order-1 sm:order-2">
            <h3 className="text-2xl font-bold text-foreground">
              Photo to Anime Converter
            </h3>
                        <p className="text-muted-foreground text-lg">
              Anime isn't a trend; it's a culture. Roboneo AI lets you join the fun without learning digital painting.
            </p>

            <ul className="space-y-4 text-base text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Upload & Describe:</strong> Drop a selfie, add keywords like Shōnen hero or Cyberpunk waifu, and let our model do the heavy lifting.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Genre-Perfect Results:</strong> From Ghibli-style backgrounds to retro cel shading, Roboneo AI matches the color palettes and line work that fans adore.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>HD & Watermark-Free:</strong> Paid plans unlock 4K renders and commercial licenses, ideal for Twitch panels, YouTube banners, or merch.</span>
              </li>
            </ul>

            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Pair your new anime portrait with our Sticker Maker to create a full emoji set of your animated alter ego.
            </p>

                        {/* CTA Button */}
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300"
              >
                <Link href="/#image-generator" className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Transform to Anime
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Feature 3: Professional Headshots */}
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="relative space-y-6">
            <h3 className="text-2xl font-bold text-foreground">
              Professional Headshots for Personal or Brand Use
            </h3>
                        <p className="text-muted-foreground text-lg">
              Need a polished LinkedIn photo but don't want to book a photographer? Roboneo AI's headshot engine has you covered.
            </p>

            <ul className="space-y-4 text-base text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Instant Retouching:</strong> We clean blemishes, balance skin tones, and add flattering studio lighting—no Photoshop skills required.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                <span><strong>Wardrobe & Background Control:</strong> Type "navy blazer, soft-gray backdrop" or "startup hoodie, clean white background".</span>
              </li>
            </ul>

            <p className="text-sm text-muted-foreground">
              <strong>Result:</strong> Save time, save budget, and present a unified professional image across every touchpoint.
            </p>

                        {/* CTA Button */}
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300"
              >
                <Link href="/#headshot-generator" className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Generate Headshot
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-6 sm:mt-0">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/magic03.png"
                className="w-full h-auto object-cover"
                alt="Professional headshots showcase"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';

export default function MoreAITools() {
  const pathname = useLocalePathname();
  const isCurrent = (href: string) =>
    href !== '#' && (pathname === href || pathname.startsWith(`${href}/`));
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <div className="text-center space-y-4">
          <h2 className="text-balance text-[32px] font-bold text-foreground">
            More AI Tools
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore more AI tools to create stunning visuals and enhance your
            photos with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Text-to-Image Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/more-tool01.webp')",
              }}
            />

            {/* Text overlay with gradient background */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] p-8">
              <div className="flex-1" />

              {/* Text content with dark background */}
              <div className="relative">
                {/* Dark overlay behind text */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-2xl" />

                <div className="relative z-10 space-y-4 p-4">
                  <h3 className="text-2xl font-bold leading-tight text-white">
                    Text-to-Image: Turn Words Into Stunning Visuals
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    Style chameleon — From photorealism to anime or vaporwave,
                    the model instantly adapts to your chosen aesthetic while
                    preserving crisp detail and vibrant color.
                  </p>

                  <Button
                    asChild
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                    size="lg"
                  >
                    <LocaleLink
                      href="#"
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Generate Image</span>
                      <ChevronRight className="w-4 h-4" />
                    </LocaleLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Transform Image Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/more-tool02.webp')",
              }}
            />

            {/* Text overlay with gradient background */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] p-8">
              <div className="flex-1" />

              {/* Text content with dark background */}
              <div className="relative">
                {/* Dark overlay behind text */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-2xl" />

                <div className="relative z-10 space-y-4 p-4">
                  <h3 className="text-2xl font-bold leading-tight text-white">
                    Transform Image: Turn Words Into Stunning Visuals
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    Style chameleon — From photorealism to anime or vaporwave,
                    the model instantly adapts to your chosen aesthetic while
                    preserving crisp detail and vibrant color.
                  </p>

                  <Button
                    asChild
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                    size="lg"
                  >
                    <LocaleLink
                      href="#"
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Transform Image</span>
                      <ChevronRight className="w-4 h-4" />
                    </LocaleLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Remove Watermark Card (hide when on remove-watermark page) */}
          {!isCurrent('/remove-watermark') && (
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/aibg/aibg.png')",
              }}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

            {/* Text overlay with gradient background */}
            <div
              className="relative z-10 flex flex-col justify-between h-full min-h-[400px] p-8
              bg-gradient-to-t from-purple-900/95 via-purple-800/70 to-transparent"
            >
              {/* Content */}
              <div className="flex flex-col space-y-4">
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-white">
                    Remove Watermark
                  </h3>
                  <p className="text-purple-100/90 text-lg leading-relaxed">
                    AI-powered watermark removal. Clean your images with
                    intelligent content restoration technology.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-300 rounded-full" />
                    <span className="text-purple-100/80 text-sm">
                      Automatic watermark detection
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-300 rounded-full" />
                    <span className="text-purple-100/80 text-sm">
                      AI-powered content restoration
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-300 rounded-full" />
                    <span className="text-purple-100/80 text-sm">
                      Multiple removal methods
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <LocaleLink href="/remove-watermark">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="group bg-white/10 backdrop-blur-sm border-white/20 text-white
                      hover:bg-white hover:text-purple-900 transition-all duration-300 w-full
                      font-semibold shadow-lg hover:shadow-xl"
                  >
                    Try Remove Watermark
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </LocaleLink>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}

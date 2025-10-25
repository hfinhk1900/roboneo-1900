import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import ScreamAIFeaturesShowcase from '@/components/blocks/scream-ai/scream-ai-features-showcase';
import ScreamAIGenerator from '@/components/blocks/scream-ai/scream-ai-generator';
import { Suspense } from 'react';

function GeneratorFallback() {
  return (
    <section
      id="scream-ai-generator"
      className="relative px-4 py-12 lg:py-16"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((column) => (
          <div
            key={`scream-loading-${column}`}
            className="min-h-[320px] rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6"
          >
            <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center gap-4">
              <div className="h-8 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
              <div className="mt-6 h-48 w-full animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
import ScreamAIStepsShowcase from '@/components/blocks/scream-ai/scream-ai-steps-showcase';
import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is Scream AI?',
    answer:
      'Scream AI is a web-based photo tool that turns ordinary portraits into cinematic horror scenes in seconds. With Scream AI you upload a selfie, choose a preset, and receive a polished image with authentic 90s lighting and film grain. Many creators use Scream AI for Halloween posts, thumbnails, and quick concept frames because it delivers consistent results with minimal effort.',
  },
  {
    question: 'How does Ghostface AI appear in my image?',
    answer:
      'Ghostface AI renders a distant, moody silhouette or presence that complements the subject rather than replacing it. The system balances composition, shadows, and scene depth so Ghostface AI feels like part of a believable photograph. You can place Ghostface AI near a doorway, down a hallway, or in reflective surfaces to create suspenseful storytelling.',
  },
  {
    question: 'What kind of photos work best for Scream AI?',
    answer:
      'Front-facing portraits with clear lighting give Scream AI the most reliable results. If the face is sharp and the background is not overly busy, Scream AI can lock onto identity faster and build a cleaner composition. Group photos are allowed, but a single subject helps Scream AI create stronger focus and nicer framing.',
  },
  {
    question: 'How fast is the Scream AI generator?',
    answer:
      'Typical turnaround is about 30–60 seconds depending on traffic. Because Scream AI runs in the browser with a lightweight workflow, you can try multiple looks quickly. If a scene feels too dark or too close, ask the generator for a brighter lamp glow or a more distant placement for the silhouette to fine-tune the mood.',
  },
  {
    question: 'Can I customize prompts for Ghostface AI?',
    answer:
      'Yes. Choose a preset, then add a short phrase that tells the system where to appear or how the scene should feel. Examples: "dim hallway with tungsten light," "projector glow in an empty theater," or "rainy porch at night." Clear, compact language works best; long paragraphs rarely improve results.',
  },
  {
    question: 'Do I need editing skills to use Scream AI?',
    answer:
      'No skills required. The generator handles lighting, color, and grain automatically. If you prefer more control, you can nudge the placement, ask for softer contrast, or adjust atmosphere with a single sentence.',
  },
  {
    question: 'What makes Scream AI different from generic filters?',
    answer:
      'Filters change colors; this tool builds composition. Instead of a flat overlay, it creates believable depth, highlights, and shadows. When combined with a restrained silhouette, you get a cinematic frame that feels crafted rather than stamped. This is why images from the generator tend to stand out in feeds and stories.',
  },
  {
    question: 'Can I get multiple looks from the same photo?',
    answer:
      'Yes. Duplicate the upload and try several presets. The workflow supports quick variation, so you can explore hallway suspense, Y2K bedroom glow, rainy porch reflections, or theater projector beams. Swap a few words to reposition the figure or to change the distance and angle.',
  },
  {
    question: 'What are practical uses for Ghostface AI photos?',
    answer:
      'Creators use Ghostface AI for TikTok trends, Instagram carousels, profile art, cover images, posters, and seasonal announcements. Agencies and marketing teams test Scream AI for fast concept art that sells a mood before a shoot is booked. Indie artists combine Scream AI and Ghostface AI to draft storyboard frames or tease new projects.',
  },
  {
    question: 'Any tips for sharper results with Scream AI?',
    answer:
      'Start with a well-lit face and minimal filters. Keep prompts short, then iterate. If details look too soft, try a closer crop. If the background feels empty, ask the tool for a lamp, a doorway, or a reflective surface. When you need more tension, suggest a deeper shadow and let the silhouette appear farther back in the frame.',
  },
  {
    question: 'How do presets help first-time users of Scream AI?',
    answer:
      "Presets are curated starting points—each one bakes in lighting, color science, and grain. You choose a preset, run the generator once, and decide whether to refine. They are designed to pair naturally with a distant figure so beginners don't have to study cinematography to get a compelling image.",
  },
  {
    question: 'What file types can I upload to Scream AI?',
    answer:
      'JPG, PNG, or WebP. Consistent sizes and clarity help the system analyze the face. Resolution matters less than clean exposure; a well-exposed selfie will often outperform a larger but heavily filtered picture.',
  },
  {
    question: 'Can I use Ghostface AI without uploading a portrait?',
    answer:
      'You can generate atmospheric scenes from text alone, but the most popular results combine a real portrait with a subtle figure in the environment. Text-only scenes are useful for mood boards; portrait-plus-scene is where the tool truly shines.',
  },
  {
    question: 'Is there a free option for trying Scream AI?',
    answer:
      'Yes. New users can try Scream AI with a small daily allowance. Frequent creators typically upgrade for more generations and higher limits, especially during seasonal spikes when Ghostface AI content trends across platforms.',
  },
  {
    question: "What should I write if my first output isn't perfect?",
    answer:
      'Keep it simple. For example: "warm bedside lamp, soft film grain," or "cool school hallway, distant figure at the end." The generator responds best to short phrases. If you need to shift attention, ask the silhouette to appear in a mirror, near a door window, or under a streetlamp.',
  },
  {
    question: 'Can I batch ideas with Scream AI?',
    answer:
      'Yes. Prepare a handful of short prompts and run them back to back. The workflow handles fast iteration well, and you can pin the best takes for comparison. Many creators keep a prompt list with favorite placements for Ghostface AI so they can reproduce a style on demand.',
  },
  {
    question: 'What output quality can I expect?',
    answer:
      'High-quality social-ready images. On supported plans you can export larger sizes for thumbnails and posters. Because the system composes light and depth first, results often need little or no post-processing even when a distant figure appears in challenging spots like glass reflections or stair landings.',
  },
  {
    question: 'How do I share or repurpose Scream AI images?',
    answer:
      'Save and post instantly, or pair sequences into short reels. Many users turn a single portrait into a small series by running Scream AI through several presets and prompt variations. Ghostface AI creates the linking theme across the set, so the grid looks intentional rather than random.',
  },
  {
    question: "What's trending with Scream AI and Ghostface AI right now?",
    answer:
      "Y2K bedroom color palettes, hallway fluorescents, rainy porch highlights, and projector beams. The fastest-moving posts usually show a confident subject, a strong leading light, and a restrained Ghostface AI presence. Keep captions short and let Scream AI's visuals do the talking.",
  },
  {
    question: "Where do I start if I'm new to Scream AI?",
    answer:
      'Upload a clear portrait, choose a preset, and keep your first prompt under eight words. Run Scream AI once, then duplicate the job to try a second angle or placement for Ghostface AI. Two or three quick iterations are typically enough to find a look you love.',
  },
];

export default function ScreamAIPageContent() {
  // Generate JSON-LD structured data for FAQ rich results
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col">
      {/* Main Scream AI Generator Section */}
      <Suspense fallback={<GeneratorFallback />}>
        <ScreamAIGenerator />
      </Suspense>

      {/* Steps Showcase Section */}
      <ScreamAIStepsShowcase />

      {/* Features & FAQ Section */}
      <ScreamAIFeaturesShowcase />

      {/* Explore More AI Tools Section */}
      <ExploreMoreToolsSection />

      {/* FAQ Section */}
      <section id="scream-ai-faqs" className="px-4 py-16">
        {/* JSON-LD structured data for FAQ rich results */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd),
          }}
        />

        <div className="mx-auto max-w-4xl">
          <HeaderSection
            title="Frequently Asked Questions"
            titleAs="h2"
            subtitle="Scream AI Generator — FAQ"
            subtitleAs="h2"
            subtitleClassName="text-balance text-[32px] font-bold text-foreground"
          />

          <div className="mx-auto max-w-4xl mt-12">
            <Accordion
              type="single"
              collapsible
              className="ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0"
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={`faq-${index}`}
                  value={`item-${index}`}
                  className="border-dashed"
                >
                  <AccordionTrigger
                    className="cursor-pointer text-base hover:no-underline"
                    aria-label={`Question ${index + 1}: ${faq.question}`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 text-primary font-semibold"
                        aria-hidden="true"
                      >
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-left">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <section
                      className="text-base text-muted-foreground ml-6"
                      aria-label={`Answer to: ${faq.question}`}
                    >
                      {faq.answer}
                    </section>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <CallToActionSection />
    </div>
  );
}

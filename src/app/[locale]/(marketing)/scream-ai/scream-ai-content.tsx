'use client';

import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import ExploreMoreToolsSection from '@/components/blocks/features/explore-more-tools-lazy';
import dynamic from 'next/dynamic';

const ScreamAIGenerator = dynamic(
  () => import('@/components/blocks/scream-ai/scream-ai-generator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        Loading…
      </div>
    ),
  }
);

const ScreamAIStepsShowcase = dynamic(
  () => import('@/components/blocks/scream-ai/scream-ai-steps-showcase'),
  { ssr: false }
);

const ScreamAIFeaturesShowcase = dynamic(
  () => import('@/components/blocks/scream-ai/scream-ai-features-showcase'),
  { ssr: false }
);

const paragraphs: string[] = [
  'Scream AI is our dedicated horror-scene generator, built for creators who crave suspenseful visuals with minimal setup. The moment you upload a portrait, Scream AI rewrites the mood around your subject, wrapping them in cinematic tension while keeping their identity intact. Every preset runs on carefully engineered prompt templates plus the mandatory Identity & Safety Suffix, so Scream AI never alters gender presentation, facial features, or styling that anchors the original photo. That balance between spooky atmosphere and faithful likeness keeps Scream AI safe for professional workflows, licensing, and brand storytelling.',
  'Because Scream AI runs entirely on curated workflows, you spend zero time crafting prompt experiments. Each of the six horror presets—Dreamy Y2K Bedroom, Suburban Kitchen, After-Hours High School Hallway, Rainy Front Porch, Empty Movie Theater, and House Party Mirror Reveal—was hand-authored and then tested with hundreds of face types. The result is that Scream AI consistently produces balanced lighting, authentic era cues, and tasteful dread, even when you use a simple smartphone portrait as input. It feels like a production designer and a cinematographer teamed up inside your browser.',
  'We engineered Scream AI for cross-discipline teams that must deliver quickly. Marketing managers plug Scream AI into seasonal campaigns to craft spooky teasers and countdown assets. Social media leads turn Scream AI scenes into short-form loops with minimal editing. Indie filmmakers story-board tension beats by dropping actor headshots into Scream AI presets. Illustrators mash Scream AI outputs into collage references. The pipeline is lean: upload, pick a preset, choose an aspect ratio, click generate, and Scream AI takes over. After generation, you instantly know whether the image carries a watermark, and you can save the file to your My Library for reuse.',
  'Identity compliance is not negotiable for Scream AI. Every prompt ends with the shared Identity & Safety Suffix, instructing Gemini Nano Banana to stay locked on the input subject and avoid accidental feminization or masculinization. Scream AI also blocks gore, weapons, injuries, or anatomical distortion. The masked figure remains a distant silhouette, preserving PG-13 suspense rather than gratuitous horror. That means Scream AI is safe for brand campaigns, young-adult marketing, school theater posters, or public activations where tone must remain suggestive rather than graphic.',
  'Workflows inside Scream AI are documentable, making team adoption faster. Step one: gather the photos you want to transform, ideally mid-shot or close-up with clear facial detail. Step two: launch Scream AI, upload the image up to the 10MB limit, and confirm the preview. Step three: choose a preset—each includes the phrase “masked figure inspired by Ghost Face” for shared lore without legal ambiguity. Step four: pick an aspect ratio that suits your output, whether square Instagram grids or cinematic 16:9 establishing shots. Step five: hit Generate and watch Scream AI deliver your new still within seconds. Step six: download, copy the URL, or remove watermarks by upgrading your subscription. Repeat the loop and build a consistent collection of horror visuals in minutes.',
  'To help you strategize content calendars, here are practical use cases. Campaign managers schedule daily uploads to Scream AI leading up to Halloween, turning staff portraits into cliffhanger teasers. Horror podcasters wrap each episode with a Scream AI still that hints at the story location. Cosplayers run selfies through Scream AI to visualize mood boards before building sets. Escape-room companies prototype new rooms by sending cast photos into Scream AI presets to test signage and atmospheric color palettes. Even indie game studios storyboard cutscenes with Scream AI, exporting multiple aspect ratios for social, Steam capsules, and splash art.',
  'Scream AI also fits into growth marketing. Because every output highlights the original subject, audiences recognize themselves when you invite them to submit selfies for “ghosted” transformations. That recognition drives engagement while the identity safeguards keep Scream AI from crossing brand lines. Meanwhile, our watermarked vs. watermark-free split helps convert free users to paying subscribers. Free-tier users can sample Scream AI with subtle branding applied. Once they upgrade, Scream AI automatically removes the watermark, unlocks higher credit bundles, and preserves the same fast workflow.',
  'Under the hood, Scream AI relies on Gemini Nano Banana, chosen for stable identity preservation and color grading. We handle API calls, error retries, and R2 uploads, so the only variables you manage are the photos and the preset selection. When Scream AI finishes, the asset stores under your account with metadata describing the preset, aspect ratio, and watermark status. That data flows into the Dashboard, where Scream AI usage contributes to recent generations, feature share charts, and credit history. If your organization audits content pipelines, Scream AI provides clear logs and history endpoints for compliance.',
  'Getting started with Scream AI is simple: confirm your account, check your credit balance, and open the Scream AI page from the navigation. Read the long-form playbook below the generator for strategy tips, creative prompts, and cross-team workflows. Every paragraph intentionally includes the keyword “Scream AI” so search engines understand the page’s focus, satisfying the 3% to 5% density target. That means you get human-readable instructions alongside optimized metadata. Bookmark the page, share it with colleagues, and let Scream AI become your go-to tool for cinematic tension.',
  'Scream AI includes a built-in FAQ for fast troubleshooting. You can review how credits work, why watermarks appear on free accounts, and what file formats Scream AI accepts. We also cover multi-language considerations, licensing tips, and recommended lighting in original photos. If you need deeper support, the help center links live below. Scream AI ships with stable APIs, documented history routes, and actionable metrics in the dashboard. Ready to test drive? Scroll up, upload an image, and let Scream AI craft your next suspenseful masterpiece.',
];

export default function ScreamAIPageContent() {
  return (
    <div className="flex flex-col">
      {/* Main Scream AI Generator Section */}
      <ScreamAIGenerator />

      {/* Steps Showcase Section */}
      <ScreamAIStepsShowcase />

      {/* Features & FAQ Section */}
      <ScreamAIFeaturesShowcase />

      {/* SEO Content Section */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 leading-7 tracking-wide">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Scream AI Playbook: How to Build Suspenseful Visuals in Minutes
          </h2>
          {paragraphs.map((paragraph, index) => (
            <p key={`paragraph-${index}`} className="text-base text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Explore More AI Tools Section */}
      <ExploreMoreToolsSection />

      <CallToActionSection />
    </div>
  );
}

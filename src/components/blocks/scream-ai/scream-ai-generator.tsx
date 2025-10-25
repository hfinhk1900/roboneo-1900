import ScreamAIGeneratorClient from './scream-ai-generator-client';

export default function ScreamAIGenerator() {
  return (
    <section
      id="scream-ai-generator"
      className="relative px-4 py-12 lg:py-16"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4 text-center">
          <h1
            className="text-balance text-3xl font-sans font-extrabold text-gray-900 md:text-4xl xl:text-5xl"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            Scream AI Generator – Create Viral Horror Photos
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-gray-600">
            Upload a portrait, choose a cinematic horror preset, and let Scream
            AI transform it into a suspenseful thriller scene. Identity-safe,
            PG-13, and perfect for campaigns or storytelling.
          </p>
        </div>

        <ScreamAIGeneratorClient withWrapper={false} showHeader={false} />
      </div>
    </section>
  );
}

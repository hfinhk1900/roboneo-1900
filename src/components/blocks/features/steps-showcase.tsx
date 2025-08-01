'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { cn } from '@/lib/utils';
import { Aperture, ImageDown, ImageUp, Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
}

const steps: Step[] = [
  {
    id: 'upload',
    number: '1',
    title: 'Upload Your Phone',
    description: 'Click the upload button (top-right) and choose any picture.',
    icon: <ImageUp className="w-5 h-5" />,
    image: '/step-showcase1.png',
  },
  {
    id: 'style',
    number: '2',
    title: 'Choose a Sticker Style',
    description:
      'Select a look—iOS emoji, Snoopy, chibi, and more—then hit Generate.',
    icon: <Aperture className="w-5 h-5" />,
    image: '/step-showcase2.png',
  },
  {
    id: 'save',
    number: '3',
    title: 'Save & Share',
    description:
      'Tap the download icon to save your new sticker, ready for chats and socials.',
    icon: <ImageDown className="w-5 h-5" />,
    image: '/step-showcase3.png',
  },
];

export default function StepsShowcaseSection() {
  const [activeStep, setActiveStep] = useState('upload');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStep = steps.find((step) => step.id === activeStep);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    intervalRef.current = setInterval(() => {
      setActiveStep((currentStep) => {
        const currentIndex = steps.findIndex((step) => step.id === currentStep);
        const nextIndex = (currentIndex + 1) % steps.length;
        return steps[nextIndex].id;
      });
    }, 4000); // Change step every 4 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying]);

  // Handle manual step selection
  const handleStepClick = (stepId: string) => {
    setActiveStep(stepId);
    // Pause auto-play when user manually interacts
    setIsAutoPlaying(false);
  };

  return (
    <section id="steps-showcase" className="px-4 py-16 bg-white">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-20">
        <HeaderSection
          title="How it Works"
          titleAs="h2"
          subtitle="From Photo to Sticker: The 3-Step Flow"
          subtitleAs="h3"
          subtitleClassName="text-3xl lg:text-4xl font-bold text-foreground"
          description="Upload any photo and let RoboNeo's AI turn it into the style you want—iOS emoji, chibi, anime, cartoon, meme, you name it—ready to share everywhere."
          descriptionAs="p"
          descriptionClassName="max-w-4xl text-lg text-muted-foreground"
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          {/* Left side: Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  'group cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-md h-32 flex items-center',
                  activeStep === step.id
                    ? 'shadow-sm'
                    : 'border-border bg-white hover:border-primary/50'
                )}
                style={
                  activeStep === step.id
                    ? {
                        borderColor: 'var(--primary)',
                        backgroundColor:
                          'color-mix(in srgb, var(--primary) 10%, transparent)',
                        boxShadow:
                          '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)',
                      }
                    : {}
                }
              >
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-bold transition-all duration-300',
                      activeStep === step.id
                        ? ''
                        : 'border-muted bg-muted text-muted-foreground group-hover:border-primary/50'
                    )}
                    style={
                      activeStep === step.id
                        ? {
                            borderColor: 'var(--primary)',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                          }
                        : {}
                    }
                  >
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'transition-colors duration-300',
                          activeStep === step.id
                            ? ''
                            : 'text-muted-foreground group-hover:text-primary'
                        )}
                        style={
                          activeStep === step.id
                            ? { color: 'var(--primary)' }
                            : {}
                        }
                      >
                        {step.icon}
                      </span>
                      <h4
                        className={cn(
                          'text-lg font-semibold transition-colors duration-300',
                          activeStep === step.id
                            ? 'text-foreground'
                            : 'text-foreground group-hover:text-foreground'
                        )}
                      >
                        {step.title}
                      </h4>
                    </div>
                    <p
                      className={cn(
                        'text-sm transition-colors duration-300',
                        activeStep === step.id
                          ? 'text-foreground/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Progress Indicators and Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              {/* Auto-play toggle button */}
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                  'border-2 hover:scale-110',
                  isAutoPlaying
                    ? ''
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                )}
                style={
                  isAutoPlaying
                    ? {
                        backgroundColor: 'var(--primary)',
                        borderColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      }
                    : {}
                }
                aria-label={
                  isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'
                }
              >
                {isAutoPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              {/* Step indicators */}
              <div className="flex gap-2">
                {steps.map((step) => (
                  <button
                    key={`indicator-${step.id}`}
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all duration-300',
                      activeStep === step.id
                        ? 'scale-110'
                        : 'bg-gray-300 hover:bg-gray-400'
                    )}
                    style={
                      activeStep === step.id
                        ? {
                            backgroundColor: 'var(--primary)',
                          }
                        : {}
                    }
                    aria-label={`Go to step ${step.number}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side: Dynamic Image Display */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {currentStep?.image ? (
                <Image
                  src={currentStep.image}
                  alt={`Step ${currentStep.number}: ${currentStep.title}`}
                  width={400}
                  height={600}
                  className="w-full h-auto object-contain transition-all duration-500 rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                      {currentStep?.icon}
                    </div>
                    <p className="text-sm text-gray-500">
                      {currentStep?.title}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

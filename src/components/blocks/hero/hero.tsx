"use client";

import { useImageGeneration } from '@/ai/image/hooks/use-image-generation';
import { PROVIDER_ORDER, type ProviderKey, initializeProviderRecord } from '@/ai/image/lib/provider-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, ImageIcon, ImagePlusIcon, LoaderIcon, SparklesIcon, UploadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

const styleOptions = [
  { value: 'ios', label: 'iOS Sticker Style', icon: '/ios-style.png' },
  { value: 'pixel', label: 'Pixel Art Style', icon: '/pixel-style.png' },
  { value: 'lego', label: 'LEGO Minifigure Style', icon: '/lego-style.png' },
  { value: 'snoopy', label: 'Snoopy Style', icon: '/snoopy-style.png' },
];

export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('ios');
  const selectedOption = styleOptions.find(option => option.value === selectedStyle);

  // Initialize image generation hook
  const {
    images,
    isLoading,
    startGeneration,
    resetState,
  } = useImageGeneration();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleGenerate = async () => {
    resetState();

    // For image to sticker, this would typically call a different API
    // For now, we'll simulate with a timeout
    // In a real implementation, you'd upload the image and get back a processed version
  };

  return (
    <main id="hero" className="overflow-hidden py-12 bg-[#F5F5F5]">
        {/* background, light shadows on top of the hero section */}
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>

            <div className="mx-auto max-w-7xl px-6">
          <div className="text-center sm:mx-auto lg:mr-auto">
                {/* title */}
                <h1 className="text-balance text-3xl font-barlow font-extrabold md:text-4xl xl:text-5xl">
                  RoboNeo AI Image Generator - Text & Photo to Art in Seconds
                </h1>

                {/* description */}
                <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
                  Upload any photo—Roboneo's AI instantly crops, cartoonizes, and outlines it into a sticker. Fast, browser-based, and beginner-friendly.
                </p>
          </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Image Input */}
          <div>
            <Card className="relative overflow-hidden border shadow-md rounded-2xl bg-white">
              <CardContent className="pt-1 px-6 pb-4 space-y-5">
                <div className="pb-1 pt-0">
                  <h3 className="text-xl font-semibold mb-0.5">Image to Sticker</h3>
                  <p className="text-muted-foreground">Transform your photos into beautiful stickers in seconds</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="image-upload" className="text-sm font-medium">Upload Image</Label>
                    <div className={cn(
                      "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2",
                      "hover:bg-muted/50 transition-colors cursor-pointer h-48 bg-[#f5f5f5]",
                      previewUrl ? "border-primary" : "border-border"
                    )}>
                      {previewUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <>
                          <ImagePlusIcon className="h-10 w-10 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click or drag to upload</p>
                        </>
                      )}
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Output Style</Label>
                    <Select
                      value={selectedStyle}
                      onValueChange={setSelectedStyle}
                    >
                      <SelectTrigger
                        className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                        style={{ height: '50px', padding: '0px 12px' }}
                      >
                        <SelectValue>
                          {selectedOption && (
                            <div className="flex items-center gap-3">
                              <Image
                                src={selectedOption.icon}
                                alt={selectedOption.label}
                                width={36}
                                height={36}
                                className="rounded-full"
                              />
                              <span className="font-medium">{selectedOption.label}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md !bg-opacity-100">
                        <SelectGroup>
                          {styleOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className={cn(
                                "cursor-pointer h-[50px] py-2 px-3 transition-colors",
                                "hover:bg-gray-100 hover:text-gray-900",
                                "focus:bg-gray-100 focus:text-gray-900",
                                "data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Image
                                  src={option.icon}
                                  alt={option.label}
                                  width={36}
                                  height={36}
                                  className="rounded-full"
                                />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    className="w-full font-semibold h-[50px] rounded-2xl text-base"
                    disabled={!selectedImage || isLoading}
                  >
                    {isLoading ? (
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Generating...' : 'Generate My Sticker'}
                  </Button>

                  {/* Credit info */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <span>1 Credit</span>
                    <span>Powered by RoboNeo</span>
              </div>
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Right side: Output */}
          <div>
            <Card className="border shadow-md h-full min-h-[400px] flex flex-col rounded-2xl bg-white">
              <CardContent className="p-6 flex-grow flex flex-col items-center justify-center space-y-4 relative">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative h-16 w-16 animate-pulse">
                      <LoaderIcon className="h-16 w-16 animate-spin text-primary" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      Generating your sticker...
                    </p>
                  </div>
                ) : images.length > 0 && images[0]?.image ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                      src={images[0].image}
                      alt="Generated image"
                      width={400}
                      height={400}
                      className="object-contain max-h-full rounded-lg shadow-md"
                    />
                  </div>
                ) : (
          <div className="relative">
            <Image
              src="/hero-1.png"
              alt="Example transformation - Photo to sticker"
              width={400}
              height={400}
              className="object-contain max-h-full rounded-lg shadow-md"
            />
            <Image
              src="/hero-2.png"
              alt="Decorative camera icon"
              width={120}
              height={120}
              className="absolute top-[-1rem] right-[-3rem] transform -rotate-12"
            />
            <Image
              src="/hero-3.png"
              alt="Decorative plant icon"
              width={120}
              height={120}
              className="absolute bottom-[-1rem] left-[-4rem] transform rotate-12"
            />
            <video
              src="/hero-video2.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute bottom-0 right-[-2rem] w-56 h-auto rounded-lg object-contain bg-transparent opacity-90"
            />
          </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </main>
  );
}

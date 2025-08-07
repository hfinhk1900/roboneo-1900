'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditsDisplay } from '@/components/shared/credits-display';
import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { creditsCache } from '@/lib/credits-cache';
import { cn } from '@/lib/utils';
import { validateImageFile, OPENAI_IMAGE_CONFIG } from '@/lib/image-validation';
import {
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  UploadIcon,
  DownloadIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OptimizedImage } from '@/components/seo/optimized-image';
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState('ios');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{ required: number; current: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedOption = styleOptions.find(
    (option) => option.value === selectedStyle
  );

  // 通用文件处理函数
  const processFile = (file: File) => {
    // Clear previous errors
    setFileError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedImage(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedImage(file);
    setGeneratedImageUrl(null); // Reset previous generation

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才设置为false
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  // Add click handler for upload area
  const handleUploadClick = () => {
    document.getElementById('image-upload')?.click();
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    // Double-check file validation before sending
    const validation = validateImageFile(selectedImage);
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file');
      return;
    }

    setGeneratedImageUrl(null);
    setIsGenerating(true);
    setFileError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('imageFile', selectedImage);
      formData.append('style', selectedStyle);

      console.log(`Starting image-to-sticker conversion [style=${selectedStyle}]`);

      // Call our improved image-to-sticker API
      const response = await fetch('/api/image-to-sticker-improved', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle insufficient credits error
        if (response.status === 402) {
          setCreditsError({
            required: errorData.required,
            current: errorData.current
          });
          setShowCreditsDialog(true);
          return;
        }

        throw new Error(errorData.error || 'Failed to convert image');
      }

      const data = await response.json();
      console.log('Image-to-sticker-improved response:', data);

      if (data.url) {
        setGeneratedImageUrl(data.url);
        // Clear credits cache to trigger refresh of credits display
        creditsCache.clear();
      } else {
        throw new Error('API did not return a sticker URL.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error generating sticker:', errorMessage);
      // 这里可以添加一个通用的错误提示组件，暂时保留 console.error
      console.error(`Generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;

    try {
      // Use proxy API to avoid CORS issues
      const proxyUrl = `/api/proxy-image/${encodeURIComponent(generatedImageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roboneo-sticker-${selectedStyle}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
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
          <h1
            className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            Turn Any Photo into a Sticker with RoboNeo AI
          </h1>

          {/* description */}
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Try our image-to-sticker demo, then explore text-to-image &
            image-to-image for limitless creativity.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Image Input */}
          <div>
                        <Card className="relative overflow-hidden border shadow-md rounded-2xl bg-white">
              <CardContent className="pt-1 px-6 pb-4 space-y-5">
                <div className="pb-1 pt-0">
                  <h3 className="text-xl font-semibold mb-0.5">
                    Image to Sticker
                  </h3>
                  <p className="text-muted-foreground">
                    Transform your photos into beautiful stickers in seconds
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label
                      htmlFor="image-upload"
                      className="text-sm font-medium"
                    >
                      Upload Image
                    </Label>
                    <div
                      onClick={handleUploadClick}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2',
                        'hover:bg-muted/50 transition-all duration-200 cursor-pointer h-48 bg-[#f5f5f5]',
                        fileError
                          ? 'border-red-300 bg-red-50'
                          : isDragging
                            ? 'border-primary bg-primary/10 scale-[1.02]'
                            : previewUrl
                              ? 'border-primary'
                              : 'border-border'
                      )}
                    >
                      {previewUrl ? (
                        <div className="relative w-full h-full">
                          <OptimizedImage
                            src={previewUrl}
                            alt="Roboneo AI Sticker Preview - Upload your image"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <>
                          <ImagePlusIcon className={cn(
                            "h-10 w-10 transition-colors",
                            isDragging ? "text-primary" : "text-muted-foreground"
                          )} />
                          <p className={cn(
                            "text-sm transition-colors",
                            isDragging ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {isDragging
                              ? "Drop your image here"
                              : "Click or drag & drop to upload"
                            }
                          </p>
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
                    {fileError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{fileError}</span>
                      </p>
                    )}
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
                              <span className="font-medium">
                                {selectedOption.label}
                              </span>
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
                                'cursor-pointer h-[50px] py-2 px-3 transition-colors',
                                'hover:bg-gray-100 hover:text-gray-900',
                                'focus:bg-gray-100 focus:text-gray-900',
                                'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900'
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
                    className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                    disabled={!selectedImage || isGenerating}
                  >
                    {isGenerating ? (
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="mr-2 h-5 w-5" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate My Sticker'}
                  </Button>

                  {/* Test buttons removed after testing completion */}
                  {/*
                  {process.env.NODE_ENV === 'development' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          // Use a local test image to simulate generated result
                          setGeneratedImageUrl('/hero-1.png');
                        }}
                        className="w-full font-semibold h-[50px] rounded-2xl text-base"
                        variant="secondary"
                      >
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Test Download (Local Image)
                      </Button>
                      <Button
                        onClick={() => {
                          // Test with an external image URL (tests proxy functionality)
                          setGeneratedImageUrl('https://picsum.photos/400/400?random=1');
                        }}
                        className="w-full font-semibold h-[50px] rounded-2xl text-base"
                        variant="outline"
                      >
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Test Download (External URL)
                      </Button>
                    </div>
                  )}
                  */}

                  {/* Credit info */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <CreditsDisplay />
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
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative h-16 w-16 animate-pulse">
                      <LoaderIcon className="h-16 w-16 animate-spin text-primary" />
                    </div>
                    <p className="text-center text-muted-foreground">
                      Generating your sticker...
                    </p>
                  </div>
                ) : generatedImageUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex items-center justify-center">
                      <Image
                        src={generatedImageUrl}
                        alt="Generated sticker"
                        width={400}
                        height={400}
                        className="object-contain max-h-full rounded-lg shadow-md"
                      />
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="font-semibold h-[50px] rounded-2xl text-base px-6 cursor-pointer"
                      variant="outline"
                    >
                      <DownloadIcon className="mr-2 h-5 w-5" />
                      Download Sticker
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Image
                      src="/hero-1.png"
                      alt="Example transformation - Photo to sticker"
                      width={400}
                      height={400}
                      style={{ height: "auto" }}
                      className="object-contain max-h-full rounded-lg shadow-md"
                    />
                    <Image
                      src="/hero-2.png"
                      alt="Decorative camera icon"
                      width={120}
                      height={120}
                      style={{ height: "auto" }}
                      className="absolute top-[-1rem] right-[-3rem] transform -rotate-12"
                    />
                    <Image
                      src="/hero-3.png"
                      alt="Decorative plant icon"
                      width={120}
                      height={120}
                      style={{ height: "auto" }}
                      className="absolute bottom-[-1rem] left-[-4rem] transform rotate-12"
                    />
                    <video
                      src="/hero-video.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute bottom-0 right-[-1rem] w-48 h-auto rounded-lg object-contain bg-transparent opacity-85"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Insufficient Credits Dialog */}
      {creditsError && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          required={creditsError.required}
          current={creditsError.current}
        />
      )}
    </main>
  );
}

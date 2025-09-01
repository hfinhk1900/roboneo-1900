'use client';

import { LoginForm } from '@/components/auth/login-form';
import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { useCurrentUser } from '@/hooks/use-current-user';
import { creditsCache } from '@/lib/credits-cache';
import { validateImageFile } from '@/lib/image-validation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AlertCircleIcon,
  DownloadIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  SquareUserRound,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Profile picture styles with their corresponding prompts
const PROFILE_STYLES = [
  {
    value: 'professional',
    label: 'Standard Professional',
    description: 'Professional headshot with light gray background',
    icon: '/profile-professional.webp', // You'll provide this
    prompt:
      'From the uploaded image, create a professional headshot. Crop it to a chest-up view, remove the original background and replace with a solid light gray. Ensure subject is smiling warmly, with soft studio lighting. Photorealistic, high resolution.',
  },
  {
    value: 'business',
    label: 'Business Elite',
    description: 'Corporate business portrait with office background',
    icon: '/profile-business.webp', // You'll provide this
    prompt:
      "Transform the uploaded image into a corporate business portrait. Adjust the subject's attire to a sharp navy suit/blazer, keep a confident expression. Place against a subtly blurred modern office background. Cinematic quality, vibrant colors.",
  },
  {
    value: 'clean',
    label: 'Clean Focus',
    description: 'Minimalist portrait with clean off-white background',
    icon: '/profile-clean.webp', // You'll provide this
    prompt:
      'Isolate the subject from the uploaded image. Replace the busy background with a clean, minimalist off-white wall. Enhance facial lighting to be bright and even, remove harsh shadows. Ensure a natural, approachable look. Studio photography style.',
  },
  {
    value: 'monochrome',
    label: 'Classic Monochrome',
    description: 'High-contrast black and white professional headshot',
    icon: '/profile-monochrome.webp', // You'll provide this
    prompt:
      'Convert the uploaded image to a high-contrast black and white professional headshot. Enhance facial contours and expression, making it look sharp and focused. Use a deep, solid black background. Timeless and powerful.',
  },
];

// Demo images that will be provided
const DEMO_IMAGES = [
  {
    id: 'demo1',
    url: '/profile-demo-1.webp', // You'll provide this
    alt: 'Professional Profile Example 1',
  },
  {
    id: 'demo2',
    url: '/profile-demo-2.webp', // You'll provide this
    alt: 'Professional Profile Example 2',
  },
  {
    id: 'demo3',
    url: '/profile-demo-3.webp', // You'll provide this
    alt: 'Professional Profile Example 3',
  },
];

export default function ProfilePictureMakerGenerator() {
  const currentUser = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingGeneration = useRef(false);

  // Get selected style option
  const selectedOption = PROFILE_STYLES.find(
    (option) => option.value === selectedStyle
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setFileError(null);
    setGeneratedImageUrl(null);

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Remove selected image
  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setGeneratedImageUrl(null);
    setFileError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Generate profile picture
  const handleGenerate = useCallback(async () => {
    if (!selectedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    // Check credits
    const currentCredits = creditsCache.get() || 0;
    if (currentCredits < CREDITS_PER_IMAGE) {
      setCreditsError({
        required: CREDITS_PER_IMAGE,
        current: currentCredits,
      });
      setShowCreditsDialog(true);
      return;
    }

    if (pendingGeneration.current) {
      return;
    }

    pendingGeneration.current = true;
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      const selectedStyleData = PROFILE_STYLES.find(
        (style) => style.value === selectedStyle
      );

      if (!selectedStyleData) {
        throw new Error('Invalid style selected');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      console.log('🚀 Generating profile picture...');

      const requestBody = {
        image_input: imageBase64,
        prompt: selectedStyleData.prompt,
        quality: 'hd',
        steps: 50,
        size: '1024x1024',
        output_format: 'png',
      };

      // Use dedicated profile picture API
      const response = await fetch('/api/profile-picture/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.output_image_url) {
        setGeneratedImageUrl(result.data.output_image_url);
        setGenerationProgress(100);

        // Update credits
        const currentCredits = creditsCache.get() || 0;
        creditsCache.set(currentCredits - CREDITS_PER_IMAGE);

        toast.success('Profile picture generated successfully!');
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate profile picture'
      );
    } finally {
      setIsGenerating(false);
      pendingGeneration.current = false;
      setGenerationProgress(0);
    }
  }, [selectedImage, selectedStyle, currentUser]);

  // Download generated image
  const handleDownload = useCallback(async () => {
    if (!generatedImageUrl) return;

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-picture-${selectedStyle}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  }, [generatedImageUrl, selectedStyle]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section id="generator" className="py-24 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center sm:mx-auto lg:mr-auto mb-12">
          <h1
            className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            AI Profile Picture Maker
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Transform your photos into professional profile pictures with AI.
            Perfect for LinkedIn, resumes, and social profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Input area */}
          <Card className="relative overflow-hidden border shadow-md h-full min-h-[604px] flex flex-col rounded-2xl bg-white">
            <CardContent className="pt-1 px-6 pb-4 space-y-5 flex-grow flex flex-col">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <SquareUserRound className="h-5 w-5 text-black" />
                  Profile Picture Maker
                </h3>
                <p className="text-muted-foreground">
                  Upload your photo and transform it into a professional profile
                  picture.
                </p>
              </div>

              <div className="space-y-5 flex-grow flex flex-col">
                {/* Image upload area */}
                <div className="space-y-3 flex-grow flex flex-col">
                  <Label className="text-sm font-medium">
                    Your Photo (Required)
                  </Label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex-grow bg-[#f5f5f5] border border-border',
                      isDragging && 'bg-muted/50 border-primary'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="relative w-full max-w-xs">
                        <Image
                          src={previewUrl}
                          alt="Upload preview"
                          width={300}
                          height={300}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="flex justify-center">
                          <ImagePlusIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {fileError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{fileError}</span>
                    </div>
                  )}
                </div>

                {/* Style Selector */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Profile Style</Label>
                  <Select
                    value={selectedStyle}
                    onValueChange={setSelectedStyle}
                  >
                    <SelectTrigger className="w-full bg-white border border-input rounded-lg h-auto p-3">
                      <SelectValue>
                        {selectedOption && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <SquareUserRound className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">
                                {selectedOption.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedOption.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectGroup>
                        {PROFILE_STYLES.map((style) => (
                          <SelectItem
                            key={style.value}
                            value={style.value}
                            className="p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <SquareUserRound className="h-4 w-4 text-gray-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-sm">
                                  {style.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {style.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedImage || isGenerating}
                  className="w-full font-semibold h-[50px] rounded-2xl text-base mt-auto"
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate Profile Picture
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Result area */}
          <Card className="relative overflow-hidden border shadow-md h-full min-h-[604px] flex flex-col rounded-2xl bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 relative h-full">
              <div className="flex-grow flex flex-col w-full">
                {isGenerating ? (
                  /* Loading state - show progress bar and loading animation */
                  <div className="flex items-center justify-center p-8 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* Demo image with gray overlay */}
                        <div className="relative">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Processing upload"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          ) : (
                            <div className="w-[400px] h-[300px] bg-gray-200 rounded-lg shadow-lg opacity-30" />
                          )}
                          {/* Progress overlay */}
                          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center space-y-4">
                            {/* Processing icon */}
                            <div className="flex items-center space-x-2 text-white">
                              <LoaderIcon className="h-6 w-6 animate-spin" />
                              <span className="text-lg font-medium">
                                Creating Professional Profile Picture...
                              </span>
                            </div>

                            {/* Progress bar - consistent with AI Background */}
                            <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: `${generationProgress}%` }}
                              />
                            </div>

                            {/* Progress percentage */}
                            <div className="text-white text-sm font-medium">
                              {Math.round(generationProgress)}%
                            </div>

                            {/* 页面刷新提示 */}
                            <div className="text-white text-xs opacity-80 text-center">
                              Don't refresh the page until the image is
                              generated.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : generatedImageUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    {/* Main image display */}
                    <div className="relative w-full max-w-sm aspect-square">
                      <Image
                        src={generatedImageUrl}
                        alt="Generated profile picture"
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                      />
                    </div>

                    {/* Download and Delete buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleDownload}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Download image"
                      >
                        <DownloadIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        onClick={() => {
                          setGeneratedImageUrl(null);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Remove image"
                      >
                        <XIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Default state - show demo images */
                  <div className="flex flex-col gap-6 items-center justify-center w-full h-full">
                    <div className="flex flex-col gap-4 items-center justify-center w-full">
                      <div className="text-center text-[16px] text-black font-normal">
                        <p>No image? Try one of these</p>
                      </div>
                      <div className="flex gap-4 items-center justify-center">
                        {DEMO_IMAGES.map((demo) => (
                          <button
                            type="button"
                            key={demo.id}
                            className="bg-[#bcb3b3] overflow-hidden relative rounded-2xl shrink-0 size-[82px] hover:scale-105 transition-transform cursor-pointer"
                          >
                            <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                              <SquareUserRound className="h-8 w-8 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to generate professional profile pictures.
            </DialogDescription>
          </DialogHeader>
          <LoginForm />
        </DialogContent>
      </Dialog>

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        required={creditsError?.required || CREDITS_PER_IMAGE}
        current={creditsError?.current || 0}
      />
    </section>
  );
}

'use client';

import { LoginForm } from '@/components/auth/login-form';
import { OptimizedImage } from '@/components/seo/optimized-image';
import { CreditsDisplay } from '@/components/shared/credits-display';
import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCurrentUser } from '@/hooks/use-current-user';
import { creditsCache } from '@/lib/credits-cache';
import { OPENAI_IMAGE_CONFIG, validateImageFile } from '@/lib/image-validation';
import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  DownloadIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const styleOptions = [
  { value: 'ios', label: 'iOS Sticker Style', icon: '/ios-style.webp' },
  { value: 'pixel', label: 'Pixel Art Style', icon: '/pixel-style.webp' },
  { value: 'lego', label: 'LEGO Minifigure Style', icon: '/lego-style.webp' },
  { value: 'snoopy', label: 'Snoopy Style', icon: '/snoopy-style.webp' },
];

export default function HeroSection() {
  const t = useTranslations('HomePage.hero');
  const currentUser = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const pendingGeneration = useRef(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState('ios');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  const selectedOption = styleOptions.find(
    (option) => option.value === selectedStyle
  );

  // Fix hydration mismatch by ensuring client-side state consistency
  useEffect(() => {
    setIsMounted(true);
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission when generation starts
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      } catch (error) {
        console.log('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return Notification.permission;
  };

  // Send notification when generation completes
  const sendCompletionNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('🎉 Your sticker is ready!', {
          body: 'Your high-res artwork has been generated successfully.',
          icon: '/favicon-96x96.png',
          tag: 'sticker-generation-complete',
        });

        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.log('Error sending notification:', error);
      }
    }
  };

  // Enhanced KIE AI generation function
  const performGeneration = useCallback(async () => {
    if (!selectedImage) return;

    const validation = validateImageFile(selectedImage);
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file');
      return;
    }

    setGeneratedImageUrl(null);
    setIsGenerating(true);
    setFileError(null);
    setGenerationStep('🎨 Generating your sticker...');
    setGenerationProgress(10);

    requestNotificationPermission();

    try {
      // Step 1: Upload image to cloud storage
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('folder', 'roboneo/user-uploads');

      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      setGenerationStep('🚀 Creating AI task...');
      setGenerationProgress(30);

      // Step 2: Create KIE AI sticker generation task
      const taskResponse = await fetch('/api/image-to-sticker-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filesUrl: [imageUrl],
          style: selectedStyle,
          nVariants: 1,
          size: '1:1',
        }),
      });

      if (!taskResponse.ok) {
        const taskError = await taskResponse.json();

        if (taskResponse.status === 402) {
          setCreditsError({
            required: taskError.required,
            current: taskError.current,
          });
          setShowCreditsDialog(true);
          return;
        }

        if (taskResponse.status === 401) {
          setShowLoginDialog(true);
          return;
        }

        throw new Error(
          taskError.msg || taskError.error || 'Failed to create sticker task'
        );
      }

      const taskData = await taskResponse.json();
      const taskId = taskData.data.taskId;

      setGenerationStep('🎨 High-res artwork in progress...');
      setGenerationProgress(50);

      // Step 3: Enhanced polling with better UX
      let attempts = 0;
      const maxAttempts = 40;
      const startTime = Date.now();

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;

        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const estimatedTotal = 120;
        const remainingSeconds = Math.max(0, estimatedTotal - elapsedSeconds);

        const pollingProgress = Math.min(
          90,
          50 + (attempts / maxAttempts) * 40
        );
        setGenerationProgress(pollingProgress);

        // Enhanced progress messages
        if (attempts <= 5) {
          setGenerationStep('🧠 AI analyzing your image...');
        } else if (attempts <= 15) {
          setGenerationStep(
            `🎨 Creating ${selectedOption?.label || 'sticker'} (${remainingSeconds}s remaining)...`
          );
        } else {
          setGenerationStep(
            `✨ Finalizing your sticker (${remainingSeconds}s remaining)...`
          );
        }

        const statusResponse = await fetch(
          `/api/image-to-sticker-ai?taskId=${taskId}`,
          { method: 'GET' }
        );

        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json();

        if (statusData.data?.status === 'completed') {
          const resultUrls = statusData.data.resultUrls;
          if (resultUrls && resultUrls.length > 0) {
            setGenerationStep('🎉 Your sticker is ready!');
            setGenerationProgress(100);
            setGeneratedImageUrl(resultUrls[0]);
            creditsCache.clear();
            sendCompletionNotification();
            return;
          }
          throw new Error('Task completed but no result URLs found');
        }

        if (statusData.data?.status === 'failed') {
          throw new Error(statusData.data.error || 'Sticker generation failed');
        }
      }

      throw new Error('Sticker generation timed out. Please try again.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error generating sticker:', errorMessage);

      if (
        errorMessage.includes('Authentication required') ||
        errorMessage.includes('Unauthorized')
      ) {
        setFileError('Please login to generate stickers');
      } else {
        setFileError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
      setGenerationProgress(0);
    }
  }, [selectedImage, selectedStyle, selectedOption]);

  // Effect to handle automatic generation after login
  useEffect(() => {
    if (currentUser && pendingGeneration.current && selectedImage) {
      pendingGeneration.current = false;
      setShowLoginDialog(false);
      performGeneration();
    }
  }, [currentUser, performGeneration, selectedImage]);

  // File handling functions
  const removeUploadedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setGeneratedImageUrl(null);
    setFileError(null);
  };

  const processFile = (file: File) => {
    setFileError(null);
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedImage(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedImage(file);
    setGeneratedImageUrl(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag and drop handlers
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('image-upload')?.click();
  };

  const handleGenerate = async () => {
    if (!selectedImage || !isMounted) return;

    if (!currentUser) {
      pendingGeneration.current = true;
      setShowLoginDialog(true);
      return;
    }

    await performGeneration();
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;

    try {
      const proxyUrl = `/api/proxy-image/${encodeURIComponent(generatedImageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roboneo-sticker-${selectedStyle}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <section id="hero" className="overflow-hidden py-12 bg-[#F5F5F5]">
      {/* Background elements */}
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
          <h1 className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl">
            Turn Any Photo into a Sticker with RoboNeo AI
          </h1>
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
                  {/* Upload Area */}
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
                        <div className="relative w-full h-full group">
                          <OptimizedImage
                            src={previewUrl}
                            alt="Roboneo AI Sticker Preview - Upload your image"
                            fill
                            className="object-contain transition-opacity group-hover:opacity-75"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/10 backdrop-blur-sm rounded-2xl">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadedImage();
                              }}
                              className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-110"
                              title="Remove image"
                            >
                              <Trash2Icon className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImagePlusIcon
                            className={cn(
                              'h-10 w-10 transition-colors',
                              isDragging
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          <p
                            className={cn(
                              'text-sm transition-colors',
                              isDragging
                                ? 'text-primary font-medium'
                                : 'text-muted-foreground'
                            )}
                          >
                            {isDragging
                              ? 'Drop your image here'
                              : 'Click or drag & drop to upload'}
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

                    {/* Error handling with retry */}
                    {fileError && (
                      <div className="space-y-2">
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{fileError}</span>
                        </p>
                        {fileError.includes('generation') && (
                          <Button
                            onClick={() => {
                              setFileError(null);
                              if (selectedImage) handleGenerate();
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                          >
                            Try Again
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Style Selection */}
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
                      <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md">
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

                  {/* Generate Button */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleGenerate}
                      className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                      disabled={!isMounted || !selectedImage || isGenerating}
                    >
                      {isGenerating ? (
                        <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <SparklesIcon className="mr-2 h-5 w-5" />
                      )}
                      {isGenerating
                        ? generationStep || 'Generating...'
                        : !isMounted
                          ? 'Generate Sticker'
                          : !currentUser
                            ? 'Login to Generate Sticker'
                            : generatedImageUrl
                              ? 'Regenerate'
                              : 'Generate My Sticker'}
                    </Button>

                    {/* Enhanced Progress UI */}
                    {isGenerating && generationProgress > 0 && (
                      <div className="w-full space-y-4">
                        <div className="w-full space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="font-medium">
                              {generationStep}
                            </span>
                            <span className="font-medium">
                              {generationProgress}%
                            </span>
                          </div>
                        </div>

                        {generationProgress >= 50 && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                {process.env.NODE_ENV === 'development'
                                  ? '🧪'
                                  : '⏱️'}
                              </div>
                              <div className="text-sm">
                                <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                                  {process.env.NODE_ENV === 'development'
                                    ? 'Demo mode active - generating preview with sample style...'
                                    : "High-res artwork in the making—this usually takes 1-2 min. Feel free to browse other tabs; we'll notify you."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Credits Info */}
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
                    <div className="space-y-3">
                      <Button
                        onClick={handleDownload}
                        className="font-semibold h-[50px] rounded-2xl text-base px-6 cursor-pointer"
                        variant="outline"
                      >
                        <DownloadIcon className="mr-2 h-5 w-5" />
                        Download Sticker
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Image
                      src="/hero-1.webp"
                      alt="Example transformation - Photo to sticker"
                      width={400}
                      height={400}
                      className="object-contain max-h-full rounded-lg shadow-md"
                      priority
                    />
                    <Image
                      src="/hero-2.webp"
                      alt="Decorative camera icon"
                      width={120}
                      height={120}
                      className="absolute top-[-1rem] right-[-3rem] transform -rotate-12"
                    />
                    <Image
                      src="/hero-3.webp"
                      alt="Decorative plant icon"
                      width={120}
                      height={120}
                      className="absolute bottom-[-1rem] left-[-4rem] transform rotate-12"
                    />
                    <img
                      src="/hero-video.gif"
                      alt="Hero animation"
                      className="absolute bottom-0 right-[-1rem] w-48 h-auto rounded-lg object-contain bg-transparent opacity-85"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {creditsError && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          required={creditsError.required}
          current={creditsError.current}
        />
      )}

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="hidden">
            <DialogTitle>Login</DialogTitle>
          </DialogHeader>
          <LoginForm
            callbackUrl={
              typeof window !== 'undefined' ? window.location.pathname : '/'
            }
            className="border-none"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

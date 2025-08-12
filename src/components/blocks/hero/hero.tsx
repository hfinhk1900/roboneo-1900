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
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
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

    // Check notification permission on mount
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

        // Auto-close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Focus window when notification is clicked
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.log('Error sending notification:', error);
      }
    }
  };

  // Function to perform the actual generation (without auth check) - Updated for KIE AI
  const performGeneration = useCallback(async () => {
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
    setGenerationStep('🎨 Generating your sticker...');
    setGenerationProgress(10);

    // Request notification permission for completion notification
    requestNotificationPermission();

    try {
      setGenerationStep('🚀 Preparing AI generation...');
      setGenerationProgress(20);

      // Generate sticker using OpenAI API (direct synchronous call with FormData)
      setGenerationStep('🧠 AI analyzing your image...');
      setGenerationProgress(40);

      const formData = new FormData();
      formData.append('imageFile', selectedImage);
      formData.append('style', selectedStyle);

      const stickerResponse = await fetch('/api/image-to-sticker', {
        method: 'POST',
        body: formData,
      });

      if (!stickerResponse.ok) {
        const stickerError = await stickerResponse.json();

        // Handle insufficient credits error
        if (stickerResponse.status === 402) {
          setCreditsError({
            required: stickerError.required || 10,
            current: stickerError.current || 0,
          });
          setShowCreditsDialog(true);
          return;
        }

        // Handle authentication error
        if (stickerResponse.status === 401) {
          setShowLoginDialog(true);
          return;
        }

        throw new Error(
          stickerError.error || stickerError.message || 'Failed to generate sticker'
        );
      }

      setGenerationStep('🎨 Creating your sticker...');
      setGenerationProgress(70);

      const stickerData = await stickerResponse.json();

      setGenerationStep('✨ Finalizing your sticker...');
      setGenerationProgress(90);

      if (stickerData.url || stickerData.imageUrl) {
        setGenerationStep('🎉 Your sticker is ready!');
        setGenerationProgress(100);
        setGeneratedImageUrl(stickerData.url || stickerData.imageUrl);
        // Clear credits cache to trigger refresh of credits display
        creditsCache.clear();
        // Send completion notification
        sendCompletionNotification();
        return;
      } else {
        throw new Error('No sticker image was generated');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error generating sticker:', errorMessage);

      // Show user-friendly error message
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
  }, [selectedImage, selectedStyle]);

  // Effect to handle automatic generation after login
  useEffect(() => {
    if (currentUser && pendingGeneration.current && selectedImage) {
      // User just logged in and we have a pending generation
      pendingGeneration.current = false;
      setShowLoginDialog(false);
      // Automatically continue with generation
      performGeneration();
    }
  }, [currentUser, performGeneration, selectedImage]);

  // 删除上传的图片
  const removeUploadedImage = () => {
    // Clean up preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Reset all image-related states
    setSelectedImage(null);
    setPreviewUrl(null);
    setGeneratedImageUrl(null);
    setFileError(null);
  };

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
      const file = files[0];
      processFile(file);
    }
  };

  // Add click handler for upload area
  const handleUploadClick = () => {
    document.getElementById('image-upload')?.click();
  };

  const handleGenerate = async () => {
    if (!selectedImage || !isMounted) return;

    // Check if user is authenticated
    if (!currentUser) {
      // Set pending generation flag and show login dialog
      pendingGeneration.current = true;
      setShowLoginDialog(true);
      return;
    }

    // User is authenticated, proceed with generation
    await performGeneration();
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
    <section id="hero" className="overflow-hidden py-12 bg-[#F5F5F5]">
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
                        'rounded-lg p-4 flex flex-col items-center justify-center gap-2 border',
                        'hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-48 bg-[#f5f5f5]',
                        fileError
                          ? 'border-red-300 bg-red-50'
                          : isDragging
                            ? 'border-primary bg-primary/10 scale-[1.02]'
                            : 'border-border'
                      )}
                    >
                      {previewUrl ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-2">
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                            <OptimizedImage
                              src={previewUrl}
                              alt="Roboneo AI Sticker Preview - Upload your image"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                            {selectedImage?.name}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUploadedImage();
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                            aria-label="Remove uploaded image"
                          >
                            <Trash2Icon className="h-4 w-4" />
                            Remove
                          </Button>
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
                                'hover:bg-muted/50 hover:text-foreground',
                                'focus:bg-muted/50 focus:text-foreground',
                                'data-[highlighted]:bg-muted/50 data-[highlighted]:text-foreground'
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

                    {/* Enhanced Progress UI for KIE AI generation */}
                    {isGenerating && generationProgress > 0 && (
                      <div className="w-full space-y-4">
                        {/* Main Progress Bar */}
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

                        {/* Generation Status Message */}
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

                  {/* Test buttons removed after testing completion */}
                  {/*
                  {process.env.NODE_ENV === 'development' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          // Use a local test image to simulate generated result
                          setGeneratedImageUrl('/hero-1.webp');
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
                    <div className="relative w-full max-w-sm max-h-64 flex items-center justify-center">
                      <Image
                        src={generatedImageUrl}
                        alt="Generated sticker"
                        width={400}
                        height={400}
                        className="object-contain rounded-lg shadow-md max-w-full max-h-full w-auto h-auto"
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
                      style={{ height: 'auto' }}
                      className="object-contain max-h-full rounded-lg shadow-md"
                      priority={true}
                    />
                    <Image
                      src="/hero-2.webp"
                      alt="Decorative camera icon"
                      width={120}
                      height={120}
                      style={{ height: 'auto' }}
                      className="absolute top-[-1rem] right-[-3rem] transform -rotate-12"
                    />
                    <Image
                      src="/hero-3.webp"
                      alt="Decorative plant icon"
                      width={120}
                      height={120}
                      style={{ height: 'auto' }}
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

      {/* Insufficient Credits Dialog */}
      {creditsError && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          required={creditsError.required}
          current={creditsError.current}
        />
      )}

      {/* Login Dialog */}
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

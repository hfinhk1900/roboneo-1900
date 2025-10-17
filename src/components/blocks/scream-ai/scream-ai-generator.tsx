'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import {
  SCREAM_PRESETS,
  SCREAM_PRESET_MAP,
} from '@/features/scream-ai/constants';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { creditsCache } from '@/lib/credits-cache';
import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  DownloadIcon,
  Ghost,
  ImagePlusIcon,
  Loader2Icon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square 1:1' },
  { id: '3:4', label: 'Portrait 3:4' },
  { id: '4:3', label: 'Landscape 4:3' },
  { id: '9:16', label: 'Tall 9:16' },
  { id: '16:9', label: 'Widescreen 16:9' },
];

type GenerateResult = {
  asset_id: string;
  view_url: string;
  download_url: string;
  preset_id: string;
  preset_name: string;
  aspect_ratio: string;
  watermarked: boolean;
  remaining_credits?: number;
};

export default function ScreamAIGenerator() {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(
    SCREAM_PRESETS[0].id
  );
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedPreset = useMemo(
    () => SCREAM_PRESET_MAP.get(selectedPresetId) ?? SCREAM_PRESETS[0],
    [selectedPresetId]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const switchToRegister = () => {
      setAuthMode('register');
      setShowLoginDialog(true);
    };
    const switchToLogin = () => {
      setAuthMode('login');
      setShowLoginDialog(true);
    };
    window.addEventListener('auth:switch-to-register', switchToRegister);
    window.addEventListener('auth:switch-to-login', switchToLogin);
    return () => {
      window.removeEventListener('auth:switch-to-register', switchToRegister);
      window.removeEventListener('auth:switch-to-login', switchToLogin);
    };
  }, []);

  const requireAuth = useCallback(() => {
    if (!currentUser) {
      setAuthMode('login');
      setShowLoginDialog(true);
      toast({
        title: 'Sign in required',
        description: 'Please log in to use Scream AI.',
      });
      return false;
    }
    return true;
  }, [currentUser, toast]);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!requireAuth()) return false;

      setFileError(null);
      setResult(null);

      if (!file.type.startsWith('image/')) {
        setFileError('Please upload a PNG, JPG, or WebP image.');
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File too large. Please upload an image up to 10MB.');
        return false;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedBase64(reader.result?.toString() ?? null);
      };
      reader.onerror = () => {
        setFileError('Could not read the selected file. Try again.');
      };
      reader.readAsDataURL(file);

      return true;
    },
    [requireAuth]
  );

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const ok = handleFileSelect(files[0]);
        if (!ok && fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [handleFileSelect]
  );

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setUploadedBase64(null);
    setResult(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedBase64 || !selectedImage) {
      toast({
        title: 'No image',
        description: 'Please upload an image first.',
      });
      return;
    }

    if (!currentUser) {
      setAuthMode('login');
      setShowLoginDialog(true);
      return;
    }

    const currentCredits = creditsCache.get() || 0;
    if (currentCredits < CREDITS_PER_IMAGE) {
      toast({
        title: 'Insufficient credits',
        description: `You need ${CREDITS_PER_IMAGE} credits to generate. Current: ${currentCredits}`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      setGenerationProgress(10);

      const res = await fetch('/api/scream-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image_input: uploadedBase64,
          preset_id: selectedPresetId,
          aspect_ratio: aspectRatio,
        }),
      });

      setGenerationProgress(50);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const data: GenerateResult = await res.json();
      setGenerationProgress(100);

      creditsCache.set(data.remaining_credits ?? 0);
      setResult(data);

      toast({
        title: 'Success!',
        description: 'Your Scream AI scene has been generated.',
      });
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: 'Generation failed',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [
    uploadedBase64,
    selectedImage,
    currentUser,
    selectedPresetId,
    aspectRatio,
    toast,
  ]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.download_url;
    link.download = `scream-ai-${result.preset_id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  return (
    <>
      <section
        id="scream-ai-generator"
        ref={sectionRef}
        className="relative bg-[#08080c] px-4 py-12 text-white lg:py-16"
      >
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h1
              className="text-balance text-3xl font-sans font-extrabold text-white md:text-4xl xl:text-5xl"
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              }}
            >
              Scream AI Generator – Create Viral Horror Photos
            </h1>
            <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-gray-300">
              Upload a portrait, choose a cinematic horror preset, and let
              Scream AI transform it into a suspenseful thriller scene.
              Identity-safe, PG-13, and perfect for campaigns or storytelling.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Input area */}
            <Card className="relative overflow-hidden border shadow-md h-full min-h-[604px] flex flex-col rounded-2xl bg-white">
              <CardContent className="pt-1 px-6 pb-4 space-y-5 flex-grow flex flex-col">
                <div className="pb-1 pt-0">
                  <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                    <Ghost className="h-5 w-5 text-black" />
                    Scream AI Generator
                  </h3>
                  <p className="text-muted-foreground">
                    Upload your portrait and transform it into a horror scene.
                  </p>
                </div>

                <div className="space-y-5 flex-grow flex flex-col">
                  {/* Image upload area */}
                  <div className="space-y-3 flex-grow flex flex-col">
                    <Label className="text-sm font-medium">
                      Your Image (Required)
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
                        <>
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                            <Image
                              src={previewUrl}
                              alt="Upload preview"
                              fill
                              sizes="(max-width: 640px) 20vw, 16vw"
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                            {selectedImage?.name}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <XIcon className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="flex justify-center">
                            <ImagePlusIcon className="h-10 w-10 transition-colors text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm transition-colors text-muted-foreground text-center">
                              Click or drag & drop to upload
                            </p>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              (JPG, JPEG, PNG, WEBP, up to 10MB)
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

                  {/* Preset Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Horror Preset</Label>
                    <Select
                      value={selectedPresetId}
                      onValueChange={setSelectedPresetId}
                    >
                      <SelectTrigger
                        className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                        style={{ height: '50px', padding: '0px 12px' }}
                      >
                        <SelectValue placeholder="Choose a preset">
                          {selectedPreset && (
                            <div className="flex items-center gap-2">
                              <Image
                                src={selectedPreset.icon}
                                alt={selectedPreset.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                              <span>{selectedPreset.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SCREAM_PRESETS.map((preset) => (
                          <SelectItem
                            key={preset.id}
                            value={preset.id}
                            className="cursor-pointer py-3 px-3 hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <Image
                                src={preset.icon}
                                alt={preset.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                              <span>{preset.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Output Aspect Ratio
                    </Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="w-full h-[50px] px-3 rounded-2xl bg-white border border-input hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                        <SelectValue placeholder="Select aspect ratio">
                          {ASPECT_RATIOS.find((o) => o.id === aspectRatio)?.label ||
                            'Select aspect ratio'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-[9999] max-h-[300px] overflow-y-auto">
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem
                            key={ratio.id}
                            value={ratio.id}
                            className={cn(
                              'cursor-pointer py-3 px-3 transition-colors',
                              'hover:bg-muted/50 hover:text-foreground',
                              'focus:bg-muted/50 focus:text-foreground',
                              'data-[highlighted]:bg-muted/50 data-[highlighted]:text-foreground'
                            )}
                          >
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedImage || isGenerating}
                    className="w-full font-semibold h-auto min-h-[52px] rounded-2xl text-[14px] mt-auto whitespace-normal leading-tight text-center sm:text-left flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2Icon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1 animate-spin" />
                        Creating...
                      </>
                    ) : !isMounted ? (
                      <>
                        <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                        Generate Horror Scene ({CREDITS_PER_IMAGE} credits)
                      </>
                    ) : !currentUser ? (
                      <>
                        <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                        Log in to generate
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                        Generate Horror Scene ({CREDITS_PER_IMAGE} credits)
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
                    <div className="flex items-center justify-center p-8 relative w-full h-full">
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-purple-400/20 blur-3xl" />
                        <div className="relative flex items-center justify-center">
                          <div className="relative flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Processing"
                                className="object-contain rounded-lg shadow-lg max-w-md max-h-96 opacity-30 grayscale"
                              />
                            ) : (
                              <div className="w-96 h-72 bg-gray-200 rounded-lg shadow-lg opacity-30" />
                            )}
                            <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center space-y-4">
                              <div className="flex items-center space-x-2 text-white">
                                <Loader2Icon className="h-6 w-6 animate-spin" />
                                <span className="text-lg font-medium">
                                  Creating...
                                </span>
                              </div>
                              <div className="w-full max-w-[320px] bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-red-500 transition-all duration-300 ease-out"
                                  style={{ width: `${generationProgress}%` }}
                                />
                              </div>
                              <div className="text-white text-sm font-medium">
                                {Math.round(generationProgress)}%
                              </div>
                              <div className="text-white text-xs opacity-80 text-center">
                                Don't refresh the page until generation is
                                complete.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <div className="relative w-full max-w-sm aspect-square">
                          <Image
                            src={result.view_url}
                            alt={result.preset_name}
                            fill
                            sizes="(max-width: 768px) 80vw, 400px"
                            className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                          />
                        </div>
                      </div>
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
                          onClick={() => setResult(null)}
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
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Ghost className="h-16 w-16 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Your horror scene will appear here
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload an image and generate to see the result
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'login'
                ? 'Sign in to continue'
                : 'Create your account'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'login'
                ? 'Please sign in to generate Scream AI scenes.'
                : 'Sign up to unlock watermark-free horror scenes.'}
            </DialogDescription>
          </DialogHeader>
          {authMode === 'login' ? (
            <LoginForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
            />
          ) : (
            <RegisterForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

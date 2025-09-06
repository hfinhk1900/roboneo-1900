'use client';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LocaleLink } from '@/i18n/navigation';
import { creditsCache } from '@/lib/credits-cache';
import { IndexedDBManager } from '@/lib/image-library/indexeddb-manager';
import { validateImageFile } from '@/lib/image-validation';
import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  DownloadIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const styleOptions = [
  { value: 'ios', label: 'iOS Sticker Style', icon: '/ios-style.webp' },
  { value: 'pixel', label: 'Pixel Art Style', icon: '/pixel-style.webp' },
  { value: 'lego', label: 'LEGO Minifigure Style', icon: '/lego-style.webp' },
  { value: 'snoopy', label: 'Snoopy Style', icon: '/snoopy-style.webp' },
];

// Sticker history interface
interface StickerHistoryItem {
  id?: string;
  asset_id?: string;
  url: string;
  style: string;
  createdAt: number;
}

const HISTORY_KEY = 'sticker_history';

// 生成唯一ID用于本地库
function generateLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function StickerGenerator() {
  const currentUser = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState('ios');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 历史记录相关状态
  const [stickerHistory, setStickerHistory] = useState<StickerHistoryItem[]>(
    []
  );
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{
    idx: number;
    item: StickerHistoryItem;
  } | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pendingGeneration = useRef(false);

  // Get selected style option
  const selectedOption = styleOptions.find(
    (option) => option.value === selectedStyle
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Expose hooks for Gallery -> Hero interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const heroStyleSelect = (style: string) => {
      // only accept known styles
      const exists = styleOptions.some((o) => o.value === style);
      setSelectedStyle(exists ? style : 'ios');
    };
    const heroScrollToHero = () => {
      const el = sectionRef.current || document.getElementById('generator');
      if (el && 'scrollIntoView' in el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {
          // fallback
          el.scrollIntoView();
        }
      }
    };

    // attach to window for ShowcaseGallery to call
    (window as any).heroStyleSelect = heroStyleSelect;
    (window as any).heroScrollToHero = heroScrollToHero;

    return () => {
      // cleanup on unmount
      try {
        delete (window as any).heroStyleSelect;
        delete (window as any).heroScrollToHero;
      } catch {}
    };
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

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      if (!isMounted) return;

      try {
        if (currentUser) {
          // 已登录：从服务器加载，并刷新URLs
          const res = await fetch('/api/history/sticker?refresh_urls=true', {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            const processedItems = data.items.map((item: any) => ({
              ...item,
              createdAt:
                typeof item.createdAt === 'string'
                  ? new Date(item.createdAt).getTime()
                  : item.createdAt || Date.now(),
            }));
            // 确保按时间降序排列（最新的在前）
            const sortedItems = processedItems.sort(
              (a: StickerHistoryItem, b: StickerHistoryItem) =>
                (b.createdAt || 0) - (a.createdAt || 0)
            );
            setStickerHistory(sortedItems);
            return;
          }
        }

        // 未登录或加载失败：从本地存储加载
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StickerHistoryItem[];
          // 确保按时间降序排列（最新的在前）
          const sortedItems = parsed.sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
          setStickerHistory(sortedItems);
        }
      } catch (error) {
        console.error('Error loading sticker history:', error);
      }
    };

    loadHistory();
  }, [currentUser, isMounted]);

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

  // Generate sticker
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
      console.log('🚀 Starting sticker generation...');
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('style', selectedStyle);

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

      const response = await fetch('/api/sticker/generate', {
        method: 'POST',
        body: formData,
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

        // 保存到历史记录 - placeholder for now
        // await pushHistory(historyItem);

        // Update credits
        const currentCredits = creditsCache.get() || 0;
        creditsCache.set(currentCredits - CREDITS_PER_IMAGE);

        toast.success('Sticker generated successfully!');
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate sticker'
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
      a.download = `sticker-${selectedStyle}-${Date.now()}.png`;
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

  // 删除单个历史记录
  const deleteHistoryItem = useCallback(
    async (idx: number, item: StickerHistoryItem) => {
      // 已登录：从服务端删除
      if (currentUser && item.id) {
        try {
          await fetch(`/api/history/sticker/${item.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        } catch {}
      }

      // 更新本地状态和存储
      setStickerHistory((prev) => {
        const newHistory = prev.filter((_, i) => i !== idx);
        if (!currentUser) {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        }
        return newHistory;
      });
    },
    [currentUser]
  );

  // 清空所有历史记录
  const clearAllHistory = useCallback(async () => {
    // 已登录：从服务端批量删除
    if (currentUser) {
      try {
        await fetch('/api/history/sticker/batch-delete', {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch {}
    }

    // 更新本地状态和存储
    setStickerHistory([]);
    if (!currentUser) {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, [currentUser]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section ref={sectionRef} id="generator" className="py-24 bg-[#F5F5F5]">
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
            Turn Any Photo into a Sticker with RoboNeo AI
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Try our image-to-sticker demo, then explore text-to-image &
            image-to-image for limitless creativity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Input area */}
          <Card className="relative overflow-hidden border shadow-md h-full min-h-[604px] flex flex-col rounded-2xl bg-white">
            <CardContent className="pt-1 px-6 pb-4 space-y-5 flex-grow flex flex-col">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sticker-icon lucide-sticker h-5 w-5 text-black"
                  >
                    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                    <path d="M14 3v4a2 2 0 0 0 2 2h4" />
                    <path d="M8 13h0" />
                    <path d="M16 13h0" />
                    <path d="M10 16s.8 1 2 1c1.3 0 2-1 2-1" />
                  </svg>
                  Sticker Maker
                </h3>
                <p className="text-muted-foreground">
                  Upload your image and transform it into a fun sticker.
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
                            (JPG, JPEG, PNG, WEBP)
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
                  <Label className="text-sm font-medium">Sticker Style</Label>
                  <Select
                    value={selectedStyle}
                    onValueChange={setSelectedStyle}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a style">
                        {selectedOption && (
                          <div className="flex items-center gap-2">
                            <Image
                              src={selectedOption.icon}
                              alt={selectedOption.label}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span>{selectedOption.label}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={option.icon}
                              alt={option.label}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
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
                  ) : !isMounted ? (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate Sticker ({CREDITS_PER_IMAGE} credits)
                    </>
                  ) : !currentUser ? (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Log in to generate
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate Sticker ({CREDITS_PER_IMAGE} credits)
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
                  <div className="flex items-center justify-center p-8 relative w-full h-full">
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* Demo image with gray overlay */}
                        <div className="relative flex items-center justify-center">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Processing upload"
                              className="object-contain rounded-lg shadow-lg max-w-md max-h-96 opacity-30 grayscale"
                            />
                          ) : (
                            <div className="w-96 h-72 bg-gray-200 rounded-lg shadow-lg opacity-30" />
                          )}
                          {/* Progress overlay */}
                          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center space-y-4">
                            {/* Processing icon */}
                            <div className="flex items-center space-x-2 text-white">
                              <LoaderIcon className="h-6 w-6 animate-spin" />
                              <span className="text-lg font-medium">
                                Creating Amazing Sticker...
                              </span>
                            </div>

                            {/* Progress bar */}
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
                              Don't refresh the page until the sticker is
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
                    <div className="flex items-center justify-center w-full">
                      <div className="relative w-full max-w-sm aspect-square">
                        <Image
                          src={generatedImageUrl}
                          alt="Generated sticker"
                          fill
                          sizes="(max-width: 768px) 80vw, 400px"
                          className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                        />
                      </div>
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
                  /* Default state - show hero image with gif animation */
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="relative">
                      <Image
                        src="/hero-1.webp"
                        alt="Example transformation - Photo to sticker"
                        width={400}
                        height={400}
                        style={{ height: 'auto' }}
                        className="object-contain rounded-lg shadow-md"
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
                        className="absolute bottom-0 right-0 w-48 h-auto rounded-lg object-contain bg-transparent opacity-85"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticker History Section - 只在有历史记录时显示 */}
        {stickerHistory.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Your Sticker History</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="cursor-pointer flex-shrink-0"
                  type="button"
                >
                  <LocaleLink
                    href="/my-library"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ImageIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">View All Images</span>
                    <span className="sm:hidden">View All</span>
                  </LocaleLink>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer flex-shrink-0"
                  onClick={clearAllHistory}
                  type="button"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stickerHistory.map((item, idx) => (
                <div
                  key={`${item.createdAt}-${idx}`}
                  className="group relative"
                >
                  <div className="relative w-full aspect-square bg-white border rounded-lg overflow-hidden">
                    <img
                      src={item.url}
                      alt={`Sticker ${idx + 1}`}
                      className="w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      onClick={() => {
                        setPreviewImageUrl(item.url);
                        setShowImagePreview(true);
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[60%]">{item.style}</span>
                    <span>{new Date(item.createdAt).toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                      title="Download sticker"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.url;
                        link.download = `sticker-${item.style}-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <DownloadIcon className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                      title="Remove sticker"
                      onClick={() => {
                        setPendingDeleteItem({ idx, item });
                        setShowDeleteConfirmDialog(true);
                      }}
                    >
                      <Trash2Icon className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'login'
                ? 'Sign in Required'
                : 'Create Your Account'}
            </DialogTitle>
            <DialogDescription>
              {authMode === 'login'
                ? 'Please sign in to generate stickers.'
                : 'Sign up to start generating stickers.'}
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

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        required={creditsError?.required || CREDITS_PER_IMAGE}
        current={creditsError?.current || 0}
      />

      {/* Delete history item confirmation dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Sticker?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sticker from your history?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmDialog(false);
                setPendingDeleteItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pendingDeleteItem) {
                  await deleteHistoryItem(
                    pendingDeleteItem.idx,
                    pendingDeleteItem.item
                  );
                  setShowDeleteConfirmDialog(false);
                  setPendingDeleteItem(null);
                  toast.success('Sticker deleted');
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Image Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-7xl w-[95vw] h-[85vh] p-0 bg-gradient-to-br from-black/90 to-black/95 border-none backdrop-blur-md overflow-hidden">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-yellow-400" />
                  Sticker Preview
                </DialogTitle>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowImagePreview(false)}
                className="text-white/80 hover:text-white transition-all duration-200 bg-white/10 hover:bg-white/20 rounded-lg p-2 backdrop-blur-sm border border-white/10"
                title="Close preview (ESC)"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>

          {/* Main image area */}
          <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
            onClick={() => setShowImagePreview(false)}
          >
            {previewImageUrl && (
              <div className="relative max-w-[95%] max-h-[90%] transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={previewImageUrl}
                  alt="Sticker preview"
                  width={1200}
                  height={1200}
                  className="object-contain w-full h-full rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                  quality={100}
                  priority
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent px-6 py-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!previewImageUrl) return;

                  try {
                    const response = await fetch(previewImageUrl);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `sticker-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    toast.success('Image downloaded successfully!');
                  } catch (error) {
                    console.error('Download error:', error);
                    toast.error('Failed to download image');
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black border-none shadow-lg transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <DownloadIcon className="h-5 w-5 mr-2" />
                Download Full Size
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImagePreview(false);
                }}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all duration-200"
                size="lg"
              >
                Close Preview
              </Button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="text-center mt-3 text-gray-400 text-xs">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono">
                ESC
              </kbd>{' '}
              to close
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

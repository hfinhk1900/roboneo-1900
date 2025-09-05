'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { useCurrentUser } from '@/hooks/use-current-user';
import { creditsCache } from '@/lib/credits-cache';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DownloadIcon,
  EraserIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { LocaleLink } from '@/i18n/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { IndexedDBManager } from '@/lib/image-library/indexeddb-manager';

// Watermark removal method configuration
const REMOVAL_METHODS = [
  {
    id: 'auto',
    name: 'Auto Detection',
    description: 'Automatically detect and remove watermarks',
    icon: '🤖',
  },
  {
    id: 'inpainting',
    name: 'AI Inpainting',
    description: 'Advanced AI-powered content restoration',
    icon: '🎨',
  },
  {
    id: 'clone',
    name: 'Content Clone',
    description: 'Clone surrounding content to fill watermark area',
    icon: '📋',
  },
  {
    id: 'blur',
    name: 'Smart Blur',
    description: 'Intelligently blur and blend watermark areas',
    icon: '🌫️',
  },
  {
    id: 'demo',
    name: 'Demo',
    description: 'Demo example removal',
    icon: '🎭',
  },
] as const;

// Watermark types for better processing
const WATERMARK_TYPES = [
  {
    value: 'text',
    label: 'Text Watermark',
    description: 'Letters, words, or numbers',
  },
  {
    value: 'logo',
    label: 'Logo/Brand',
    description: 'Company logos or brand marks',
  },
  {
    value: 'signature',
    label: 'Signature',
    description: 'Handwritten signatures',
  },
  {
    value: 'timestamp',
    label: 'Timestamp',
    description: 'Date and time stamps',
  },
  {
    value: 'pattern',
    label: 'Pattern',
    description: 'Repeated patterns or textures',
  },
  {
    value: 'unknown',
    label: 'Unknown/Mixed',
    description: 'Let AI decide the best approach',
  },
] as const;

// Processing quality options
const QUALITY_OPTIONS = [
  {
    value: 'fast',
    label: 'Fast',
    description: 'Quick processing, good for simple watermarks',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Balance between speed and quality',
  },
  {
    value: 'high',
    label: 'High Quality',
    description: 'Best quality, takes more time',
  },
] as const;

// Demo images configuration with before/after states
const DEMO_IMAGES = [
  {
    id: 1,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark01.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark-remove01.png',
    alt: 'Watermark Remove Demo - Sample 1',
    type: 'sample1',
  },
  {
    id: 2,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark02.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark-remove02.png',
    alt: 'Watermark Remove Demo - Sample 2',
    type: 'sample2',
  },
  {
    id: 3,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark03.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-watermark/watermark-remove03.png',
    alt: 'Watermark Remove Demo - Sample 3',
    type: 'sample3',
  },
];

type RemovalMethod = (typeof REMOVAL_METHODS)[number]['id'];
type WatermarkType = (typeof WATERMARK_TYPES)[number]['value'];
type QualityLevel = (typeof QUALITY_OPTIONS)[number]['value'];

interface RemovalHistoryItem {
  id: string;
  originalImage: string;
  processedImage: string;
  method: RemovalMethod;
  watermarkType: WatermarkType;
  quality: QualityLevel;
  createdAt: number;
}

export function RemoveWatermarkGeneratorSection() {
  // Get current user
  const currentUser = useCurrentUser();

  // History related states
  const [removalHistory, setRemovalHistory] = useState<RemovalHistoryItem[]>(
    []
  );
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showClearAllConfirmDialog, setShowClearAllConfirmDialog] =
    useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{
    idx: number;
    item: RemovalHistoryItem;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Image preview related states
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Processing states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Demo image states
  const [selectedDemoImage, setSelectedDemoImage] = useState<string>('');
  const [selectedDemoImageData, setSelectedDemoImageData] = useState<
    (typeof DEMO_IMAGES)[0] | null
  >(null);

  // Processing configuration states
  const [selectedMethod, setSelectedMethod] = useState<RemovalMethod>('auto');
  const [selectedWatermarkType, setSelectedWatermarkType] =
    useState<WatermarkType>('unknown');
  const [selectedQuality, setSelectedQuality] =
    useState<QualityLevel>('balanced');

  // Dialog states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] =
    useState(false);

  // History storage key
  const HISTORY_KEY = 'roboneo_watermark_removal_history_v1';

  // Add custom CSS for shimmer animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translateX(200%); opacity: 0; }
      }
      .shimmer-animation {
        animation: shimmer 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Component mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load history: logged-in → server (with refresh), otherwise local fallback
  useEffect(() => {
    if (!isMounted) return;

    const loadHistory = async () => {
      if (currentUser) {
        try {
          const res = await fetch('/api/history/watermark?refresh_urls=true', {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data.items) ? data.items : [];
            const mapped = items
              .map((it: any) => ({
                id: it.id,
                originalImage: it.originalImageUrl || it.originalImage,
                processedImage: it.processedImageUrl || it.processedImage,
                method: it.method || 'auto',
                watermarkType: it.watermarkType || 'unknown',
                quality: it.quality || 'balanced',
                createdAt: it.createdAt
                  ? typeof it.createdAt === 'string'
                    ? new Date(it.createdAt).getTime()
                    : it.createdAt
                  : Date.now(),
              }))
              .sort(
                (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)
              );
            setRemovalHistory(mapped);
            return;
          }
        } catch (e) {
          console.warn('Failed to load server watermark history:', e);
        }
      }

      // Local fallback
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const sorted = parsed.sort(
              (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)
            );
            setRemovalHistory(sorted);
            console.log(
              '📱 Local removal history loaded:',
              sorted.length,
              'items'
            );
          }
        }
      } catch (error) {
        console.warn('Error loading removal history:', error);
      }
    };

    loadHistory();
  }, [isMounted, currentUser]);

  // Save history
  const saveHistory = useCallback(
    (newHistory: RemovalHistoryItem[]) => {
      if (!isMounted) return;

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        console.log('💾 Removal history saved:', newHistory.length, 'items');
      } catch (error) {
        console.warn('Error saving removal history:', error);
      }
    },
    [isMounted]
  );

  // File upload handlers
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        const validTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        if (!validTypes.includes(file.type)) {
          toast.error('Please upload a valid image file (JPEG, PNG, WebP)');
          return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast.error('Image file size must be less than 10MB');
          return;
        }

        setUploadedImage(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreview(result);
        };
        reader.readAsDataURL(file);

        // Reset processed image
        setProcessedImage(null);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith('image/'));

      if (imageFile) {
        const event = { target: { files: [imageFile] } } as any;
        handleFileSelect(event);
      } else {
        toast.error('Please drop an image file');
      }
    },
    [handleFileSelect]
  );

  // Demo image click handling
  const handleDemoImageClick = async (demoImage: (typeof DEMO_IMAGES)[0]) => {
    // Prevent multiple simultaneous processing
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setSelectedDemoImage(demoImage.afterSrc);
    setSelectedDemoImageData(demoImage);

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Set the processed result
      setProcessedImage(demoImage.afterSrc);

      // Demo result should NOT be saved to My Library/history

      toast.success('Watermark removed successfully! ✨');
    } catch (error) {
      console.warn('Demo watermark removal error:', error);
      toast.error('Failed to process demo image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setProcessedImage(null);

    // Reset file input
    const fileInput = document.getElementById(
      'watermark-image-upload'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  // Processing handler - Real API call
  const handleRemoveWatermark = useCallback(async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    console.log(
      '👤 Current user:',
      currentUser?.id ? 'Logged in' : 'Not logged in'
    );

    // Check credits
    const currentCredits = creditsCache.get() || 0;
    if (currentCredits < CREDITS_PER_IMAGE) {
      setShowInsufficientCreditsDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadedImage);
      });

      console.log('🚀 Calling watermark removal API...');

      const requestBody = {
        image_input: imageBase64,
        quality: selectedQuality === 'high' ? 'hd' : 'standard',
        steps:
          selectedQuality === 'high'
            ? 50
            : selectedQuality === 'fast'
              ? 20
              : 30,
        size: '1024x1024',
        output_format: 'png',
      };

      console.log('📤 Request payload:', {
        ...requestBody,
        image_input: `${imageBase64.substring(0, 50)}... (${imageBase64.length} chars)`,
      });

      // Call the watermark removal API
      const response = await fetch('/api/watermark/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      let result: any;
      try {
        result = await response.json();
        console.log('📥 Response data:', result);
      } catch (jsonError) {
        console.warn('❌ Failed to parse JSON response:', jsonError);
        const responseText = await response.text();
        console.warn('📄 Raw response:', responseText);
        throw new Error(
          `Server response is not valid JSON. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        // 安全地处理可能为空的 result 对象
        const safeResult = result || {};
        const errorInfo = {
          status: response.status,
          statusText: response.statusText,
          error: safeResult.error || 'No error message',
          details: safeResult.details || 'No details provided',
        };

        // 使用 console.warn 避免 Next.js 将错误抛出
        console.warn('❌ API request failed:', errorInfo);

        if (response.status === 401) {
          console.warn('🔐 User not authenticated, showing login dialog');
          setShowLoginDialog(true);
          toast.error('Please log in to use watermark removal');
          return;
        }

        if (response.status === 402) {
          setShowInsufficientCreditsDialog(true);
          return;
        }

        const errorMessage =
          safeResult.error ||
          safeResult.details ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (result.success && result.public_url) {
        console.log('✅ Watermark removal successful:', result);

        setProcessedImage(result.public_url);

        // Update credits cache
        if (result.remaining_credits !== undefined) {
          creditsCache.set(result.remaining_credits);
        }

        // Save to server history
        try {
          const historyResponse = await fetch('/api/history/watermark', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalImageUrl: imagePreview,
              processedImageUrl: result.public_url,
              method: selectedMethod,
              watermarkType: selectedWatermarkType,
              quality: selectedQuality,
              assetId: result.asset_id,
            }),
          });

          if (historyResponse.ok) {
            console.log('✅ History saved to server');
          } else {
            console.warn('⚠️ Failed to save history to server');
          }
        } catch (historyError) {
          console.warn('⚠️ Failed to save history:', historyError);
        }

        // Add to local history for immediate display
        const newHistoryItem: RemovalHistoryItem = {
          id: result.asset_id || Date.now().toString(),
          originalImage: imagePreview || '',
          processedImage: result.public_url,
          method: selectedMethod,
          watermarkType: selectedWatermarkType,
          quality: selectedQuality,
          createdAt: Date.now(),
        };

        const newHistory = [newHistoryItem, ...removalHistory.slice(0, 19)];
        setRemovalHistory(newHistory);
        saveHistory(newHistory);
        // 保存到本地图片库（IndexedDB）
        try {
          const db = IndexedDBManager.getInstance();
          let blob: Blob | undefined;
          try {
            const resp = await fetch(newHistoryItem.processedImage);
            if (resp.ok) blob = await resp.blob();
          } catch {}
          const thumbnail = blob ? await db.generateThumbnail(blob) : undefined;
          await db.saveImage({
            id: newHistoryItem.id || `watermark-removal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            url: newHistoryItem.processedImage,
            blob,
            thumbnail,
            toolType: 'watermark-removal',
            toolParams: { method: newHistoryItem.method },
            createdAt: newHistoryItem.createdAt,
            lastAccessedAt: Date.now(),
            fileSize: blob?.size,
            syncStatus: newHistoryItem.id ? 'synced' : 'local',
            serverId: newHistoryItem.id,
          } as any);
        } catch {}

        toast.success(
          `Watermark removed successfully! ${result.credits_used} credits used. ${result.remaining_credits} credits remaining.`
        );
      } else {
        throw new Error('Invalid response from watermark removal service');
      }
    } catch (error) {
      // 使用 console.warn 避免 Next.js 错误拦截
      console.warn('Watermark removal error:', error);

      let errorMessage = 'Unknown error occurred';
      let userMessage = 'Failed to remove watermark. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;

        // 根据错误类型提供更具体的用户反馈
        if (errorMessage.includes('Insufficient credits')) {
          setShowInsufficientCreditsDialog(true);
          return; // 不显示 toast，由对话框处理
        }

        if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('AbortError')
        ) {
          userMessage = 'Request timed out. Please try again.';
        } else if (
          errorMessage.includes('AI服务暂时不可用') ||
          errorMessage.includes('service temporarily unavailable')
        ) {
          userMessage =
            'AI service temporarily unavailable. Please try again later.';
        } else if (
          errorMessage.includes('Network error') ||
          errorMessage.includes('fetch')
        ) {
          userMessage =
            'Network error. Please check your connection and try again.';
        } else if (
          errorMessage.includes('Not authenticated') ||
          errorMessage.includes('Unauthorized')
        ) {
          setShowLoginDialog(true);
          userMessage = 'Please log in to use watermark removal.';
        } else if (
          errorMessage.includes('Invalid response') ||
          errorMessage.includes('not valid JSON')
        ) {
          userMessage = 'Server error. Please try again later.';
        } else if (errorMessage.includes('HTTP')) {
          userMessage = `Server error: ${errorMessage}`;
        }
      }

      // 显示用户友好的错误消息
      toast.error(userMessage);

      // 记录详细错误信息用于调试（使用 console.warn 避免错误拦截）
      console.warn('详细错误信息:', {
        originalError: error,
        errorMessage,
        userMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    uploadedImage,
    currentUser,
    imagePreview,
    removalHistory,
    saveHistory,
    selectedMethod,
    selectedWatermarkType,
    selectedQuality,
  ]);

  // Download handler
  const handleDownload = useCallback(
    async (imageUrl: string, filename = 'watermark-removed.png') => {
      try {
        let finalUrl = imageUrl;
        if (finalUrl.startsWith('/api/assets/')) {
          try {
            const urlObj = new URL(finalUrl, window.location.origin);
            const exp = urlObj.searchParams.get('exp');
            const assetId = urlObj.searchParams.get('asset_id');
            if (exp && assetId) {
              const expiryTime = Number.parseInt(exp) * 1000;
              const currentTime = Date.now();
              if (expiryTime - currentTime <= 5 * 60 * 1000) {
                const refreshRes = await fetch('/api/storage/sign-download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    asset_id: assetId,
                    display_mode: 'inline',
                    expires_in: 3600,
                  }),
                });
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  finalUrl = refreshData.url;
                }
              }
            }
          } catch {}
        }

        const response = await fetch(finalUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
        toast.success('Image downloaded successfully!');
      } catch (error) {
        console.warn('Download error:', error);
        toast.error('Failed to download image');
      }
    },
    []
  );

  // History management
  const deleteHistoryItem = useCallback(
    (index: number) => {
      const newHistory = removalHistory.filter((_, i) => i !== index);
      setRemovalHistory(newHistory);
      saveHistory(newHistory);
      toast.success('History item deleted');
    },
    [removalHistory, saveHistory]
  );

  const clearAllHistory = useCallback(() => {
    setRemovalHistory([]);
    saveHistory([]);
    toast.success('All history cleared');
  }, [saveHistory]);

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
            Remove Image Watermark
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Upload your image and remove watermarks instantly with AI. Simple,
            fast, and effective.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Input area */}
          <Card className="relative overflow-hidden border shadow-md h-full min-h-[604px] flex flex-col rounded-2xl bg-white">
            <CardContent className="pt-1 px-6 pb-4 space-y-5 flex-grow flex flex-col">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <EraserIcon className="h-5 w-5 text-black" />
                  Watermark Removal
                </h3>
                <p className="text-muted-foreground">
                  Upload your image and remove watermarks with one click.
                </p>
              </div>

              <div className="space-y-5 flex-grow flex flex-col">
                {/* Image upload area */}
                <div className="space-y-3 flex-grow flex flex-col">
                  <Label className="text-sm font-medium">
                    Image with Watermark (Required)
                  </Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex-grow bg-[#f5f5f5] border border-border',
                      isDragOver && 'bg-muted/50 border-primary'
                    )}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="watermark-image-upload"
                    />

                    {imagePreview ? (
                      <>
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                          <Image
                            src={imagePreview}
                            alt="Image preview"
                            fill
                            sizes="(max-width: 640px) 20vw, 16vw"
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                          {uploadedImage?.name}
                        </p>
                        <Button
                          onClick={removeImage}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <XIcon className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </>
                    ) : (
                      <label
                        htmlFor="watermark-image-upload"
                        className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                      >
                        <ImagePlusIcon className="h-10 w-10 transition-colors text-muted-foreground" />
                        <p className="text-sm transition-colors text-muted-foreground text-center">
                          Click or drag & drop to upload
                        </p>
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          (JPG, JPEG, PNG, WEBP)
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                {/* Process Button */}
                <Button
                  onClick={handleRemoveWatermark}
                  disabled={!uploadedImage || isProcessing}
                  className="w-full font-semibold h-[50px] rounded-2xl text-base mt-auto"
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                      Removing Watermark...
                    </>
                  ) : !currentUser ? (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Log in to generate
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Remove Watermark ({CREDITS_PER_IMAGE} credits)
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
                {isProcessing ? (
                  /* Loading state - show progress bar and loading animation */
                  <div className="flex items-center justify-center p-8 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* Demo image with gray overlay */}
                        <div className="relative">
                          {selectedDemoImageData ? (
                            <img
                              src={selectedDemoImageData.beforeSrc}
                              alt="Processing your selected demo"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          ) : imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Processing your upload"
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
                                Removing Watermark...
                              </span>
                            </div>

                            {/* Progress bar - consistent with AI Background */}
                            <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: '100%' }}
                              />
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
                ) : processedImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    {/* Main image display */}
                    <div className="relative w-full max-w-sm aspect-square">
                      <Image
                        src={processedImage}
                        alt="Watermark removed"
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                      />
                    </div>

                    {/* Download and Delete buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleDownload(processedImage)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Download image"
                      >
                        <DownloadIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        onClick={() => {
                          setProcessedImage(null);
                          setSelectedDemoImage('');
                          setSelectedDemoImageData(null);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Remove image"
                      >
                        <Trash2Icon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    {/* Preview before processing */}
                    <div className="relative w-full max-w-sm aspect-square">
                      <Image
                        src={imagePreview}
                        alt="Preview before removal"
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Image ready. Click "Remove Watermark" to process.
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
                        {DEMO_IMAGES.map((demoImage, index) => (
                          <button
                            type="button"
                            key={demoImage.id}
                            onClick={() => handleDemoImageClick(demoImage)}
                            className="bg-[#bcb3b3] overflow-hidden relative rounded-2xl shrink-0 size-[82px] hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Image
                              src={demoImage.beforeSrc}
                              alt={demoImage.alt}
                              fill
                              sizes="82px"
                              className="object-cover"
                            />
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

        {/* Watermark Removal History Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Watermark Removal History</h3>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="cursor-pointer" type="button">
                <LocaleLink href="/my-library" target="_blank" rel="noopener noreferrer">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  View All Images
                </LocaleLink>
              </Button>
              {removalHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setShowClearAllConfirmDialog(true)}
                  type="button"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          {removalHistory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {removalHistory.slice(0, 12).map((item, idx) => (
                <div
                  key={`${item.createdAt}-${idx}`}
                  className="group relative"
                >
                  <div className="relative w-full aspect-square bg-white border rounded-lg overflow-hidden">
                    <img
                      src={item.processedImage}
                      alt={`Watermark Removal ${idx + 1}`}
                      className="w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      onClick={() => {
                        setPreviewImageUrl(item.processedImage);
                        setShowPreviewDialog(true);
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[60%]">watermark</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                      title="Download removed image"
                      onClick={() =>
                        handleDownload(
                          item.processedImage,
                          `watermark-removed-${item.id}.png`
                        )
                      }
                    >
                      <DownloadIcon className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                      title="Remove from history"
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
          ) : (
            <div className="text-sm text-gray-500">No history yet.</div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Sign in Required' : 'Create Your Account'}</DialogTitle>
            <DialogDescription>
              {authMode === 'login'
                ? 'Please sign in to use the watermark removal feature.'
                : 'Sign up to start using the watermark removal feature.'}
            </DialogDescription>
          </DialogHeader>
          {authMode === 'login' ? (
            <LoginForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
              className="border-none"
            />
          ) : (
            <RegisterForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
              className="border-none"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-7xl w-[95vw] h-[85vh] p-0 bg-gradient-to-br from-black/90 to-black/95 border-none backdrop-blur-md overflow-hidden">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-yellow-400" />
                  Watermark Removal Result
                </DialogTitle>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowPreviewDialog(false)}
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
            onClick={() => setShowPreviewDialog(false)}
          >
            {previewImageUrl && (
              <div className="relative max-w-[95%] max-h-[90%] transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={previewImageUrl}
                  alt="Watermark removal result"
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (previewImageUrl) {
                    handleDownload(previewImageUrl, 'watermark-removed.png');
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
                  setShowPreviewDialog(false);
                }}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all duration-200"
                size="lg"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete History Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this removal from your history?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
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
              onClick={() => {
                if (pendingDeleteItem) {
                  deleteHistoryItem(pendingDeleteItem.idx);
                }
                setShowDeleteConfirmDialog(false);
                setPendingDeleteItem(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={showClearAllConfirmDialog}
        onOpenChange={setShowClearAllConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all removal history? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowClearAllConfirmDialog(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAllHistory();
                setShowClearAllConfirmDialog(false);
              }}
              type="button"
            >
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showInsufficientCreditsDialog}
        required={CREDITS_PER_IMAGE}
        current={creditsCache.get() || 0}
      />
    </section>
  );
}

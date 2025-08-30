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
  CpuIcon,
  DownloadIcon,
  EraserIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

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
] as const;

// Watermark types for better processing
const WATERMARK_TYPES = [
  { value: 'text', label: 'Text Watermark', description: 'Letters, words, or numbers' },
  { value: 'logo', label: 'Logo/Brand', description: 'Company logos or brand marks' },
  { value: 'signature', label: 'Signature', description: 'Handwritten signatures' },
  { value: 'timestamp', label: 'Timestamp', description: 'Date and time stamps' },
  { value: 'pattern', label: 'Pattern', description: 'Repeated patterns or textures' },
  { value: 'unknown', label: 'Unknown/Mixed', description: 'Let AI decide the best approach' },
] as const;

// Processing quality options
const QUALITY_OPTIONS = [
  { value: 'fast', label: 'Fast', description: 'Quick processing, good for simple watermarks' },
  { value: 'balanced', label: 'Balanced', description: 'Balance between speed and quality' },
  { value: 'high', label: 'High Quality', description: 'Best quality, takes more time' },
] as const;

type RemovalMethod = typeof REMOVAL_METHODS[number]['id'];
type WatermarkType = typeof WATERMARK_TYPES[number]['value'];
type QualityLevel = typeof QUALITY_OPTIONS[number]['value'];

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
  const [removalHistory, setRemovalHistory] = useState<RemovalHistoryItem[]>([]);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showClearAllConfirmDialog, setShowClearAllConfirmDialog] = useState(false);
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



  // Dialog states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false);

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

  // Load history
  useEffect(() => {
    if (!isMounted) return;

    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRemovalHistory(parsed);
          console.log('📱 Local removal history loaded:', parsed.length, 'items');
        }
      }
    } catch (error) {
      console.error('Error loading removal history:', error);
    }
  }, [isMounted]);

  // Save history
  const saveHistory = useCallback((newHistory: RemovalHistoryItem[]) => {
    if (!isMounted) return;

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      console.log('💾 Removal history saved:', newHistory.length, 'items');
    } catch (error) {
      console.error('Error saving removal history:', error);
    }
  }, [isMounted]);

  // File upload handlers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      const event = { target: { files: [imageFile] } } as any;
      handleFileSelect(event);
    } else {
      toast.error('Please drop an image file');
    }
  }, [handleFileSelect]);

  const removeImage = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setProcessedImage(null);

    // Reset file input
    const fileInput = document.getElementById('watermark-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  // Processing handler (placeholder)
  const handleRemoveWatermark = useCallback(async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    // Check credits
    const currentCredits = creditsCache.credits;
    if (currentCredits < CREDITS_PER_IMAGE) {
      setShowInsufficientCreditsDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual watermark removal API call
      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate processed result (using original image for demo)
      if (imagePreview) {
        setProcessedImage(imagePreview);

        // Add to history
        const newHistoryItem: RemovalHistoryItem = {
          id: Date.now().toString(),
          originalImage: imagePreview,
          processedImage: imagePreview,
          method: 'auto',
          watermarkType: 'unknown',
          quality: 'balanced',
          createdAt: Date.now(),
        };

        const newHistory = [newHistoryItem, ...removalHistory.slice(0, 19)]; // Keep last 20
        setRemovalHistory(newHistory);
        saveHistory(newHistory);

        toast.success('Watermark removed successfully! ✨');
      }
    } catch (error) {
      console.error('Watermark removal error:', error);
      toast.error('Failed to remove watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, currentUser, imagePreview, removalHistory, saveHistory]);

  // Download handler
  const handleDownload = useCallback(async (imageUrl: string, filename: string = 'watermark-removed.png') => {
    try {
      const response = await fetch(imageUrl);
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
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  }, []);

  // History management
  const deleteHistoryItem = useCallback((index: number) => {
    const newHistory = removalHistory.filter((_, i) => i !== index);
    setRemovalHistory(newHistory);
    saveHistory(newHistory);
    toast.success('History item deleted');
  }, [removalHistory, saveHistory]);

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
            Upload your image and remove watermarks instantly with AI. Simple, fast, and effective.
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
            <CardContent className="pt-1 px-6 pb-4 space-y-4 flex-grow flex flex-col">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-green-600" />
                  Clean Result
                </h3>
                <p className="text-muted-foreground">
                  Your watermark-free image will appear here.
                </p>
              </div>

              <div className="flex-grow flex flex-col">
                {isProcessing ? (
                  <div className="flex-grow flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200">
                    <div className="relative">
                      <LoaderIcon className="h-12 w-12 text-purple-600 animate-spin" />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-medium text-purple-800">Removing watermark...</p>
                      <p className="text-sm text-purple-600">AI is analyzing and cleaning your image</p>
                    </div>
                  </div>
                ) : processedImage ? (
                  <div className="flex-grow flex flex-col space-y-4">
                    <div className="relative flex-grow bg-white rounded-lg border overflow-hidden">
                      <Image
                        src={processedImage}
                        alt="Watermark removed"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(processedImage)}
                        className="flex-1"
                        variant="default"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => {
                          setPreviewImageUrl(processedImage);
                          setShowPreviewDialog(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <ZapIcon className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-center space-y-3">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-gray-400 mx-auto"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M2 11H3V6C3 4.34314 4.34326 3 6 3H18C19.6567 3 21 4.34314 21 6V11H22C22.5522 11 23 11.4477 23 12C23 12.5523 22.5522 13 22 13H21V18C21 19.6569 19.6567 21 18 21H6C4.34326 21 3 19.6569 3 18V13H2C1.44775 13 1 12.5523 1 12C1 11.4477 1.44775 11 2 11ZM18 5H6C5.44775 5 5 5.44769 5 6V11H19V6C19 5.44769 18.5522 5 18 5ZM16.2929 13H13.7071L7.70711 19H10.2929L16.2929 13ZM11.7071 19L17.7071 13H19V14.2929L14.2929 19H11.7071ZM15.7071 19H18C18.5522 19 19 18.5523 19 18V15.7071L15.7071 19ZM6.29289 19L12.2929 13H9.70711L5 17.7071V18C5 18.5523 5.44775 19 6 19H6.29289ZM5 16.2929L8.29289 13H5V16.2929Z"
                          fill="currentColor"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-700">Ready to remove watermarks</p>
                        <p className="text-sm text-gray-500">Upload an image to get started</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Section */}
        {removalHistory.length > 0 && (
          <Card className="border shadow-md rounded-2xl bg-white">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CpuIcon className="h-5 w-5" />
                  Recent Removals
                </h3>
                <Button
                  onClick={() => setShowClearAllConfirmDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {removalHistory.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative bg-gray-50 rounded-lg overflow-hidden border hover:shadow-md transition-all duration-200"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={item.processedImage}
                        alt={`Removed watermark ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownload(item.processedImage, `watermark-removed-${item.id}.png`)}
                            size="sm"
                            variant="secondary"
                            className="bg-white/90 hover:bg-white"
                          >
                            <DownloadIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => {
                              setPendingDeleteItem({ idx: index, item });
                              setShowDeleteConfirmDialog(true);
                            }}
                            size="sm"
                            variant="secondary"
                            className="bg-white/90 hover:bg-white text-red-600"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 text-xs text-muted-foreground">
                      <p className="font-medium">{REMOVAL_METHODS.find(m => m.id === item.method)?.name}</p>
                      <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to use the watermark removal feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Watermark Removal Result</DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <div className="relative w-full h-96">
              <Image
                src={previewImageUrl}
                alt="Preview"
                fill
                sizes="100vw"
                className="object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete History Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this removal from your history? This action cannot be undone.
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
      <Dialog open={showClearAllConfirmDialog} onOpenChange={setShowClearAllConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all removal history? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowClearAllConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAllHistory();
                setShowClearAllConfirmDialog(false);
              }}
            >
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showInsufficientCreditsDialog}
        onClose={() => setShowInsufficientCreditsDialog(false)}
        requiredCredits={CREDITS_PER_IMAGE}
      />
    </section>
  );
}

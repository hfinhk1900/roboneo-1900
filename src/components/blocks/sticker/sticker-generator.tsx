'use client';

import { LoginForm } from '@/components/auth/login-form';
import { OptimizedImage } from '@/components/seo/optimized-image';
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

// 历史记录接口定义
interface StickerHistoryItem {
  id?: string;
  url: string;
  style: string;
  asset_id?: string;
  createdAt: number;
}

const HISTORY_KEY = 'sticker_history';

export default function StickerGenerator() {
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

  // 历史记录相关状态
  const [stickerHistory, setStickerHistory] = useState<StickerHistoryItem[]>(
    []
  );
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{
    idx: number;
    item: StickerHistoryItem;
  } | null>(null);
  const [showClearAllConfirmDialog, setShowClearAllConfirmDialog] =
    useState(false);

  // 图片预览弹窗状态
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Get selected style option
  const selectedOption = styleOptions.find(
    (option) => option.value === selectedStyle
  );

  useEffect(() => {
    setIsMounted(true);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (currentUser) {
          // 已登录：优先从服务端加载
          const res = await fetch('/api/history/sticker', {
            credentials: 'include',
          });
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              // 处理服务端历史记录
              const processedItems = await Promise.all(
                result.data.map(
                  async (it: any): Promise<StickerHistoryItem> => {
                    let finalUrl = it.url;

                    // 如果是资产下载URL，检查是否过期
                    if (it.url?.startsWith('/api/assets/download')) {
                      try {
                        const urlObj = new URL(it.url, window.location.origin);
                        const exp = urlObj.searchParams.get('exp');
                        const assetId = urlObj.searchParams.get('asset_id');

                        if (exp && assetId) {
                          const expiryTime = Number.parseInt(exp) * 1000;
                          const currentTime = Date.now();

                          // 如果URL即将过期或已过期，刷新它
                          if (expiryTime - currentTime <= 5 * 60 * 1000) {
                            try {
                              const refreshRes = await fetch(
                                '/api/storage/sign-download',
                                {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    asset_id: assetId,
                                    display_mode: 'inline',
                                    expires_in: 3600,
                                  }),
                                }
                              );
                              if (refreshRes.ok) {
                                const refreshData = await refreshRes.json();
                                finalUrl = refreshData.url;
                              }
                            } catch (error) {
                              console.error(
                                'Failed to refresh asset URL:',
                                error
                              );
                            }
                          }
                        }
                      } catch (error) {
                        console.error('Error checking URL expiry:', error);
                      }
                    }

                    return {
                      id: it.id,
                      url: finalUrl,
                      style: it.style,
                      asset_id: it.asset_id || it.metadata?.asset_id,
                      createdAt: it.createdAt
                        ? new Date(it.createdAt).getTime()
                        : Date.now(),
                    } as StickerHistoryItem;
                  }
                )
              );

              // 确保按时间降序排列（最新的在前）
              const sortedItems = processedItems.sort(
                (a: StickerHistoryItem, b: StickerHistoryItem) =>
                  (b.createdAt || 0) - (a.createdAt || 0)
              );

              setStickerHistory(sortedItems);
              return;
            }
          }
        } else {
          // 未登录：加载本地历史
          const raw = localStorage.getItem(HISTORY_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as StickerHistoryItem[];
            // 确保按时间降序排列（最新的在前）
            const sortedItems = parsed.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );

            setStickerHistory(sortedItems);
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };

    // 只有在 mounted 后才加载历史
    if (isMounted) {
      loadHistory();
    }
  }, [currentUser, isMounted]);

  // 写入历史（最多保留 24 条，最新在前）
  const pushHistory = useCallback(
    async (item: StickerHistoryItem) => {
      // 已登录：写入服务端
      if (currentUser) {
        try {
          const res = await fetch('/api/history/sticker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              asset_id: item.asset_id,
              url: item.url,
              style: item.style,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            const createdItem: StickerHistoryItem = {
              id: created.id,
              url: created.url,
              style: created.style,
              asset_id: created.asset_id,
              createdAt: created.createdAt
                ? new Date(created.createdAt).getTime()
                : Date.now(),
            };
            setStickerHistory((prev) => [createdItem, ...prev]);
            return;
          }
        } catch {}
      }
      // 未登录：写入本地回退
      try {
        const itemWithTime = {
          ...item,
          createdAt: item.createdAt || Date.now(),
        };
        const next = [itemWithTime, ...stickerHistory].slice(0, 24);
        setStickerHistory(next);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
    },
    [stickerHistory, currentUser]
  );

  // 删除单条历史记录
  const removeHistoryItem = useCallback(
    (idx: number) => {
      const target = stickerHistory[idx];
      if (!target) return;

      // 显示确认弹窗
      setPendingDeleteItem({ idx, item: target });
      setShowDeleteConfirmDialog(true);
    },
    [stickerHistory]
  );

  // 确认删除历史记录
  const confirmDeleteHistoryItem = useCallback(async () => {
    if (!pendingDeleteItem) return;

    const { idx, item } = pendingDeleteItem;

    // 已登录：调用删除
    if (currentUser && item.id) {
      try {
        await fetch(`/api/history/sticker/${item.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch {}
    }

    const next = stickerHistory.filter((_, i) => i !== idx);
    setStickerHistory(next);
    // 同步本地回退
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}

    // 关闭弹窗并清理状态
    setShowDeleteConfirmDialog(false);
    setPendingDeleteItem(null);
  }, [pendingDeleteItem, currentUser, stickerHistory]);

  // 清空所有历史记录（显示确认弹窗）
  const clearHistory = useCallback(() => {
    setShowClearAllConfirmDialog(true);
  }, []);

  // 确认清空所有历史记录
  const confirmClearAllHistory = useCallback(async () => {
    const snapshot = [...stickerHistory];
    if (currentUser) {
      await Promise.all(
        snapshot.map(async (it) => {
          if (!it.id) return;
          try {
            await fetch(`/api/history/sticker/${it.id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
          } catch {}
        })
      );
    }
    setStickerHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}

    // 关闭弹窗
    setShowClearAllConfirmDialog(false);
  }, [stickerHistory, currentUser]);

  // 从URL下载图片
  const downloadFromUrl = useCallback(async (url: string, style: string) => {
    const filename = `sticker-${style}-${Date.now()}.png`;

    if (url.startsWith('/api/assets/download')) {
      // 新资产管理系统
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (url.startsWith('data:')) {
      // base64 数据
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (url.startsWith('http')) {
      // HTTP URL，使用代理
      const downloadUrl = `/api/image-proxy?${new URLSearchParams({ url, filename })}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }, []);

  // 处理文件拖拽
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      handleImageUpload({ target: { files: [file] } } as any);
    }
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

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
    },
    []
  );

  // 移除上传的图片
  const removeUploadedImage = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setGeneratedImageUrl(null);
    setFileError(null);
  }, []);

  // 生成贴纸
  const handleGenerate = useCallback(async () => {
    if (!selectedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (!currentUser) {
      setShowLoginDialog(true);
      return;
    }

    // 检查积分
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
    setGenerationStep('Preparing image...');

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      setGenerationStep('Generating sticker...');

      // 创建 FormData 以匹配 API 期待的格式
      const formData = new FormData();
      formData.append('imageFile', selectedImage);
      formData.append('style', selectedStyle);

      const response = await fetch('/api/image-to-sticker', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.url) {
        setGeneratedImageUrl(result.url);
        setGenerationProgress(100);
        setGenerationStep('Complete!');

        // 更新积分
        const currentCredits = creditsCache.get() || 0;
        creditsCache.set(currentCredits - CREDITS_PER_IMAGE);

        // 保存到历史记录
        await pushHistory({
          url: result.url,
          style: selectedStyle,
          asset_id: result.asset_id,
          createdAt: Date.now(),
        });

        toast.success('Sticker generated successfully!');

        // 发送通知（如果已授权）
        if (notificationPermission === 'granted') {
          new Notification('Sticker Ready!', {
            body: 'Your AI sticker has been generated successfully.',
            icon: '/favicon.ico',
          });
        }
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
      setGenerationStep(null);
    }
  }, [
    selectedImage,
    selectedStyle,
    currentUser,
    notificationPermission,
    pushHistory,
  ]);

  // 下载生成的图片
  const handleDownload = useCallback(async () => {
    if (!generatedImageUrl) return;
    await downloadFromUrl(generatedImageUrl, selectedStyle);
    toast.success('Image downloaded successfully!');
  }, [generatedImageUrl, selectedStyle, downloadFromUrl]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="relative bg-gradient-to-b from-gray-50 to-white min-h-screen overflow-hidden">
      {/* Background decoration */}
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
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl pt-24"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            Turn Any Photo into a Sticker with RoboNeo AI
          </motion.h1>

          {/* description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground"
          >
            Try our image-to-sticker demo, then explore text-to-image &
            image-to-image for limitless creativity.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Image Input */}
          <div>
            <Card className="relative overflow-hidden border shadow-md h-full min-h-[400px] flex flex-col rounded-2xl bg-white">
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
                      <path d="M8 13h.01" />
                      <path d="M16 13h.01" />
                      <path d="M10 16s.8 1 2 1c1.3 0 2-1 2-1" />
                    </svg>
                    Image to Sticker
                  </h3>
                  <p className="text-muted-foreground">
                    Transform your photos into beautiful stickers in seconds
                  </p>
                </div>

                <div className="space-y-5 flex-grow flex flex-col">
                  <div className="space-y-3 flex-grow flex flex-col">
                    <Label
                      htmlFor="image-upload"
                      className="text-sm font-medium"
                    >
                      Upload Image
                    </Label>
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={cn(
                        'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex-grow bg-[#f5f5f5] border border-border',
                        isDragging && 'bg-muted/50 border-primary'
                      )}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />

                      {previewUrl ? (
                        <>
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                            <OptimizedImage
                              src={previewUrl}
                              alt="Sticker preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                            {selectedImage?.name}
                          </p>
                          <Button
                            onClick={removeUploadedImage}
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
                          htmlFor="image-upload"
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
                    {fileError && (
                      <div className="space-y-2">
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{fileError}</span>
                        </p>
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
                              ? `Regenerate (${CREDITS_PER_IMAGE} credits)`
                              : `Generate My Sticker (${CREDITS_PER_IMAGE} credits)`}
                    </Button>
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
                  /* Loading 状态 - 显示进度条和灰色遮罩 */
                  <div className="flex items-center justify-center min-h-[400px] p-8 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* 用户上传的图片带灰色遮罩 */}
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
                            <Image
                              src="/hero-1.webp"
                              alt="Sticker Example"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          )}
                          {/* 进度遮罩层 */}
                          <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center space-y-4">
                            {/* 生成中图标 */}
                            <div className="flex items-center space-x-2 text-white">
                              <LoaderIcon className="h-6 w-6 animate-spin" />
                              <span className="text-lg font-medium">
                                {generationStep || 'Generating...'}
                              </span>
                            </div>

                            {/* 进度条 */}
                            <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: `${generationProgress}%` }}
                              />
                            </div>

                            {/* 进度百分比 */}
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
                  /* 生成完成状态 */
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex items-center justify-center">
                      <img
                        src={generatedImageUrl}
                        alt="Generated sticker"
                        className="object-contain max-h-full max-w-full"
                        style={{
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          borderRadius: '0',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleDownload}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Download sticker"
                      >
                        <DownloadIcon className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        onClick={() => setGeneratedImageUrl(null)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Remove sticker"
                      >
                        <Trash2Icon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 默认状态 - 显示用户上传的图片或示例图片 */
                  <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {previewUrl ? (
                          <div className="text-center space-y-4">
                            <img
                              src={previewUrl}
                              alt="Upload preview"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full"
                            />
                            <div className="text-sm text-muted-foreground">
                              Your image is ready! Select a style and click
                              generate.
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
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
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Credits Display - Removed */}

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

      {/* 确认删除弹窗 */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Sticker History?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sticker from your history?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmDialog(false);
                setPendingDeleteItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteHistoryItem}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 确认清空所有历史弹窗 */}
      <Dialog
        open={showClearAllConfirmDialog}
        onOpenChange={setShowClearAllConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All History?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all sticker history? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowClearAllConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAllHistory}>
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 历史记录区块 */}

      {stickerHistory.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Sticker History</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={clearHistory}
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stickerHistory.map((item, idx) => (
              <div key={`${item.createdAt}-${idx}`} className="group relative">
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
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    title="Download sticker"
                    onClick={() => downloadFromUrl(item.url, item.style)}
                  >
                    <DownloadIcon className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    title="Remove sticker"
                    onClick={() => removeHistoryItem(idx)}
                  >
                    <Trash2Icon className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片预览弹窗 */}
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
                <img
                  src={previewImageUrl}
                  alt="Sticker preview"
                  className="object-contain w-full h-full rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
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
                  // 从历史记录中找到对应的项目进行下载
                  const historyItem = stickerHistory.find(
                    (item) => item.url === previewImageUrl
                  );
                  if (historyItem) {
                    downloadFromUrl(historyItem.url, historyItem.style);
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
    </main>
  );
}

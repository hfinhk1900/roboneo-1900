'use client';

import { CreditsDisplay } from '@/components/shared/credits-display';
import { GalleryImage } from '@/components/shared/gallery-image';
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';
import {
  BoxIcon,
  CameraIcon,
  DownloadIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  PackageIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// 导入新的 ProductShot 功能
import {
  DEFAULT_SCENES,
  type SceneConfig,
  type SceneType,
  useProductShot,
} from '@/ai/image/hooks/use-productshot';

// 6种专业产品摄影场景图标映射
const sceneIcons: Record<SceneType, string> = {
  'studio-white': '⚪',
  'studio-shadow': '🎭',
  'home-lifestyle': '🏠',
  'nature-outdoor': '🌿',
  'table-flatlay': '📷',
  'minimalist-clean': '✨',
  custom: '🎨',
} as const;

// Presentation Style 已经整合到场景选择中，不再需要单独配置

export default function ProductShotGeneratorSection() {
  const [selectedScene, setSelectedScene] = useState<SceneType | ''>('');
  const [customSceneDescription, setCustomSceneDescription] = useState('');
  // Product Size Hint 已隐藏，系统自动智能检测
  const [productTypeHint] = useState<'auto'>('auto');
  // Presentation Style 已移除，现在由场景选择统一控制
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

  // 新增：生成进度状态
  const [generationProgress, setGenerationProgress] = useState(0);

  // Image upload state - Main Product Image
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // NEW: Reference Image upload state for dual-image generation
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isReferenceDragOver, setIsReferenceDragOver] = useState(false);

  // Aspect ratio selection (default original)
  const [selectedAspect, setSelectedAspect] = useState<string>('original');

  // Image preview modal state
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // 新增：历史记录相关状态
  const [productshotHistory, setProductshotHistory] = useState<
    ProductshotHistoryItem[]
  >([]);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{
    idx: number;
    item: ProductshotHistoryItem;
  } | null>(null);
  const [showClearAllConfirmDialog, setShowClearAllConfirmDialog] =
    useState(false);

  // 历史记录接口定义
  interface ProductshotHistoryItem {
    id?: string;
    asset_id?: string; // 新增：仅存资产ID更稳
    url: string; // 仍保留以兼容旧数据
    scene: string;
    createdAt: number;
  }

  const HISTORY_KEY = 'roboneo_productshot_history_v1'; // 未登录时回退

  // 获取当前用户
  const currentUser = useCurrentUser();

  // 新增：mounted 状态，避免 hydration 不匹配
  const [isMounted, setIsMounted] = useState(false);

  const ASPECT_OPTIONS: Array<{
    id: string; // ratio id, e.g. '2:3'
    label: string; // display label, e.g. 'Tall'
    icon: string; // icon path
    ratioClass: string; // kept for potential future use
  }> = [
    {
      id: 'original',
      label: 'Original',
      icon: '/icons/original.svg',
      ratioClass: 'aspect-auto',
    },
    {
      id: '2:3',
      label: 'Tall',
      icon: '/icons/tall.svg',
      ratioClass: 'aspect-[2/3]',
    },
    {
      id: '1:1',
      label: 'Square',
      icon: '/icons/square.svg',
      ratioClass: 'aspect-[1/1]',
    },
    {
      id: '3:2',
      label: 'Wide',
      icon: '/icons/wide.svg',
      ratioClass: 'aspect-[3/2]',
    },
  ];

  // 新增：Fix hydration mismatch by ensuring client-side state consistency
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 新增：监听 currentUser 变化，重新加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (currentUser) {
          console.log('🔄 Loading server history for user:', currentUser.id);
          const res = await fetch(
            '/api/history/productshot?refresh_urls=true',
            {
              // 移除limit=24，获取所有历史记录
              credentials: 'include',
            }
          );
          if (res.ok) {
            const data = await res.json();
            console.log('📦 Server history response:', data);

            // 处理每个历史记录项，检查并刷新过期的URL
            const processedItems = await Promise.all(
              (data.items || []).map(async (it: any) => {
                let finalUrl = it.url;

                // 如果是资产下载URL，检查是否过期
                if (it.url.startsWith('/api/assets/download')) {
                  try {
                    const urlObj = new URL(it.url, window.location.origin);
                    const exp = urlObj.searchParams.get('exp');
                    const assetId = urlObj.searchParams.get('asset_id');

                    if (exp && assetId) {
                      const expiryTime = Number.parseInt(exp) * 1000;
                      const currentTime = Date.now();

                      // 如果URL即将过期或已过期，刷新它
                      if (expiryTime - currentTime <= 5 * 60 * 1000) {
                        console.log(
                          '🔄 Refreshing expired asset URL:',
                          assetId
                        );
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
                          console.error('Failed to refresh asset URL:', error);
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
                  scene: it.scene,
                  createdAt: it.createdAt
                    ? new Date(it.createdAt).getTime()
                    : Date.now(),
                } as ProductshotHistoryItem;
              })
            );

            // 确保按时间降序排列（最新的在前）
            const sortedItems = processedItems.sort(
              (a: ProductshotHistoryItem, b: ProductshotHistoryItem) =>
                (b.createdAt || 0) - (a.createdAt || 0)
            );
            setProductshotHistory(sortedItems);
            console.log(
              '✅ Server history loaded:',
              processedItems.length,
              'items'
            );
            return;
          }
          console.warn('⚠️ Server history request failed:', res.status);
        } else {
          console.log('👤 No user logged in, loading local history');
          // fallback 本地
          const raw = localStorage.getItem(HISTORY_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as ProductshotHistoryItem[];

            // 处理本地历史记录，检查并刷新过期的URL
            const processedItems = await Promise.all(
              parsed.map(async (item) => {
                let finalUrl = item.url;

                // 如果是资产下载URL，检查是否过期
                if (item.url.startsWith('/api/assets/download')) {
                  try {
                    const urlObj = new URL(item.url, window.location.origin);
                    const exp = urlObj.searchParams.get('exp');
                    const assetId = urlObj.searchParams.get('asset_id');

                    if (exp && assetId) {
                      const expiryTime = Number.parseInt(exp) * 1000;
                      const currentTime = Date.now();

                      // 如果URL即将过期或已过期，刷新它
                      if (expiryTime - currentTime <= 5 * 60 * 1000) {
                        console.log(
                          '🔄 Refreshing expired asset URL:',
                          assetId
                        );
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
                          console.error('Failed to refresh asset URL:', error);
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error checking URL expiry:', error);
                  }
                }

                return {
                  ...item,
                  url: finalUrl,
                };
              })
            );

            // 确保按时间降序排列（最新的在前）
            const sortedItems = processedItems.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );
            setProductshotHistory(sortedItems);
            console.log(
              '📱 Local history loaded:',
              processedItems.length,
              'items'
            );
          }
        }
      } catch (error) {
        console.error('❌ Error loading history:', error);
        // 忽略错误，尽量展示本地
        try {
          const raw = localStorage.getItem(HISTORY_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as ProductshotHistoryItem[];
            // 确保按时间降序排列（最新的在前）
            const sortedItems = parsed.sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );
            setProductshotHistory(sortedItems);
            console.log(
              '🔄 Fallback to local history:',
              parsed.length,
              'items'
            );
          }
        } catch {}
      }
    };

    // 只有在 mounted 后才加载历史
    if (isMounted) {
      loadHistory();
    }
  }, [currentUser, isMounted]);

  // 使用新的 ProductShot Hook
  const {
    generateProductShot,
    result,
    isLoading,
    error,
    availableScenes,
    clearResult,
    downloadImage,
    fetchAvailableScenes,
  } = useProductShot();

  // 新增：历史记录操作函数
  // 写入历史（永久保存所有历史记录）
  const pushHistory = useCallback(
    async (item: ProductshotHistoryItem) => {
      // 已登录：写入服务端
      if (currentUser) {
        try {
          const res = await fetch('/api/history/productshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              scene: item.scene,
              asset_id: item.asset_id,
              url: item.url, // 兼容：若无asset_id时仍可保存
            }),
          });
          if (res.ok) {
            const created = await res.json();
            const createdItem: ProductshotHistoryItem = {
              id: created.id,
              url: created.url,
              scene: created.scene,
              createdAt: created.createdAt
                ? new Date(created.createdAt).getTime()
                : Date.now(),
            };
            setProductshotHistory(
              (prev) => [createdItem, ...prev] // 永久保存所有历史记录
            );
            return;
          }
        } catch {}
      }
      // 未登录：写入本地回退
      try {
        setProductshotHistory((prev) => {
          // 新项目添加到最前面，确保时间戳
          const itemWithTime = {
            ...item,
            createdAt: item.createdAt || Date.now(),
          };
          const next = [itemWithTime, ...prev]; // 永久保存所有历史记录
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          return next;
        });
      } catch {}
    },
    [currentUser]
  );

  // 删除单条历史记录
  const removeHistoryItem = useCallback((idx: number) => {
    setProductshotHistory((prev) => {
      const target = prev[idx];
      if (!target) return prev;

      // 显示确认弹窗
      setPendingDeleteItem({ idx, item: target });
      setShowDeleteConfirmDialog(true);
      return prev;
    });
  }, []);

  // 确认删除历史记录
  const confirmDeleteHistoryItem = useCallback(async () => {
    if (!pendingDeleteItem) return;

    const { idx, item } = pendingDeleteItem;

    // 已登录：调用删除
    if (currentUser && item.id) {
      try {
        await fetch(`/api/history/productshot/${item.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch {}
    }

    setProductshotHistory((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // 同步本地回退
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 关闭弹窗并清理状态
    setShowDeleteConfirmDialog(false);
    setPendingDeleteItem(null);
  }, [pendingDeleteItem, currentUser]);

  // 清空所有历史记录（显示确认弹窗）
  const clearHistory = useCallback(() => {
    setShowClearAllConfirmDialog(true);
  }, []);

  // 确认清空所有历史记录
  const confirmClearAllHistory = useCallback(async () => {
    // 简化：前端逐条删除（避免新增批量删除API）
    setProductshotHistory((prev) => {
      const snapshot = [...prev];
      if (currentUser) {
        // 异步删除，不等待结果
        Promise.all(
          snapshot.map(async (it) => {
            if (!it.id) return;
            try {
              await fetch(`/api/history/productshot/${it.id}`, {
                method: 'DELETE',
                credentials: 'include',
              });
            } catch {}
          })
        );
      }
      try {
        localStorage.removeItem(HISTORY_KEY);
      } catch {}
      return [];
    });

    // 关闭弹窗
    setShowClearAllConfirmDialog(false);
  }, [currentUser]);

  // 从URL下载图片
  const downloadFromUrl = useCallback(async (url: string, scene: string) => {
    const filename = `productshot-${scene}-${Date.now()}.png`;

    // 检查并刷新过期的URL
    let finalUrl = url;
    if (url.startsWith('/api/assets/download')) {
      try {
        const urlObj = new URL(url, window.location.origin);
        const exp = urlObj.searchParams.get('exp');
        const assetId = urlObj.searchParams.get('asset_id');

        if (exp && assetId) {
          const expiryTime = Number.parseInt(exp) * 1000;
          const currentTime = Date.now();

          // 如果URL即将过期或已过期，刷新它
          if (expiryTime - currentTime <= 5 * 60 * 1000) {
            console.log(
              '🔄 Refreshing expired asset URL for download:',
              assetId
            );
            try {
              const refreshRes = await fetch('/api/storage/sign-download', {
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
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                finalUrl = refreshData.url;
              }
            } catch (error) {
              console.error('Failed to refresh asset URL for download:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking URL expiry for download:', error);
      }
    }

    if (finalUrl.startsWith('/api/assets/download')) {
      // 新资产管理系统
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (finalUrl.startsWith('data:')) {
      // base64 数据
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (finalUrl.startsWith('http')) {
      // HTTP URL，使用代理
      const downloadUrl = `/api/image-proxy?${new URLSearchParams({ url: finalUrl, filename })}`;
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

  // 初始化时获取可用场景
  useEffect(() => {
    fetchAvailableScenes();
  }, []);

  // 使用默认场景或从API获取的场景
  const scenes = availableScenes.length > 0 ? availableScenes : DEFAULT_SCENES;
  // 获取当前选中的场景配置
  const selectedSceneConfig = selectedScene
    ? DEFAULT_SCENES.find((scene) => scene.id === selectedScene)
    : null;

  // 通用文件处理函数
  const processFile = (file: File) => {
    // 严格验证支持的图片格式
    const supportedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!supportedFormats.includes(file.type)) {
      toast.error(
        `Unsupported image format: ${file.type}. Please use JPEG, PNG, or WebP format. AVIF is not currently supported.`
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload from input
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Clear uploaded image
  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  // NEW: Reference image handling functions
  const processReferenceFile = (file: File) => {
    // 严格验证支持的图片格式
    const supportedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!supportedFormats.includes(file.type)) {
      toast.error(
        `Unsupported reference image format: ${file.type}. Please use JPEG, PNG, or WebP format. AVIF is not currently supported.`
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Reference image size must be less than 5MB');
      return;
    }

    setReferenceImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferencePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processReferenceFile(file);
  };

  // Reference image drag and drop handlers
  const handleReferenceDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragOver(true);
  };

  const handleReferenceDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragOver(false);
  };

  const handleReferenceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReferenceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processReferenceFile(files[0]);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferencePreview(null);
  };

  // 模拟生成进度
  const simulateProgress = () => {
    setGenerationProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // 每次增加5-20%
      if (progress >= 95) {
        progress = 95; // 停在95%，等待实际完成
      }
      setGenerationProgress(Math.min(progress, 95));
    }, 800); // 每800ms更新一次

    return interval;
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Please upload a product image');
      return;
    }

    // 双图模式：如果有参考图片，不需要选择Scene
    // 单图模式：必须选择Scene
    if (!referenceImage && !selectedScene) {
      toast.error('Please select a scene type');
      return;
    }

    // 开始进度模拟
    const progressInterval = simulateProgress();

    try {
      // 确定使用的场景类型
      // 双图模式：纯reference image引导，不使用默认场景
      // 单图模式：使用用户选择的scene
      const effectiveSceneType = referenceImage
        ? selectedScene // 双图模式：只使用用户明确选择的场景，无默认场景
        : selectedScene; // 单图模式使用用户选择

      console.log('🎭 Generation mode:', {
        mode: referenceImage ? 'Dual-Image' : 'Single-Image',
        effectiveScene: effectiveSceneType,
        userSelectedScene: selectedScene,
        hasReferenceImage: !!referenceImage,
      });

      // 直接使用用户提供的上下文，场景已经包含所有必要信息
      await generateProductShot({
        sceneType: effectiveSceneType as SceneType,
        uploaded_image: uploadedImage,
        reference_image: referenceImage || undefined, // NEW: Pass reference image if available
        customSceneDescription:
          selectedScene === 'custom' ? customSceneDescription : undefined,
        productTypeHint: productTypeHint,
        aspectRatio: selectedAspect,
        quality: 'standard',
      });

      // 生成完成，设置进度为100%
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // 历史记录会自动通过 useEffect 添加到 result 变化时

      // 短暂显示100%后重置
      setTimeout(() => {
        setGenerationProgress(0);
      }, 1000);
    } catch (err) {
      // 清理进度
      clearInterval(progressInterval);
      setGenerationProgress(0);

      console.error('Generation failed:', err);
      const error = err as Error;
      if (error.message?.includes('credits')) {
        const match = error.message.match(/required: (\d+), current: (\d+)/);
        if (match) {
          setCreditsError({
            required: Number.parseInt(match[1]),
            current: Number.parseInt(match[2]),
          });
          setShowCreditsDialog(true);
        }
      }
    }
  };

  const handleDownload = async () => {
    if (!result?.download_url) return;

    const filename = `productshot-${selectedSceneConfig?.name}-${Date.now()}.png`;
    await downloadImage(result.download_url, filename);
  };

  const handleImageClick = () => {
    if (result?.download_url) {
      setPreviewImageUrl(result.download_url);
      setShowImagePreview(true);
    }
  };

  // 新增：监听 result 变化，自动添加到历史记录
  useEffect(() => {
    if (result?.download_url && isMounted) {
      console.log('🎉 ProductShot generated, adding to history:', result);
      const historyItem: ProductshotHistoryItem = {
        asset_id: result.asset_id, // 保存资产ID
        url: result.download_url,
        scene: selectedScene || 'custom',
        createdAt: Date.now(),
      };
      pushHistory(historyItem);
    }
  }, [result, selectedScene, pushHistory, isMounted]);

  return (
    <section id="generator" className="py-24 bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center sm:mx-auto lg:mr-auto mb-12">
          <h1
            className="text-balance text-3xl font-sans font-extrabold md:text-4xl xl:text-5xl"
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            Product Shots
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Transform product descriptions into professional scene photography
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Text Input */}
          <div>
            <Card className="relative overflow-hidden border shadow-md h-full min-h-[400px] flex flex-col rounded-2xl bg-white">
              <CardContent className="pt-6 px-6 pb-4 space-y-5 flex-grow flex flex-col">
                <div className="pb-1 pt-0">
                  <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                    <PackageIcon className="h-5 w-5" />
                    Product Shots
                  </h3>
                  <p className="text-muted-foreground">
                    Transform product descriptions into professional scene
                    photography.
                  </p>
                </div>

                <div className="space-y-5 flex-grow flex flex-col">
                  {/* Image Upload Section */}
                  <div className="space-y-3 flex-grow flex flex-col">
                    <Label className="text-sm font-medium">
                      Product Image (Required)
                    </Label>

                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={cn(
                        'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex-grow bg-[#f5f5f5] border border-border',
                        isDragOver && 'bg-muted/50 border-primary'
                      )}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />

                      {imagePreview ? (
                        <>
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                            <Image
                              src={imagePreview}
                              alt="Product preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                            {uploadedImage?.name}
                          </p>
                          <Button
                            onClick={clearImage}
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
                  </div>

                  {/* Reference Background upload hidden (API not supported) */}
                  {false && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Reference Background (Optional)
                      </Label>
                      {referenceImage && (
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          💡 Dual-image mode: Your reference background will
                          guide the scene style and environment.
                        </p>
                      )}

                      <div
                        onDragEnter={handleReferenceDragEnter}
                        onDragLeave={handleReferenceDragLeave}
                        onDragOver={handleReferenceDragOver}
                        onDrop={handleReferenceDrop}
                        className={cn(
                          'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-32 bg-[#f8f9fa] border border-dashed border-border',
                          isReferenceDragOver && 'bg-muted/50 border-primary',
                          referencePreview && 'min-h-20'
                        )}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleReferenceImageUpload}
                          className="hidden"
                          id="reference-image-upload"
                        />

                        {referencePreview ? (
                          <>
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                              <Image
                                src={referencePreview ?? '/favicon.ico'}
                                alt="Reference preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center truncate max-w-full px-2">
                              {referenceImage?.name}
                            </p>
                            <Button
                              onClick={clearReferenceImage}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                            >
                              <XIcon className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </>
                        ) : (
                          <label
                            htmlFor="reference-image-upload"
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
                  )}

                  {/* Photography Scene - 仅在单图模式下显示 */}
                  {!referenceImage && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Photography Scene
                      </Label>
                      <Select
                        value={selectedScene}
                        onValueChange={(value) =>
                          setSelectedScene(value as SceneType | '')
                        }
                      >
                        <SelectTrigger
                          className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                          style={{ height: '50px', padding: '0px 12px' }}
                        >
                          <SelectValue placeholder="Please select a photography scene">
                            {selectedSceneConfig ? (
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {sceneIcons[selectedSceneConfig.id]}
                                </span>
                                <div className="text-left">
                                  <div className="font-medium">
                                    {selectedSceneConfig.name}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Please select a photography scene
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md !bg-opacity-100">
                          <SelectGroup>
                            {/* All Scenes in order */}
                            {scenes.map((scene) => (
                              <React.Fragment key={scene.id}>
                                <SelectItem
                                  value={scene.id}
                                  className={cn(
                                    'cursor-pointer py-3 px-3 transition-colors',
                                    'hover:bg-muted/50 hover:text-foreground',
                                    'focus:bg-muted/50 focus:text-foreground',
                                    'data-[highlighted]:bg-muted/50 data-[highlighted]:text-foreground'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                      {sceneIcons[scene.id as SceneType]}
                                    </span>
                                    <div className="text-left">
                                      <div className="font-medium">
                                        {scene.name}
                                      </div>
                                      {scene.description && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {scene.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                                {/* Add separator after custom scene */}
                                {scene.id === 'custom' && (
                                  <SelectSeparator className="my-1" />
                                )}
                              </React.Fragment>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Custom Scene Description Input - Only show when custom is selected - 紧接着Scene选择器后面 */}
                  {selectedScene === 'custom' && (
                    <div className="space-y-3">
                      <Label
                        htmlFor="custom-scene"
                        className="text-sm font-medium"
                      >
                        Custom Scene Description
                      </Label>
                      <Textarea
                        id="custom-scene"
                        placeholder="Describe your custom scene, e.g., 'Product displayed on a wooden table in a cozy coffee shop with warm lighting and plants in the background'"
                        value={customSceneDescription}
                        onChange={(e) =>
                          setCustomSceneDescription(e.target.value)
                        }
                        className="min-h-[100px] resize-none rounded-xl"
                        maxLength={300}
                      />
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-muted-foreground">
                          {customSceneDescription.length}/300
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Output Aspect Ratio - independent component */}
                  {!referenceImage && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Output Aspect Ratio
                      </Label>
                      <Select
                        value={selectedAspect}
                        onValueChange={(value) => setSelectedAspect(value)}
                      >
                        <SelectTrigger
                          className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                          style={{ height: '50px', padding: '0px 12px' }}
                        >
                          <SelectValue placeholder="Aspect Ratio (Default Original)">
                            {ASPECT_OPTIONS.find(
                              (o) => o.id === selectedAspect
                            ) ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    ASPECT_OPTIONS.find(
                                      (o) => o.id === selectedAspect
                                    )?.icon
                                  }
                                  alt="aspect"
                                  className="w-6 h-6"
                                />
                                <div className="text-left">
                                  <div className="font-medium">
                                    {
                                      ASPECT_OPTIONS.find(
                                        (o) => o.id === selectedAspect
                                      )?.label
                                    }
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Aspect Ratio (Default Original)
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md !bg-opacity-100">
                          <SelectGroup>
                            {ASPECT_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.id}
                                value={opt.id}
                                className={cn(
                                  'cursor-pointer py-3 px-3 transition-colors',
                                  'hover:bg-muted/50 hover:text-foreground',
                                  'focus:bg-muted/50 focus:text-foreground',
                                  'data-[highlighted]:bg-muted/50 data-[highlighted]:text-foreground'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={opt.icon}
                                    alt="aspect"
                                    className="w-6 h-6"
                                  />
                                  <div className="text-left">
                                    <div className="font-medium">
                                      {opt.label}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Presentation Style 已整合到场景选择中 */}

                  <Button
                    onClick={handleGenerate}
                    className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                    disabled={
                      !uploadedImage ||
                      (!referenceImage && !selectedScene) || // 单图模式需要selectedScene，双图模式不需要
                      isLoading ||
                      (selectedScene === 'custom' &&
                        !customSceneDescription.trim())
                    }
                  >
                    {isLoading ? (
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="mr-2 h-5 w-5" />
                    )}
                    {isLoading
                      ? 'Generating Product Scene...'
                      : `Generate Product Scene (${CREDITS_PER_IMAGE} credits)`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side: Output */}
          <div>
            <Card className="border shadow-md h-full min-h-[400px] flex flex-col rounded-2xl bg-white">
              <CardContent className="p-6 flex-grow flex flex-col items-center justify-center space-y-4 relative">
                {result?.download_url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <button
                      type="button"
                      className="relative w-full max-w-md aspect-square cursor-pointer group transition-all duration-200 hover:scale-[1.02] border-none bg-transparent p-0"
                      onClick={handleImageClick}
                      title="Click to view full size"
                    >
                      <Image
                        src={result.download_url}
                        alt={`Generated product shot - ${selectedSceneConfig?.name || 'Unknown scene'}`}
                        fill
                        className="object-contain rounded-lg transition-all duration-200 group-hover:brightness-110"
                      />
                      {/* Zoom overlay icon */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
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
                        onClick={() => clearResult()}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                        title="Remove image"
                      >
                        <Trash2Icon className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                ) : isLoading ? (
                  /* Loading 状态 - 显示进度条和灰色遮罩 */
                  <div className="flex items-center justify-center min-h-[400px] p-8 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* 用户上传的图片带灰色遮罩 */}
                        <div className="relative">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Processing your product"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          ) : (
                            <Image
                              src="/productshots/productshot.jpg"
                              alt="Product Scene Example"
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
                                Generating...
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
                ) : (
                  /* 默认状态 - 显示用户上传的图片或示例图片 */
                  <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {imagePreview ? (
                          <div className="text-center space-y-4">
                            <img
                              src={imagePreview}
                              alt="Your uploaded product"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full"
                            />
                            <div className="text-sm text-muted-foreground">
                              {referenceImage
                                ? 'Your images are ready! Click generate to create your product scene.'
                                : 'Your product is ready! Select a scene and click generate.'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center space-y-4">
                            <Image
                              src="/productshots/productshot.jpg"
                              alt="Product Scene Example"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full"
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

      {/* Credits Dialog */}
      {showCreditsDialog && creditsError && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          required={creditsError.required}
          current={creditsError.current}
        />
      )}

      {/* Image Preview Modal */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-7xl w-[95vw] h-[85vh] p-0 bg-gradient-to-br from-black/90 to-black/95 border-none backdrop-blur-md overflow-hidden">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-yellow-400" />
                  Product Shot Preview
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
                  alt="Product shot preview"
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
                  // 从历史记录中找到对应的项目进行下载
                  const historyItem = productshotHistory.find(
                    (item) => item.url === previewImageUrl
                  );
                  if (historyItem) {
                    downloadFromUrl(historyItem.url, historyItem.scene);
                  } else {
                    handleDownload();
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

      {/* 确认删除弹窗 */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete ProductShot History?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product shot from your
              history? This action cannot be undone.
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
              Are you sure you want to delete all product shot history? This
              action cannot be undone.
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
      {productshotHistory.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your ProductShot History</h3>
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
            {productshotHistory.map((item, idx) => (
              <div key={`${item.createdAt}-${idx}`} className="group relative">
                <div className="relative w-full aspect-square bg-gray-50 border rounded-lg overflow-hidden">
                  <GalleryImage
                    src={item.url}
                    alt={`ProductShot ${idx + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain"
                    fallbackSrc="/productshots/productshot.jpg"
                    onClick={() => {
                      setPreviewImageUrl(item.url);
                      setShowImagePreview(true);
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[60%]">{item.scene}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    title="Download product shot"
                    onClick={() => downloadFromUrl(item.url, item.scene)}
                  >
                    <DownloadIcon className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                    title="Remove product shot"
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
    </section>
  );
}

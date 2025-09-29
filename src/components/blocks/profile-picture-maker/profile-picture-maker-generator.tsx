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
import { motion } from 'framer-motion';
import {
  AlertCircleIcon,
  DownloadIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  SquareUserRound,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const IDENTITY_PRESERVATION_PROMPT =
  "Preserve the uploaded person's exact facial structure, skin tone, and hairstyle. Blend their face seamlessly into the reference scene without replacing their identity.";

type ProfileStyle = {
  value: string;
  label: string;
  description: string;
  image: string;
  referenceImage: string;
  prompt: string;
};

// Profile picture styles with their corresponding prompts
const PROFILE_STYLES: ProfileStyle[] = [
  {
    value: 'man-portrait01',
    label: 'Professional Business',
    description: 'Sharp business portrait with neutral background',
    image: '/protile-maker/man-portrait01.png',
    referenceImage: '/protile-maker/reference/refer-man01.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Match the crisp white dress shirt and modern high-rise office background from the reference image, including the softly blurred city view and confident, chest-up pose. Maintain studio-quality lighting that highlights the subject's face while keeping their natural expression.`,
  },
  {
    value: 'man-portrait02',
    label: 'Outdoor Professional',
    description: 'Modern professional with natural outdoor background',
    image: '/protile-maker/man-portrait02.png',
    referenceImage: '/protile-maker/reference/refer-man02.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Match the dark navy blazer over an open-collared white shirt and the softly blurred green park path from the reference image, completing the warm golden-hour outdoor lighting and confident, chest-up pose. Ensure the subject looks naturally integrated into the scene while retaining their real face.`,
  },
  {
    value: 'man-portrait03',
    label: 'Smart Casual',
    description: 'Smart casual look with outdoor setting',
    image: '/protile-maker/man-portrait03.png',
    referenceImage: '/protile-maker/reference/refer-man03.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Follow the reference image by placing the subject in a softly blurred downtown street with a sharp dark navy suit, light blue dress shirt, and dark tie. Keep the confident, forward-facing expression and late-afternoon lighting exactly as shown while preserving the subject's true features.`,
  },
  {
    value: 'man-portrait04',
    label: 'Modern Office',
    description: 'Contemporary office professional style',
    image: '/protile-maker/man-portrait04.png',
    referenceImage: '/protile-maker/reference/refer-man04.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Recreate the solid light gray studio background and polished navy suit with light blue shirt and tie from the reference image. Maintain the even studio lighting and composed expression while keeping the subject's real facial identity intact.`,
  },
  {
    value: 'woman-portrait01',
    label: 'Executive Professional',
    description: 'Executive style with warm professional tones',
    image: '/protile-maker/woman-portrait01.png',
    referenceImage: '/protile-maker/reference/refer-woman01.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Match the minimalist light gray studio backdrop and clean turtleneck wardrobe from the reference image. Keep the lighting soft and even, gently refining the hairstyle to sit neatly while preserving the subject's natural color and facial identity.`,
  },
  {
    value: 'woman-portrait02',
    label: 'Corporate Blue',
    description: 'Classic corporate look with blue tones',
    image: '/protile-maker/woman-portrait02.png',
    referenceImage: '/protile-maker/reference/refer-woman02.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Follow the reference look with a light gray blazer over a crisp white open-collared shirt and a softly blurred contemporary office interior. Encourage a natural, confident smile while keeping the subject's true facial features and coloring.`,
  },
  {
    value: 'woman-portrait03',
    label: 'Modern Office',
    description: 'Modern office environment professional',
    image: '/protile-maker/woman-portrait03.png',
    referenceImage: '/protile-maker/reference/refer-woman03.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Match the reference image's bright urban outdoor backdrop with hints of modern architecture and greenery, and dress the subject in the same tailored light gray blazer. Keep the daylight feel and approachable smile while preserving their authentic face.`,
  },
  {
    value: 'woman-portrait04',
    label: 'Minimalist Professional',
    description: 'Clean minimalist professional style',
    image: '/protile-maker/woman-portrait04.png',
    referenceImage: '/protile-maker/reference/refer-woman04.png',
    prompt: `${IDENTITY_PRESERVATION_PROMPT} Use the dark gray textured studio backdrop and tan blazer with white shirt from the reference image. Maintain soft studio lighting and a composed, welcoming expression while keeping the subject's genuine facial identity.`,
  },
];

// Demo images that will be provided
const DEMO_IMAGES = [
  {
    id: 'demo1',
    url: '/protile-maker/portrait-demo01.png',
    resultUrl: '/protile-maker/portrait-result-demo01.png',
    alt: 'Professional Portrait Example 1',
  },
  {
    id: 'demo2',
    url: '/protile-maker/portrait-demo02.png',
    resultUrl: '/protile-maker/portrait-result-demo02.png',
    alt: 'Professional Portrait Example 2',
  },
  {
    id: 'demo3',
    url: '/protile-maker/portrait-demo03.png',
    resultUrl: '/protile-maker/portrait-result-demo03.png',
    alt: 'Professional Portrait Example 3',
  },
];

// Profile Picture Aspect ratio options configuration
const PROFILE_ASPECT_OPTIONS: Array<{
  id: string; // ratio id, e.g. '1:1'
  label: string; // display label, e.g. 'Square'
  icon: string; // icon path
  description: string; // description for tooltip
  ratioClass: string; // CSS class for aspect ratio
}> = [
  {
    id: '1:1',
    label: 'Square',
    icon: '/icons/square.svg',
    description: 'Perfect for social media profiles (LinkedIn, Twitter, etc.)',
    ratioClass: 'aspect-[1/1]',
  },
  {
    id: '2:3',
    label: 'Portrait',
    icon: '/icons/tall.svg',
    description: 'Ideal for resumes and professional profiles',
    ratioClass: 'aspect-[2/3]',
  },
  {
    id: 'original',
    label: 'Original',
    icon: '/icons/original.svg',
    description: 'Keep original image proportions',
    ratioClass: 'aspect-auto',
  },
];

// Profile Picture 历史记录接口
interface ProfilePictureHistoryItem {
  id?: string;
  asset_id?: string; // 资产ID，用于R2存储
  url: string; // 图片URL
  style: string; // 选择的风格
  aspectRatio?: string; // 输出宽高比
  createdAt: number;
}

export default function ProfilePictureMakerGenerator() {
  const currentUser = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState('man-portrait01');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('1:1');
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
  const [profilePictureHistory, setProfilePictureHistory] = useState<
    ProfilePictureHistoryItem[]
  >([]);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showClearAllConfirmDialog, setShowClearAllConfirmDialog] =
    useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{
    idx: number;
    item: ProfilePictureHistoryItem;
  } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingGeneration = useRef(false);
  const referenceImageCache = useRef<Map<string, string>>(new Map());

  // 历史记录本地存储键名
  const HISTORY_KEY = 'roboneo_profile_picture_history_v1';

  // Get selected style option
  const selectedOption = PROFILE_STYLES.find(
    (option) => option.value === selectedStyle
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      if (!isMounted) return;

      try {
        if (currentUser) {
          // 已登录：从服务器加载，并刷新URLs
          const res = await fetch(
            '/api/history/profile-picture?refresh_urls=true',
            {
              credentials: 'include',
            }
          );
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
              (a: ProfilePictureHistoryItem, b: ProfilePictureHistoryItem) =>
                (b.createdAt || 0) - (a.createdAt || 0)
            );
            setProfilePictureHistory(sortedItems);
            return;
          }
        }

        // 未登录或加载失败：从本地存储加载
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ProfilePictureHistoryItem[];
          // 确保按时间降序排列（最新的在前）
          const sortedItems = parsed.sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
          setProfilePictureHistory(sortedItems);
        }
      } catch (error) {
        console.error('Error loading profile picture history:', error);
      }
    };

    loadHistory();
  }, [currentUser, isMounted]);

  // 历史记录操作函数
  const pushHistory = useCallback(
    async (item: ProfilePictureHistoryItem) => {
      const db = IndexedDBManager.getInstance(currentUser?.id);
      // 已登录：写入服务端
      if (currentUser) {
        try {
          const res = await fetch('/api/history/profile-picture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              asset_id: item.asset_id, // 优先传asset_id
              url: item.url, // 兼容旧数据
              style: item.style,
              aspectRatio: item.aspectRatio,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            const createdItem: ProfilePictureHistoryItem = {
              id: created.id,
              asset_id: created.asset_id,
              url: created.url,
              style: created.style,
              aspectRatio: created.aspectRatio,
              createdAt: created.createdAt
                ? typeof created.createdAt === 'string'
                  ? new Date(created.createdAt).getTime()
                  : created.createdAt
                : Date.now(),
            };
            setProfilePictureHistory((prev) => [createdItem, ...prev]);
            // 保存到本地图片库（IndexedDB）
            try {
              let blob: Blob | undefined;
              try {
                const resp = await fetch(createdItem.url);
                if (resp.ok) blob = await resp.blob();
              } catch {}
              const thumbnail = blob
                ? await db.generateThumbnail(blob)
                : undefined;
              await db.saveImage({
                id:
                  createdItem.id ||
                  `profile-picture_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                url: createdItem.url,
                blob,
                thumbnail,
                toolType: 'profile-picture',
                toolParams: { style: createdItem.style },
                createdAt: createdItem.createdAt,
                lastAccessedAt: Date.now(),
                fileSize: blob?.size,
                syncStatus: createdItem.id ? 'synced' : 'local',
                serverId: createdItem.id,
              } as any);
            } catch {}
            return;
          }
        } catch {}
      }

      // 未登录：写入本地存储
      setProfilePictureHistory((prev) => {
        const newHistory = [item, ...prev];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        // 保存到本地图片库（IndexedDB）
        (async () => {
          try {
            let blob: Blob | undefined;
            try {
              const resp = await fetch(item.url);
              if (resp.ok) blob = await resp.blob();
            } catch {}
            const thumbnail = blob
              ? await db.generateThumbnail(blob)
              : undefined;
            await db.saveImage({
              id: `profile-picture_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              url: item.url,
              blob,
              thumbnail,
              toolType: 'profile-picture',
              toolParams: { style: item.style },
              createdAt: item.createdAt || Date.now(),
              lastAccessedAt: Date.now(),
              fileSize: blob?.size,
              syncStatus: 'local',
            } as any);
          } catch {}
        })();
        return newHistory;
      });
    },
    [currentUser]
  );

  // 删除单个历史记录
  const deleteHistoryItem = useCallback(
    async (idx: number, item: ProfilePictureHistoryItem) => {
      // 已登录：从服务端删除
      if (currentUser && item.id) {
        try {
          await fetch(`/api/history/profile-picture/${item.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        } catch {}
      }

      // 更新本地状态和存储
      setProfilePictureHistory((prev) => {
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
        await fetch('/api/history/profile-picture/batch-delete', {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch {}
    }

    // 更新本地状态和存储
    setProfilePictureHistory([]);
    if (!currentUser) {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, [currentUser]);

  // Parse aspect ratio string to width/height object (copied from AI Background)
  function parseAspectRatio(
    aspect?: string
  ): { w: number; h: number } | undefined {
    if (!aspect || aspect === 'original') return undefined;
    const parts = aspect.split(':');
    if (parts.length !== 2) return undefined;
    const w = Number.parseInt(parts[0]);
    const h = Number.parseInt(parts[1]);
    if (Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0)
      return undefined;
    return { w, h };
  }

  // Convert File to base64 with aspect ratio processing (copied from AI Background)
  const fileToBase64 = (
    file: File,
    targetAspect?: { w: number; h: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          const sourceWidth = img.naturalWidth;
          const sourceHeight = img.naturalHeight;
          const maxSide = 1024;

          let canvasW = 0;
          let canvasH = 0;

          if (targetAspect && targetAspect.w > 0 && targetAspect.h > 0) {
            const targetRatio = targetAspect.w / targetAspect.h;

            if (targetRatio >= 1) {
              // Wide aspect ratio (1:1 or wider)
              canvasW = 1024;
              canvasH = Math.round(1024 / targetRatio);
            } else {
              // Tall aspect ratio (2:3)
              canvasH = 1024;
              canvasW = Math.round(1024 * targetRatio);
            }

            canvas.width = canvasW;
            canvas.height = canvasH;

            // Fill with transparent background
            ctx.clearRect(0, 0, canvasW, canvasH);

            // Calculate how to fit the image within the target aspect ratio
            const sourceRatio = sourceWidth / sourceHeight;
            let drawW: number;
            let drawH: number;
            let drawX: number;
            let drawY: number;

            if (sourceRatio > targetRatio) {
              // Source is wider than target - fit by height
              drawH = canvasH;
              drawW = drawH * sourceRatio;
              drawX = (canvasW - drawW) / 2;
              drawY = 0;
            } else {
              // Source is taller than target or same ratio - fit by width
              drawW = canvasW;
              drawH = drawW / sourceRatio;
              drawX = 0;
              drawY = (canvasH - drawH) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            console.log(
              `📐 Canvas size: ${canvasW}x${canvasH} for aspect ratio ${targetAspect.w}:${targetAspect.h}`
            );
          } else {
            // Original logic: maintain aspect ratio, compress to maxSide
            let width = sourceWidth;
            let height = sourceHeight;
            if (width > height) {
              if (width > maxSide) {
                height = Math.round((height * maxSide) / width);
                width = maxSide;
              }
            } else {
              if (height > maxSide) {
                width = Math.round((width * maxSide) / height);
                height = maxSide;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Convert to base64
          const base64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(base64);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const getReferenceImageBase64 = useCallback(async (url: string) => {
    if (!url) {
      throw new Error('Reference image URL is missing');
    }

    const cached = referenceImageCache.current.get(url);
    if (cached) {
      return cached;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load reference image (${response.status})`);
    }

    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const commaIndex = result.indexOf(',');
          resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
        } else {
          reject(new Error('Unexpected reference image data'));
        }
      };
      reader.onerror = () =>
        reject(new Error('Failed to read reference image data'));
      reader.readAsDataURL(blob);
    });

    referenceImageCache.current.set(url, base64);
    return base64;
  }, []);

  // Convert aspect ratio format for API (copied from AI Background)
  const convertAspectRatioToSize = (aspectRatio: string): string => {
    switch (aspectRatio) {
      case 'original':
        return '1024x1024'; // Default size, will maintain original proportions
      case '1:1':
        return '1024x1024';
      case '2:3':
        return '683x1024'; // Portrait orientation
      default:
        return '1024x1024';
    }
  };

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

  // Handle demo image click - simulate generation process
  const handleDemoClick = useCallback(
    async (demo: (typeof DEMO_IMAGES)[0]) => {
      // Allow demo click even when not logged in; do not check credits for demo

      if (pendingGeneration.current) {
        return;
      }

      // Set demo image as preview
      setPreviewUrl(demo.url);

      // Start simulation
      pendingGeneration.current = true;
      setIsGenerating(true);
      setGenerationProgress(0);

      try {
        // Simulate generation progress
        const progressInterval = setInterval(() => {
          setGenerationProgress((prev) => {
            if (prev >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return prev + 5;
          });
        }, 100);

        // Simulate 2 second generation time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        clearInterval(progressInterval);
        setGenerationProgress(100);

        // Show result after short delay
        setTimeout(async () => {
          setGeneratedImageUrl(demo.resultUrl);
          setIsGenerating(false);
          setGenerationProgress(0);
          pendingGeneration.current = false;

          // Demo result should NOT be saved to My Library/history
          // Demo should NOT deduct credits

          toast.success('Demo profile picture generated successfully!');
        }, 300);
      } catch (error) {
        console.error('Demo generation error:', error);
        setIsGenerating(false);
        setGenerationProgress(0);
        pendingGeneration.current = false;
        toast.error('Demo generation failed');
      }
    },
    [currentUser]
  );

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
      // Process uploaded image with aspect ratio handling (similar to AI Background)
      console.log('📸 Processing image with aspect ratio handling...');
      const imageBase64 = await fileToBase64(
        selectedImage,
        parseAspectRatio(selectedAspectRatio)
      );
      console.log(`✅ Image processed: ${imageBase64.length} characters`);

      const selectedStyleData = PROFILE_STYLES.find(
        (style) => style.value === selectedStyle
      );

      if (!selectedStyleData) {
        throw new Error('Invalid style selected');
      }

      console.log('🖼️ Loading reference image for style:', selectedStyle);
      const referenceImageBase64 = await getReferenceImageBase64(
        selectedStyleData.referenceImage
      );
      console.log(
        `✅ Reference image loaded: ${referenceImageBase64.length} characters`
      );

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
        reference_image: referenceImageBase64,
        prompt: selectedStyleData.prompt,
        style: selectedStyle,
        aspect_ratio: selectedAspectRatio,
      };

      console.log('📐 Selected aspect ratio:', selectedAspectRatio);
      console.log(
        '📐 Cropping size used for preprocessing:',
        convertAspectRatioToSize(selectedAspectRatio)
      );

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

        // 保存到历史记录
        const historyItem: ProfilePictureHistoryItem = {
          asset_id: result.data.asset_id, // 使用API返回的asset_id
          url: result.data.output_image_url,
          style: selectedStyle,
          aspectRatio: selectedAspectRatio,
          createdAt: Date.now(),
        };
        await pushHistory(historyItem);

        // Update credits (unified)
        try {
          const { spendCredits } = await import('@/lib/credits-utils');
          await spendCredits({
            amount: CREDITS_PER_IMAGE,
            fetchFallback: true,
          });
        } catch {}

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
  }, [
    selectedImage,
    selectedStyle,
    selectedAspectRatio,
    currentUser,
    getReferenceImageBase64,
  ]);

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
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Profile Style</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PROFILE_STYLES.map((style) => (
                      <button
                        type="button"
                        key={style.value}
                        className={cn(
                          'relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all hover:scale-105 text-center overflow-hidden',
                          selectedStyle === style.value
                            ? 'ring-2 ring-primary scale-[1.01] bg-yellow-100/50'
                            : 'hover:ring-1 hover:ring-primary/50'
                        )}
                        onClick={() => setSelectedStyle(style.value)}
                        title={style.label}
                      >
                        {/* Background image */}
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={style.image}
                            alt={style.label}
                            fill
                            sizes="(max-width: 768px) 25vw, 15vw"
                            className="object-contain"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Aspect Ratio - independent component */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Output Aspect Ratio
                  </Label>
                  <Select
                    value={selectedAspectRatio}
                    onValueChange={(value) => setSelectedAspectRatio(value)}
                  >
                    <SelectTrigger
                      className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                      style={{ height: '50px', padding: '0px 12px' }}
                    >
                      <SelectValue placeholder="Aspect Ratio (Default Square)">
                        {PROFILE_ASPECT_OPTIONS.find(
                          (o) => o.id === selectedAspectRatio
                        ) ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                PROFILE_ASPECT_OPTIONS.find(
                                  (o) => o.id === selectedAspectRatio
                                )?.icon
                              }
                              alt="aspect"
                              className="w-6 h-6"
                            />
                            <div className="text-left">
                              <div className="font-medium">
                                {
                                  PROFILE_ASPECT_OPTIONS.find(
                                    (o) => o.id === selectedAspectRatio
                                  )?.label
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Aspect Ratio (Default Square)
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      className="w-full min-w-[--radix-select-trigger-width] bg-white border border-input rounded-2xl shadow-lg"
                    >
                      {PROFILE_ASPECT_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className="rounded-xl cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 py-2">
                            <img
                              src={option.icon}
                              alt={option.label}
                              className="w-6 h-6"
                            />
                            <div className="text-left">
                              <div className="font-medium">{option.label}</div>
                            </div>
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
                  className="w-full font-semibold h-auto min-h-[52px] rounded-2xl text-[14px] mt-auto whitespace-normal leading-tight text-center sm:text-left flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-2"
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1 animate-spin" />
                      Creating...
                    </>
                  ) : !isMounted ? (
                    <>
                      <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                      Generate Profile Picture ({CREDITS_PER_IMAGE} credits)
                    </>
                  ) : !currentUser ? (
                    <>
                      <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                      Log in to generate
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 sm:mr-2 sm:mb-0 mb-1" />
                      Generate Profile Picture ({CREDITS_PER_IMAGE} credits)
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
                                Creating...
                              </span>
                            </div>

                            {/* Progress bar - consistent with AI Background */}
                            <div className="w-full max-w-[320px] bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 transition-all duration-300 ease-out"
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
                    <div className="flex items-center justify-center w-full">
                      <div
                        className={cn(
                          'relative w-full max-w-sm',
                          // 根据选择的宽高比动态调整容器样式
                          selectedAspectRatio === '1:1'
                            ? 'aspect-square' // 1:1 正方形
                            : selectedAspectRatio === '2:3'
                              ? 'aspect-[2/3]' // 2:3 竖向
                              : selectedAspectRatio === 'original'
                                ? 'aspect-square' // 原始比例默认正方形
                                : 'aspect-square' // 默认正方形
                        )}
                      >
                        <Image
                          src={generatedImageUrl}
                          alt="Generated profile picture"
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
                ) : previewUrl ? (
                  /* Uploaded image preview state - show uploaded image before processing */
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    {/* Main image display */}
                    <div className="flex items-center justify-center w-full">
                      <div
                        className={cn(
                          'relative w-full max-w-sm',
                          // 根据选择的宽高比动态调整容器样式
                          selectedAspectRatio === '1:1'
                            ? 'aspect-square' // 1:1 正方形
                            : selectedAspectRatio === '2:3'
                              ? 'aspect-[2/3]' // 2:3 竖向
                              : selectedAspectRatio === 'original'
                                ? 'aspect-square' // 原始比例默认正方形
                                : 'aspect-square' // 默认正方形
                        )}
                      >
                        <Image
                          src={previewUrl}
                          alt="Uploaded image preview"
                          fill
                          sizes="(max-width: 768px) 80vw, 400px"
                          className="object-contain rounded-lg transition-all duration-300 ease-out"
                        />
                      </div>
                    </div>

                    {/* Upload info */}
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">
                        Your image is ready! Choose a style and click "Generate
                        Profile Picture" to transform it.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Default state - show demo images */
                  <div className="flex flex-col gap-6 items-center justify-center w-full h-full">
                    {/* Demo images section */}
                    <div className="flex flex-col gap-4 items-center justify-center w-full">
                      <div className="text-center text-[16px] text-black font-normal">
                        <p>No image? Try one of these</p>
                      </div>
                      <div className="flex gap-4 items-center justify-center">
                        {DEMO_IMAGES.map((demo) => (
                          <button
                            type="button"
                            key={demo.id}
                            onClick={() => handleDemoClick(demo)}
                            className="bg-[#bcb3b3] overflow-hidden relative rounded-2xl shrink-0 size-[82px] hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Image
                              src={demo.url}
                              alt={demo.alt}
                              width={82}
                              height={82}
                              className="w-full h-full object-cover rounded-2xl"
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

        {/* Profile Picture History Section - 只在有历史记录时显示 */}
        {profilePictureHistory.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">
                Your Profile Picture History
              </h3>
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
                  onClick={() => setShowClearAllConfirmDialog(true)}
                  type="button"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profilePictureHistory.map((item, idx) => (
                <div
                  key={`${item.createdAt}-${idx}`}
                  className="group relative"
                >
                  <div className="relative w-full aspect-square bg-white border rounded-lg overflow-hidden">
                    <img
                      src={item.url}
                      alt={`Professional headshot ${idx + 1}`}
                      className="w-full h-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      onClick={() => {
                        setPreviewImageUrl(item.url);
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[60%]">Profile Style</span>
                    <span>
                      {new Date(item.createdAt).toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                      title="Download profile picture"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.url;
                        link.download = `profile-picture-${item.style}-${Date.now()}.png`;
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
                      title="Remove profile picture"
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
                ? 'Please sign in to generate professional profile pictures.'
                : 'Sign up to start generating professional profile pictures.'}
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
            <DialogTitle>Delete Profile Picture?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this profile picture from your
              history? This action cannot be undone.
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
                  toast.success('Profile picture deleted');
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear all history confirmation dialog */}
      <Dialog
        open={showClearAllConfirmDialog}
        onOpenChange={setShowClearAllConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All History?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all profile picture history? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowClearAllConfirmDialog(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await clearAllHistory();
                setShowClearAllConfirmDialog(false);
                toast.success('All profile pictures deleted');
              }}
              type="button"
            >
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Image Dialog */}
      <Dialog
        open={!!previewImageUrl}
        onOpenChange={() => setPreviewImageUrl('')}
      >
        <DialogContent className="max-w-7xl w-[95vw] h-[85vh] p-0 bg-gradient-to-br from-black/90 to-black/95 border-none backdrop-blur-md overflow-hidden">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-yellow-400" />
                  Profile Picture Preview
                </DialogTitle>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setPreviewImageUrl('')}
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
            onClick={() => setPreviewImageUrl('')}
          >
            {previewImageUrl && (
              <div className="relative max-w-[95%] max-h-[90%] transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={previewImageUrl}
                  alt="Profile picture preview"
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
                    let finalUrl = previewImageUrl;
                    if (finalUrl.startsWith('/api/assets/')) {
                      try {
                        const assetId = finalUrl.split('/').pop();
                        if (assetId) {
                          const refreshRes = await fetch(
                            '/api/storage/sign-download',
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
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
                        }
                      } catch {}
                    }

                    const response = await fetch(finalUrl);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `profile-picture-${Date.now()}.png`;
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
                  setPreviewImageUrl('');
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

'use client';

import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
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
import { cn } from '@/lib/utils';
import { creditsCache } from '@/lib/credits-cache';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { rembgApiService } from '@/lib/rembg-api';
import {
  CpuIcon,
  DownloadIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// Preset color configuration
const PRESET_COLORS = [
  { name: 'Red', value: '#E25241' },
  { name: 'Purple', value: '#9036AA' },
  { name: 'Blue', value: '#4153AF' },
  { name: 'Green', value: '#419488' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Transparent', value: 'transparent' },
  { name: 'Custom', value: 'custom' },
];

// Background styles configuration - 与后端 API 保持一致
const BACKGROUND_STYLES = [
  {
    id: 'gradient-abstract',
    name: 'Abstract Gradient',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/gradient-aura.png',
    prompt:
      'smooth gradient background, modern abstract colors, soft transitions, clean aesthetic, vibrant color blending',
  },
  {
    id: 'texture-fabric',
    name: 'Fabric Texture',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/silk-fabric.png',
    prompt:
      'luxurious silk fabric background, smooth golden fabric texture, elegant material draping, soft fabric folds, premium textile surface',
  },
  {
    id: 'nature-blur',
    name: 'Nature Blur',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/gardenbokeh.png',
    prompt:
      'natural blurred background, bokeh effect, soft focus nature scene, warm ambient light, garden atmosphere',
  },
  {
    id: 'urban-blur',
    name: 'Urban Blur',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/studio-spotlight.png',
    prompt:
      'blurred urban background, soft city lights, bokeh street scene, modern atmosphere',
  },
  {
    id: 'wood-surface',
    name: 'Wood Surface',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/naturalwood.png',
    prompt:
      'wooden surface background, natural wood grain texture, warm brown tones, table surface, rustic wooden table',
  },
  {
    id: 'marble-stone',
    name: 'Marble Stone',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/luxurymarble.png',
    prompt:
      'marble stone background, elegant natural patterns, luxury surface texture, neutral colors, premium marble surface',
  },
  {
    id: 'fabric-cloth',
    name: 'Soft Fabric',
    image:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/silk-fabric.png',
    prompt:
      'soft fabric background, silk or cotton texture, gentle folds and draping, elegant material',
  },
  {
    id: 'paper-vintage',
    name: 'Vintage Paper',
    icon: '📜',
    prompt:
      'vintage paper background, aged texture, warm cream tones, subtle aging effects',
  },
  {
    id: 'custom',
    name: 'Custom Background',
    icon: '🎨',
    prompt: '', // Will be filled by user input
  },
];

type BackgroundType =
  | 'gradient-abstract'
  | 'texture-fabric'
  | 'nature-blur'
  | 'urban-blur'
  | 'wood-surface'
  | 'marble-stone'
  | 'fabric-cloth'
  | 'paper-vintage'
  | 'custom';

// Aspect ratio options configuration
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

// Demo images configuration with before/after states
const DEMO_IMAGES = [
  {
    id: 1,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg01.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg01.png',
    alt: 'AI Background Demo - Portrait 1',
    type: 'portrait',
  },
  {
    id: 2,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg02.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg02.png',
    alt: 'AI Background Demo - Portrait 2',
    type: 'portrait',
  },
  {
    id: 3,
    beforeSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg03.png',
    afterSrc:
      'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg03.png',
    alt: 'AI Background Demo - Still Life',
    type: 'still-life',
  },
];

export function AIBackgroundGeneratorSection() {
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
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Aspect ratio selection (default original)
  const [selectedAspect, setSelectedAspect] = useState<string>('original');

  // Image preview modal state
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);

  const [selectedBackgroundColor, setSelectedBackgroundColor] =
    useState<string>('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState<string>('#E25241');

  // New background style state
  const [backgroundMode, setBackgroundMode] = useState<'color' | 'background'>(
    'background'
  );
  const [selectedBackground, setSelectedBackground] = useState<
    BackgroundType | ''
  >('');
  const [customBackgroundDescription, setCustomBackgroundDescription] =
    useState<string>('');
  const [showBackgroundInput, setShowBackgroundInput] = useState(false);

  // Track the current display image for before/after toggle
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(
    null
  );
  const [showAfter, setShowAfter] = useState(true); // State for Before/After toggle

  // Optimize toggle performance by pre-calculating image sources
  const [beforeImageSrc, setBeforeImageSrc] = useState<string | null>(null);
  const [afterImageSrc, setAfterImageSrc] = useState<string | null>(null);

  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

  // Mode switch confirmation dialog state
  const [showModeSwitchDialog, setShowModeSwitchDialog] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<
    'color' | 'background' | null
  >(null);

  // Track the currently selected demo image for loading state
  const [selectedDemoImage, setSelectedDemoImage] = useState<string | null>(
    null
  );
  const [selectedDemoImageData, setSelectedDemoImageData] = useState<
    (typeof DEMO_IMAGES)[0] | null
  >(null);

  // 新增：生成进度状态 - 与Productshot保持一致
  const [generationProgress, setGenerationProgress] = useState(0);

  // Debug effect to monitor selectedBackgroundColor changes
  useEffect(() => {
    console.log('selectedBackgroundColor changed to:', selectedBackgroundColor);
  }, [selectedBackgroundColor]);

  // Image upload handling
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    console.log('📁 Uploading file:', file.name, file.type, file.size);

    // 立即设置文件状态，提供即时反馈

      setUploadedImage(file);


      setProcessedImage(null); // Clear previous results
    setCurrentDisplayImage(null); // Clear current display
    setBeforeImageSrc(null);
    setAfterImageSrc(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('✅ File read successfully, preview length:', result?.length);
      setImagePreview(result);
    };
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      toast.error('Failed to read image file');
      // 重置状态
      setUploadedImage(null);
      setImagePreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setProcessedImage(null);
    setSelectedDemoImage(null); // Clear demo image selection
    setSelectedDemoImageData(null); // Clear demo image data
    setCurrentDisplayImage(null); // Clear current display image
    setBeforeImageSrc(null); // Clear pre-calculated before image
    setAfterImageSrc(null); // Clear pre-calculated after image
    setSelectedBackgroundColor('transparent'); // Reset to default transparent background
  };

  // Mode switch function with cleanup
  const performModeSwitch = (newMode: 'color' | 'background') => {
    // 清空已处理的图片
    setProcessedImage(null);
    setCurrentDisplayImage(null);
    setAfterImageSrc(null);
    setBeforeImageSrc(null);
    setShowAfter(true);

    // 根据切换方向重置相应选择
    if (newMode === 'background') {
      // 切换到 Background Style 模式
      if (backgroundMode === 'color') {
        setSelectedBackgroundColor('transparent');
      }
    } else {
      // 切换到 Solid Color 模式
      if (backgroundMode === 'background') {
        setSelectedBackground('');
        setCustomBackgroundDescription('');
      }
    }

    // 执行模式切换
    setBackgroundMode(newMode);

    // 关闭确认对话框
    setShowModeSwitchDialog(false);
    setPendingModeSwitch(null);
  };

  // 模拟生成进度 - 与Productshot保持一致
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

  // Demo image click handling
  const handleDemoImageClick = async (demoImage: (typeof DEMO_IMAGES)[0]) => {
    // Prevent multiple simultaneous processing
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setGenerationProgress(0);
    setSelectedDemoImage(demoImage.afterSrc);
    setSelectedDemoImageData(demoImage);
    setCurrentDisplayImage(demoImage.afterSrc);

    // Pre-calculate image sources for better performance
    setBeforeImageSrc(demoImage.beforeSrc);
    setAfterImageSrc(demoImage.afterSrc);

    // 开始进度模拟
    const progressInterval = simulateProgress();

    // Simulate loading for demo images with smooth progress
    setTimeout(() => {
      clearInterval(progressInterval);
      setGenerationProgress(100);
            setIsProcessing(false);
            setProcessedImage(demoImage.afterSrc);

      // Set default background color to transparent
            setTimeout(() => {
              setSelectedBackgroundColor('transparent');
        console.log('Demo image processing completed');
            }, 0);

      // Show success message and reset progress after a delay
            setTimeout(() => {
        setProcessingProgress(0);
        setGenerationProgress(0);
              toast.success('Demo image loaded successfully!');
      }, 1000);
    }, 3000); // 3秒后完成
  };

  // Background color handling
  const handleBackgroundColorSelect = async (color: string) => {
    if (color === 'custom') {
      setShowColorPicker(true);
    } else {
      setSelectedBackgroundColor(color);

      // 实时应用背景颜色效果
      if (processedImage) {
        if (color === 'transparent') {
          // 如果选择透明，直接使用原始透明图片
          setCurrentDisplayImage(processedImage);
          setAfterImageSrc(processedImage);
          console.log('Switched to transparent background');
        } else {
          // 如果选择具体颜色，应用背景颜色
          try {
            const coloredImage = await applyBackgroundColor(processedImage, color);
            setCurrentDisplayImage(coloredImage);
            setAfterImageSrc(coloredImage);
            console.log(`Applied background color: ${color}`);
          } catch (error) {
            console.error('Failed to apply background color:', error);
            toast.error('Failed to apply background color');
          }
        }
      }
    }
  };

  const handleCustomColorChange = async (color: string) => {
    setSelectedBackgroundColor(color);
    setCustomColor(color);

    // 应用自定义背景颜色效果
    if (processedImage) {
      try {
        const coloredImage = await applyBackgroundColor(processedImage, color);
        setCurrentDisplayImage(coloredImage);
        setAfterImageSrc(coloredImage);
        console.log(`Applied custom background color: ${color}`);
      } catch (error) {
        console.error('Failed to apply custom background color:', error);
        toast.error('Failed to apply custom background color');
      }
    }
  };

  // Parse aspect ratio string to width/height object
  function parseAspectRatio(
    aspect?: string
  ): { w: number; h: number } | undefined {
    if (!aspect || aspect === 'original') return undefined;
    const parts = aspect.split(':');
    if (parts.length !== 2) return undefined;
    const w = Number(parts[0]);
    const h = Number(parts[1]);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return undefined;
    }
    return { w, h };
  }

  // Convert File to base64 with aspect ratio processing (similar to ProductShot)
  const fileToBase64 = (
    file: File,
    targetAspect?: { w: number; h: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate input
      if (!file) {
        reject(new Error('File is null or undefined'));
        return;
      }

      // Validate supported image formats
      const supportedFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!supportedFormats.includes(file.type)) {
        reject(
          new Error(
            `Unsupported file type: ${file.type}. Please use ${supportedFormats.join(', ')}.`
          )
        );
        return;
      }

      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        try {
          // Target max side limit
          const maxSide = 1024;
          const sourceWidth = img.width;
          const sourceHeight = img.height;

          if (targetAspect && targetAspect.w > 0 && targetAspect.h > 0) {
            // Use contain mode: preserve complete image content, no cropping
            const targetRatio = targetAspect.w / targetAspect.h;
            const sourceRatio = sourceWidth / sourceHeight;

            // Determine output canvas size - 与 API 期望的尺寸保持一致
            let canvasW = 0;
            let canvasH = 0;
            if (targetRatio >= 1) {
              // Wide aspect ratio (3:2, 1:1)
              canvasW = 1024;
              canvasH = Math.round(1024 / targetRatio);
            } else {
              // Tall aspect ratio (2:3)
              canvasH = 1024;
              canvasW = Math.round(1024 * targetRatio);
            }

            canvas.width = canvasW;
            canvas.height = canvasH;

            // Set white background (can be changed to transparent or other colors)
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvasW, canvasH);
            }

            // Calculate image position and size in canvas (contain mode)
            let drawWidth = 0;
            let drawHeight = 0;
            let drawX = 0;
            let drawY = 0;

            if (sourceRatio > targetRatio) {
              // Source is wider, fit to canvas width
              drawWidth = canvasW;
              drawHeight = Math.round(canvasW / sourceRatio);
              drawX = 0;
              drawY = Math.round((canvasH - drawHeight) / 2);
            } else {
              // Source is taller or same ratio, fit to canvas height
              drawHeight = canvasH;
              drawWidth = Math.round(canvasH * sourceRatio);
              drawX = Math.round((canvasW - drawWidth) / 2);
              drawY = 0;
            }

            // Draw complete image to canvas center
            ctx?.drawImage(
              img,
              0,
              0,
              sourceWidth,
              sourceHeight,
              drawX,
              drawY,
              drawWidth,
              drawHeight
            );

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
            ctx?.drawImage(img, 0, 0, width, height);
          }

          // Convert to base64, use JPEG format to reduce file size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

          // Keep the full data URL format for AIBG API
          if (!compressedDataUrl) {
            reject(
              new Error('Failed to generate base64 data from processed image')
            );
            return;
          }

          console.log(
            `📸 Image processed for AIBG: ${file.name} (${Math.round(file.size / 1024)}KB → ${Math.round((compressedDataUrl.length * 0.75) / 1024)}KB)`
          );
          resolve(compressedDataUrl);
        } catch (error) {
          reject(
            new Error(
              `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      // Read file and set image source
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Convert aspect ratio format for API - 与前端处理逻辑保持一致
  const convertAspectRatioToSize = (aspectRatio: string): string => {
    switch (aspectRatio) {
      case 'original':
        return '1024x1024'; // Default size, will maintain original proportions
      case '1:1':
        return '1024x1024';
      case '2:3':
        return '1024x1536'; // Tall: 1024 * (3/2) = 1536
      case '3:2':
        return '1536x1024'; // Wide: 1024 * (3/2) = 1536
      default:
        return '1024x1024';
    }
  };

  // Process image with AI Background API or remove-background service
  const handleProcessImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    // Prevent multiple simultaneous processing
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setGenerationProgress(0);
    setSelectedDemoImage(null); // Clear demo image selection when processing uploaded image
    setSelectedDemoImageData(null); // Clear demo image data
    setCurrentDisplayImage(null); // Clear current display image

    // 开始进度模拟
    const progressInterval = simulateProgress();

    try {
      // Process uploaded image with aspect ratio handling (similar to ProductShot)
      console.log('📸 Processing image with aspect ratio handling...');
      const imageBase64 = await fileToBase64(
        uploadedImage,
        parseAspectRatio(selectedAspect)
      );
      console.log(`✅ Image processed: ${imageBase64.length} characters`);

      // For Solid Color mode, use rembg API service with fallback
      if (backgroundMode === 'color') {
        console.log('🎯 Solid Color mode: Using rembg API service');
        console.log(`📐 Selected aspect ratio: ${selectedAspect}`);
        console.log(`📐 Parsed aspect ratio:`, parseAspectRatio(selectedAspect));
        console.log(`📐 Processed image size: ${imageBase64.length} characters`);

        try {
          // 优先使用rembg API - 不传递背景颜色，让API生成透明背景
          const result = await rembgApiService.removeBackground(imageBase64, {
            backgroundColor: 'transparent', // 固定为透明，让API生成透明背景
            timeout: 30000,
            aspectRatio: parseAspectRatio(selectedAspect), // 传递尺寸信息
          });

          // Clear progress interval
              clearInterval(progressInterval);

          if (result.success && result.image) {
            // Complete progress
            setProcessingProgress(100);
            setGenerationProgress(100);
              setProcessedImage(result.image);

            // 根据用户选择的背景颜色处理图片
            if (selectedBackgroundColor === 'transparent') {
              // 如果选择透明背景，直接使用原始透明图片
              setCurrentDisplayImage(result.image);
              setAfterImageSrc(result.image);
              console.log('Using transparent background - no color applied');
            } else {
              // 如果选择具体颜色，应用背景颜色
              try {
                const coloredImage = await applyBackgroundColor(result.image, selectedBackgroundColor);
                setCurrentDisplayImage(coloredImage);
                setAfterImageSrc(coloredImage);
                console.log(`Applied user-selected background color: ${selectedBackgroundColor}`);
              } catch (error) {
                console.error('Failed to apply background color:', error);
                // 如果应用颜色失败，使用原始透明图片
                setCurrentDisplayImage(result.image);
                setAfterImageSrc(result.image);
              }
            }

            // 添加详细的尺寸信息日志
            console.log(`✅ Rembg API processing completed in ${result.processingTime}ms`);
            console.log(`📐 Result image size from API: ${result.image_size || 'unknown'}`);
            console.log(`📐 Expected aspect ratio: ${selectedAspect}`);
            console.log(`📐 Parsed aspect ratio:`, parseAspectRatio(selectedAspect));

            // 更新积分缓存 - 扣除10积分
            try {
              const currentCredits = creditsCache.get();
              if (currentCredits !== null) {
                const newCredits = Math.max(0, currentCredits - CREDITS_PER_IMAGE);
                creditsCache.set(newCredits);
                console.log(`💰 Updated credits cache: ${currentCredits} → ${newCredits}`);
              }
            } catch (error) {
              console.warn('Failed to update credits cache:', error);
            }

            // Show success message and reset progress after a delay
            setTimeout(() => {
              setProcessingProgress(0);
              setGenerationProgress(0);
              toast.success('Background removed successfully!');
            }, 1000);

              return;
            }
          throw new Error(result.error || 'Rembg API failed');
        } catch (error) {
          // Clear progress interval on error
            clearInterval(progressInterval);
          console.error('❌ Rembg API failed:', error);
          toast.error(
            'Background removal service is temporarily unavailable. Please try again later.'
          );
          setProcessingProgress(0);
          setGenerationProgress(0);
          setIsProcessing(false);
          return;
        }
      }

      // For AI Background mode, use original AI service
      const apiPayload: any = {
        image_input: imageBase64,
        backgroundMode: backgroundMode,
        quality: 'standard',
        steps: 25,
        size: convertAspectRatioToSize(selectedAspect),
        output_format: 'png',
      };

      // Add background-specific parameters for AI mode
      if (backgroundMode === 'background') {
        apiPayload.backgroundType = selectedBackground;
        if (
          selectedBackground === 'custom' &&
          customBackgroundDescription.trim()
        ) {
          apiPayload.customBackgroundDescription =
            customBackgroundDescription.trim();
        }
      }

      console.log('🚀 Calling AI Background API with payload:', {
        ...apiPayload,
        image_input: '[base64 image data]', // Don't log the full base64 string
      });

      // Call AI Background API
      const response = await fetch('/api/aibackground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        console.error(
          `AI Background API error: HTTP ${response.status} ${response.statusText}`
        );

        let errorData:
          | {
              required?: number;
              current?: number;
              error?: string;
              details?: string;
              message?: string;
            }
          | Record<string, any>;
        try {
          errorData = await response.json();
          console.error('Error response data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = {};
        }

        if (response.status === 402) {
          // Insufficient credits
          setCreditsError({
            required: errorData.required || CREDITS_PER_IMAGE,
            current: errorData.current || 0,
          });
          setShowCreditsDialog(true);
          return;
        }
        if (response.status === 401) {
          throw new Error('Please log in to use AI Background');
        }

        // 提供更详细的错误信息
        const errorMessage =
          errorData.error ||
          errorData.details ||
          errorData.message ||
          `HTTP ${response.status} error`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ AI Background API success:', result);

      // Complete progress
      setProcessingProgress(100);
      setGenerationProgress(100);

      // Set the processed image
      setProcessedImage(result.resultUrl);
      setAfterImageSrc(result.resultUrl);
      setBeforeImageSrc(imagePreview);
      setCurrentDisplayImage(result.resultUrl);

      // 更新积分缓存 - 使用API返回的积分信息
      try {
        if (result.remaining_credits !== undefined) {
          creditsCache.set(result.remaining_credits);
          console.log(`💰 Updated credits cache from API: ${result.remaining_credits} credits`);
        } else {
          // 如果API没有返回积分信息，手动扣除
          const currentCredits = creditsCache.get();
          if (currentCredits !== null) {
            const newCredits = Math.max(0, currentCredits - CREDITS_PER_IMAGE);
            creditsCache.set(newCredits);
            console.log(`💰 Updated credits cache manually: ${currentCredits} → ${newCredits}`);
          }
        }
      } catch (error) {
        console.warn('Failed to update credits cache:', error);
      }

      // Show success message and reset progress after a delay
      setTimeout(() => {
        setProcessingProgress(0);
        setGenerationProgress(0);
        toast.success(
          `AI Background generated successfully! Used ${result.credits_used} credits.`
        );
      }, 1000); // 与Productshot保持一致的延迟时间
    } catch (error) {
      console.error('AI Background generation failed:', error);

      // 提供更详细的错误信息
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        // 记录完整的错误堆栈
        console.error('Error stack:', error.stack);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        console.error('Unexpected error type:', typeof error, error);
      }

      // Show error toast
      toast.error(errorMessage);

      // Reset processing state
      setProcessingProgress(0);
      setGenerationProgress(0);
    } finally {
      // Clear progress interval in finally block
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  // Apply background color to processed image
  const applyBackgroundColor = (
    imageUrl: string,
    backgroundColor: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';

      const isDataUrl = imageUrl.startsWith('data:');
      const srcUrl = isDataUrl
        ? imageUrl
        : `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
      image.src = srcUrl;

      image.onload = () => {
        const canvas = document.createElement('canvas');

        // 保持用户选择的尺寸，而不是图片的原始尺寸
        const targetAspect = parseAspectRatio(selectedAspect);
        let canvasW = image.naturalWidth;
        let canvasH = image.naturalHeight;

        if (targetAspect && targetAspect.w > 0 && targetAspect.h > 0) {
          // 根据用户选择的尺寸调整画布大小
          const targetRatio = targetAspect.w / targetAspect.h;
          const sourceRatio = image.naturalWidth / image.naturalHeight;

          if (targetRatio >= 1) {
            // Wide aspect ratio (3:2, 1:1)
            canvasW = 1024;
            canvasH = Math.round(1024 / targetRatio);
          } else {
            // Tall aspect ratio (2:3)
            canvasH = 1024;
            canvasW = Math.round(1024 * targetRatio);
          }
        }

        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill background color if it's not transparent
          if (backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          // 注意：当 backgroundColor === 'transparent' 时，不绘制任何背景
          // 这样生成的图片将保持真正的透明背景

          // Draw the processed image on top, maintaining aspect ratio
          if (targetAspect && targetAspect.w > 0 && targetAspect.h > 0) {
            // 使用 contain 模式，保持图片完整内容
            const targetRatio = targetAspect.w / targetAspect.h;
            const sourceRatio = image.naturalWidth / image.naturalHeight;

            let drawWidth = 0;
            let drawHeight = 0;
            let drawX = 0;
            let drawY = 0;

            if (sourceRatio > targetRatio) {
              // Source is wider, fit to canvas width
              drawWidth = canvasW;
              drawHeight = Math.round(canvasW / sourceRatio);
              drawX = 0;
              drawY = Math.round((canvasH - drawHeight) / 2);
            } else {
              // Source is taller or same ratio, fit to canvas height
              drawHeight = canvasH;
              drawWidth = Math.round(canvasH * sourceRatio);
              drawX = Math.round((canvasW - drawWidth) / 2);
              drawY = 0;
            }

            ctx.drawImage(
              image,
              0,
              0,
              image.naturalWidth,
              image.naturalHeight,
              drawX,
              drawY,
              drawWidth,
              drawHeight
            );
          } else {
            // 原始逻辑：直接绘制，保持原始尺寸
            ctx.drawImage(image, 0, 0);
          }

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  // Download processed result
  const handleDownload = () => {
    if (!processedImage) {
      toast.error('No image to download');
      return;
    }

    // 如果当前显示的是应用了背景颜色的图片，直接下载
    if (currentDisplayImage && currentDisplayImage !== processedImage) {
      const link = document.createElement('a');
      link.href = currentDisplayImage;
      link.download = 'ai-background-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded');
      return;
    }

    // 否则下载原始处理后的图片
    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    const isDataUrl = processedImage.startsWith('data:');
    const srcUrl = isDataUrl
      ? processedImage
      : `/api/image-proxy?url=${encodeURIComponent(processedImage)}`;
    image.src = srcUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fill background color if it's not transparent
        if (selectedBackgroundColor !== 'transparent') {
          ctx.fillStyle = selectedBackgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw the processed image on top
        ctx.drawImage(image, 0, 0);

        // Trigger download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'ai-background-result.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image downloaded');
      } else {
        toast.error('Could not process image for download.');
      }
    };

    image.onerror = () => {
      toast.error('Failed to load image for download.');
    };
  };

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
            AI Background
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-lg text-muted-foreground">
            Upload any photo and generate stunning custom backgrounds with AI -
            from solid colors to artistic styles.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Input area */}
          <Card className="relative overflow-hidden border shadow-md h-full min-h-[400px] flex flex-col rounded-2xl bg-white">
            <CardContent className="pt-6 px-6 pb-4 space-y-5 flex-grow flex flex-col">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2 11H3V6C3 4.34314 4.34326 3 6 3H18C19.6567 3 21 4.34314 21 6V11H22C22.5522 11 23 11.4477 23 12C23 12.5523 22.5522 13 22 13H21V18C21 19.6569 19.6567 21 18 21H6C4.34326 21 3 19.6569 3 18V13H2C1.44775 13 1 12.5523 1 12C1 11.4477 1.44775 11 2 11ZM18 5H6C5.44775 5 5 5.44769 5 6V11H19V6C19 5.44769 18.5522 5 18 5ZM16.2929 13H13.7071L7.70711 19H10.2929L16.2929 13ZM11.7071 19L17.7071 13H19V14.2929L14.2929 19H11.7071ZM15.7071 19H18C18.5522 19 19 18.5523 19 18V15.7071L15.7071 19ZM6.29289 19L12.2929 13H9.70711L5 17.7071V18C5 18.5523 5.44775 19 6 19H6.29289ZM5 16.2929L8.29289 13H5V16.2929Z"
                      fill="currentColor"
                    />
                  </svg>
                  AI Background
                </h3>
                <p className="text-muted-foreground">
                  Upload your photo and create custom backgrounds with AI.
                </p>
              </div>

              <div className="space-y-5 flex-grow flex flex-col">
                {/* Image upload area */}
                <div className="space-y-3 flex-grow flex flex-col">
                  <Label className="text-sm font-medium">
                    Product Image (Required)
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
                      id="image-upload"
                    />

                    {imagePreview ? (
                      <>
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border">
                          <Image
                            src={imagePreview}
                            alt="Product preview"
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
                        htmlFor="image-upload"
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

                {/* Background selection - Always visible */}
                <div className="space-y-3">
                  {/* Background Mode Toggle */}
                  <div>
                    <Label className="text-sm font-medium mb-3">
                      Background Type
                    </Label>
                    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          // 如果当前不是 Background Style 模式，检查是否需要确认
                          if (backgroundMode !== 'background') {
                            if (processedImage) {
                              // 有已生成的图片，显示确认对话框
                              setPendingModeSwitch('background');
                              setShowModeSwitchDialog(true);
                            } else {
                              // 没有图片，直接切换
                              performModeSwitch('background');
                            }
                          }
                        }}
                        className={cn(
                          'flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all',
                          backgroundMode === 'background'
                            ? 'bg-white text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Background Style
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // 如果当前不是 Solid Color 模式，检查是否需要确认
                          if (backgroundMode !== 'color') {
                            if (processedImage) {
                              // 有已生成的图片，显示确认对话框
                              setPendingModeSwitch('color');
                              setShowModeSwitchDialog(true);
                            } else {
                              // 没有图片，直接切换
                              performModeSwitch('color');
                            }
                          }
                        }}
                        className={cn(
                          'flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all',
                          backgroundMode === 'color'
                            ? 'bg-white text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Solid Color
                      </button>
                    </div>
                  </div>

                  {/* Solid Color Mode */}
                  {backgroundMode === 'color' && (
                    <div className="mb-2 mt-3">
                      <div className="flex gap-2 items-center justify-between w-full">
                        {/* Transparent (mosaic) button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleBackgroundColorSelect('transparent')
                          }
                          className={cn(
                            'relative rounded-2xl size-12 hover:scale-105 transition-all duration-200 cursor-pointer flex-shrink-0 overflow-hidden border-2',
                            selectedBackgroundColor === 'transparent'
                              ? 'border-yellow-500 border-opacity-100 scale-110 shadow-lg ring-1 ring-yellow-200'
                              : 'border-gray-300 hover:border-gray-400'
                          )}
                          title="Transparent Background"
                        >
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            className="w-full h-full"
                          >
                            <defs>
                              <pattern
                                id="mosaic-left"
                                patternUnits="userSpaceOnUse"
                                width="10"
                                height="10"
                              >
                                <rect width="5" height="5" fill="#ffffff" />
                                <rect
                                  x="5"
                                  y="0"
                                  width="5"
                                  height="5"
                                  fill="#e5e7eb"
                                />
                                <rect
                                  x="0"
                                  y="5"
                                  width="5"
                                  height="5"
                                  fill="#e5e7eb"
                                />
                                <rect
                                  x="5"
                                  y="5"
                                  width="5"
                                  height="5"
                                  fill="#ffffff"
                                />
                              </pattern>
                            </defs>
                            <rect
                              width="48"
                              height="48"
                              fill="url(#mosaic-left)"
                            />
                          </svg>
                          {/* 选中状态的勾号，保持马赛克背景 */}
                          {selectedBackgroundColor === 'transparent' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-yellow-600 drop-shadow-sm"
                              >
                                <path
                                  d="M13.5 4.5L6 12L2.5 8.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </button>

                        {/* Color buttons (excluding transparent and custom) */}
                        {PRESET_COLORS.filter(
                          (color) =>
                            color.value !== 'transparent' &&
                            color.value !== 'custom'
                        ).map((color) => (
                          <button
                            type="button"
                            key={color.value}
                            className={cn(
                              'relative rounded-2xl size-12 hover:scale-105 transition-all duration-200 cursor-pointer flex-shrink-0 border-2 flex items-center justify-center',
                              selectedBackgroundColor === color.value
                                ? 'border-yellow-500 border-opacity-100 scale-110 shadow-lg ring-1 ring-yellow-200'
                                : 'border-gray-300 hover:border-gray-400'
                            )}
                            style={{ backgroundColor: color.value }}
                            onClick={() =>
                              handleBackgroundColorSelect(color.value)
                            }
                            title={color.name}
                          >
                            {/* 选中状态的勾号 */}
                            {selectedBackgroundColor === color.value && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'drop-shadow-sm',
                                  // 根据背景色调整勾号颜色以确保对比度
                                  color.value === '#FFFFFF' ||
                                    color.value === '#ffeaa7'
                                    ? 'text-gray-700'
                                    : 'text-white'
                                )}
                              >
                                <path
                                  d="M13.5 4.5L6 12L2.5 8.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        ))}

                        {/* Custom color button */}
                        <button
                          type="button"
                          onClick={() => handleBackgroundColorSelect('custom')}
                          className={cn(
                            'relative rounded-full size-12 hover:scale-105 transition-all duration-200 cursor-pointer flex-shrink-0 border-2 flex items-center justify-center',
                            selectedBackgroundColor === 'custom'
                              ? 'border-yellow-500 border-opacity-100 scale-110 shadow-lg ring-1 ring-yellow-200'
                              : 'border-gray-300 hover:border-gray-400'
                          )}
                          style={{
                            background:
                              selectedBackgroundColor === 'custom'
                                ? customColor
                                : 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd)',
                          }}
                          title="Custom Color"
                        >
                          {selectedBackgroundColor === 'custom' ? (
                            // 选中状态显示勾号
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white drop-shadow-sm"
                            >
                              <path
                                d="M13.5 4.5L6 12L2.5 8.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            // 未选中状态显示调色板图标
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white drop-shadow-sm"
                            >
                              <path
                                d="M8 1L9.06 5.94L14 7L9.06 8.06L8 13L6.94 8.06L2 7L6.94 5.94L8 1Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Background Style Mode */}
                  {backgroundMode === 'background' && (
                    <div className="mb-2">
                      {/* First row - 4 items */}
                      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                        {BACKGROUND_STYLES.slice(0, 4).map((style) => (
                          <button
                            type="button"
                            key={style.id}
                            onClick={() => {
                              setSelectedBackground(style.id as BackgroundType);
                              if (style.id === 'custom') {
                                setShowBackgroundInput(true);
                              } else {
                                setShowBackgroundInput(false);
                              }
                            }}
                            className={cn(
                              'relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all hover:scale-105 text-center aspect-square overflow-hidden',
                              selectedBackground === style.id
                                ? 'ring-2 ring-primary scale-105 bg-primary/5'
                                : 'hover:ring-1 hover:ring-primary/50'
                            )}
                            title={style.name}
                          >
                            {/* Background image */}
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                              {style.image ? (
                                <Image
                                  src={style.image}
                                  alt={style.name}
                                  fill
                                  sizes="(max-width: 768px) 25vw, 15vw"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-2xl">
                                  {style.icon}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Second row - 2 regular items + 1 wide custom item */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {/* Natural Wood */}
                        {BACKGROUND_STYLES.slice(4, 6).map((style) => (
                          <button
                            type="button"
                            key={style.id}
                            onClick={() => {
                              setSelectedBackground(style.id as BackgroundType);
                              if (style.id === 'custom') {
                                setShowBackgroundInput(true);
                              } else {
                                setShowBackgroundInput(false);
                              }
                            }}
                            className={cn(
                              'relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all hover:scale-105 text-center aspect-square overflow-hidden',
                              selectedBackground === style.id
                                ? 'ring-2 ring-primary scale-105 bg-primary/5'
                                : 'hover:ring-1 hover:ring-primary/50'
                            )}
                            title={style.name}
                          >
                            {/* Background image */}
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                              {style.image ? (
                                <Image
                                  src={style.image}
                                  alt={style.name}
                                  fill
                                  sizes="(max-width: 768px) 25vw, 15vw"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-2xl">
                                  {style.icon}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}

                        {/* Custom Background - spans 2 columns */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBackground('custom' as BackgroundType);
                            setShowBackgroundInput(true);
                          }}
                          className={cn(
                            'relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all hover:scale-105 text-center aspect-[2/1] overflow-hidden col-span-2',
                            selectedBackground === 'custom'
                              ? 'ring-2 ring-primary scale-105 bg-primary/5'
                              : 'hover:ring-1 hover:ring-primary/50'
                          )}
                          title="Custom Background"
                        >
                          {/* Custom icon and gradient background */}
                          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center justify-center gap-1">
                            <span className="text-xl">🎨</span>
                            <span className="text-xs font-medium text-gray-700 leading-tight">
                              Custom Style
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Custom Background Description Input */}
                      {selectedBackground === 'custom' &&
                        showBackgroundInput && (
                          <div className="space-y-3 mt-4">
                            <Label
                              htmlFor="custom-background"
                              className="text-sm font-medium"
                            >
                              Custom Background Description
                            </Label>
                            <Textarea
                              id="custom-background"
                              placeholder="Describe your desired background style..."
                              value={customBackgroundDescription}
                              onChange={(e) =>
                                setCustomBackgroundDescription(e.target.value)
                              }
                              className="min-h-[100px] resize-none rounded-xl"
                              maxLength={300}
                            />
                            <div className="flex items-center justify-end">
                              <span className="text-xs text-muted-foreground">
                                {customBackgroundDescription.length}/300
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Output Aspect Ratio - independent component */}
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
                        {ASPECT_OPTIONS.find((o) => o.id === selectedAspect) ? (
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
                                <div className="font-medium">{opt.label}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleProcessImage}
                  disabled={
                    !uploadedImage ||
                    isProcessing ||
                    (backgroundMode === 'background' && !selectedBackground) ||
                    (backgroundMode === 'background' &&
                      selectedBackground === 'custom' &&
                      !customBackgroundDescription.trim())
                  }
                  className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Process Image (10 credits)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Output area */}
          <div className="flex-1">
            <Card className="gap-6 py-6 border shadow-md h-full flex flex-col rounded-2xl bg-white min-h-[588px]">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 relative h-full">
                {processedImage ? (
                  /* Result state - show processed image with background change interface */
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 px-4">
                    {/* Background Type Toggle */}
                    <div className="flex items-center justify-center mb-4 w-full">
                      <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 w-[160px]">
                        <button
                          type="button"
                          onClick={() => setShowAfter(false)}
                          className={cn(
                            'flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all',
                            !showAfter
                              ? 'bg-white text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Before
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAfter(true)}
                          className={cn(
                            'flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all',
                            showAfter
                              ? 'bg-white text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          After
                        </button>
                      </div>
                    </div>

                    {/* Main image display */}
                    <div
                      className={cn(
                        'relative w-full max-w-sm mb-4',
                        // 根据选择的宽高比动态调整容器样式
                        selectedAspect === '1:1' || selectedAspect === 'original'
                          ? 'aspect-square' // 1:1 或原始比例保持正方形
                          : selectedAspect === '3:2'
                          ? 'aspect-[3/2]' // 3:2 宽图
                          : selectedAspect === '2:3'
                          ? 'aspect-[2/3]' // 2:3 高图
                          : 'aspect-square' // 默认正方形
                      )}
                    >
                      {/* 移除关闭按钮，简化用户体验 */}

                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundImage:
                            showAfter &&
                            backgroundMode === 'color' &&
                            selectedBackgroundColor === 'transparent'
                              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                              : 'none',
                          backgroundSize:
                            showAfter &&
                            backgroundMode === 'color' &&
                            selectedBackgroundColor === 'transparent'
                              ? '20px 20px'
                              : 'auto',
                          backgroundPosition:
                            showAfter &&
                            backgroundMode === 'color' &&
                            selectedBackgroundColor === 'transparent'
                              ? '0 0, 0 10px, 10px -10px, -10px 0px'
                              : 'auto',
                          backgroundColor:
                            showAfter &&
                            backgroundMode === 'color' &&
                            selectedBackgroundColor !== 'transparent'
                              ? selectedBackgroundColor
                              : 'transparent',
                        }}
                      />
                      <Image
                        src={
                          showAfter
                            ? afterImageSrc || processedImage || ''
                            : beforeImageSrc || imagePreview || ''
                        }
                        alt="AI Background processed result"
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                      />
                    </div>

                    {/* 移除第二个颜色选择器，避免与第一个选择器冲突 */}
                    {/* 用户应该在处理前选择颜色，而不是处理后 */}

                    {/* Download button */}
                    <Button
                      onClick={handleDownload}
                      className="bg-white border border-black rounded-2xl px-8 py-4 text-[14px] font-semibold text-black hover:bg-gray-50"
                    >
                      Download
                    </Button>
                  </div>
                ) : isProcessing ? (
                  /* Loading state - show progress bar and loading animation */
                  <div className="flex items-center justify-center p-8 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        {/* 用户选择的图片带灰色遮罩 */}
                        <div className="relative">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Processing your upload"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          ) : selectedDemoImage ? (
                            <img
                              src={selectedDemoImage}
                              alt="Processing your selected demo"
                              width={400}
                              height={300}
                              className="object-contain rounded-lg shadow-lg max-w-full max-h-full opacity-30 grayscale"
                            />
                          ) : (
                            <Image
                              src="/hero-1.webp"
                              alt="AI Background Example"
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
                                {backgroundMode === 'color'
                                  ? 'Removing Background...'
                                  : 'Generating AI Background...'}
                              </span>
                            </div>

                            {/* 进度条 - 与Productshot保持一致 */}
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

                            {/* Main loading message */}
                            <div className="text-white text-center max-w-sm">
                              <p>
                                {backgroundMode === 'color'
                                  ? 'Removing background with AI precision...'
                                  : 'Creating your AI-generated background...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : imagePreview ? (
                  /* Uploaded image preview state - show uploaded image before processing */
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 px-4">
                    {/* Main image display */}
                    <div
                      className={cn(
                        'relative w-full max-w-sm mb-4',
                        // 根据选择的宽高比动态调整容器样式
                        selectedAspect === '1:1' || selectedAspect === 'original'
                          ? 'aspect-square' // 1:1 或原始比例保持正方形
                          : selectedAspect === '3:2'
                          ? 'aspect-[3/2]' // 3:2 宽图
                          : selectedAspect === '2:3'
                          ? 'aspect-[2/3]' // 2:3 高图
                          : 'aspect-square' // 默认正方形
                      )}
                    >
                      <Image
                        src={imagePreview}
                        alt="Uploaded image preview"
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain rounded-lg transition-all duration-300 ease-out"
                      />
                    </div>

                    {/* Upload info */}
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">
                        {backgroundMode === 'color'
                          ? 'Your image is ready! Click "Process Image" to remove background.'
                          : 'Your image is ready! Click "Process Image" to generate AI background.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Default state - show demo images according to Figma design */
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>

                {/* Mode switch confirmation dialog */}
        <Dialog
          open={showModeSwitchDialog}
          onOpenChange={setShowModeSwitchDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Generated Image?</DialogTitle>
              <DialogDescription>
                You have an unsaved image. Switching modes will lose your
                current result. Would you like to save before switching?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModeSwitchDialog(false);
                  setPendingModeSwitch(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // 直接切换模式，不保存
                  if (pendingModeSwitch) {
                    performModeSwitch(pendingModeSwitch);
                  }
                }}
              >
                Switch Directly
              </Button>
              <Button
                onClick={() => {
                  // 保存图片并切换模式
                  if (pendingModeSwitch && processedImage) {
                    // 触发图片下载
                    const link = document.createElement('a');
                    link.href = processedImage;
                    link.download = 'ai-background-result.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Image saved successfully');

                    // 然后切换模式
                    performModeSwitch(pendingModeSwitch);
                  }
                }}
              >
                Save & Switch
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Insufficient credits dialog */}
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          required={creditsError?.required || 0}
          current={creditsError?.current || 0}
        />

        {/* Color picker */}
        <ColorPicker
          open={showColorPicker}
          onOpenChange={setShowColorPicker}
          value={customColor}
          onChange={handleCustomColorChange}
        />
      </div>
    </section>
  );
}

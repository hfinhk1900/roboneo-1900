'use client';

import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
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
import { cn } from '@/lib/utils';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DownloadIcon,
  ImagePlusIcon,
  LoaderIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useState, useEffect, useRef } from 'react';
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
    id: 'remove-background',
    name: 'Remove Background',
    icon: '✂️',
    prompt: 'remove the background completely, make background transparent or white, keep only the main subject, clean edges, no background elements'
  },
  {
    id: 'gradient-abstract',
    name: 'Abstract Gradient',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/gradient-aura.png',
    prompt: 'smooth gradient background, modern abstract colors, soft transitions, clean aesthetic, vibrant color blending'
  },
  {
    id: 'texture-fabric',
    name: 'Fabric Texture',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/silk-fabric.png',
    prompt: 'luxurious silk fabric background, smooth golden fabric texture, elegant material draping, soft fabric folds, premium textile surface'
  },
  {
    id: 'nature-blur',
    name: 'Nature Blur',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/gardenbokeh.png',
    prompt: 'natural blurred background, bokeh effect, soft focus nature scene, warm ambient light, garden atmosphere'
  },
  {
    id: 'urban-blur',
    name: 'Urban Blur',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/studio-spotlight.png',
    prompt: 'blurred urban background, soft city lights, bokeh street scene, modern atmosphere'
  },
  {
    id: 'wood-surface',
    name: 'Wood Surface',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/naturalwood.png',
    prompt: 'wooden surface background, natural wood grain texture, warm brown tones, table surface, rustic wooden table'
  },
  {
    id: 'marble-stone',
    name: 'Marble Stone',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/luxurymarble.png',
    prompt: 'marble stone background, elegant natural patterns, luxury surface texture, neutral colors, premium marble surface'
  },
  {
    id: 'fabric-cloth',
    name: 'Soft Fabric',
    image: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/aibg-preset/silk-fabric.png',
    prompt: 'soft fabric background, silk or cotton texture, gentle folds and draping, elegant material'
  },
  {
    id: 'paper-vintage',
    name: 'Vintage Paper',
    icon: '📜',
    prompt: 'vintage paper background, aged texture, warm cream tones, subtle aging effects'
  },
  {
    id: 'custom',
    name: 'Custom Background',
    icon: '🎨',
    prompt: '' // Will be filled by user input
  },
];

type BackgroundType = 'remove-background' | 'gradient-abstract' | 'texture-fabric' | 'nature-blur' | 'urban-blur' | 'wood-surface' | 'marble-stone' | 'fabric-cloth' | 'paper-vintage' | 'custom';

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
    beforeSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg01.png',
    afterSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg01.png',
    alt: 'AI Background Demo - Portrait 1',
    type: 'portrait',
  },
  {
    id: 2,
    beforeSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg02.png',
    afterSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg02.png',
    alt: 'AI Background Demo - Portrait 2',
    type: 'portrait',
  },
  {
    id: 3,
    beforeSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/noremovebg03.png',
    afterSrc: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg03.png',
    alt: 'AI Background Demo - Still Life',
    type: 'still-life',
  },
];

export function AIBackgroundGeneratorSection() {
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

  const [selectedBackgroundColor, setSelectedBackgroundColor] =
    useState<string>('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState<string>('#E25241');

  // New background style state
  const [backgroundMode, setBackgroundMode] = useState<'color' | 'background'>('background');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType | ''>('');
  const [customBackgroundDescription, setCustomBackgroundDescription] = useState<string>('');
  const [showBackgroundInput, setShowBackgroundInput] = useState(false);

  // Track the current display image for before/after toggle
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(true); // State for Before/After toggle

  // Optimize toggle performance by pre-calculating image sources
  const [beforeImageSrc, setBeforeImageSrc] = useState<string | null>(null);
  const [afterImageSrc, setAfterImageSrc] = useState<string | null>(null);

  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

  // Track the currently selected demo image for loading state
  const [selectedDemoImage, setSelectedDemoImage] = useState<string | null>(null);
  const [selectedDemoImageData, setSelectedDemoImageData] = useState<(typeof DEMO_IMAGES)[0] | null>(null);

  // Track active intervals to prevent multiple simultaneous processing
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug effect to monitor selectedBackgroundColor changes
  useEffect(() => {
    console.log('selectedBackgroundColor changed to:', selectedBackgroundColor);
  }, [selectedBackgroundColor]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, []);

  // Image upload handling
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setUploadedImage(file);
      setProcessedImage(null); // Clear previous results
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

    // Demo image click handling
  const handleDemoImageClick = async (demoImage: (typeof DEMO_IMAGES)[0]) => {
    // Prevent multiple simultaneous processing
    if (isProcessing) {
      return;
    }

    // Clear any existing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setSelectedDemoImage(demoImage.afterSrc); // Set the selected demo image (after state)
    setSelectedDemoImageData(demoImage); // Store the full demo image data
    setCurrentDisplayImage(demoImage.afterSrc); // Set current display image

    // Pre-calculate image sources for better performance
    setBeforeImageSrc(demoImage.beforeSrc);
    setAfterImageSrc(demoImage.afterSrc);

    // Simulate 3-second loading for demo images
    processingIntervalRef.current = setInterval(() => {
      setProcessingProgress((prev) => {
                  if (prev >= 100) {
            if (processingIntervalRef.current) {
              clearInterval(processingIntervalRef.current);
              processingIntervalRef.current = null; // Prevent re-entry

              setIsProcessing(false);
              // Load the processed demo image
              setProcessedImage(demoImage.afterSrc);

              // Set default background color to transparent (mosaic) for demo images
              // This will show the "After" state with mosaic background
              setTimeout(() => {
                setSelectedBackgroundColor('transparent');
                console.log('Demo image processing completed, setting background to transparent (After state)');
              }, 0);

              // Use setTimeout to avoid React rendering conflicts
              setTimeout(() => {
                toast.success('Demo image loaded successfully!');
              }, 100);
            }
            return 100;
          }
        return prev + 100 / 30; // 30 steps over 3 seconds (100ms each)
      });
    }, 100);
  };

  // Background color handling
  const handleBackgroundColorSelect = (color: string) => {
    if (color === 'custom') {
      setShowColorPicker(true);
    } else {
      setSelectedBackgroundColor(color);
      // Background color application logic can be added here
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
  function parseAspectRatio(aspect?: string): { w: number; h: number } | undefined {
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

            // Determine output canvas size (scale longest side to maxSide)
            let canvasW = 0;
            let canvasH = 0;
            if (targetRatio >= 1) {
              canvasW = maxSide;
              canvasH = Math.round(maxSide / targetRatio);
            } else {
              canvasH = maxSide;
              canvasW = Math.round(maxSide * targetRatio);
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
            reject(new Error('Failed to generate base64 data from processed image'));
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

  // Convert aspect ratio format for API (kept for compatibility)
  const convertAspectRatioToSize = (aspectRatio: string): string => {
    switch (aspectRatio) {
      case 'original': return '1024x1024'; // Default size, will maintain original proportions
      case '1:1': return '1024x1024';
      case '2:3': return '768x1152'; // Tall
      case '3:2': return '1152x768'; // Wide
      default: return '1024x1024';
    }
  };

  // Process image with real AI Background API
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
    setSelectedDemoImage(null); // Clear demo image selection when processing uploaded image
    setSelectedDemoImageData(null); // Clear demo image data
    setCurrentDisplayImage(null); // Clear current display image

    try {
      // Process uploaded image with aspect ratio handling (similar to ProductShot)
      console.log('📸 Processing image with aspect ratio handling...');
      const imageBase64 = await fileToBase64(
        uploadedImage,
        parseAspectRatio(selectedAspect)
      );
      console.log(`✅ Image processed: ${imageBase64.length} characters`);

      // Prepare API request payload
      const apiPayload: any = {
        image_input: imageBase64,
        backgroundMode: backgroundMode,
        quality: 'standard',
        steps: 25,
        size: convertAspectRatioToSize(selectedAspect),
        output_format: 'png'
      };

      // Add background-specific parameters
      if (backgroundMode === 'color') {
        // For Solid Color mode, use remove-background to get transparent background
        apiPayload.backgroundType = 'remove-background';
        apiPayload.backgroundColor = selectedBackgroundColor === customColor ? customColor : selectedBackgroundColor;
      } else if (backgroundMode === 'background') {
        apiPayload.backgroundType = selectedBackground;
        if (selectedBackground === 'custom' && customBackgroundDescription.trim()) {
          apiPayload.customBackgroundDescription = customBackgroundDescription.trim();
        }
      }

      console.log('🚀 Calling AI Background API with payload:', {
        ...apiPayload,
        image_input: '[base64 image data]' // Don't log the full base64 string
      });

      // Start progress simulation while waiting for API response
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            return 90; // Stop at 90% until API responds
          }
          return prev + 5;
        });
      }, 300);

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
        console.error(`AI Background API error: HTTP ${response.status} ${response.statusText}`);

        let errorData;
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
            current: errorData.current || 0
          });
          setShowCreditsDialog(true);
          return;
        }
        if (response.status === 401) {
          throw new Error('Please log in to use AI Background');
        }

        // 提供更详细的错误信息
        const errorMessage = errorData.error || errorData.details || errorData.message || `HTTP ${response.status} error`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ AI Background API success:', result);

      // Complete progress
      setProcessingProgress(100);

      // Set the processed image
      setProcessedImage(result.resultUrl);
      setAfterImageSrc(result.resultUrl);
      setBeforeImageSrc(imagePreview);
      setCurrentDisplayImage(result.resultUrl);

      // Show success message
      setTimeout(() => {
        setProcessingProgress(0);
        toast.success(`AI Background generated successfully! Used ${result.credits_used} credits.`);
      }, 1000);

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
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply background color to processed image
  const applyBackgroundColor = (imageUrl: string, backgroundColor: string): Promise<string> => {
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
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill background color if it's not transparent
          if (backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Draw the processed image on top
          ctx.drawImage(image, 0, 0);

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
            Upload any photo and generate stunning custom backgrounds with AI - from solid colors to artistic styles.
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
                            className="object-cover"
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
                        onClick={() => setBackgroundMode('background')}
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
                        onClick={() => setBackgroundMode('color')}
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
                          onClick={() => handleBackgroundColorSelect('transparent')}
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
                                <rect x="5" y="0" width="5" height="5" fill="#e5e7eb" />
                                <rect x="0" y="5" width="5" height="5" fill="#e5e7eb" />
                                <rect x="5" y="5" width="5" height="5" fill="#ffffff" />
                              </pattern>
                            </defs>
                                <rect width="48" height="48" fill="url(#mosaic-left)" />
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
                        {PRESET_COLORS.filter(color => color.value !== 'transparent' && color.value !== 'custom').map((color) => (
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
                            onClick={() => handleBackgroundColorSelect(color.value)}
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
                                  color.value === '#FFFFFF' || color.value === '#ffeaa7' ? 'text-gray-700' : 'text-white'
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
                            selectedBackgroundColor === customColor
                              ? 'border-yellow-500 border-opacity-100 scale-110 shadow-lg ring-1 ring-yellow-200'
                              : 'border-gray-300 hover:border-gray-400'
                          )}
                          style={{
                            background: selectedBackgroundColor === customColor
                              ? customColor
                              : 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd)'
                          }}
                          title="Custom Color"
                        >
                          {selectedBackgroundColor === customColor ? (
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
                            <span className="text-xs font-medium text-gray-700 leading-tight">Custom Style</span>
                          </div>
                        </button>
                      </div>

                      {/* Custom Background Description Input */}
                      {selectedBackground === 'custom' && showBackgroundInput && (
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
                            onChange={(e) => setCustomBackgroundDescription(e.target.value)}
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

                <Button
                  onClick={handleProcessImage}
                  disabled={!uploadedImage || isProcessing || (backgroundMode === 'background' && !selectedBackground) || (selectedBackground === 'custom' && !customBackgroundDescription.trim())}
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
                    <div className="relative w-full max-w-sm aspect-square mb-4">
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => {
                          setProcessedImage(null);
                          setCurrentDisplayImage(null);
                          setShowAfter(true);
                        }}
                        className="absolute -top-2 -right-2 z-20 bg-white hover:bg-gray-100 border border-gray-300 rounded-full p-1.5 shadow-md transition-all duration-200 hover:scale-110"
                        title="Close preview"
                      >
                        <XIcon className="h-4 w-4 text-gray-600" />
                      </button>

                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundImage:
                            showAfter && selectedBackgroundColor === 'transparent'
                              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                              : 'none',
                          backgroundSize:
                            showAfter && selectedBackgroundColor === 'transparent'
                              ? '20px 20px'
                              : 'auto',
                          backgroundPosition:
                            showAfter && selectedBackgroundColor === 'transparent'
                              ? '0 0, 0 10px, 10px -10px, -10px 0px'
                              : 'auto',
                          backgroundColor:
                            showAfter && selectedBackgroundColor !== 'transparent'
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
                        className="object-contain rounded-lg transition-all duration-300 ease-out relative z-10"
                      />
                    </div>

                    {/* Background color selection - 只在 solid color 模式下显示 */}
                    {backgroundMode === 'color' && (
                      <div className="flex flex-wrap gap-2 items-center justify-center mb-4 w-full max-w-xs">
                        {/* Transparent (mosaic) button */}
                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedBackgroundColor('transparent');
                            // 应用透明背景效果
                            if (processedImage) {
                              try {
                                const transparentImage = await applyBackgroundColor(processedImage, 'transparent');
                                setCurrentDisplayImage(transparentImage);
                                setAfterImageSrc(transparentImage);
                                console.log('Applied transparent background');
                              } catch (error) {
                                console.error('Failed to apply transparent background:', error);
                                toast.error('Failed to apply transparent background');
                              }
                            }
                          }}
                          className={`rounded-2xl size-8 hover:scale-105 transition-transform cursor-pointer flex-shrink-0 overflow-hidden border-2 ${
                            selectedBackgroundColor === 'transparent'
                              ? 'border-blue-500 border-opacity-70'
                              : 'border-gray-300'
                          }`}
                          title="Transparent Background"
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            className="w-full h-full"
                          >
                            <defs>
                              <pattern
                                id="mosaic"
                                patternUnits="userSpaceOnUse"
                                width="8"
                                height="8"
                              >
                                <rect width="4" height="4" fill="#ffffff" />
                                <rect x="4" y="0" width="4" height="4" fill="#e5e7eb" />
                                <rect x="0" y="4" width="4" height="4" fill="#e5e7eb" />
                                <rect x="4" y="4" width="4" height="4" fill="#ffffff" />
                              </pattern>
                            </defs>
                            <rect width="32" height="32" fill="url(#mosaic)" />
                          </svg>
                        </button>

                        {PRESET_COLORS.slice(0, 4).map((color) => (
                          <button
                            type="button"
                            key={color.value}
                            className={`rounded-2xl size-8 hover:scale-105 transition-transform cursor-pointer flex-shrink-0 border-2 ${
                              selectedBackgroundColor === color.value
                                ? 'border-blue-500 border-opacity-70'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={async () => {
                              setSelectedBackgroundColor(color.value);
                              // 应用背景颜色效果
                              if (processedImage) {
                                try {
                                  const coloredImage = await applyBackgroundColor(processedImage, color.value);
                                  setCurrentDisplayImage(coloredImage);
                                  setAfterImageSrc(coloredImage);
                                  console.log(`Applied background color: ${color.value}`);
                                } catch (error) {
                                  console.error('Failed to apply background color:', error);
                                  toast.error('Failed to apply background color');
                                }
                              }
                            }}
                            title={color.name}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(true)}
                          className={`rounded-full size-8 hover:scale-105 transition-transform cursor-pointer flex-shrink-0 border-2 flex items-center justify-center ${
                            selectedBackgroundColor === customColor
                              ? 'border-blue-500 border-opacity-70'
                              : 'border-gray-300'
                          }`}
                          style={{
                            background: selectedBackgroundColor === customColor
                              ? customColor
                              : 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd)'
                          }}
                          title="Custom Color"
                        >
                          <svg
                            width="16"
                            height="16"
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
                        </button>
                      </div>
                    )}

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
                                Processing...
                              </span>
                            </div>

                            {/* 进度条 */}
                            <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: `${processingProgress}%` }}
                              />
                            </div>

                            {/* 进度百分比 */}
                            <div className="text-white text-sm font-medium">
                              {Math.round(processingProgress)}%
                            </div>

                            {/* Loading message */}
                            <div className="text-white text-center max-w-sm">
                              <p>Removing background from your image...</p>
                            </div>
                          </div>
                        </div>
                      </div>
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

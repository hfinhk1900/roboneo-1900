'use client';

import { CreditsDisplay } from '@/components/shared/credits-display';
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
import { cn } from '@/lib/utils';
import {
  BoxIcon,
  CameraIcon,
  DownloadIcon,
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
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// 导入新的 ProductShot 功能
import {
  DEFAULT_SCENES,
  type SceneConfig,
  type SceneType,
  useProductShot,
} from '@/ai/image/hooks/use-productshot';

// 6种专业产品摄影场景图标映射
const sceneIcons = {
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

  // 使用新的 ProductShot Hook
  const {
    isLoading,
    result,
    error,
    availableScenes,
    generateProductShot,
    clearResult,
    downloadImage,
    fetchAvailableScenes,
  } = useProductShot();

  // 初始化时获取可用场景
  useEffect(() => {
    fetchAvailableScenes();
  }, []);

  // 使用默认场景或从API获取的场景
  const scenes = availableScenes.length > 0 ? availableScenes : DEFAULT_SCENES;
  const selectedSceneConfig = scenes.find(
    (scene) => scene.id === selectedScene
  );

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
    if (!result?.resultUrl) return;

    const filename = `productshot-${selectedSceneConfig?.name}-${Date.now()}.png`;
    await downloadImage(result.resultUrl, filename);
  };

  const handleImageClick = () => {
    if (result?.resultUrl) {
      setShowImagePreview(true);
    }
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

                <div className="space-y-5 flex-grow">
                  {/* Image Upload Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Product Image (Required)
                    </Label>

                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={cn(
                        'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-32 bg-[#f5f5f5] border border-border',
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
                                      {sceneIcons[scene.id]}
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
                {result?.resultUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <button
                      type="button"
                      className="relative w-full max-w-md aspect-square cursor-pointer group transition-all duration-200 hover:scale-[1.02] border-none bg-transparent p-0"
                      onClick={handleImageClick}
                      title="Click to view full size"
                    >
                      <Image
                        src={result.resultUrl}
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
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Download Image
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
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-gradient-to-br from-black/90 to-black/95 border-none backdrop-blur-md overflow-hidden">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Generated Product Shot
                </DialogTitle>
                <DialogDescription className="text-gray-300 text-sm mt-1">
                  Scene: {selectedSceneConfig?.name || 'Custom'} • Aspect Ratio:{' '}
                  {selectedAspect === 'original' ? 'Original' : selectedAspect}
                </DialogDescription>
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
            {result?.resultUrl && (
              <div className="relative max-w-[90%] max-h-[80%] transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={result.resultUrl}
                  alt={`Generated product shot - ${selectedSceneConfig?.name || 'Unknown scene'}`}
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
                  handleDownload();
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

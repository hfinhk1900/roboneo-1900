'use client';

import { CreditsDisplay } from '@/components/shared/credits-display';
import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// 导入新的 ProductShot 功能
import {
  DEFAULT_SCENES,
  type SceneConfig,
  type SceneType,
  useProductShot,
} from '@/ai/image/hooks/use-productshot';

// 场景图标映射
const sceneIcons = {
  'studio-model': '👤',
  'lifestyle-casual': '🏠',
  'outdoor-adventure': '🏔️',
  'elegant-evening': '✨',
  'street-style': '🏙️',
  'minimalist-clean': '🎯',
  custom: '🎨',
} as const;

// 新增：产品呈现方式提示映射
const PRESENTATION_HINTS: Record<
  | 'model'
  | 'studio-white'
  | 'studio-shadow'
  | 'home-lifestyle'
  | 'nature-outdoor'
  | 'table-flatlay'
  | 'minimalist-clean',
  string
> = {
  model:
    'with a person model interacting with the product, natural human interaction',
  'studio-white':
    'product-only, no person, isolated on pure white seamless background, soft studio lighting',
  'studio-shadow':
    'product-only, no person, on white background with distinct studio shadows, high-contrast studio lighting',
  'home-lifestyle': 'product featured in cozy home lifestyle setting',
  'nature-outdoor': 'product shown in natural outdoor environment',
  'table-flatlay':
    'product-only, no person, flat lay on tabletop, overhead shot, realistic soft shadows',
  'minimalist-clean': 'product-only, no person, minimalist clean background',
};

export default function ProductShotGeneratorSection() {
  const [additionalContext, setAdditionalContext] = useState('');
  const [selectedScene, setSelectedScene] = useState<SceneType | ''>('');
  const [customSceneDescription, setCustomSceneDescription] = useState('');
  const [productTypeHint, setProductTypeHint] = useState<
    'small' | 'medium' | 'large' | 'auto'
  >('auto');
  // 新增：呈现方式选择
  const [presentationStyle, setPresentationStyle] = useState<
    | 'model'
    | 'studio-white'
    | 'studio-shadow'
    | 'home-lifestyle'
    | 'nature-outdoor'
    | 'table-flatlay'
    | 'minimalist-clean'
  >('model');
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
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

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Please upload a product image');
      return;
    }

    if (!selectedScene) {
      toast.error('Please select a scene type');
      return;
    }

    try {
      // 合并用户上下文与呈现方式提示
      const presentationHint = PRESENTATION_HINTS[presentationStyle];
      const mergedAdditionalContext = [
        additionalContext.trim(),
        presentationHint,
      ]
        .filter(Boolean)
        .join(', ');

      await generateProductShot({
        sceneType: selectedScene,
        uploaded_image: uploadedImage,
        customSceneDescription:
          selectedScene === 'custom' ? customSceneDescription : undefined,
        additionalContext: mergedAdditionalContext || undefined,
        productTypeHint: productTypeHint,
        quality: 'standard',
      });
    } catch (err) {
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
            <Card className="relative overflow-hidden border shadow-md rounded-2xl bg-white">
              <CardContent className="pt-6 px-6 pb-4 space-y-5">
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

                <div className="space-y-5">
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
                        'rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-48 bg-[#f5f5f5] border border-border',
                        isDragOver && 'bg-muted/50 border-primary'
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />

                      {imagePreview ? (
                        <>
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden rounded-lg bg-white">
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

                  <div className="space-y-3">
                    {/* 产品类型选择器 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Product Size Hint (Optional)
                      </Label>
                      <Select
                        value={productTypeHint}
                        onValueChange={(value) =>
                          setProductTypeHint(
                            value as 'small' | 'medium' | 'large' | 'auto'
                          )
                        }
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue placeholder="Auto-detect from scene" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            <div className="flex items-center gap-2">
                              <span>🤖 Auto-detect</span>
                              <span className="text-sm transition-colors text-muted-foreground">
                                Smart detection based on scene
                              </span>
                            </div>
                          </SelectItem>
                          <SelectSeparator />
                          <SelectItem value="small">
                            <div className="flex items-center gap-2">
                              <span>📱 Small</span>
                              <span className="text-sm transition-colors text-muted-foreground">
                                Jewelry, cosmetics, accessories
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <span>👜 Medium</span>
                              <span className="text-sm transition-colors text-muted-foreground">
                                Bags, shoes, books, clothing
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="large">
                            <div className="flex items-center gap-2">
                              <span>🛋️ Large</span>
                              <span className="text-sm transition-colors text-muted-foreground">
                                Furniture, large decor items
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      id="additional-context"
                      placeholder="e.g. small perfume bottle', 'compact jewelry', 'handheld device', or styling requests like 'warm lighting', 'elegant mood'"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      className="min-h-[120px] resize-none rounded-xl"
                      maxLength={500}
                      aria-label="Additional context for AI scene generation"
                    />
                  </div>

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
                          {/* Preset Scenes */}
                          {scenes
                            .filter((scene) => scene.id !== 'custom')
                            .map((scene) => (
                              <SelectItem
                                key={scene.id}
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
                                  </div>
                                </div>
                              </SelectItem>
                            ))}

                          {/* Separator between preset and custom scenes */}
                          <SelectSeparator className="my-1" />

                          {/* Custom Scene */}
                          {scenes
                            .filter((scene) => scene.id === 'custom')
                            .map((scene) => (
                              <SelectItem
                                key={scene.id}
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
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 新增：Presentation Style 选择器 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Presentation Style
                    </Label>
                    <Select
                      value={presentationStyle}
                      onValueChange={(v) =>
                        setPresentationStyle(v as typeof presentationStyle)
                      }
                    >
                      <SelectTrigger
                        className="w-full rounded-2xl bg-white border border-input cursor-pointer"
                        style={{ height: '46px', padding: '0px 12px' }}
                      >
                        <SelectValue placeholder="Select presentation style" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md !bg-opacity-100">
                        <SelectItem value="model">
                          <span className="text-sm transition-colors">
                            Model presentation
                          </span>
                        </SelectItem>
                        <SelectSeparator />
                        <SelectItem value="studio-white">
                          <span className="text-sm transition-colors">
                            Studio White
                          </span>
                        </SelectItem>
                        <SelectItem value="studio-shadow">
                          <span className="text-sm transition-colors">
                            Studio Shadow
                          </span>
                        </SelectItem>
                        <SelectSeparator />
                        <SelectItem value="home-lifestyle">
                          <span className="text-sm transition-colors">
                            Home Lifestyle
                          </span>
                        </SelectItem>
                        <SelectItem value="nature-outdoor">
                          <span className="text-sm transition-colors">
                            Nature Outdoor
                          </span>
                        </SelectItem>
                        <SelectSeparator />
                        <SelectItem value="table-flatlay">
                          <span className="text-sm transition-colors">
                            Table Flatlay
                          </span>
                        </SelectItem>
                        <SelectItem value="minimalist-clean">
                          <span className="text-sm transition-colors">
                            Minimalist Clean
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Scene Description Input - Only show when custom is selected */}
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

                  <Button
                    onClick={handleGenerate}
                    className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                    disabled={
                      !uploadedImage ||
                      !selectedScene ||
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
                      : 'Generate Product Scene'}
                  </Button>

                  {/* Credit info */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                    <CreditsDisplay />
                    <span>Powered by RoboNeo</span>
                  </div>
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
                    <div className="relative w-full max-w-md aspect-square">
                      <Image
                        src={result.resultUrl}
                        alt={`Generated product shot - ${selectedSceneConfig?.name || 'Unknown scene'}`}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Download Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative flex items-center justify-center">
                        <Image
                          src="/productshots/productshot.jpg"
                          alt="Product Scene Example"
                          width={400}
                          height={300}
                          className="object-contain rounded-lg shadow-lg max-w-full max-h-full"
                        />
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
    </section>
  );
}

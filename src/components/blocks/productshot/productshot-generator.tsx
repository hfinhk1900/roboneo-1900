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
  LoaderIcon,
  PackageIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UploadIcon,
  ImagePlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 导入新的 ProductShot 功能
import {
  useProductShot,
  DEFAULT_SCENES,
  type SceneType,
  type SceneConfig
} from '@/ai/image/hooks/use-productshot';

// 场景图标映射
const sceneIcons = {
  'studio-model': '👤',
  'lifestyle-casual': '🏠',
  'outdoor-adventure': '🏔️',
  'elegant-evening': '✨',
  'street-style': '🏙️',
  'minimalist-clean': '🎯',
  'custom': '🎨'
} as const;

export default function ProductShotGeneratorSection() {
  const [productDescription, setProductDescription] = useState('');
  const [selectedScene, setSelectedScene] = useState<SceneType | ''>('');
  const [customSceneDescription, setCustomSceneDescription] = useState('');
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 使用新的 ProductShot Hook
  const {
    isLoading,
    result,
    error,
    availableScenes,
    generateProductShot,
    clearResult,
    downloadImage,
    fetchAvailableScenes
  } = useProductShot();

  // 初始化时获取可用场景
  useEffect(() => {
    fetchAvailableScenes();
  }, []);

  // 使用默认场景或从API获取的场景
  const scenes = availableScenes.length > 0 ? availableScenes : DEFAULT_SCENES;
  const selectedSceneConfig = scenes.find(scene => scene.id === selectedScene);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  // Clear uploaded image
  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      toast.error('Please enter a product description');
      return;
    }

    try {
      // Enhanced product description with image context
      let enhancedDescription = productDescription;
      if (uploadedImage) {
        enhancedDescription += ' (based on uploaded product image)';
      }

      // Type guard to ensure selectedScene is not empty
      if (!selectedScene) {
        return;
      }

      await generateProductShot({
        productDescription: enhancedDescription,
        sceneType: selectedScene as SceneType,
        customSceneDescription: selectedScene === 'custom' ? customSceneDescription : undefined
      });
    } catch (error) {
      console.error('Error generating product shot:', error);
      // Error handling is done in the hook
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
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Product Shots
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Transform product descriptions into professional scene photography with FLUX.1-Kontext
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    Transform product descriptions into professional scene photography.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Image Upload Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Product Image (Optional)
                    </Label>
                    <div>
                      {imagePreview ? (
                        <div className="rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-48 bg-[#f5f5f5] border border-border">
                          <div className="relative max-w-28 max-h-28 w-full h-auto mx-auto mb-2 flex items-center justify-center">
                            <Image
                              src={imagePreview}
                              alt="Product preview"
                              width={112}
                              height={112}
                              className="object-contain rounded-lg max-w-full max-h-full w-auto h-auto"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {uploadedImage?.name}
                          </p>
                          <Button
                            onClick={clearImage}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 cursor-pointer"
                            aria-label="Remove uploaded image"
                          >
                            <Trash2Icon className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-all duration-200 cursor-pointer min-h-48 bg-[#f5f5f5] border border-border">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <ImagePlusIcon className="h-10 w-10 transition-colors text-muted-foreground" />
                            <p className="text-sm transition-colors text-muted-foreground">Click or drag & drop to upload</p>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="product-description"
                      className="text-sm font-medium"
                    >
                      Product Description
                    </Label>
                    <Textarea
                      id="product-description"
                      placeholder="Describe your product (e.g., 'red cotton t-shirt', 'leather hiking boots', 'silk evening dress')"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      className="min-h-[120px] resize-none rounded-xl"
                      maxLength={500}
                      aria-label="Product description for AI scene generation"
                    />
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-muted-foreground">
                        {productDescription.length}/500
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Photography Scene
                    </Label>
                    <Select
                      value={selectedScene}
                      onValueChange={(value) => setSelectedScene(value as SceneType | '')}
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
                            <span className="text-muted-foreground">Please select a photography scene</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-border shadow-md !bg-opacity-100">
                        <SelectGroup>
                          {/* Preset Scenes */}
                          {scenes.filter(scene => scene.id !== 'custom').map((scene) => (
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
                                <span className="text-2xl">{sceneIcons[scene.id]}</span>
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
                          {scenes.filter(scene => scene.id === 'custom').map((scene) => (
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
                                <span className="text-2xl">{sceneIcons[scene.id]}</span>
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
                        onChange={(e) => setCustomSceneDescription(e.target.value)}
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
                      !productDescription.trim() ||
                      !selectedScene ||
                      isLoading ||
                      (selectedScene === 'custom' && !customSceneDescription.trim())
                    }
                  >
                    {isLoading ? (
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="mr-2 h-5 w-5" />
                    )}
                    {isLoading
                      ? 'Generating Product Scene with FLUX.1-Kontext...'
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
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Scene: {result.sceneConfig.name} | Model: {result.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Credits used: {result.credits_used} | Processing: {result.processingTime}ms
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Download Image
                      </Button>
                      <Button
                        onClick={clearResult}
                        variant="ghost"
                        size="sm"
                      >
                        Generate Another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />
                      <div className="relative grid grid-cols-2 gap-4 p-8">
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <ShoppingBagIcon className="h-12 w-12 text-purple-500" />
                        </div>
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                          <CameraIcon className="h-12 w-12 text-blue-500" />
                        </div>
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <BoxIcon className="h-12 w-12 text-green-500" />
                        </div>
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <PackageIcon className="h-12 w-12 text-orange-500" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium">
                        Your AI-Generated Product Scene Will Appear Here
                      </p>
                      <p className="text-sm">
                        Powered by FLUX.1-Kontext for professional product scene generation
                      </p>
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

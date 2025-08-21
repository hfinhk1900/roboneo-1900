'use client';

import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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
import { useState } from 'react';
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

// Demo images configuration
const DEMO_IMAGES = [
  {
    id: 1,
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg01.png',
    alt: 'AI Background Demo - Portrait 1',
    type: 'portrait',
  },
  {
    id: 2,
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg02.png',
    alt: 'AI Background Demo - Portrait 2',
    type: 'portrait',
  },
  {
    id: 3,
    src: 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-aibg/removebg03.png',
    alt: 'AI Background Demo - Still Life',
    type: 'still-life',
  },
];

export function AIBackgroundGeneratorSection() {
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [selectedBackgroundColor, setSelectedBackgroundColor] =
    useState<string>('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState<string>('#E25241');

  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    required: number;
    current: number;
  } | null>(null);

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
  };

  // Demo image click handling
  const handleDemoImageClick = async (demoImage: (typeof DEMO_IMAGES)[0]) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate 3-second loading for demo images
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          // Load the processed demo image
          setProcessedImage(demoImage.src);
          // Use setTimeout to avoid React rendering conflicts
          setTimeout(() => {
            toast.success('Demo image loaded successfully!');
          }, 0);
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
      toast.success('Background color updated');
    }
  };

  const handleCustomColorChange = (color: string) => {
    setSelectedBackgroundColor(color);
    setCustomColor(color);
    toast.success('Custom color applied');
  };

  // Process image (simulation)
  const handleProcessImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          // Simulate processing completion
          setProcessedImage(imagePreview);
          // Use setTimeout to avoid React rendering conflicts
          setTimeout(() => {
            toast.success('Background removal completed!');
          }, 0);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Download processed result
  const handleDownload = () => {
    if (!processedImage) {
      toast.error('No image to download');
      return;
    }

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'ai-background-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded');
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
            Upload any photo and Roboneo's AI will instantly remove the
            background with precision.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input area */}
          <Card className="relative overflow-hidden border shadow-md h-[588px] flex flex-col rounded-2xl bg-white">
            <CardContent className="p-6 space-y-5 flex flex-col h-full">
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
                  Upload any photo and Roboneo's AI will instantly remove the
                  background with precision.
                </p>
              </div>

              <div className="space-y-5 flex flex-col flex-grow">
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
                      'rounded-lg p-8 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer flex-grow bg-[#f5f5f5] border border-border min-h-[280px]',
                      isDragOver && 'bg-muted/50 border-primary',
                      imagePreview && 'bg-muted/50 border-primary'
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

                {/* Background color selection */}
                {uploadedImage && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Background Color
                    </Label>
                    <div className="grid grid-cols-4 gap-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={cn(
                            'h-12 rounded-lg border-2 transition-all hover:scale-105',
                            selectedBackgroundColor === color.value
                              ? 'border-primary scale-105'
                              : 'border-muted-foreground/25'
                          )}
                          style={{
                            backgroundColor: color.value,
                            backgroundImage:
                              color.value === 'transparent'
                                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                                : 'none',
                            backgroundSize:
                              color.value === 'transparent'
                                ? '20px 20px'
                                : 'auto',
                            backgroundPosition:
                              color.value === 'transparent'
                                ? '0 0, 0 10px, 10px -10px, -10px 0px'
                                : 'auto',
                          }}
                          onClick={() =>
                            handleBackgroundColorSelect(color.value)
                          }
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Process button */}
                <Button
                  onClick={handleProcessImage}
                  disabled={!uploadedImage || isProcessing}
                  className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                      Processing... {processingProgress}%
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" />
                      Remove Background (10 credits)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Output area */}
          <div>
            <Card className="gap-6 py-6 border shadow-md h-[588px] flex flex-col rounded-2xl bg-white">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 relative h-full">
                {processedImage ? (
                  /* Result state - show processed image with background change interface */
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 px-4">
                    {/* Before/After toggle */}
                    <div className="flex items-center justify-center mb-4 w-full">
                      <div className="bg-[#d9d9d9] h-10 rounded-2xl flex items-center relative w-[160px]">
                        <div
                          className="bg-white h-9 rounded-2xl w-[78px] absolute left-0.5 top-0.5 transition-all duration-300"
                          style={{
                            transform:
                              selectedBackgroundColor === 'transparent'
                                ? 'translateX(0)'
                                : 'translateX(79px)',
                          }}
                        />
                        <button
                          onClick={() =>
                            setSelectedBackgroundColor('transparent')
                          }
                          className="relative z-10 h-10 w-[80px] text-[14px] font-medium text-black"
                        >
                          Before
                        </button>
                        <button
                          onClick={() =>
                            setSelectedBackgroundColor(
                              selectedBackgroundColor === 'transparent'
                                ? '#E25241'
                                : selectedBackgroundColor
                            )
                          }
                          className="relative z-10 h-10 w-[80px] text-[14px] font-medium text-black"
                        >
                          After
                        </button>
                      </div>
                    </div>

                    {/* Main image display */}
                    <div className="relative w-full max-w-sm aspect-square mb-4">
                      {/* Close button */}
                      <button
                        onClick={() => {
                          setProcessedImage(null);
                          setSelectedBackgroundColor('transparent');
                        }}
                        className="absolute -top-2 -right-2 z-10 bg-white hover:bg-gray-100 border border-gray-300 rounded-full p-1.5 shadow-md transition-all duration-200 hover:scale-110"
                        title="Close preview"
                      >
                        <XIcon className="h-4 w-4 text-gray-600" />
                      </button>

                      <Image
                        src={processedImage}
                        alt="AI Background processed result"
                        fill
                        className="object-contain rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor:
                            selectedBackgroundColor === 'transparent'
                              ? 'transparent'
                              : selectedBackgroundColor,
                        }}
                      />
                    </div>

                    {/* Background color selection */}
                    <div className="flex flex-wrap gap-2 items-center justify-center mb-4 w-full max-w-xs">
                      <div className="bg-[#3922d1] rounded-2xl size-8 flex items-center justify-center flex-shrink-0">
                        <Image
                          src={processedImage}
                          alt="Original"
                          width={32}
                          height={32}
                          className="rounded-2xl object-cover"
                        />
                      </div>
                      {PRESET_COLORS.slice(0, 4).map((color) => (
                        <button
                          key={color.value}
                          className="rounded-2xl size-8 hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: color.value }}
                          onClick={() =>
                            setSelectedBackgroundColor(color.value)
                          }
                          title={color.name}
                        />
                      ))}
                      <button
                        onClick={() => setShowColorPicker(true)}
                        className="rounded-2xl size-8 hover:scale-105 transition-transform cursor-pointer bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200 flex-shrink-0"
                        title="Custom Color"
                      />
                    </div>

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
                        {/* 用户上传的图片带灰色遮罩 */}
                        <div className="relative">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Processing your image"
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
                              <p className="text-sm mt-1">
                                This usually takes about 3 seconds
                              </p>
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
                          key={demoImage.id}
                          onClick={() => handleDemoImageClick(demoImage)}
                          className="bg-[#bcb3b3] overflow-hidden relative rounded-2xl shrink-0 size-[82px] hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Image
                            src={demoImage.src}
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

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditsDisplay } from '@/components/shared/credits-display';
import { InsufficientCreditsDialog } from '@/components/shared/insufficient-credits-dialog';
import { cn } from '@/lib/utils';
import {
  SparklesIcon,
  LoaderIcon,
  DownloadIcon,
  PackageIcon,
  ShoppingBagIcon,
  CameraIcon,
  BoxIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

const styleOptions = [
  { 
    value: 'minimalist', 
    label: 'Minimalist Studio', 
    icon: '🎨',
    description: 'Clean white background, professional lighting'
  },
  { 
    value: 'lifestyle', 
    label: 'Lifestyle Setting', 
    icon: '🏠',
    description: 'Product in natural environment'
  },
  { 
    value: 'floating', 
    label: '3D Floating', 
    icon: '✨',
    description: 'Floating product with soft shadows'
  },
  { 
    value: 'gradient', 
    label: 'Gradient Background', 
    icon: '🌈',
    description: 'Modern gradient backdrop'
  },
];

const examplePrompts = [
  "Luxury watch with leather strap, silver case, minimalist dial",
  "Organic skincare bottle, green glass, bamboo cap, natural ingredients label",
  "Wireless headphones, matte black, premium build quality",
  "Handcrafted ceramic coffee mug with geometric patterns",
];

export default function ProductShotSection() {
  const [productDescription, setProductDescription] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('minimalist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [creditsError, setCreditsError] = useState<{ required: number; current: number } | null>(null);

  const selectedOption = styleOptions.find(
    (option) => option.value === selectedStyle
  );

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      toast.error('Please enter a product description');
      return;
    }

    setGeneratedImageUrl(null);
    setIsGenerating(true);

    try {
      // TODO: Replace with actual API call
      // This is a placeholder for the API integration
      console.log('Generating product shot with:', {
        prompt: productDescription,
        style: selectedStyle,
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, set a placeholder image
      setGeneratedImageUrl('/hero-1.png');
      toast.success('Product shot generated successfully!');
    } catch (error) {
      console.error('Error generating product shot:', error);
      toast.error('Failed to generate product shot. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-shot-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  const handleExampleClick = (prompt: string) => {
    setProductDescription(prompt);
  };

  return (
    <>
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side: Text Input */}
        <div>
          <Card className="relative overflow-hidden border shadow-md rounded-2xl bg-white">
            <CardContent className="pt-6 px-6 pb-4 space-y-5">
              <div className="pb-1 pt-0">
                <h3 className="text-xl font-semibold mb-0.5 flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  Product Description
                </h3>
                <p className="text-muted-foreground">
                  Describe your product in detail for best results
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="product-description" className="text-sm font-medium">
                    Describe Your Product
                  </Label>
                  <Textarea
                    id="product-description"
                    placeholder="e.g., Modern minimalist coffee mug, matte black ceramic, 12oz capacity, ergonomic handle..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="min-h-[120px] resize-none rounded-xl"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-end">
                    <span className="text-xs text-muted-foreground">
                      {productDescription.length}/500
                    </span>
                  </div>
                </div>

                {/* Example Prompts */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Try an example:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(prompt)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {prompt.substring(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Photography Style</Label>
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
                            <span className="text-2xl">{selectedOption.icon}</span>
                            <div className="text-left">
                              <div className="font-medium">{selectedOption.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {selectedOption.description}
                              </div>
                            </div>
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
                              'cursor-pointer py-3 px-3 transition-colors',
                              'hover:bg-gray-100 hover:text-gray-900',
                              'focus:bg-gray-100 focus:text-gray-900',
                              'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{option.icon}</span>
                              <div className="text-left">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
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
                  onClick={handleGenerate}
                  className="w-full font-semibold h-[50px] rounded-2xl text-base cursor-pointer"
                  disabled={!productDescription.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <SparklesIcon className="mr-2 h-5 w-5" />
                  )}
                  {isGenerating ? 'Creating Your Product Shot...' : 'Generate Product Shot'}
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
              {generatedImageUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-full max-w-md aspect-square">
                    <Image
                      src={generatedImageUrl}
                      alt="Generated product shot"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Image
                  </Button>
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
                    <p className="text-lg font-medium">Your Product Shot Will Appear Here</p>
                    <p className="text-sm">
                      Describe your product and select a style to generate
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credits Dialog */}
      {showCreditsDialog && creditsError && (
        <InsufficientCreditsDialog
          open={showCreditsDialog}
          onOpenChange={setShowCreditsDialog}
          requiredCredits={creditsError.required}
          currentCredits={creditsError.current}
        />
      )}
    </>
  );
}

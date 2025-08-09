'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface OpenAIImageSettings {
  quality: 'low' | 'medium' | 'high' | 'auto';
  outputFormat: 'jpeg' | 'png' | 'webp';
  outputCompression?: number;
  background: 'default' | 'transparent';
  size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
}

interface OpenAISettingsProps {
  settings: OpenAIImageSettings;
  onSettingsChange: (settings: OpenAIImageSettings) => void;
  disabled?: boolean;
}

export function OpenAISettings({
  settings,
  onSettingsChange,
  disabled = false,
}: OpenAISettingsProps) {
  const updateSetting = <K extends keyof OpenAIImageSettings>(
    key: K,
    value: OpenAIImageSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const supportsCompression = ['jpeg', 'webp'].includes(settings.outputFormat);
  const supportsTransparency = ['png', 'webp'].includes(settings.outputFormat);

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">OpenAI 高级设置</CardTitle>
            <Badge variant="secondary" className="text-xs">
              gpt-image-1
            </Badge>
          </div>
          <CardDescription>
            配置 OpenAI 新一代图像生成模型的高级参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 图像质量 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="quality">图像质量</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    选择图像生成质量等级：
                    <br />• auto: 自动选择最佳质量
                    <br />• high: 最高质量，生成时间较长
                    <br />• medium: 平衡质量和速度
                    <br />• low: 快速生成，质量较低
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={settings.quality}
              onValueChange={(value) =>
                updateSetting(
                  'quality',
                  value as OpenAIImageSettings['quality']
                )
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动 (推荐)</SelectItem>
                <SelectItem value="high">高质量</SelectItem>
                <SelectItem value="medium">中等质量</SelectItem>
                <SelectItem value="low">低质量 (快速)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 输出格式 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="format">输出格式</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    选择图像输出格式：
                    <br />• webp: 现代格式，文件小，质量高
                    <br />• png: 支持透明背景，文件较大
                    <br />• jpeg: 经典格式，文件小，不支持透明
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={settings.outputFormat}
              onValueChange={(value) =>
                updateSetting(
                  'outputFormat',
                  value as OpenAIImageSettings['outputFormat']
                )
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP (推荐)</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 图像尺寸 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="size">图像尺寸</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    选择图像输出尺寸：
                    <br />• 1024x1024: 正方形，适合头像、logo
                    <br />• 1536x1024: 风景格式，适合横向图像
                    <br />• 1024x1536: 人像格式，适合竖向图像
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={settings.size}
              onValueChange={(value) =>
                updateSetting('size', value as OpenAIImageSettings['size'])
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">1024×1024 (正方形)</SelectItem>
                <SelectItem value="1536x1024">1536×1024 (风景)</SelectItem>
                <SelectItem value="1024x1536">1024×1536 (人像)</SelectItem>
                <SelectItem value="auto">自动</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 透明背景 */}
          {supportsTransparency && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="transparent">透明背景</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>生成具有透明背景的图像（仅 PNG 和 WebP 格式支持）</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                id="transparent"
                checked={settings.background === 'transparent'}
                onCheckedChange={(checked) =>
                  updateSetting(
                    'background',
                    checked ? 'transparent' : 'default'
                  )
                }
                disabled={disabled}
              />
            </div>
          )}

          {/* 压缩级别 */}
          {supportsCompression && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="compression">
                  压缩级别: {settings.outputCompression || 80}%
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      调整图像压缩级别：
                      <br />• 高压缩 (低值): 文件小，质量低
                      <br />• 低压缩 (高值): 文件大，质量高
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="compression"
                min={10}
                max={100}
                step={10}
                value={[settings.outputCompression || 80]}
                onValueChange={([value]) =>
                  updateSetting('outputCompression', value)
                }
                disabled={disabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>高压缩</span>
                <span>低压缩</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

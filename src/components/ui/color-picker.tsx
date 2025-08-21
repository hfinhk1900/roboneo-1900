'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckIcon, PaletteIcon } from 'lucide-react';
import React, { useState } from 'react';

interface ColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (color: string) => void;
}

// 预设颜色
const PRESET_COLORS = [
  '#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00', '#9ACD32', '#00FF00',
  '#00FA9A', '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2', '#FF00FF', '#FF1493',
  '#FF69B4', '#FFB6C1', '#F5F5DC', '#A0522D', '#8B4513', '#000000', '#696969',
  '#808080', '#C0C0C0', '#D3D3D3', '#FFFFFF'
];

export function ColorPicker({ open, onOpenChange, value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const handleConfirm = () => {
    onChange(customColor);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCustomColor(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PaletteIcon className="h-5 w-5" />
            Select Color
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current color preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Color</Label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-muted-foreground/25"
                style={{ backgroundColor: customColor }}
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full px-3 py-2 border border-muted-foreground/25 rounded-md text-sm font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color Picker</Label>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-full h-12 rounded-lg border-2 border-muted-foreground/25 cursor-pointer"
            />
          </div>

          {/* Preset colors */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preset Colors</Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'w-8 h-8 rounded-lg border-2 transition-all hover:scale-110',
                    customColor === color
                      ? 'border-primary scale-110'
                      : 'border-muted-foreground/25'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                >
                  {customColor === color && (
                    <CheckIcon className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

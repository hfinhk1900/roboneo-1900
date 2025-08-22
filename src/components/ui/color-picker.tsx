'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

interface ColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (color: string) => void;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl';

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

// Convert RGB to hex color
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  return { h, s, v };
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function ColorPicker({ open, onOpenChange, value, onChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);
  const [hue, setHue] = useState(240);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize color
  useEffect(() => {
    if (value) {
      const rgb = hexToRgb(value);
      if (rgb) {
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHue(hsv.h);
        setSaturation(hsv.s);
        setBrightness(hsv.v);
        setSelectedColor(value);
      }
    }
  }, [value]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFormatDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const rgb = hexToRgb(selectedColor) || { r: 0, g: 0, b: 255 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Handle 2D color area click
  const handleSaturationBrightnessChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (saturationRef.current) {
      const rect = saturationRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newSaturation = Math.max(0, Math.min(1, x / rect.width));
      const newBrightness = Math.max(0, Math.min(1, 1 - (y / rect.height)));
      
      setSaturation(newSaturation);
      setBrightness(newBrightness);
      
      const newRgb = hsvToRgb(hue, newSaturation, newBrightness);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setSelectedColor(newHex);
    }
  };
  
  const handleHueChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hueRef.current) {
      const rect = hueRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newHue = Math.max(0, Math.min(360, (x / rect.width) * 360));
      setHue(newHue);
      
      const newRgb = hsvToRgb(newHue, saturation, brightness);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setSelectedColor(newHex);
    }
  };
  
  const handleColorInputChange = (inputValue: string) => {
    let newRgb: { r: number; g: number; b: number } | null = null;
    
    if (colorFormat === 'hex') {
      newRgb = hexToRgb(inputValue);
    } else if (colorFormat === 'rgb') {
      const match = inputValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        newRgb = {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
    } else if (colorFormat === 'hsl') {
      const match = inputValue.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        newRgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      }
    }
    
    if (newRgb) {
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      const hsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
      setSelectedColor(newHex);
    }
  };
  
  const getColorValue = () => {
    switch (colorFormat) {
      case 'hex':
        return selectedColor;
      case 'rgb':
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'hsl':
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      default:
        return selectedColor;
    }
  };
  
  const handleConfirm = () => {
    onChange(selectedColor);
    onOpenChange(false);
  };
  
  const formatOptions = [
    { value: 'hex' as const, label: 'Hex' },
    { value: 'rgb' as const, label: 'RGB' },
    { value: 'hsl' as const, label: 'HSL' }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Choose Color</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          {/* 2D Color Saturation/Brightness Area */}
          <div 
            ref={saturationRef}
            className="relative w-full h-48 rounded-lg cursor-pointer border border-gray-200 overflow-hidden"
            style={{
              background: `
                linear-gradient(to top, #000000, transparent),
                linear-gradient(to right, #ffffff, hsl(${hue}, 100%, 50%))
              `
            }}
            onClick={handleSaturationBrightnessChange}
          >
            {/* Color picker circle */}
            <div 
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none"
              style={{
                left: `${saturation * 100}%`,
                top: `${(1 - brightness) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          
          {/* Hue Slider */}
          <div 
            ref={hueRef}
            className="relative w-full h-4 rounded-full cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
            onClick={handleHueChange}
          >
            <div 
              className="absolute top-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-md pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          
          {/* Format Selection and Color Value Input */}
          <div className="flex space-x-2">
            {/* Format Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <span className="text-sm font-medium">
                  {formatOptions.find(opt => opt.value === colorFormat)?.label}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {formatDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setColorFormat(option.value);
                        setFormatDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg",
                        colorFormat === option.value && "bg-blue-50 text-blue-600"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Color Value Input */}
            <input
              type="text"
              value={getColorValue()}
              onChange={(e) => handleColorInputChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 font-mono text-sm"
              placeholder={colorFormat === 'hex' ? '#000000' : colorFormat === 'rgb' ? 'rgb(0, 0, 0)' : 'hsl(0, 0%, 0%)'}
            />
          </div>
          
          {/* Confirm button */}
          <Button 
            onClick={handleConfirm}
            className="w-full"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

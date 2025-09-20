'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface GalleryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  onClick?: () => void;
}

export function GalleryImage({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  fallbackSrc = '/productshots/productshot.jpg',
  onClick,
}: GalleryImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`);
    setHasError(true);
    setIsLoading(false);

    // 尝试使用 fallback 图片
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg" />
      )}

      {/* Error state */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center rounded-lg">
          <div className="text-center p-2">
            <svg
              className="w-8 h-8 mx-auto text-gray-300 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-gray-400">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          onClick &&
            'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
          className
        )}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        priority={false}
        quality={90}
      />
    </div>
  );
}

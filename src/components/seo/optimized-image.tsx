'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  style,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // SEO优化的alt文本
  const seoAlt = alt.includes('roboneo') 
    ? alt 
    : `${alt} - Roboneo AI`;

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (fill) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <Image
          src={src}
          alt={seoAlt}
          fill
          quality={quality}
          sizes={sizes || '100vw'}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          style={style}
        />
      </>
    );
  }

  return (
    <div className={cn('relative', className)} style={style}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        src={src}
        alt={seoAlt}
        width={width || 800}
        height={height || 600}
        quality={quality}
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-auto transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        style={{ width: 'auto', height: 'auto', maxWidth: '100%', ...style }}
      />
    </div>
  );
}

// 响应式图片组件
export function ResponsiveImage({
  src,
  alt,
  className,
  aspectRatio = '16/9',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}) {
  return (
    <div 
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={priority}
      />
    </div>
  );
}

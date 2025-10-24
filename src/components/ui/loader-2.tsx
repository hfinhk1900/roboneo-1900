import { cn } from '@/lib/utils';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderTone = 'light' | 'dark';

interface CircularLoaderProps {
  className?: string;
  size?: LoaderSize;
  tone?: LoaderTone;
}

const sizeMap: Record<LoaderSize, string> = {
  sm: 'h-8 w-8 border-2',
  md: 'h-12 w-12 border-4',
  lg: 'h-16 w-16 border-[6px]',
};

const toneMap: Record<LoaderTone, string> = {
  light: 'text-white',
  dark: 'text-gray-900',
};

export function CircularLoader({
  className,
  size = 'md',
  tone = 'light',
}: CircularLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-primary border-t-transparent animate-spin',
        toneMap[tone],
        sizeMap[size],
        className
      )}
      aria-hidden
    />
  );
}

interface ImageGenerationLoaderProps {
  label: string;
  progress?: number;
  helperText?: string;
  tone?: LoaderTone;
  className?: string;
  size?: LoaderSize;
}

export function ImageGenerationLoader({
  label,
  progress,
  helperText,
  tone = 'light',
  className,
  size = 'md',
}: ImageGenerationLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-center',
        toneMap[tone],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CircularLoader tone={tone} size={size} />
      <div className="flex flex-col items-center gap-1">
        <p className="text-lg font-medium">{label}</p>
        {typeof progress === 'number' && (
          <span className="text-sm font-semibold">{Math.round(progress)}%</span>
        )}
        {helperText && (
          <p className="max-w-[240px] text-xs opacity-80">{helperText}</p>
        )}
      </div>
    </div>
  );
}

export default ImageGenerationLoader;

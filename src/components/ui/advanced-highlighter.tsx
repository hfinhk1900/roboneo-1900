'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

type HighlighterVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'gradient'
  | 'neon'
  | 'marker';

type HighlighterEffect =
  | 'fade'
  | 'slide'
  | 'typewriter'
  | 'pulse'
  | 'bounce';

interface AdvancedHighlighterProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
  children: React.ReactNode;
  variant?: HighlighterVariant;
  effect?: HighlighterEffect;
  duration?: number;
  delay?: number;
  glowing?: boolean;
  animated?: boolean;
}

const variantStyles: Record<HighlighterVariant, string> = {
  default: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100',
  primary: 'bg-primary/20 text-primary-foreground border border-primary/30',
  success: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100',
  warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100',
  error: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100',
  gradient: 'bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 dark:from-pink-800 dark:via-purple-800 dark:to-indigo-800 text-gray-900 dark:text-gray-100',
  neon: 'bg-black text-cyan-300 border border-cyan-300 shadow-[0_0_10px_theme(colors.cyan.300)]',
  marker: 'bg-yellow-300 text-gray-900 relative before:absolute before:inset-0 before:bg-yellow-300 before:-skew-x-12 before:-z-10'
};

const glowStyles: Record<HighlighterVariant, string> = {
  default: 'shadow-[0_0_15px_theme(colors.blue.300)]',
  primary: 'shadow-[0_0_15px_var(--primary)]',
  success: 'shadow-[0_0_15px_theme(colors.green.300)]',
  warning: 'shadow-[0_0_15px_theme(colors.yellow.300)]',
  error: 'shadow-[0_0_15px_theme(colors.red.300)]',
  gradient: 'shadow-[0_0_20px_theme(colors.purple.400)]',
  neon: 'shadow-[0_0_20px_theme(colors.cyan.300)]',
  marker: 'shadow-[0_0_10px_theme(colors.yellow.400)]'
};

export function AdvancedHighlighter({
  children,
  variant = 'default',
  effect = 'fade',
  duration = 0.6,
  delay = 0,
  glowing = false,
  animated = true,
  className,
  ...props
}: AdvancedHighlighterProps) {
  const getAnimationProps = () => {
    if (!animated) return {};

    const baseTransition: Transition = {
      duration,
      delay,
      ease: 'easeOut' as const
    };

    switch (effect) {
      case 'fade':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: baseTransition
        };

      case 'slide':
        return {
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: baseTransition
        };

      case 'typewriter':
        return {
          initial: { width: 0 },
          animate: { width: 'auto' },
          transition: { ...baseTransition, duration: duration * 1.5 }
        };

      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: {
            scale: [1, 1.05, 1],
          },
          transition: {
            duration: duration,
            delay,
            repeat: 2,
          ease: 'easeInOut' as const
          }
        };

      case 'bounce':
        return {
          initial: { y: -10, opacity: 0 },
          animate: {
            y: [0, -5, 0],
            opacity: 1
          },
          transition: {
            duration: duration,
            delay,
          ease: 'easeOut' as const
          }
        };

      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: baseTransition
        };
    }
  };

  return (
    <motion.span
      className={cn(
        'inline-block relative px-2 py-1 rounded-md font-medium transition-all',
        variantStyles[variant],
        glowing && glowStyles[variant],
        effect === 'typewriter' && 'overflow-hidden whitespace-nowrap',
        className
      )}
      {...getAnimationProps()}
      {...props}
    >
      {children}
    </motion.span>
  );
}

// 预设组合组件
export function PrimaryHighlight({ children, ...props }: Omit<AdvancedHighlighterProps, 'variant'>) {
  return <AdvancedHighlighter variant="primary" {...props}>{children}</AdvancedHighlighter>;
}

export function GradientHighlight({ children, ...props }: Omit<AdvancedHighlighterProps, 'variant'>) {
  return <AdvancedHighlighter variant="gradient" glowing {...props}>{children}</AdvancedHighlighter>;
}

export function NeonHighlight({ children, ...props }: Omit<AdvancedHighlighterProps, 'variant'>) {
  return <AdvancedHighlighter variant="neon" glowing effect="pulse" {...props}>{children}</AdvancedHighlighter>;
}

export function MarkerHighlight({ children, ...props }: Omit<AdvancedHighlighterProps, 'variant'>) {
  return <AdvancedHighlighter variant="marker" effect="slide" {...props}>{children}</AdvancedHighlighter>;
}

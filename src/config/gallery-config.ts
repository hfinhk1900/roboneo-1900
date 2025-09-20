/**
 * Gallery configuration for managing static image URLs
 * This provides a centralized way to manage gallery images and their URLs
 */

import { storageConfig } from '@/storage/config/storage-config';

/**
 * Get the base URL for gallery images
 * Uses the configured storage public URL or falls back to the hardcoded R2 domain
 */
export const getGalleryBaseUrl = (): string => {
  // Try to use the configured storage public URL first
  const configuredUrl = storageConfig.publicUrl;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  // Fallback to the current hardcoded R2 domain
  // This should be updated when the R2 domain changes
  return 'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev';
};

/**
 * Gallery image configuration interface
 */
export interface GalleryImage {
  filename: string;
  alt: string;
  style: string;
  styleLabel: string;
  ctaText: string;
  aspectRatio?: string;
  className?: string;
}

/**
 * Generate full URL for a gallery image
 * @param folder - The folder path (e.g., 'Landing-sticker')
 * @param filename - The image filename
 * @returns Full URL to the image
 */
export const getGalleryImageUrl = (
  folder: string,
  filename: string
): string => {
  const baseUrl = getGalleryBaseUrl();
  return `${baseUrl}/${folder}/${filename}`;
};

/**
 * Sticker gallery images configuration
 * This replaces the hardcoded URLs in showcase-gallery.tsx
 */
export const stickerImages: GalleryImage[] = [
  {
    filename: 'sticker01-ios.webp',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker02-snoopy.webp',
    alt: 'RoboNeo AI generated sticker - Snoopy style by roboneo artificial intelligence',
    style: 'snoopy',
    styleLabel: 'Snoopy Style',
    ctaText: 'Try Snoopy Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker03-snoopy.webp',
    alt: 'RoboNeo AI generated sticker - Snoopy style by roboneo artificial intelligence',
    style: 'snoopy',
    styleLabel: 'Snoopy Style',
    ctaText: 'Try Snoopy Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker04-pixel.webp',
    alt: 'RoboNeo AI generated sticker - Pixel art style by roboneo artificial intelligence',
    style: 'pixel',
    styleLabel: 'Pixel Art Style',
    ctaText: 'Try Pixel Art',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker05-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker06-ios.jpeg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker07-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker08-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker09-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker10-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker11-ios.jpg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker12-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker13-ios.jpeg',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker14-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker15-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
  {
    filename: 'sticker16-ios.png',
    alt: 'RoboNeo AI generated sticker - iOS style by roboneo artificial intelligence',
    style: 'ios',
    styleLabel: 'iOS Sticker Style',
    ctaText: 'Try iOS Style',
    aspectRatio: 'aspect-[4/5]',
    className: '',
  },
];

/**
 * Get all sticker images with generated URLs
 * @returns Array of sticker images with full URLs
 */
export const getStickerImages = () => {
  return stickerImages.map((image) => ({
    ...image,
    src: getGalleryImageUrl('Landing-sticker', image.filename),
  }));
};

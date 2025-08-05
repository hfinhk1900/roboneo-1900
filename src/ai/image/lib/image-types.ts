import type { ProviderKey } from './provider-config';

export interface GeneratedImage {
  image: string;
  provider: ProviderKey;
  modelId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ImageResult {
  provider: ProviderKey;
  image: string | null;
  modelId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ImageError {
  provider: ProviderKey;
  message: string;
}

export interface ProviderTiming {
  startTime: number;
  completionTime?: number;
  elapsed?: number;
}

import type { StickerStyle, StylePromptConfig } from './api-types';

// Laozhang AI API 配置
export const LAOZHANG_CONFIG = {
  apiBase: process.env.LAOZHANG_API_BASE || 'https://api.laozhang.ai/v1',
  apiKey: process.env.LAOZHANG_API_KEY,
  chatCompletionEndpoint: '/chat/completions',
  imageEditEndpoint: '/images/edits',

  // 默认模型配置
  defaultModel: 'gpt-4o-image',
  fallbackModel: 'gpt-4-vision-preview',

  // 请求限制
  maxFileSize: 4 * 1024 * 1024, // 4MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,

  // Token 配置
  maxTokens: 300,
  estimatedCostPerToken: 0.001, // 每1000 tokens的成本（美元）

  // 超时设置
  requestTimeout: 120000, // 120秒，AI 图像生成需要更长时间
} as const;

// 贴纸样式提示配置
export const STYLE_PROMPTS: StylePromptConfig = {
  ios: 'Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people\'s body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove background and include only the full figures, ensuring the final image looks like an official iOS emoji sticker.',
  pixel: 'Transform into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
  lego: 'Convert to LEGO minifigure style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
  snoopy: 'Transform into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background'
} as const;

// 开发环境下的简化版本（节省成本）
export const DEV_STYLE_PROMPTS: StylePromptConfig = {
  ios: 'iOS sticker style',
  pixel: '8-bit pixel art style',
  lego: 'LEGO style',
  snoopy: 'Snoopy cartoon style'
} as const;

// 获取样式提示的函数
export function getStylePrompt(style: string, isDevelopment = false): string {
  const prompts = isDevelopment ? DEV_STYLE_PROMPTS : STYLE_PROMPTS;
  return prompts[style] || prompts.ios;
}

// 验证 API 配置
export function validateLaozhangConfig(): boolean {
  if (!LAOZHANG_CONFIG.apiKey) {
    console.error('LAOZHANG_API_KEY is not configured');
    return false;
  }
  return true;
}

// 获取完整的 API URL
export function getLaozhangApiUrl(endpoint: string): string {
  return `${LAOZHANG_CONFIG.apiBase}${endpoint}`;
}

// 计算估算成本
export function calculateEstimatedCost(tokens: number): number {
  return (tokens / 1000) * LAOZHANG_CONFIG.estimatedCostPerToken;
}

// 验证文件类型和大小
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!(LAOZHANG_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Please use ${LAOZHANG_CONFIG.allowedFileTypes.join(', ')}.`
    };
  }

  if (file.size > LAOZHANG_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds the ${LAOZHANG_CONFIG.maxFileSize / 1024 / 1024}MB limit.`
    };
  }

  return { isValid: true };
}

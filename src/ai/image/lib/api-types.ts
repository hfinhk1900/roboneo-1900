import type { ProviderKey } from './provider-config';

export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  // 新增 OpenAI gpt-image-1 支持的参数
  quality?: 'low' | 'medium' | 'high' | 'auto';
  outputFormat?: 'jpeg' | 'png' | 'webp';
  outputCompression?: number; // 0-100
  background?: 'transparent' | 'default';
  // 扩展支持所有OpenAI模型的尺寸
  size?: '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto';
  // 图片编辑功能参数
  inputImage?: string; // base64 编码的图片数据
  editType?: 'generate' | 'edit' | 'variation'; // 生成类型
}

export interface GenerateImageResponse {
  image?: string;
  provider?: ProviderKey;
  // 增强的响应信息
  width?: number;
  height?: number;
  format?: string;
  editType?: 'generate' | 'edit' | 'variation';
  error?: string;
}

// New types for image-to-sticker functionality
export interface ImageToStickerRequest {
  imageFile: File;
  style: string;
  prompt?: string;
}

// Enhanced response type with all fields from actual API
export interface ImageToStickerResponse {
  url?: string;
  description?: string;
  seed?: number;
  width?: number;
  height?: number;
  isHighQuality?: boolean;
  style?: string;
  cost?: number;
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

// Laozhang AI specific types
export interface LaozhangChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens: number;
}

export interface LaozhangChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Style configuration
export type StickerStyle = 'ios' | 'pixel' | 'lego' | 'snoopy';

export interface StylePromptConfig {
  [key: string]: string;
}

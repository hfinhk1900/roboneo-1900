/**
 * OpenAI API 图片验证配置
 * 基于 OpenAI gpt-image-1 和图片编辑 API 的实际要求
 */

// OpenAI API 配置
export const OPENAI_IMAGE_CONFIG = {
  // 文件大小限制 (6MB - 提高用户体验，会在客户端压缩到合适大小)
  maxFileSize: 6 * 1024 * 1024, // 6MB

  // 支持的文件类型 (OpenAI gpt-image-1 支持的格式)
  allowedFileTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,

  // 最大尺寸推荐 (OpenAI 会自动调整大图片)
  maxDimensions: {
    width: 2048,
    height: 2048,
  },

  // 最小尺寸
  minDimensions: {
    width: 256,
    height: 256,
  },
} as const;

/**
 * 验证上传的图片文件是否符合 OpenAI API 要求
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // 检查文件是否存在
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  // 检查文件类型
  if (!OPENAI_IMAGE_CONFIG.allowedFileTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type not supported. Please use ${OPENAI_IMAGE_CONFIG.allowedFileTypes.join(', ')}`,
    };
  }

  // 检查文件大小
  if (file.size > OPENAI_IMAGE_CONFIG.maxFileSize) {
    const maxSizeMB = OPENAI_IMAGE_CONFIG.maxFileSize / 1024 / 1024;
    return {
      isValid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // 检查文件大小下限 (至少要有一些内容)
  if (file.size < 1024) {
    // 1KB
    return {
      isValid: false,
      error: 'File is too small. Please upload a valid image file',
    };
  }

  return { isValid: true };
}

/**
 * 获取文件大小的友好显示
 */
export function getFileSizeDisplay(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查图片尺寸 (需要在客户端通过 Image 对象)
 */
export function validateImageDimensions(
  width: number,
  height: number
): { isValid: boolean; error?: string } {
  const { maxDimensions, minDimensions } = OPENAI_IMAGE_CONFIG;

  if (width < minDimensions.width || height < minDimensions.height) {
    return {
      isValid: false,
      error: `Image too small. Minimum size: ${minDimensions.width}x${minDimensions.height}px`,
    };
  }

  if (width > maxDimensions.width || height > maxDimensions.height) {
    return {
      isValid: false,
      error: `Image too large. Maximum size: ${maxDimensions.width}x${maxDimensions.height}px. OpenAI will auto-resize, but smaller images work better.`,
    };
  }

  return { isValid: true };
}

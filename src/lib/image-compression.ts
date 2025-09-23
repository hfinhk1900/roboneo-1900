/**
 * 统一的图片压缩和验证库
 * 针对Vercel免费账户优化，减少带宽消耗
 */

// 统一的图片处理配置
export const IMAGE_CONFIG = {
  // 文件大小限制配置 (可通过环境变量覆盖)
  limits: {
    // 客户端上传限制 (建议值)
    clientUpload: 8 * 1024 * 1024, // 8MB - 比较宽松的上传限制
    // 压缩后大小限制 (发送给API前)
    compressed: 2 * 1024 * 1024, // 2MB - 压缩后的目标大小
    // Base64编码限制 (发送给外部API)
    base64Encoded: 3 * 1024 * 1024, // 3MB - Base64会增加约33%
  },

  // 压缩配置
  compression: {
    // 最大尺寸限制 (像素)
    maxWidth: 1024,
    maxHeight: 1024,
    // JPEG质量 (0.1 - 1.0)
    jpegQuality: 0.8,
    // WebP质量 (0.1 - 1.0, 更高效的压缩)
    webpQuality: 0.85,
    // PNG压缩级别 (对于需要透明背景的图片)
    pngCompression: 6,
  },

  // 支持的格式
  supportedFormats: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,

  // 尺寸要求
  dimensions: {
    minWidth: 256,
    minHeight: 256,
    maxWidth: 4096, // 允许更大的输入，但会被压缩
    maxHeight: 4096,
  },
} as const;

// 环境变量覆盖配置
function getConfig() {
  return {
    ...IMAGE_CONFIG,
    limits: {
      clientUpload:
        Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES) ||
        IMAGE_CONFIG.limits.clientUpload,
      compressed:
        Number(process.env.NEXT_PUBLIC_MAX_COMPRESSED_BYTES) ||
        IMAGE_CONFIG.limits.compressed,
      base64Encoded:
        Number(process.env.NEXT_PUBLIC_MAX_BASE64_BYTES) ||
        IMAGE_CONFIG.limits.base64Encoded,
    },
  };
}

/**
 * 文件大小格式化显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 验证上传的图片文件
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const config = getConfig();

  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  // 检查文件类型
  if (!config.supportedFormats.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type not supported. Please use ${config.supportedFormats.join(', ')}`,
    };
  }

  // 检查文件大小
  if (file.size > config.limits.clientUpload) {
    const maxSizeMB = config.limits.clientUpload / 1024 / 1024;
    return {
      isValid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit. Current size: ${formatFileSize(file.size)}`,
    };
  }

  // 检查最小文件大小
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
 * 压缩选项接口
 */
export interface CompressionOptions {
  // 最大尺寸 (默认使用配置值)
  maxWidth?: number;
  maxHeight?: number;
  // 质量设置
  quality?: number;
  // 输出格式 ('auto' 会智能选择最优格式)
  outputFormat?: 'jpeg' | 'webp' | 'png' | 'auto';
  // 目标比例 (用于特定功能需求)
  aspectRatio?: { w: number; h: number };
  // 是否保持透明度 (影响格式选择)
  preserveTransparency?: boolean;
}

/**
 * 智能图片压缩函数
 * 针对Vercel免费账户优化，平衡质量和带宽
 */
export function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{
  base64: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}> {
  return new Promise((resolve, reject) => {
    const config = getConfig();

    // 合并选项和默认配置
    const opts = {
      maxWidth: options.maxWidth || config.compression.maxWidth,
      maxHeight: options.maxHeight || config.compression.maxHeight,
      quality: options.quality || config.compression.jpegQuality,
      outputFormat: options.outputFormat || 'auto',
      preserveTransparency: options.preserveTransparency || false,
      ...options,
    };

    console.log(
      `📸 Starting compression for ${file.name} (${formatFileSize(file.size)})`
    );

    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          const sourceWidth = img.naturalWidth;
          const sourceHeight = img.naturalHeight;

          // 计算目标尺寸
          const { targetWidth, targetHeight } = calculateTargetDimensions(
            sourceWidth,
            sourceHeight,
            opts.maxWidth,
            opts.maxHeight,
            opts.aspectRatio
          );

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // 高质量缩放设置
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 绘制图像
          if (opts.aspectRatio) {
            // 居中裁剪以适应目标比例
            const sourceRatio = sourceWidth / sourceHeight;
            const targetRatio = opts.aspectRatio.w / opts.aspectRatio.h;

            let drawWidth = sourceWidth;
            let drawHeight = sourceHeight;
            let drawX = 0;
            let drawY = 0;

            if (sourceRatio > targetRatio) {
              // 源图像更宽，裁剪宽度
              drawWidth = sourceHeight * targetRatio;
              drawX = (sourceWidth - drawWidth) / 2;
            } else {
              // 源图像更高，裁剪高度
              drawHeight = sourceWidth / targetRatio;
              drawY = (sourceHeight - drawHeight) / 2;
            }

            ctx.drawImage(
              img,
              drawX,
              drawY,
              drawWidth,
              drawHeight,
              0,
              0,
              targetWidth,
              targetHeight
            );
          } else {
            // 普通缩放
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          }

          // 智能选择输出格式
          const outputFormat = determineOptimalFormat(
            file.type,
            opts.outputFormat,
            opts.preserveTransparency
          );

          // 转换为指定格式
          const { mimeType, quality } = getFormatSettings(
            outputFormat,
            opts.quality
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // 检查压缩后大小
              if (blob.size > config.limits.compressed) {
                console.warn(
                  `⚠️ Compressed image still large: ${formatFileSize(blob.size)}`
                );
                // 可以选择进一步压缩或警告用户
              }

              // 转换为base64
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                const compressionRatio =
                  ((file.size - blob.size) / file.size) * 100;

                console.log(`✅ Compression complete:
                  Original: ${formatFileSize(file.size)}
                  Compressed: ${formatFileSize(blob.size)}
                  Reduction: ${compressionRatio.toFixed(1)}%
                  Format: ${outputFormat}
                  Dimensions: ${sourceWidth}×${sourceHeight} → ${targetWidth}×${targetHeight}`);

                resolve({
                  base64,
                  blob,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio,
                  format: outputFormat,
                });
              };
              reader.onerror = () =>
                reject(new Error('Failed to convert to base64'));
              reader.readAsDataURL(blob);
            },
            mimeType,
            quality
          );
        } catch (error) {
          reject(
            new Error(
              `Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 计算目标尺寸
 */
function calculateTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
  aspectRatio?: { w: number; h: number }
): { targetWidth: number; targetHeight: number } {
  if (aspectRatio) {
    // 使用指定比例
    const targetRatio = aspectRatio.w / aspectRatio.h;
    const maxSize = Math.min(maxWidth, maxHeight);

    if (targetRatio >= 1) {
      // 横向或正方形
      return {
        targetWidth: maxSize,
        targetHeight: Math.round(maxSize / targetRatio),
      };
    }

    // 纵向
    return {
      targetWidth: Math.round(maxSize * targetRatio),
      targetHeight: maxSize,
    };
  }

  // 保持原始比例，缩放到适合最大尺寸
  const sourceRatio = sourceWidth / sourceHeight;

  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (sourceWidth > maxWidth || sourceHeight > maxHeight) {
    if (sourceRatio > 1) {
      // 横向图片
      targetWidth = maxWidth;
      targetHeight = Math.round(maxWidth / sourceRatio);
    } else {
      // 纵向图片
      targetHeight = maxHeight;
      targetWidth = Math.round(maxHeight * sourceRatio);
    }
  }

  return { targetWidth, targetHeight };
}

/**
 * 智能选择最优格式
 */
function determineOptimalFormat(
  originalType: string,
  requestedFormat: string,
  preserveTransparency: boolean
): 'jpeg' | 'webp' | 'png' {
  if (requestedFormat !== 'auto') {
    return requestedFormat as 'jpeg' | 'webp' | 'png';
  }

  // 需要透明度时使用PNG
  if (preserveTransparency || originalType === 'image/png') {
    return 'png';
  }

  // 检查浏览器WebP支持 (现代浏览器都支持)
  const supportsWebP =
    typeof window !== 'undefined' &&
    document.createElement('canvas').toDataURL('image/webp').indexOf('webp') >
      -1;

  // WebP提供更好的压缩率
  return supportsWebP ? 'webp' : 'jpeg';
}

/**
 * 获取格式设置
 */
function getFormatSettings(
  format: string,
  quality: number
): { mimeType: string; quality: number } {
  const config = getConfig();

  switch (format) {
    case 'webp':
      return {
        mimeType: 'image/webp',
        quality: config.compression.webpQuality,
      };
    case 'png':
      return {
        mimeType: 'image/png',
        quality: 1, // PNG不使用质量参数
      };
    default:
      return {
        mimeType: 'image/jpeg',
        quality,
      };
  }
}

/**
 * 快速压缩 (用于对质量要求不高的场景)
 */
export function quickCompress(
  file: File,
  maxSizeKB = 500
): Promise<{ base64: string; blob: Blob }> {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.7,
    outputFormat: 'jpeg',
  }).then((result) => {
    // 如果还是太大，进一步压缩
    if (result.compressedSize > maxSizeKB * 1024) {
      console.log(`📉 Further compression needed, target: ${maxSizeKB}KB`);
      return compressImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.5,
        outputFormat: 'jpeg',
      });
    }
    return result;
  });
}

/**
 * 为特定AI功能预设的压缩配置
 */
export const FEATURE_PRESETS = {
  // Image to Sticker - 需要保持细节，但要符合4MB限制
  imageToSticker: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.9,
    outputFormat: 'png' as const,
    preserveTransparency: true,
  },

  // Productshot - 平衡质量和速度
  productshot: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    outputFormat: 'auto' as const,
  },

  // AI Background - 优化传输速度
  aiBackground: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    outputFormat: 'jpeg' as const,
  },

  // Profile Picture - 高质量
  profilePicture: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    outputFormat: 'auto' as const,
  },

  // Remove Watermark - 保持原始质量
  removeWatermark: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.9,
    outputFormat: 'png' as const,
    preserveTransparency: true,
  },
} as const;

/**
 * 统一的图片大小限制配置
 * 针对Vercel免费账户优化
 */

// Vercel免费账户限制参考
const VERCEL_FREE_LIMITS = {
  // 函数执行时间限制
  functionTimeout: 10, // 10秒
  // 函数内存限制
  functionMemory: 1024, // 1GB
  // 月度带宽限制
  monthlyBandwidth: 100 * 1024 * 1024 * 1024, // 100GB
  // 单个文件大小限制 (通过Vercel部署)
  maxFileSize: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * 统一的图片限制配置
 * 可通过环境变量覆盖
 */
export const UNIFIED_IMAGE_LIMITS = {
  // === 基础上传限制 ===
  upload: {
    // 客户端文件大小限制 (用户体验平衡点)
    maxFileSize:
      Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE) || 6 * 1024 * 1024, // 6MB
    // 最小文件大小 (防止无效文件)
    minFileSize: 1024, // 1KB
  },

  // === 压缩后限制 ===
  compressed: {
    // 压缩后最大大小 (发送到API前)
    maxSize:
      Number(process.env.NEXT_PUBLIC_MAX_COMPRESSED_SIZE) || 2 * 1024 * 1024, // 2MB
    // Base64编码后最大大小 (考虑33%增长)
    maxBase64Size:
      Number(process.env.NEXT_PUBLIC_MAX_BASE64_SIZE) || 3 * 1024 * 1024, // 3MB
  },

  // === 尺寸限制 ===
  dimensions: {
    // 最小尺寸
    minWidth: 256,
    minHeight: 256,
    // 最大输入尺寸 (会被压缩)
    maxInputWidth: 4096,
    maxInputHeight: 4096,
    // 压缩目标尺寸
    targetMaxWidth: 1024,
    targetMaxHeight: 1024,
  },

  // === 功能特定限制 ===
  features: {
    // Image to Sticker (OpenAI API限制较严格)
    imageToSticker: {
      maxFileSize:
        Number(process.env.MAX_STICKER_UPLOAD_SIZE) || 4 * 1024 * 1024, // 4MB
      maxProcessedSize: 4 * 1024 * 1024, // 4MB (OpenAI限制)
      targetDimensions: { width: 1024, height: 1024 },
      requiredFormats: ['image/jpeg', 'image/png', 'image/webp'],
    },

    // Productshot (SiliconFlow API)
    productshot: {
      maxBase64Size:
        Number(process.env.MAX_GENERATE_IMAGE_BYTES) || 3 * 1024 * 1024, // 3MB
      targetDimensions: { width: 1024, height: 1024 },
    },

    // AI Background (SiliconFlow API)
    aiBackground: {
      maxBase64Size:
        Number(process.env.MAX_GENERATE_IMAGE_BYTES) || 3 * 1024 * 1024, // 3MB
      targetDimensions: { width: 1024, height: 1024 },
    },

    // Background Removal (HF Space)
    backgroundRemoval: {
      maxBase64Size:
        Number(process.env.MAX_BG_REMOVE_IMAGE_BYTES) || 3 * 1024 * 1024, // 3MB
      targetDimensions: { width: 1024, height: 1024 },
    },

    // Profile Picture (SiliconFlow API)
    profilePicture: {
      maxBase64Size:
        Number(process.env.MAX_GENERATE_IMAGE_BYTES) || 3 * 1024 * 1024, // 3MB
      targetDimensions: { width: 1024, height: 1024 },
    },

    // Remove Watermark (SiliconFlow API)
    removeWatermark: {
      maxBase64Size:
        Number(process.env.MAX_GENERATE_IMAGE_BYTES) || 3 * 1024 * 1024, // 3MB
      targetDimensions: { width: 1024, height: 1024 },
    },

    // Storage Upload (通用文件存储)
    storageUpload: {
      maxFileSize:
        Number(process.env.MAX_STORAGE_UPLOAD_SIZE) || 8 * 1024 * 1024, // 8MB
    },
  },

  // === 支持的格式 ===
  supportedFormats: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,

  // === Vercel优化设置 ===
  vercelOptimization: {
    // 启用激进压缩 (减少带宽)
    aggressiveCompression: true,
    // 客户端预压缩阈值
    clientCompressionThreshold: 1 * 1024 * 1024, // 1MB
    // 批量上传限制 (防止内存溢出)
    maxConcurrentUploads: 3,
    // 渐进式上传
    progressiveUpload: true,
  },
} as const;

/**
 * 获取功能特定的限制
 */
export function getFeatureLimits(
  feature: keyof typeof UNIFIED_IMAGE_LIMITS.features
) {
  return UNIFIED_IMAGE_LIMITS.features[feature];
}

/**
 * 获取通用限制
 */
export function getGeneralLimits() {
  return {
    upload: UNIFIED_IMAGE_LIMITS.upload,
    compressed: UNIFIED_IMAGE_LIMITS.compressed,
    dimensions: UNIFIED_IMAGE_LIMITS.dimensions,
    supportedFormats: UNIFIED_IMAGE_LIMITS.supportedFormats,
  };
}

/**
 * 验证是否需要压缩
 */
export function shouldCompress(
  fileSize: number,
  feature?: keyof typeof UNIFIED_IMAGE_LIMITS.features
): boolean {
  const threshold =
    UNIFIED_IMAGE_LIMITS.vercelOptimization.clientCompressionThreshold;

  // 始终压缩大于阈值的文件
  if (fileSize > threshold) {
    return true;
  }

  // 功能特定判断
  if (feature) {
    const featureLimits = getFeatureLimits(feature);
    if ('maxBase64Size' in featureLimits) {
      // 估算Base64大小 (约增长33%)
      const estimatedBase64Size = fileSize * 1.33;
      return estimatedBase64Size > featureLimits.maxBase64Size;
    }
  }

  return false;
}

/**
 * 计算压缩目标
 */
export function getCompressionTarget(
  fileSize: number,
  feature?: keyof typeof UNIFIED_IMAGE_LIMITS.features
): {
  targetSize: number;
  compressionRatio: number;
  shouldUseAggressive: boolean;
} {
  const maxCompressed = UNIFIED_IMAGE_LIMITS.compressed.maxSize;

  // 功能特定目标
  let targetSize = maxCompressed;
  if (feature) {
    const featureLimits = getFeatureLimits(feature);
    if ('maxBase64Size' in featureLimits) {
      // Base64会增长约33%，所以目标要更小
      targetSize = Math.min(targetSize, featureLimits.maxBase64Size * 0.75);
    }
    if ('maxProcessedSize' in featureLimits) {
      targetSize = Math.min(targetSize, featureLimits.maxProcessedSize);
    }
  }

  const compressionRatio = targetSize / fileSize;
  const shouldUseAggressive = compressionRatio < 0.5; // 需要压缩超过50%

  return {
    targetSize,
    compressionRatio,
    shouldUseAggressive,
  };
}

/**
 * Vercel特定的优化建议
 */
export const VERCEL_OPTIMIZATION_TIPS = {
  // 带宽优化
  bandwidth: [
    '使用WebP格式减少30-50%文件大小',
    '启用客户端压缩减少上传流量',
    '实施缓存策略减少重复传输',
    '使用CDN代理外部API调用',
  ],

  // 性能优化
  performance: [
    '图片预处理移到客户端',
    '使用Web Workers处理大图片',
    '实施分片上传处理大文件',
    '优化API路由减少冷启动',
  ],

  // 内存优化
  memory: [
    '流式处理大图片避免内存溢出',
    '及时释放Canvas和Blob对象',
    '限制并发处理数量',
    '使用更高效的图片库',
  ],

  // 成本控制
  cost: [
    '监控带宽使用量',
    '实施用户级别的上传限制',
    '缓存处理结果减少重复计算',
    '优化外部API调用频率',
  ],
} as const;

/**
 * 环境变量配置指南
 */
export const ENV_CONFIG_GUIDE = `
# 图片限制配置 (可选，使用默认值如果未设置)

# === 基础限制 ===
NEXT_PUBLIC_MAX_UPLOAD_SIZE=6291456          # 6MB - 用户上传限制
NEXT_PUBLIC_MAX_COMPRESSED_SIZE=2097152      # 2MB - 压缩后限制
NEXT_PUBLIC_MAX_BASE64_SIZE=3145728          # 3MB - Base64限制

# === 功能特定限制 ===
MAX_STICKER_UPLOAD_SIZE=4194304              # 4MB - Sticker上传限制
MAX_GENERATE_IMAGE_BYTES=3145728             # 3MB - AI生成图片限制
MAX_BG_REMOVE_IMAGE_BYTES=3145728            # 3MB - 背景移除限制
MAX_STORAGE_UPLOAD_SIZE=8388608              # 8MB - 存储上传限制

# === Vercel优化 ===
NEXT_PUBLIC_ENABLE_CLIENT_COMPRESSION=true   # 启用客户端压缩
NEXT_PUBLIC_MAX_CONCURRENT_UPLOADS=3         # 最大并发上传数
NEXT_PUBLIC_PROGRESSIVE_UPLOAD=true          # 启用渐进式上传
`;

/**
 * 迁移指南
 */
export const MIGRATION_GUIDE = {
  steps: [
    '1. 更新所有组件使用统一的压缩库',
    '2. 配置环境变量覆盖默认限制',
    '3. 启用客户端压缩减少带宽',
    '4. 实施监控和警告系统',
    '5. 优化图片格式和质量设置',
  ],

  priorities: [
    'HIGH: Image to Sticker - 添加客户端压缩',
    'HIGH: Remove Watermark - 添加压缩处理',
    'MEDIUM: Productshot - 优化压缩设置',
    'MEDIUM: 统一所有API的验证逻辑',
    'LOW: 添加带宽监控和用户提示',
  ],
} as const;

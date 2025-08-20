// 免费图像分析器 - 不使用任何付费 API
export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  fileSize?: number;
  orientation: 'portrait' | 'landscape' | 'square';
}

export interface FreeProductAnalysis {
  category: 'small' | 'medium' | 'large';
  confidence: number;
  reasoning: string;
  metadata: ImageMetadata;
  suggestedHints: string[];
}

/**
 * 分析图像基本属性（完全免费，基于浏览器 API）
 */
export function analyzeImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = Number((width / height).toFixed(2));

      let orientation: 'portrait' | 'landscape' | 'square';
      if (aspectRatio > 1.1) {
        orientation = 'landscape';
      } else if (aspectRatio < 0.9) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }

      URL.revokeObjectURL(url);

      resolve({
        width,
        height,
        aspectRatio,
        fileSize: file.size,
        orientation,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 基于图像属性和启发式规则进行产品分类（完全免费）
 */
export function analyzeProductWithHeuristics(
  metadata: ImageMetadata,
  filename?: string,
  userContext?: string
): FreeProductAnalysis {
  const rules = [
    // 规则1: 基于文件名关键词
    {
      name: 'filename_keywords',
      weight: 0.8,
      analyze: () => analyzeFilename(filename || ''),
    },

    // 规则2: 基于图像尺寸和宽高比
    {
      name: 'image_dimensions',
      weight: 0.6,
      analyze: () => analyzeDimensions(metadata),
    },

    // 规则3: 基于用户上下文
    {
      name: 'user_context',
      weight: 0.9,
      analyze: () => analyzeUserContext(userContext || ''),
    },

    // 规则4: 基于图像方向
    {
      name: 'orientation',
      weight: 0.4,
      analyze: () => analyzeOrientation(metadata.orientation),
    },
  ];

  // 执行所有规则并计算加权结果
  const results = rules.map((rule) => ({
    ...rule,
    result: rule.analyze(),
  }));

  // 加权投票系统
  const votes = { small: 0, medium: 0, large: 0 };
  const reasons: string[] = [];

  results.forEach(({ name, weight, result }) => {
    if (result.category && result.confidence > 0.3) {
      votes[result.category] += weight * result.confidence;
      if (result.reason) {
        reasons.push(`${name}: ${result.reason}`);
      }
    }
  });

  // 确定最终类别
  const finalCategory = Object.entries(votes).reduce((a, b) =>
    votes[a[0] as keyof typeof votes] > votes[b[0] as keyof typeof votes]
      ? a
      : b
  )[0] as 'small' | 'medium' | 'large';

  const maxVote = Math.max(...Object.values(votes));
  const totalVotes = Object.values(votes).reduce((sum, vote) => sum + vote, 0);
  const confidence = totalVotes > 0 ? maxVote / totalVotes : 0.5;

  return {
    category: finalCategory,
    confidence: Math.min(0.9, Math.max(0.3, confidence)),
    reasoning:
      reasons.length > 0 ? reasons.join('; ') : 'Default heuristic analysis',
    metadata,
    suggestedHints: generateHeuristicHints(finalCategory, metadata),
  };
}

/**
 * 分析文件名中的关键词
 */
function analyzeFilename(filename: string): {
  category?: 'small' | 'medium' | 'large';
  confidence: number;
  reason?: string;
} {
  const name = filename.toLowerCase();

  // 小型产品关键词
  const smallKeywords = [
    'ring',
    'watch',
    'phone',
    'perfume',
    'cosmetic',
    'jewelry',
    'lipstick',
    'earring',
    'necklace',
    'bracelet',
  ];
  if (smallKeywords.some((keyword) => name.includes(keyword))) {
    return {
      category: 'small',
      confidence: 0.8,
      reason: 'filename contains small product keyword',
    };
  }

  // 大型产品关键词
  const largeKeywords = [
    'furniture',
    'chair',
    'table',
    'sofa',
    'lamp',
    'cabinet',
    'bed',
    'desk',
  ];
  if (largeKeywords.some((keyword) => name.includes(keyword))) {
    return {
      category: 'large',
      confidence: 0.8,
      reason: 'filename contains large product keyword',
    };
  }

  // 中型产品关键词
  const mediumKeywords = [
    'bag',
    'shoe',
    'boot',
    'tablet',
    'book',
    'handbag',
    'backpack',
    'clothing',
  ];
  if (mediumKeywords.some((keyword) => name.includes(keyword))) {
    return {
      category: 'medium',
      confidence: 0.7,
      reason: 'filename contains medium product keyword',
    };
  }

  return { confidence: 0 };
}

/**
 * 基于图像尺寸分析
 */
function analyzeDimensions(metadata: ImageMetadata): {
  category?: 'small' | 'medium' | 'large';
  confidence: number;
  reason?: string;
} {
  const { width, height, aspectRatio } = metadata;

  // 非常小的图像可能是小产品的特写
  if (width < 800 && height < 800) {
    return {
      category: 'small',
      confidence: 0.4,
      reason: `small image dimensions (${width}x${height})`,
    };
  }

  // 超高分辨率可能是大型产品
  if (width > 2000 || height > 2000) {
    return {
      category: 'large',
      confidence: 0.3,
      reason: 'high resolution suggests detailed large product',
    };
  }

  // 极端宽高比分析
  if (aspectRatio > 2.0) {
    return {
      category: 'medium',
      confidence: 0.3,
      reason: 'wide aspect ratio suggests medium-length product',
    };
  }

  if (aspectRatio < 0.5) {
    return {
      category: 'small',
      confidence: 0.4,
      reason: 'tall narrow ratio suggests bottle-like small product',
    };
  }

  return { category: 'medium', confidence: 0.2, reason: 'neutral dimensions' };
}

/**
 * 分析用户上下文
 */
function analyzeUserContext(context: string): {
  category?: 'small' | 'medium' | 'large';
  confidence: number;
  reason?: string;
} {
  if (!context.trim()) return { confidence: 0 };

  const text = context.toLowerCase();

  // 小型产品描述
  if (text.match(/\b(small|tiny|mini|compact|delicate|pocket|handheld)\b/)) {
    return {
      category: 'small',
      confidence: 0.9,
      reason: 'user described as small/compact',
    };
  }

  // 大型产品描述
  if (text.match(/\b(large|big|huge|substantial|massive|oversized)\b/)) {
    return {
      category: 'large',
      confidence: 0.9,
      reason: 'user described as large/substantial',
    };
  }

  // 中型产品描述
  if (text.match(/\b(medium|standard|normal|regular|typical)\b/)) {
    return {
      category: 'medium',
      confidence: 0.8,
      reason: 'user described as medium/standard',
    };
  }

  return { confidence: 0.1 };
}

/**
 * 基于图像方向分析
 */
function analyzeOrientation(orientation: 'portrait' | 'landscape' | 'square'): {
  category?: 'small' | 'medium' | 'large';
  confidence: number;
  reason?: string;
} {
  switch (orientation) {
    case 'portrait':
      return {
        category: 'small',
        confidence: 0.3,
        reason: 'portrait orientation suggests bottle/vertical small product',
      };
    case 'landscape':
      return {
        category: 'medium',
        confidence: 0.2,
        reason: 'landscape orientation suggests horizontal medium product',
      };
    case 'square':
      return {
        category: 'small',
        confidence: 0.2,
        reason: 'square format often used for small product photography',
      };
    default:
      return { confidence: 0 };
  }
}

/**
 * 生成基于启发式分析的提示词
 */
function generateHeuristicHints(
  category: 'small' | 'medium' | 'large',
  metadata: ImageMetadata
): string[] {
  const hints: string[] = [];

  // 基础尺寸提示
  switch (category) {
    case 'small':
      hints.push('compact', 'delicate', 'handheld', 'intimate scale');
      break;
    case 'medium':
      hints.push('well-proportioned', 'standard size', 'everyday scale');
      break;
    case 'large':
      hints.push('substantial', 'prominent', 'impressive scale');
      break;
  }

  // 基于宽高比的构图提示
  if (metadata.aspectRatio > 1.5) {
    hints.push('horizontal composition');
  } else if (metadata.aspectRatio < 0.7) {
    hints.push('vertical elegance');
  }

  // 基于方向的提示
  switch (metadata.orientation) {
    case 'portrait':
      hints.push('vertical presentation');
      break;
    case 'landscape':
      hints.push('wide angle view');
      break;
    case 'square':
      hints.push('balanced composition');
      break;
  }

  return hints.slice(0, 4); // 限制数量
}

/**
 * 智能场景匹配（基于免费分析结果）
 */
export function getSmartSceneRecommendations(analysis: FreeProductAnalysis): {
  recommended: string[];
  reasons: string[];
} {
  const recommended: string[] = [];
  const reasons: string[] = [];

  // 基于产品类别推荐场景
  switch (analysis.category) {
    case 'small':
      recommended.push('studio-model', 'elegant-evening', 'minimalist-clean');
      reasons.push(
        'Small products work well in intimate, detailed presentations'
      );
      break;
    case 'medium':
      recommended.push('lifestyle-casual', 'street-style', 'outdoor-adventure');
      reasons.push('Medium products are versatile for lifestyle scenes');
      break;
    case 'large':
      recommended.push('minimalist-clean', 'lifestyle-casual');
      reasons.push('Large products need spacious, contextual environments');
      break;
  }

  // 基于图像方向调整推荐
  if (analysis.metadata.orientation === 'portrait') {
    if (!recommended.includes('studio-model')) {
      recommended.unshift('studio-model');
      reasons.push('Portrait orientation suits model photography');
    }
  }

  return { recommended: recommended.slice(0, 3), reasons };
}

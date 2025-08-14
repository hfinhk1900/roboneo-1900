// 不使用付费 API，改为基于启发式规则的免费分析
import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { type NextRequest, NextResponse } from 'next/server';

// 产品尺寸映射 - 基于常见产品类型的合理尺寸
const PRODUCT_SIZE_HINTS = {
  // 小型产品
  small: ['small', 'compact', 'handheld', 'pocket-sized', 'delicate'],
  // 中型产品
  medium: [
    'medium-sized',
    'standard',
    'appropriately sized',
    'well-proportioned',
  ],
  // 大型产品
  large: ['substantial', 'prominent', 'statement piece', 'centerpiece'],
  // 默认
  default: ['properly sized', 'well-proportioned', 'naturally scaled'],
};

// 场景与产品类型的智能映射
const SCENE_PRODUCT_PREFERENCES = {
  'studio-white': {
    likely: 'medium', // 电商产品通常是标准商品
    description: 'e-commerce products for online stores',
    contextHints: [
      'commercial product',
      'retail item',
      'e-commerce merchandise',
    ],
  },
  'studio-shadow': {
    likely: 'medium', // 高端产品适合展现质感
    description: 'premium products with luxury appeal',
    contextHints: ['luxury item', 'premium product', 'high-end merchandise'],
  },
  'home-lifestyle': {
    likely: 'medium', // 家居生活产品适合日常使用
    description: 'everyday household products',
    contextHints: ['home product', 'lifestyle item', 'daily use object'],
  },
  'nature-outdoor': {
    likely: 'medium', // 户外产品适合自然环境
    description: 'outdoor and adventure products',
    contextHints: ['outdoor gear', 'nature product', 'adventure equipment'],
  },
  'table-flatlay': {
    likely: 'small', // 俯拍适合小到中型产品
    description: 'small to medium products for overhead photography',
    contextHints: ['flatlay item', 'desk accessory', 'portable product'],
  },
  'minimalist-clean': {
    likely: 'small', // 极简风格适合设计感产品
    description: 'design-focused products',
    contextHints: ['design object', 'modern item', 'minimalist product'],
  },
  custom: {
    likely: 'medium', // 自定义场景默认中等尺寸
    description: 'custom products',
    contextHints: ['product item', 'custom merchandise', 'unique product'],
  },
} as const;

// 快速关键词分析（完全免费，零延迟）
function analyzeContextKeywords(context: string): {
  category: 'small' | 'medium' | 'large';
  confidence: number;
} {
  const text = context.toLowerCase();

  // 高置信度关键词匹配
  const smallProducts = [
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
    'charm',
    'pendant',
    'bottle',
    'tube',
    'compact',
    'tiny',
    'mini',
    'small',
    'delicate',
    'pocket',
  ];

  const largeProducts = [
    'furniture',
    'chair',
    'table',
    'sofa',
    'lamp',
    'cabinet',
    'bed',
    'desk',
    'bookshelf',
    'dresser',
    'mirror',
    'artwork',
    'sculpture',
    'vase',
    'large',
    'big',
    'huge',
    'substantial',
    'massive',
    'oversized',
  ];

  const mediumProducts = [
    'bag',
    'handbag',
    'backpack',
    'purse',
    'shoe',
    'boot',
    'sneaker',
    'tablet',
    'laptop',
    'book',
    'clothing',
    'shirt',
    'dress',
    'jacket',
    'hat',
    'cap',
    'glasses',
    'headphones',
    'camera',
    'tool',
  ];

  // 计算匹配得分
  const smallScore = smallProducts.reduce(
    (score, word) => (text.includes(word) ? score + 1 : score),
    0
  );
  const largeScore = largeProducts.reduce(
    (score, word) => (text.includes(word) ? score + 1 : score),
    0
  );
  const mediumScore = mediumProducts.reduce(
    (score, word) => (text.includes(word) ? score + 1 : score),
    0
  );

  const maxScore = Math.max(smallScore, largeScore, mediumScore);

  if (maxScore === 0) {
    return { category: 'medium', confidence: 0.3 };
  }

  let category: 'small' | 'medium' | 'large';
  if (smallScore === maxScore) category = 'small';
  else if (largeScore === maxScore) category = 'large';
  else category = 'medium';

  // 置信度基于匹配强度
  const confidence = Math.min(0.95, 0.6 + maxScore * 0.1);

  return { category, confidence };
}

// 多层智能尺寸检测函数（免费高效版本）
function detectProductSize(
  additionalContext?: string,
  sceneType?: SceneType,
  productTypeHint?: 'small' | 'medium' | 'large' | 'auto'
): {
  category: keyof typeof PRODUCT_SIZE_HINTS;
  confidence: 'high' | 'medium' | 'low';
  source: 'user_hint' | 'user_input' | 'scene_inference' | 'default';
} {
  // 第0层：用户明确选择的产品类型提示（最高优先级）
  if (productTypeHint && productTypeHint !== 'auto') {
    return {
      category: productTypeHint,
      confidence: 'high',
      source: 'user_hint',
    };
  }

  // 第1层：免费启发式分析（基于文本上下文关键词，零延迟）
  if (additionalContext?.trim()) {
    const quickAnalysis = analyzeContextKeywords(additionalContext);
    if (quickAnalysis.confidence > 0.7) {
      console.log(
        `🚀 Quick Analysis: "${additionalContext}" → ${quickAnalysis.category} (confidence: ${quickAnalysis.confidence})`
      );
      return {
        category: quickAnalysis.category,
        confidence: 'high',
        source: 'user_input',
      };
    }
  }

  // 第2层：基于场景的智能推断（中等优先级）
  if (sceneType && SCENE_PRODUCT_PREFERENCES[sceneType]) {
    const scenePreference = SCENE_PRODUCT_PREFERENCES[sceneType];
    return {
      category: scenePreference.likely,
      confidence: 'medium',
      source: 'scene_inference',
    };
  }

  // 第4层：安全默认值（最低优先级）
  return { category: 'default', confidence: 'low', source: 'default' };
}

// 获取尺寸提示词（增强版）
function getSizeHints(detection: {
  category: keyof typeof PRODUCT_SIZE_HINTS;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}): string {
  const hints = PRODUCT_SIZE_HINTS[detection.category];

  // 根据信心度调整提示词数量
  const hintCount = detection.confidence === 'high' ? 2 : 1;
  return hints.slice(0, hintCount).join(', ');
}

// 获取场景相关的产品上下文
function getSceneContext(sceneType: SceneType): string {
  const scenePreference = SCENE_PRODUCT_PREFERENCES[sceneType];
  if (scenePreference) {
    return scenePreference.contextHints[0]; // 使用第一个最合适的上下文
  }
  return 'product item';
}

// 6种专业产品摄影场景配置 - 以产品为主体
const SCENE_PRESETS = {
  'studio-white': {
    name: 'Studio White',
    prompt:
      'professional product photography, clean white seamless background, soft even lighting, high-key illumination, commercial studio setup, product centered and in focus, no shadows, crisp details',
    category: 'studio',
    icon: '⚪',
    description: '电商白底图 - 纯净白色背景，完美商业展示',
  },
  'studio-shadow': {
    name: 'Studio Shadow',
    prompt:
      'professional studio photography, neutral gray backdrop, dramatic side lighting, soft shadows for depth, premium commercial feel, product as hero subject, professional lighting setup, luxury brand aesthetic',
    category: 'studio',
    icon: '🎭',
    description: '质感工作室图 - 专业灯光，突出产品质感',
  },
  'home-lifestyle': {
    name: 'Home Lifestyle',
    prompt:
      'natural home lifestyle setting, modern interior background, warm ambient lighting, cozy domestic environment, product in everyday use context, soft natural light, lived-in atmosphere, relatable home scene',
    category: 'lifestyle',
    icon: '🏠',
    description: '生活场景 - 温馨家居环境，日常使用情境',
  },
  'nature-outdoor': {
    name: 'Nature Outdoor',
    prompt:
      'natural outdoor environment, soft daylight, organic natural background, fresh air atmosphere, product in nature setting, golden hour lighting, adventure lifestyle vibe, authentic outdoor scene',
    category: 'nature',
    icon: '🌿',
    description: '户外自然 - 自然光线，有机环境背景',
  },
  'table-flatlay': {
    name: 'Table Flatlay',
    prompt:
      'clean tabletop flatlay photography, overhead perspective, organized composition, modern surface texture, soft overhead lighting, minimalist arrangement, product showcase style, editorial layout',
    category: 'flatlay',
    icon: '📷',
    description: '桌面俯拍 - 俯视角度，整洁构图',
  },
  'minimalist-clean': {
    name: 'Minimalist Clean',
    prompt:
      'minimalist aesthetic, clean geometric composition, neutral color palette, simple elegant background, architectural elements, modern design sensibility, sophisticated brand positioning, premium minimalist style',
    category: 'minimal',
    icon: '✨',
    description: '简约美学 - 极简设计，突出产品线条',
  },
  custom: {
    name: 'Custom Scene',
    prompt: 'product in {customScene}',
    category: 'custom',
    icon: '🎨',
    description: 'Create your own unique scene description',
  },
} as const;

// 产品专用场景提示词（无人物版本）- 与新场景匹配
const PRODUCT_ONLY_SCENE_PROMPTS = {
  'studio-white':
    'professional product photography, clean white seamless background, soft even lighting, high-key illumination, commercial studio setup, product centered and in focus, no shadows, crisp details',
  'studio-shadow':
    'professional studio photography, neutral gray backdrop, dramatic side lighting, soft shadows for depth, premium commercial feel, product as hero subject, professional lighting setup, luxury brand aesthetic',
  'home-lifestyle':
    'natural home lifestyle setting, modern interior background, warm ambient lighting, cozy domestic environment, product in everyday use context, soft natural light, lived-in atmosphere, relatable home scene',
  'nature-outdoor':
    'natural outdoor environment, soft daylight, organic natural background, fresh air atmosphere, product in nature setting, golden hour lighting, adventure lifestyle vibe, authentic outdoor scene',
  'table-flatlay':
    'clean tabletop flatlay photography, overhead perspective, organized composition, modern surface texture, soft overhead lighting, minimalist arrangement, product showcase style, editorial layout',
  'minimalist-clean':
    'minimalist aesthetic, clean geometric composition, neutral color palette, simple elegant background, architectural elements, modern design sensibility, sophisticated brand positioning, premium minimalist style',
  custom: '{customScene}', // Will be replaced with actual custom scene description
} as const;

/**
 * 获取无人物的场景提示词
 */
function getProductOnlyScenePrompt(sceneType: SceneType): string {
  return (
    PRODUCT_ONLY_SCENE_PROMPTS[sceneType] ||
    PRODUCT_ONLY_SCENE_PROMPTS['minimalist-clean']
  );
}

type SceneType = keyof typeof SCENE_PRESETS;

interface ProductShotRequest {
  sceneType: SceneType;
  customSceneDescription?: string;
  quality?: 'standard' | 'hd';

  // Advanced generation controls
  steps?: number;
  seed?: number;
  guidance_scale?: number;
  num_images?: number;
  size?: string;
  output_format?: 'jpeg' | 'png' | 'webp';

  // Image input (base64 encoded) - NOW REQUIRED
  image_input: string;

  // NEW: Reference image for dual-image generation (optional)
  reference_image?: string;

  // Optional additional context
  additionalContext?: string;

  // Optional product type hint for better detection
  productTypeHint?: 'small' | 'medium' | 'large' | 'auto';
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 解析请求参数
    const body: ProductShotRequest = await request.json();
    const {
      sceneType,
      customSceneDescription,
      quality = 'standard',
      steps,
      seed,
      guidance_scale,
      num_images,
      size,
      output_format,
      image_input,
      reference_image,
      additionalContext,
      productTypeHint,
    } = body;

    // 3. 验证必需参数 - 简化验证逻辑，允许空场景（双图模式）
    if (!image_input) {
      return NextResponse.json(
        { error: 'Product image is required' },
        { status: 400 }
      );
    }

    // 场景验证：允许空场景（双图模式），但如果提供了场景必须有效
    if (sceneType && !SCENE_PRESETS[sceneType]) {
      return NextResponse.json(
        { error: 'Invalid scene type' },
        { status: 400 }
      );
    }

    // 验证自定义场景
    if (sceneType === 'custom' && !customSceneDescription?.trim()) {
      return NextResponse.json(
        {
          error:
            'Custom scene description is required when using custom scene type',
        },
        { status: 400 }
      );
    }

    // 4. 检查用户 Credits
    const { canGenerateStickerAction } = await import(
      '@/actions/credits-actions'
    );
    const creditsCheck = await canGenerateStickerAction({
      requiredCredits: CREDITS_PER_IMAGE,
    });

    if (!creditsCheck?.data?.success || !creditsCheck.data.data?.canGenerate) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDITS_PER_IMAGE,
          current: creditsCheck?.data?.data?.currentCredits || 0,
        },
        { status: 402 }
      );
    }

    console.log(
      `💳 User ${session.user.id} has ${creditsCheck.data.data.currentCredits} credits, proceeding with ProductShot generation...`
    );

    // 5. 初始化 SiliconFlow 提供商
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('SiliconFlow API key not configured');
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const provider = new SiliconFlowProvider(apiKey);

    // 6. 构建提示词 - 处理有场景和无场景两种情况
    let basePrompt: string;

    if (!sceneType) {
      // 双图模式无场景：强调参考图的风格和环境引导
      if (reference_image) {
        basePrompt =
          'match the style, lighting, environment, and aesthetic of the reference background image, adopt the same color palette and mood, recreate similar lighting conditions, maintain the overall atmosphere and visual style from reference image, professional product photography with consistent visual theme';
        console.log('🖼️ No scene selected - using strong reference image guided mode');
      } else {
        // 单图模式无场景：使用通用描述
        basePrompt =
          'professional product photography, high quality commercial image, natural lighting, clean composition';
        console.log('📸 No scene selected - using general product photography mode');
      }
    } else {
      // 有场景：使用场景预设
      const sceneConfig = SCENE_PRESETS[sceneType];
      console.log(`🎯 Using scene: ${sceneType} (${sceneConfig.name})`);

      if (sceneType === 'custom' && customSceneDescription) {
        // 对于自定义场景，使用用户提供的场景描述
        basePrompt = sceneConfig.prompt.replace(
          '{customScene}',
          customSceneDescription
        );
        console.log('🎨 Using custom scene prompt');
      } else {
        // 直接使用场景预设的提示词
        basePrompt = sceneConfig.prompt;
        console.log(`📸 Scene: ${sceneConfig.icon} ${sceneConfig.name}`);
      }

      // 双图模式下增强场景与参考图的融合
      if (reference_image) {
        basePrompt += ', blend scene style with reference image elements, incorporate reference image color palette and lighting into the scene, harmoniously merge scene concept with reference background aesthetic';
        console.log('🎨 Enhanced scene-reference fusion for dual-image mode');
      }
    }

    // 强化产品主体识别 - 以用户上传的图片为核心
    const productFocusEnhancers = [
      'uploaded product image as main subject',
      'product is the central focus',
      'preserve product characteristics from original image',
      'maintain product details and features',
      'product prominently featured and clearly visible',
    ];

    // 双图模式的提示词优化
    if (reference_image) {
      productFocusEnhancers.push(
        'integrate product seamlessly with reference background style',
        'combine product and reference scene naturally and professionally',
        'extract visual elements from reference image',
        'reference image provides the environment and style guidance',
        'follow reference image lighting and color scheme'
      );
      console.log('🖼️ Dual-image mode activated: product + reference image with enhanced style matching');
    }

    let finalPrompt = `${productFocusEnhancers.join(', ')}, ${basePrompt}`;

    // 添加智能尺寸控制（免费，零延迟）
    const sizeDetection = detectProductSize(
      additionalContext,
      sceneType,
      productTypeHint
    );
    const sizeHints = getSizeHints(sizeDetection);
    finalPrompt += `, ${sizeHints}`;

    // 智能添加场景相关的产品上下文（当用户没有提供具体描述时）
    if (
      !additionalContext?.trim() &&
      sizeDetection.source === 'scene_inference'
    ) {
      const sceneContext = getSceneContext(sceneType);
      finalPrompt += `, ${sceneContext}`;
      console.log(
        `🎭 Scene context added: "${sceneContext}" (user provided no additional context)`
      );
    }

    console.log(
      `🎯 Size optimization: detected category "${sizeDetection.category}" (${sizeDetection.confidence} confidence, source: ${sizeDetection.source}) → using hints "${sizeHints}"`
    );

    // 添加额外上下文
    if (additionalContext?.trim()) {
      finalPrompt += `, ${additionalContext}`;
    }

    // 添加 FLUX.1-Kontext-dev 特有的优化提示词
    const kontextEnhancements = [
      'professional product photography',
      'high quality commercial image',
      'detailed textures and realistic materials',
      'perfect composition and lighting',
      'marketing ready photograph',
    ].join(', ');

    finalPrompt += `, ${kontextEnhancements}`;

    // 6. 场景特定的质量参数优化
    const sceneOptimizations = {
      'studio-white': {
        steps: steps || 35,
        guidance_scale: guidance_scale || 4.0,
        size: size || '1024x1024',
      }, // 高精度白底图
      'studio-shadow': {
        steps: steps || 40,
        guidance_scale: guidance_scale || 4.2,
        size: size || '1024x1024',
      }, // 强调光影效果
      'home-lifestyle': {
        steps: steps || 32,
        guidance_scale: guidance_scale || 3.8,
        size: size || '1024x768',
      }, // 生活场景平衡
      'nature-outdoor': {
        steps: steps || 35,
        guidance_scale: guidance_scale || 4.0,
        size: size || '1216x832',
      }, // 自然场景宽屏
      'table-flatlay': {
        steps: steps || 30,
        guidance_scale: guidance_scale || 3.8,
        size: size || '1024x1024',
      }, // 俯视构图优化
      'minimalist-clean': {
        steps: steps || 28,
        guidance_scale: guidance_scale || 3.5,
        size: size || '1024x1024',
      }, // 简约快速生成
      custom: {
        steps: steps || 32,
        guidance_scale: guidance_scale || 3.6,
        size: size || '1024x1024',
      }, // 自定义默认
    };

    const optimizedParams =
      sceneOptimizations[sceneType] || sceneOptimizations['minimalist-clean'];

    console.log(`🎛️ Scene optimization for ${sceneType}:`, optimizedParams);

    // 7. 调用 AI 生成
    console.log('Generating ProductShot with SiliconFlow:', {
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      prompt: finalPrompt.substring(0, 100) + '...',
      quality,
      hasImageInput: !!image_input,
      hasReferenceImage: !!reference_image,
      dualImageMode: !!reference_image,
      optimizedParams,
    });

    const result = await provider.generateProductShot({
      prompt: finalPrompt,
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      size: optimizedParams.size,
      quality,
      steps: optimizedParams.steps,
      seed,
      guidance_scale: optimizedParams.guidance_scale,
      num_images,
      output_format,
      image_input,
      reference_image, // 新增：传递reference_image参数
    });

    // 8. 扣减 Credits - 成功生成后
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: session.user.id,
      amount: CREDITS_PER_IMAGE,
    });

    if (deductResult?.data?.success) {
      console.log(
        `💰 Deducted ${CREDITS_PER_IMAGE} credits for ProductShot. Remaining: ${deductResult.data.data?.remainingCredits}`
      );
    } else {
      console.warn(
        '⚠️ Failed to deduct credits, but ProductShot was generated successfully'
      );
    }

    // 9. 返回简化结果 - 隐藏技术细节
    return NextResponse.json({
      success: true,
      resultUrl: result.resultUrl,
      scene: sceneType
        ? SCENE_PRESETS[sceneType].name
        : 'Reference Image Guided',
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deductResult?.data?.data?.remainingCredits || 0,
    });
  } catch (error) {
    console.error('ProductShot generation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Generation failed',
        details: errorMessage,
        provider: 'SiliconFlow',
      },
      { status: 500 }
    );
  }
}

// GET 方法用于获取可用的场景类型
export async function GET() {
  return NextResponse.json({
    scenes: Object.entries(SCENE_PRESETS).map(([id, config]) => ({
      id,
      name: config.name,
      category: config.category,
    })),
  });
}

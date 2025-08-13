import { NextRequest, NextResponse } from 'next/server';
import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';

// 产品尺寸映射 - 基于常见产品类型的合理尺寸
const PRODUCT_SIZE_HINTS = {
  // 小型产品
  small: ['small', 'compact', 'handheld', 'pocket-sized', 'delicate'],
  // 中型产品
  medium: ['medium-sized', 'standard', 'appropriately sized', 'well-proportioned'],
  // 大型产品
  large: ['substantial', 'prominent', 'statement piece', 'centerpiece'],
  // 默认
  default: ['properly sized', 'well-proportioned', 'naturally scaled']
};

// 场景与产品类型的智能映射
const SCENE_PRODUCT_PREFERENCES = {
  'studio-model': {
    likely: 'small',  // 模特摄影通常是小型产品（时尚、美妆、配饰）
    description: 'fashion and beauty products',
    contextHints: ['fashion accessory', 'beauty product', 'handheld item']
  },
  'lifestyle-casual': {
    likely: 'medium', // 生活方式场景适合中型日用品
    description: 'everyday lifestyle products',
    contextHints: ['everyday item', 'lifestyle product', 'daily use object']
  },
  'outdoor-adventure': {
    likely: 'medium', // 户外运动适合便携装备
    description: 'portable outdoor gear',
    contextHints: ['portable gear', 'outdoor equipment', 'sports accessory']
  },
  'elegant-evening': {
    likely: 'small',  // 优雅晚宴场景适合精致小物件
    description: 'luxury accessories',
    contextHints: ['luxury item', 'elegant accessory', 'refined product']
  },
  'street-style': {
    likely: 'medium', // 街头风格适合中型时尚单品
    description: 'trendy fashion items',
    contextHints: ['fashion item', 'trendy accessory', 'style statement']
  },
  'minimalist-clean': {
    likely: 'small',  // 极简风格适合精致小物件
    description: 'design-focused products',
    contextHints: ['design object', 'minimalist item', 'clean aesthetic']
  },
  'custom': {
    likely: 'default',
    description: 'various products',
    contextHints: ['product item']
  }
} as const;

// 多层智能尺寸检测函数
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
      source: 'user_hint'
    };
  }

  // 第1层：用户明确输入的产品信息（高优先级）
  if (additionalContext?.trim()) {
    const context = additionalContext.toLowerCase();

    // 小型产品关键词
    if (context.match(/\b(perfume|cologne|lipstick|ring|earrings|watch|phone|makeup|cosmetic|jewelry|small|tiny|mini|compact)\b/)) {
      return { category: 'small', confidence: 'high', source: 'user_input' };
    }

    // 大型产品关键词
    if (context.match(/\b(furniture|lamp|vase|large|big|substantial|prominent|statement|sofa|chair|table)\b/)) {
      return { category: 'large', confidence: 'high', source: 'user_input' };
    }

    // 中型产品关键词
    if (context.match(/\b(bag|handbag|shoes|boots|tablet|book|medium|standard|backpack|clothing|apparel)\b/)) {
      return { category: 'medium', confidence: 'high', source: 'user_input' };
    }
  }

  // 第2层：基于场景的智能推断（中等优先级）
  if (sceneType && SCENE_PRODUCT_PREFERENCES[sceneType]) {
    const scenePreference = SCENE_PRODUCT_PREFERENCES[sceneType];
    return {
      category: scenePreference.likely,
      confidence: 'medium',
      source: 'scene_inference'
    };
  }

  // 第3层：安全默认值（最低优先级）
  return { category: 'default', confidence: 'low', source: 'default' };
}

// 获取尺寸提示词（增强版）
function getSizeHints(detection: ReturnType<typeof detectProductSize>): string {
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

// 简化的场景预设配置 - 使用通用词汇，不需要产品类型检测
const SCENE_PRESETS = {
  'studio-model': {
    name: 'Professional Model',
    prompt: 'professional model elegantly holding a small product item in hands, product is properly sized as handheld object, clean studio setting, high-end product photography, perfect lighting, commercial quality, realistic proportions',
    category: 'model'
  },
  'lifestyle-casual': {
    name: 'Casual Lifestyle',
    prompt: 'person naturally using a reasonably sized product in casual lifestyle setting, product appears as normal everyday item, natural lighting, comfortable environment, realistic scale and proportions',
    category: 'lifestyle'
  },
  'outdoor-adventure': {
    name: 'Outdoor Adventure',
    prompt: 'person carrying a compact product during outdoor activities, product is appropriately sized for portable use, dynamic action shot, nature background, realistic proportions',
    category: 'sport'
  },
  'elegant-evening': {
    name: 'Elegant Evening',
    prompt: 'elegant person gracefully displaying a refined product at sophisticated evening event, product is elegantly proportioned, luxury setting, formal atmosphere, perfect scale',
    category: 'formal'
  },
  'street-style': {
    name: 'Street Style',
    prompt: 'stylish person casually featuring a trendy product in urban street style, product is street-appropriate size, modern city background, trendy lifestyle, natural proportions',
    category: 'urban'
  },
  'minimalist-clean': {
    name: 'Minimalist Clean',
    prompt: 'person thoughtfully presenting a well-proportioned product in minimalist clean environment, product appears as designed accessory, soft neutral lighting, simple background, balanced composition',
    category: 'minimal'
  },
  'custom': {
    name: 'Custom Scene',
    prompt: 'this product in {customScene}', // Will be replaced with actual custom scene description
    category: 'custom'
  }
} as const;

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      additionalContext,
      productTypeHint
    } = body;

    // 3. 验证必需参数 - 简化验证逻辑
    if (!sceneType || !image_input) {
      return NextResponse.json(
        { error: 'Scene type and product image are required' },
        { status: 400 }
      );
    }

    if (!SCENE_PRESETS[sceneType]) {
      return NextResponse.json(
        { error: 'Invalid scene type' },
        { status: 400 }
      );
    }

    // 验证自定义场景
    if (sceneType === 'custom' && !customSceneDescription?.trim()) {
      return NextResponse.json(
        { error: 'Custom scene description is required when using custom scene type' },
        { status: 400 }
      );
    }

    // 4. 检查用户 Credits
    const { canGenerateStickerAction } = await import('@/actions/credits-actions');
    const creditsCheck = await canGenerateStickerAction({
      requiredCredits: CREDITS_PER_IMAGE,
    });

    if (
      !creditsCheck?.data?.success ||
      !creditsCheck.data.data?.canGenerate
    ) {
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

    // 6. 构建简化的提示词 - 不需要复杂的产品类型检测
    const sceneConfig = SCENE_PRESETS[sceneType];
    let basePrompt: string;

    if (sceneType === 'custom' && customSceneDescription) {
      // 对于自定义场景，使用用户提供的场景描述
      basePrompt = sceneConfig.prompt.replace('{customScene}', customSceneDescription);
    } else {
      // 对于预设场景，直接使用模板
      basePrompt = sceneConfig.prompt;
    }

    let finalPrompt = basePrompt;

    // 添加智能尺寸控制
    const sizeDetection = detectProductSize(additionalContext, sceneType, productTypeHint);
    const sizeHints = getSizeHints(sizeDetection);
    finalPrompt += `, ${sizeHints}`;

    // 智能添加场景相关的产品上下文（当用户没有提供具体描述时）
    if (!additionalContext?.trim() && sizeDetection.source === 'scene_inference') {
      const sceneContext = getSceneContext(sceneType);
      finalPrompt += `, ${sceneContext}`;
      console.log(`🎭 Scene context added: "${sceneContext}" (user provided no additional context)`);
    }

    console.log(`🎯 Size optimization: detected category "${sizeDetection.category}" (${sizeDetection.confidence} confidence, source: ${sizeDetection.source}) → using hints "${sizeHints}"`);

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
      'marketing ready photograph'
    ].join(', ');

    finalPrompt += `, ${kontextEnhancements}`;

    // 7. 调用 AI 生成
    console.log('Generating ProductShot with SiliconFlow:', {
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      prompt: finalPrompt,
      quality,
      hasImageInput: !!image_input
    });

    const result = await provider.generateProductShot({
      prompt: finalPrompt,
      model: 'black-forest-labs/FLUX.1-dev',
      size: size || '1024x1024',
      quality,
      steps,
      seed,
      guidance_scale,
      num_images,
      output_format,
      image_input
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

    // 9. 返回结果
    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      resultUrl: result.resultUrl,
      sceneType,
      sceneConfig: {
        name: sceneConfig.name,
        category: sceneConfig.category
      },
      processingTime: result.processingTime,
      model: 'FLUX.1-Kontext-dev',
      provider: 'SiliconFlow',
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deductResult?.data?.data?.remainingCredits || 0
    });

  } catch (error) {
    console.error('ProductShot generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Generation failed',
        details: errorMessage,
        provider: 'SiliconFlow'
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
      category: config.category
    }))
  });
}

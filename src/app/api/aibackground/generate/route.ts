import { SiliconFlowProvider } from '@/ai/image/providers/siliconflow';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';
import { type NextRequest, NextResponse } from 'next/server';

// AI Background 预设颜色配置
const PRESET_COLORS = [
  { name: 'Red', value: '#E25241' },
  { name: 'Purple', value: '#9036AA' },
  { name: 'Blue', value: '#4153AF' },
  { name: 'Green', value: '#419488' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Transparent', value: 'transparent' },
];

// AI Background 风格预设
const BACKGROUND_STYLES = {
  'gradient-abstract': {
    name: 'Abstract Gradient',
    prompt: 'smooth gradient background, modern abstract colors, soft transitions, clean aesthetic'
  },
  'texture-fabric': {
    name: 'Fabric Texture',
    prompt: 'subtle texture background, fabric or paper texture, neutral tones, soft material feel'
  },
  'nature-blur': {
    name: 'Nature Blur',
    prompt: 'natural blurred background, bokeh effect, soft focus nature scene, warm ambient light'
  },
  'urban-blur': {
    name: 'Urban Blur',
    prompt: 'blurred urban background, soft city lights, bokeh street scene, modern atmosphere'
  },
  'wood-surface': {
    name: 'Wood Surface',
    prompt: 'wooden surface background, natural wood grain texture, warm brown tones, table surface'
  },
  'marble-stone': {
    name: 'Marble Stone',
    prompt: 'marble stone background, elegant natural patterns, luxury surface texture, neutral colors'
  },
  'fabric-cloth': {
    name: 'Soft Fabric',
    prompt: 'soft fabric background, silk or cotton texture, gentle folds and draping, elegant material'
  },
  'paper-vintage': {
    name: 'Vintage Paper',
    prompt: 'vintage paper background, aged texture, warm cream tones, subtle aging effects'
  },
  'custom': {
    name: 'Custom Background',
    prompt: '' // Will be filled by user input
  },
} as const;

type BackgroundType = keyof typeof BACKGROUND_STYLES;

interface AIBackgroundRequest {
  // Required: Product image (base64 encoded)
  image_input: string;

  // Background mode: 'color' for solid colors, 'background' for AI-generated backgrounds
  backgroundMode: 'color' | 'background';

  // For solid color mode
  backgroundColor?: string; // hex color or 'transparent'

  // For background style mode
  backgroundType?: BackgroundType;
  customBackgroundDescription?: string;

  // Optional generation parameters
  quality?: 'standard' | 'hd';
  steps?: number;
  seed?: number;
  guidance_scale?: number;
  size?: string;
  output_format?: 'jpeg' | 'png' | 'webp';
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
    const body: AIBackgroundRequest = await request.json();
    const {
      image_input,
      backgroundMode,
      backgroundColor,
      backgroundType,
      customBackgroundDescription,
      quality = 'standard',
      steps,
      seed,
      guidance_scale,
      size,
      output_format,
    } = body;

    // 3. 验证必需参数
    if (!image_input) {
      return NextResponse.json(
        { error: 'Product image is required' },
        { status: 400 }
      );
    }

    if (!backgroundMode || (backgroundMode !== 'color' && backgroundMode !== 'background')) {
      return NextResponse.json(
        { error: 'Invalid background mode. Must be "color" or "background"' },
        { status: 400 }
      );
    }

    // 验证背景模式特定参数
    if (backgroundMode === 'color' && !backgroundColor) {
      return NextResponse.json(
        { error: 'Background color is required when using color mode' },
        { status: 400 }
      );
    }

    if (backgroundMode === 'background') {
      if (!backgroundType) {
        return NextResponse.json(
          { error: 'Background type is required when using background mode' },
          { status: 400 }
        );
      }

      if (!BACKGROUND_STYLES[backgroundType]) {
        return NextResponse.json(
          { error: 'Invalid background type' },
          { status: 400 }
        );
      }

      if (backgroundType === 'custom' && !customBackgroundDescription?.trim()) {
        return NextResponse.json(
          {
            error: 'Custom background description is required when using custom background type',
          },
          { status: 400 }
        );
      }
    }

    // 4. 检查用户 Credits
    const { canGenerateStickerAction } = await import('@/actions/credits-actions');
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
      `💳 User ${session.user.id} has ${creditsCheck.data.data.currentCredits} credits, proceeding with AI Background generation...`
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

    // 6. 构建提示词
    let finalPrompt: string;

    if (backgroundMode === 'color') {
      // 纯色背景模式
      if (backgroundColor === 'transparent') {
        finalPrompt = 'remove background completely, transparent background, isolated object on transparent background, clean cutout, no background elements, perfect edge detection, professional background removal';
      } else {
        finalPrompt = `replace background with solid ${backgroundColor} color background, smooth even color background, no texture or pattern, clean solid color backdrop, professional studio lighting, object isolated on solid color background`;
      }
    } else {
      // AI 生成背景模式
      const styleConfig = BACKGROUND_STYLES[backgroundType!];
      console.log(`🎯 Using background style: ${backgroundType} (${styleConfig.name})`);

      let backgroundPrompt: string;
      if (backgroundType === 'custom' && customBackgroundDescription) {
        backgroundPrompt = customBackgroundDescription;
        console.log('🎨 Using custom background description');
      } else {
        backgroundPrompt = styleConfig.prompt;
        console.log(`🎨 Style: ${styleConfig.name}`);
      }

      finalPrompt = `replace background with ${backgroundPrompt}, maintain original object proportions and details, seamless background replacement, professional compositing, natural integration`;
    }

    // 添加通用质量提升词
    const qualityEnhancements = [
      'high quality image processing',
      'professional photo editing',
      'clean edge detection',
      'maintain object clarity and details',
      'perfect background replacement',
      'commercial quality result',
    ];

    finalPrompt += `, ${qualityEnhancements.join(', ')}`;

    console.log('🤖 AI Background generation prompt:', {
      mode: backgroundMode,
      backgroundType: backgroundType || 'N/A',
      backgroundColor: backgroundColor || 'N/A',
      prompt: finalPrompt.substring(0, 100) + '...',
    });

    // 7. 设置生成参数
    const generationParams = {
      prompt: finalPrompt,
      model: 'black-forest-labs/FLUX.1-Kontext-dev', // 使用相同的模型
      size: size || '1024x1024',
      quality,
      steps: steps || 30,
      seed,
      guidance_scale: guidance_scale || 3.5,
      output_format: output_format || 'png',
      image_input,
    };

    console.log('🚀 Generating AI Background with SiliconFlow:', {
      model: generationParams.model,
      size: generationParams.size,
      quality: generationParams.quality,
      steps: generationParams.steps,
      hasImageInput: !!image_input,
    });

    // 8. 调用 AI 生成 - 使用专门的 aibackgrounds 存储文件夹
    const result = await provider.generateProductShot({
      ...generationParams,
      storageFolder: 'aibackgrounds', // 使用专门的存储文件夹
    });

    // 9. 扣减 Credits - 成功生成后
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: session.user.id,
      amount: CREDITS_PER_IMAGE,
    });

    if (deductResult?.data?.success) {
      console.log(
        `💰 Deducted ${CREDITS_PER_IMAGE} credits for AI Background. Remaining: ${deductResult.data.data?.remainingCredits}`
      );
    } else {
      console.warn(
        '⚠️ Failed to deduct credits, but AI Background was generated successfully'
      );
    }

    // 10. 返回结果
    return NextResponse.json({
      success: true,
      resultUrl: result.resultUrl,
      backgroundMode,
      backgroundType: backgroundType || null,
      backgroundColor: backgroundColor || null,
      credits_used: CREDITS_PER_IMAGE,
      remaining_credits: deductResult?.data?.data?.remainingCredits || 0,
    });

  } catch (error) {
    console.error('AI Background generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 根据错误类型返回不同的HTTP状态码和用户友好的消息
    let statusCode = 500;
    let userMessage = 'Generation failed';

    if (errorMessage.includes('AI服务暂时不可用')) {
      statusCode = 503;
      userMessage = 'AI服务暂时不可用，请稍后重试';
    } else if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('AbortError')
    ) {
      statusCode = 408;
      userMessage = '请求超时，请重试';
    } else if (errorMessage.includes('网络')) {
      statusCode = 503;
      userMessage = '网络连接问题，请检查网络后重试';
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: errorMessage,
        provider: 'SiliconFlow',
        suggestion: '如果问题持续存在，请稍后重试或联系技术支持',
      },
      { status: statusCode }
    );
  }
}

// GET 方法用于获取可用的背景类型
export async function GET() {
  // 获取所有背景样式
  const allStyles = Object.entries(BACKGROUND_STYLES).map(([id, config]) => ({
    id,
    name: config.name,
  }));

  // 获取预设颜色
  const colors = PRESET_COLORS;

  return NextResponse.json({
    backgroundStyles: allStyles,
    presetColors: colors,
  });
}

/**
 * 测试 OpenAI gpt-image-1 贴纸风格提示词效果
 * 运行命令: npx tsx scripts/test-openai-sticker-prompts.ts
 */

import type {
  GenerateImageRequest,
  GenerateImageResponse,
} from '../src/ai/image/lib/api-types';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:3000';

// 贴纸风格提示词配置（保持与实际 API 一致）
const STICKER_STYLE_PROMPTS = {
  ios: "Create an iOS emoji sticker from the object in the uploaded image. Depict it as a smooth, vibrant 3D cartoon object, with a clean white edge. Render it against a pure white background.",
  pixel:
    'Transform into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
  lego: 'Convert to LEGO minifigure style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
  snoopy:
    'Transform into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background',
} as const;

async function testStickerPrompts() {
  console.log('🎨 测试 OpenAI gpt-image-1 贴纸风格提示词...\n');

  // 测试不同风格的贴纸生成
  const testCases: Array<{
    name: string;
    style: keyof typeof STICKER_STYLE_PROMPTS;
    subject: string;
    request: GenerateImageRequest;
  }> = [
    {
      name: 'iOS风格小猫贴纸',
      style: 'ios',
      subject: 'cat',
      request: {
        prompt: `${STICKER_STYLE_PROMPTS.ios} - cute cat`,
        provider: 'openai',
        modelId: 'gpt-image-1',
        quality: 'low',
        outputFormat: 'webp',
        background: 'transparent',
        size: '1024x1024',
        outputCompression: 60,
        editType: 'generate',
      },
    },
    {
      name: '像素艺术小狗贴纸',
      style: 'pixel',
      subject: 'dog',
      request: {
        prompt: `${STICKER_STYLE_PROMPTS.pixel} - happy dog`,
        provider: 'openai',
        modelId: 'gpt-image-1',
        quality: 'low',
        outputFormat: 'webp',
        background: 'transparent',
        size: '1024x1024',
        outputCompression: 60,
        editType: 'generate',
      },
    },
    {
      name: '乐高风格机器人贴纸',
      style: 'lego',
      subject: 'robot',
      request: {
        prompt: `${STICKER_STYLE_PROMPTS.lego} - friendly robot`,
        provider: 'openai',
        modelId: 'gpt-image-1',
        quality: 'low',
        outputFormat: 'webp',
        background: 'transparent',
        size: '1024x1024',
        outputCompression: 60,
        editType: 'generate',
      },
    },
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n🎯 ${testCase.name}`);
    console.log(`风格: ${testCase.style.toUpperCase()}`);
    console.log(`主题: ${testCase.subject}`);
    console.log(`提示词: ${testCase.request.prompt.substring(0, 80)}...`);

    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const result = (await response.json()) as GenerateImageResponse;
      const elapsed = Date.now() - startTime;

      if (response.ok && result.image) {
        console.log(`✅ 成功生成! 耗时: ${elapsed}ms`);
        console.log('响应信息:', {
          provider: result.provider,
          width: result.width,
          height: result.height,
          format: result.format,
          hasTransparentBg: testCase.request.background === 'transparent',
          imageSize: `${Math.round((result.image.length * 3) / 4 / 1024)}KB (base64)`,
        });

        results.push({
          style: testCase.style,
          subject: testCase.subject,
          success: true,
          elapsed,
          imageSize: Math.round((result.image.length * 3) / 4 / 1024),
        });

        // 保存图片到文件
        if (process.env.SAVE_TEST_IMAGES === 'true') {
          const fs = await import('fs');
          const path = await import('path');

          const imageData = Buffer.from(result.image, 'base64');
          const filename = `sticker_${testCase.style}_${testCase.subject}_${Date.now()}.webp`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, imageData);
          console.log(`💾 贴纸已保存: public/${filename}`);
        }
      } else {
        console.log('❌ 生成失败:', result.error || '未知错误');
        results.push({
          style: testCase.style,
          subject: testCase.subject,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.log(
        '💥 请求异常:',
        error instanceof Error ? error.message : error
      );
      results.push({
        style: testCase.style,
        subject: testCase.subject,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 等待3秒避免频率限制
    if (testCases.indexOf(testCase) < testCases.length - 1) {
      console.log('⏳ 等待3秒以避免频率限制...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(50));

  results.forEach((result, index) => {
    const status = result.success ? '✅ 成功' : '❌ 失败';
    console.log(
      `${index + 1}. ${result.style.toUpperCase()} 风格 ${result.subject}: ${status}`
    );
    if (result.success) {
      console.log(
        `   - 耗时: ${result.elapsed}ms, 大小: ${result.imageSize}KB`
      );
    } else {
      console.log(`   - 错误: ${result.error}`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `\n📈 成功率: ${successCount}/${results.length} (${Math.round((successCount / results.length) * 100)}%)`
  );

  console.log('\n💡 贴纸风格对比:');
  console.log('- iOS 风格: 现代、圆润、简洁，适合应用图标');
  console.log('- 像素风格: 复古、方块化，适合游戏主题');
  console.log('- 乐高风格: 积木感、明亮，适合儿童内容');
  console.log('- 史努比风格: 简约线条，适合卡通形象');

  console.log('\n🎯 下一步优化建议:');
  console.log('1. 基于测试结果调整提示词');
  console.log('2. 实现真正的 image-to-sticker 编辑功能');
  console.log('3. 集成到 hero 组件的文件上传流程');
  console.log('4. 添加批处理和队列管理');

  console.log('\n⚙️  环境变量提示:');
  console.log('- 设置 SAVE_TEST_IMAGES=true 保存生成的贴纸');
  console.log('- 确保 OPENAI_API_KEY 已正确配置');
}

// 运行测试
if (require.main === module) {
  testStickerPrompts().catch(console.error);
}

export { testStickerPrompts };

/**
 * 测试新的 OpenAI gpt-image-1 API 实现 - 贴纸生成模式
 * 运行命令: npx tsx scripts/test-openai-gpt-image.ts
 */

import type {
  GenerateImageRequest,
  GenerateImageResponse,
} from '../src/ai/image/lib/api-types';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:3000';

async function testGptImage1() {
  console.log('🧪 测试 OpenAI gpt-image-1 API (贴纸生成模式)...\n');

  // 使用最经济的设置测试贴纸生成功能
  const testCases: Array<{
    name: string;
    request: GenerateImageRequest;
  }> = [
    {
      name: 'iOS 贴纸风格测试',
      request: {
        prompt:
          "Learn the Apple iOS emoji style and create a 3D sticker avatar cat that matches that style. Recreate the cat's body shape, facial features, and expressions in the iOS emoji style. Remove background and include only the full figure, ensuring the final image looks like an official iOS emoji sticker.", // iOS风格贴纸
        provider: 'openai',
        modelId: 'gpt-image-1',
        quality: 'low', // 最低质量节省费用
        outputFormat: 'webp', // 最小文件格式
        background: 'transparent', // 贴纸需要透明背景
        size: '1024x1024', // 正方形贴纸
        outputCompression: 50, // 高压缩
      },
    },
    {
      name: '像素艺术贴纸测试',
      request: {
        prompt:
          'Transform into pixel art style sticker: 8-bit retro dog, blocky pixels, limited color palette, bold white outline, transparent background', // 像素风格贴纸
        provider: 'openai',
        modelId: 'gpt-image-1',
        quality: 'low',
        outputFormat: 'webp',
        background: 'transparent',
        size: '1024x1024',
        outputCompression: 30,
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);
    console.log('请求参数:', JSON.stringify(testCase.request, null, 2));

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
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log('响应信息:', {
          provider: result.provider,
          width: result.width,
          height: result.height,
          format: result.format,
          hasTransparentBg: testCase.request.background === 'transparent',
          imageSize: `${Math.round((result.image.length * 3) / 4 / 1024)}KB (base64)`,
        });

        // 可选：保存图片到文件（仅在设置环境变量时）
        if (process.env.SAVE_TEST_IMAGES === 'true') {
          const fs = await import('fs');
          const path = await import('path');

          const imageData = Buffer.from(result.image, 'base64');
          const filename = `sticker_${testCase.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${result.format || 'webp'}`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, imageData);
          console.log(`💾 贴纸已保存: public/${filename}`);
        }
      } else {
        console.log('❌ 失败:', result.error || '未知错误');
      }
    } catch (error) {
      console.log(
        '💥 请求异常:',
        error instanceof Error ? error.message : error
      );
    }

    // 等待2秒避免频率限制，节省费用
    console.log('⏳ 等待2秒以避免频率限制...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 贴纸生成测试完成!');
  console.log('\n💰 费用优化提示:');
  console.log('- 使用了贴纸特定的提示词');
  console.log('- 使用了最低质量设置 (low)');
  console.log('- 使用了透明背景设置');
  console.log('- 使用了 WebP 格式和高压缩率');
  console.log('- 使用了 1024x1024 正方形贴纸尺寸');
  console.log('- 设置环境变量 SAVE_TEST_IMAGES=true 可保存测试贴纸');

  console.log('\n🎨 贴纸风格说明:');
  console.log('- iOS 风格: 圆润边缘、鲜艳色彩、白色轮廓');
  console.log('- 像素风格: 8位复古、方块像素、有限色彩');
  console.log('- 乐高风格: 积木质感、明亮色彩、简化特征');
  console.log('- 史努比风格: 简约线条、可爱设计、卡通化');

  console.log('\n⚠️  注意事项:');
  console.log('- gpt-image-1 主要用于文本生成图片，不是图片编辑');
  console.log('- 真正的 Image-to-Sticker 需要图片编辑API');
  console.log('- 当前测试验证基础图片生成能力');
}

// 运行测试
if (require.main === module) {
  testGptImage1().catch(console.error);
}

export { testGptImage1 };

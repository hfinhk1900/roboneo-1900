/**
 * OpenAI 模型成本和尺寸对比测试
 * 运行命令: npx tsx scripts/test-openai-cost-comparison.ts
 */

import type { GenerateImageRequest, GenerateImageResponse } from '../src/ai/image/lib/api-types';

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com'
  : 'http://localhost:3000';

async function testCostComparison() {
  console.log('💰 OpenAI 模型成本和尺寸对比测试...\n');

  // 不同模型和尺寸的测试用例
  const testCases: Array<{
    name: string;
    model: string;
    size: string;
    estimatedCost: string;
    request: GenerateImageRequest;
  }> = [
    {
      name: '最便宜选项 - DALL-E 2 (512x512)',
      model: 'dall-e-2',
      size: '512x512',
      estimatedCost: '约 $0.018',
      request: {
        prompt: 'cute cat sticker, simple style, white outline',
        provider: 'openai',
        modelId: 'dall-e-2',
        size: '512x512',
        outputFormat: 'webp',
        outputCompression: 50,
      }
    },
    {
      name: '中等选项 - DALL-E 2 (1024x1024)',
      model: 'dall-e-2',
      size: '1024x1024',
      estimatedCost: '约 $0.020',
      request: {
        prompt: 'cute cat sticker, simple style, white outline',
        provider: 'openai',
        modelId: 'dall-e-2',
        size: '1024x1024',
        outputFormat: 'webp',
        outputCompression: 50,
      }
    },
    {
      name: '新模型 - GPT-Image-1 (1024x1024) 低质量',
      model: 'gpt-image-1',
      size: '1024x1024',
      estimatedCost: '约 $0.02-0.19 (取决于质量)',
      request: {
        prompt: 'cute cat sticker, simple style, white outline',
        provider: 'openai',
        modelId: 'gpt-image-1',
        size: '1024x1024',
        quality: 'low',
        outputFormat: 'webp',
        background: 'transparent',
        outputCompression: 50,
      }
    }
  ];

  console.log('📋 模型支持尺寸对比:');
  console.log('- DALL-E 2: 256x256, 512x512, 1024x1024');
  console.log('- DALL-E 3: 1024x1024, 1792x1024, 1024x1792');
  console.log('- GPT-Image-1: 1024x1024, 1536x1024, 1024x1536\n');

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`模型: ${testCase.model}`);
    console.log(`尺寸: ${testCase.size}`);
    console.log(`预估成本: ${testCase.estimatedCost}`);

    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const result = await response.json() as GenerateImageResponse;
      const elapsed = Date.now() - startTime;

      if (response.ok && result.image) {
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log(`响应信息:`, {
          provider: result.provider,
          width: result.width,
          height: result.height,
          format: result.format,
          imageSize: `${Math.round((result.image.length * 3/4) / 1024)}KB`
        });

        results.push({
          model: testCase.model,
          size: testCase.size,
          success: true,
          elapsed,
          imageSize: Math.round((result.image.length * 3/4) / 1024),
          estimatedCost: testCase.estimatedCost,
        });

        // 保存图片进行质量对比
        if (process.env.SAVE_TEST_IMAGES === 'true') {
          const fs = await import('fs');
          const path = await import('path');

          const imageData = Buffer.from(result.image, 'base64');
          const filename = `cost_test_${testCase.model.replace('-', '_')}_${testCase.size}_${Date.now()}.webp`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, imageData);
          console.log(`💾 已保存: public/${filename}`);
        }
      } else {
        console.log(`❌ 失败:`, result.error || '未知错误');
        results.push({
          model: testCase.model,
          size: testCase.size,
          success: false,
          error: result.error,
          estimatedCost: testCase.estimatedCost,
        });
      }
    } catch (error) {
      console.log(`💥 请求异常:`, error instanceof Error ? error.message : error);
      results.push({
        model: testCase.model,
        size: testCase.size,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        estimatedCost: testCase.estimatedCost,
      });
    }

    // 等待2秒避免频率限制
    if (testCases.indexOf(testCase) < testCases.length - 1) {
      console.log(`⏳ 等待2秒...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n📊 成本效益分析:');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${result.model} (${result.size}) ${status}`);
    console.log(`   成本: ${result.estimatedCost}`);
    if (result.success) {
      console.log(`   耗时: ${result.elapsed}ms | 大小: ${result.imageSize}KB`);
    } else {
      console.log(`   错误: ${result.error}`);
    }
    console.log('');
  });

  console.log('💡 成本优化建议:');
  console.log('1. 🏆 最便宜: DALL-E 2 + 512x512 尺寸');
  console.log('2. ⚖️ 平衡: DALL-E 2 + 1024x1024 尺寸');
  console.log('3. 🚀 最新: GPT-Image-1 + 低质量设置');
  console.log('');
  console.log('🎯 贴纸生成推荐:');
  console.log('- 预览/测试: DALL-E 2 (512x512)');
  console.log('- 生产环境: GPT-Image-1 (更好的指令跟随)');
  console.log('- 透明背景: GPT-Image-1 (更好支持)');
  console.log('');
  console.log('⚙️ 环境变量:');
  console.log('- 设置 SAVE_TEST_IMAGES=true 保存图片对比质量');
}

// 运行测试
if (require.main === module) {
  testCostComparison().catch(console.error);
}

export { testCostComparison };

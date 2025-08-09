#!/usr/bin/env tsx

/**
 * 测试 image-to-sticker API 的脚本
 * 运行方式: npx tsx scripts/test-image-api.ts
 */

import { join } from 'path';
import FormData from 'form-data';
import { readFile } from 'fs/promises';

const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : 'http://localhost:3000';

async function testImageToStickerAPI() {
  try {
    console.log('🧪 Testing Image-to-Sticker API...');
    console.log('📍 API Base URL:', API_BASE_URL);

    // 检查测试图片文件
    const testImagePath = join(
      process.cwd(),
      'public',
      'images',
      'blog',
      'post-1.png'
    );
    console.log('📁 Test image path:', testImagePath);

    // 读取测试图片
    let imageBuffer;
    try {
      imageBuffer = await readFile(testImagePath);
      console.log(`✅ Image loaded successfully (${imageBuffer.length} bytes)`);
    } catch (error) {
      console.error('❌ Failed to load test image:', error);
      console.log('💡 Please ensure there is a test image at:', testImagePath);
      return;
    }

    // 准备 FormData
    const formData = new FormData();
    formData.append('imageFile', imageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png',
    });
    formData.append('style', 'ios');

    console.log('📤 Sending request to API...');
    const startTime = Date.now();

    // 发送请求
    const response = await fetch(`${API_BASE_URL}/api/image-to-sticker`, {
      method: 'POST',
      body: formData as any,
      headers: {
        ...formData.getHeaders(),
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log('📝 Response status:', response.status);
    console.log(
      '📝 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API request successful!');
    console.log('📊 Response data:', JSON.stringify(result, null, 2));

    // 分析响应
    if (result.url) {
      console.log('🖼️  Generated image URL:', result.url);
    }

    if (result.cost) {
      console.log('💰 Estimated cost: $' + result.cost.toFixed(4));
    }

    if (result.tokenUsage) {
      console.log('🪙 Token usage:', result.tokenUsage);
    }

    if (result.description) {
      console.log(
        '📝 AI description:',
        result.description.substring(0, 100) + '...'
      );
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// 检查必要的环境变量
function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');

  const requiredEnvVars = ['LAOZHANG_API_KEY'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.log('💡 Please set these variables in your .env file');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// 主函数
async function main() {
  console.log('🚀 Starting Image-to-Sticker API Test\n');

  if (!checkEnvironment()) {
    process.exit(1);
  }

  await testImageToStickerAPI();

  console.log('\n🏁 Test completed');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

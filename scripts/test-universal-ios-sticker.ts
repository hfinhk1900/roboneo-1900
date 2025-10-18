#!/usr/bin/env tsx

/**
 * 测试 image-to-sticker-universal API 的 iOS 风格转换
 * 运行方式: npx tsx scripts/test-universal-ios-sticker.ts
 */

import fs from 'fs';
import { join } from 'path';

const API_BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_PATH = join(process.cwd(), 'public', 'test-img.jpg');
const OUTPUT_DIR = join(process.cwd(), 'public');

async function testUniversalIOSSticker() {
  console.log('🎨 测试 Universal 版本的 iOS Sticker 生成...\n');

  console.log('🔧 配置信息:');
  console.log(`   📁 测试图片: ${TEST_IMAGE_PATH}`);
  console.log('   🎯 目标风格: ios');
  console.log(`   🌐 API 端点: ${API_BASE_URL}/api/image-to-sticker-universal`);
  console.log(`   📤 输出目录: ${OUTPUT_DIR}`);
  console.log('');

  const startTime = Date.now();

  try {
    // 检查测试图片是否存在
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error('❌ 测试图片不存在:', TEST_IMAGE_PATH);
      return;
    }

    // 读取图片文件
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`📁 图片读取成功: ${Math.round(imageBuffer.length / 1024)}KB`);

    // 创建 FormData
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('imageFile', imageBlob, 'test-img.jpg');
    formData.append('style', 'ios');

    console.log('\n🚀 开始调用 Universal API...');
    console.log('⏳ 预计耗时: 15-25秒 (直接 DALL-E 2 图片编辑)');
    console.log('━'.repeat(60));

    // 调用 Universal API
    const response = await fetch(
      `${API_BASE_URL}/api/image-to-sticker-universal`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ 成功完成! 总耗时: ${Math.round(elapsed / 1000)}秒`);

      // 显示处理结果
      console.log('\n📊 处理信息:');
      console.log(`   ✅ 成功状态: ${data.success}`);
      console.log(`   🎨 应用风格: ${data.style}`);

      if (data.processing) {
        console.log(`   📄 原始格式: ${data.processing.originalFormat}`);
        console.log(
          `   📐 原始尺寸: ${data.processing.originalSize.width}x${data.processing.originalSize.height}`
        );
        console.log(
          `   📏 最终尺寸: ${data.processing.finalSize.width}x${data.processing.finalSize.height}`
        );
        console.log(`   📦 压缩比: ${data.processing.compressionRatio}%`);
        console.log(
          `   🔧 处理特点: ${data.processing.supportedAnyFormat ? '支持任意格式' : '标准格式'}`
        );
      }

      // 保存生成的贴纸
      if (data.stickerUrl?.startsWith('data:image/')) {
        const base64Data = data.stickerUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const timestamp = Date.now();
        const outputPath = join(
          OUTPUT_DIR,
          `ios_sticker_universal_${timestamp}.png`
        );

        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`\n💾 贴纸已保存: ${outputPath}`);
        console.log(`📏 文件大小: ${Math.round(imageBuffer.length / 1024)}KB`);
      }

      console.log('\n🎉 测试完成!');
    } else {
      const errorData = await response.text();
      console.error(`\n❌ API 调用失败 (${response.status}):`, errorData);
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(
      `\n❌ 测试失败 (耗时: ${Math.round(elapsed / 1000)}秒):`,
      error
    );
  }
}

// 显示提示信息
console.log('\n📋 测试说明:');
console.log('━'.repeat(60));
console.log('🎯 此测试将验证 Universal 版本的 iOS Sticker 生成功能');
console.log('💡 使用的是 DALL-E 2 直接图片编辑的稳定方案');
console.log('📝 不需要预先分析，直接进行风格转换');
console.log('🚀 支持任意图片格式，无人物识别限制');
console.log('━'.repeat(60));

// 运行测试
testUniversalIOSSticker().catch(console.error);

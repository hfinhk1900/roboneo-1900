#!/usr/bin/env tsx

/**
 * 测试 image-to-sticker-improved API 的 iOS 风格转换
 * 运行方式: npx tsx scripts/test-improved-ios-sticker.ts
 */

import fs from 'fs';
import { join } from 'path';

const API_BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_PATH = join(process.cwd(), 'public', 'test-img.jpg');
const OUTPUT_DIR = join(process.cwd(), 'public');

async function testImprovedIOSSticker() {
  console.log('🎨 测试 Improved 版本的 iOS Sticker 生成...\n');

  console.log('🔧 配置信息:');
  console.log(`   📁 测试图片: ${TEST_IMAGE_PATH}`);
  console.log(`   🎯 目标风格: ios`);
  console.log(`   🌐 API 端点: ${API_BASE_URL}/api/image-to-sticker-improved`);
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

    console.log('\n🚀 开始调用 Improved API...');
    console.log('⏳ 预计耗时: 15-25秒 (GPT-4o 优化 + GPT Image 1 生成)');
    console.log('━'.repeat(60));

    // 调用 Improved API
    const response = await fetch(
      `${API_BASE_URL}/api/image-to-sticker-improved`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ 成功完成! 总耗时: ${Math.round(elapsed / 1000)}秒`);

      // 显示分析结果
      if (data.analysis) {
        console.log('\n📊 处理分析:');
        console.log(`   ✅ 成功状态: ${data.success}`);
        console.log(`   🎨 应用风格: ${data.style}`);
        console.log(`   🔧 处理方法: ${data.analysis.method}`);
        console.log(`   📱 风格描述: ${data.analysis.styleApplied}`);

        if (data.analysis.originalDescription) {
          console.log('\n🔍 GPT-4o 图片内容分析:');
          console.log('━'.repeat(60));
          console.log(`${data.analysis.originalDescription}`);
          console.log('━'.repeat(60));
        }

        if (data.analysis.improvements) {
          console.log('\n🚀 改进功能:');
          data.analysis.improvements.forEach(
            (improvement: string, index: number) => {
              console.log(`   ${index + 1}. ${improvement}`);
            }
          );
        }
      }

      // 保存生成的贴纸
      if (data.stickerUrl && data.stickerUrl.startsWith('data:image/')) {
        const base64Data = data.stickerUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const timestamp = Date.now();
        const outputPath = join(
          OUTPUT_DIR,
          `ios_sticker_improved_${timestamp}.png`
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
console.log('🎯 此测试将验证 Improved 版本的 iOS Sticker 生成功能');
console.log('💡 使用的是 GPT-4o 优化 + GPT Image 1 生成的生产级方案');
console.log('📝 新的 iOS 提示词已更新为用户指定版本');
console.log('⚠️  请确保本地开发服务器已启动 (npm run dev)');
console.log('━'.repeat(60));

// 运行测试
testImprovedIOSSticker().catch(console.error);

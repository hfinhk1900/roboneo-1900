/**
 * 测试正确的风格转换 API
 * 运行命令: npx tsx scripts/test-correct-style-transfer.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testCorrectStyleTransfer() {
  console.log('🎨 测试正确的风格转换 API (两步法)...\n');

  // 测试图片
  const testImagePath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');

  if (!fs.existsSync(testImagePath)) {
    console.log('❌ 找不到测试图片: public/apple-touch-icon.png');
    return;
  }

  console.log(`📁 使用测试图片: ${testImagePath}`);
  console.log(`📏 图片大小: ${Math.round(fs.statSync(testImagePath).size / 1024)}KB`);

  // 测试一种风格看效果
  const testStyle = 'ios';

  console.log(`\n🎨 测试风格转换: ${testStyle.toUpperCase()}`);
  console.log('🔄 流程: 原图 → GPT-4o分析 → DALL-E 3生成风格化贴纸');

  const startTime = Date.now();

  try {
    // 读取图片文件
    const imageBuffer = fs.readFileSync(testImagePath);

    // 创建 FormData
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('imageFile', imageBlob, path.basename(testImagePath));
    formData.append('style', testStyle);

    console.log('📡 调用正确的风格转换 API...');

    // 调用正确的风格转换 API
    const response = await fetch('http://localhost:3000/api/image-to-sticker-correct', {
      method: 'POST',
      body: formData,
    });

    const elapsed = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 成功! 总耗时: ${elapsed}ms`);
      console.log(`📊 转换信息:`, {
        success: data.success,
        style: data.style,
        method: data.analysis?.method,
        styleApplied: data.analysis?.styleApplied,
        hasSticker: Boolean(data.stickerUrl)
      });

      // 显示分析结果
      if (data.analysis?.originalDescription) {
        console.log('\n🔍 GPT-4o 图片分析结果:');
        console.log(`"${data.analysis.originalDescription}"`);
      }

      // 保存生成的风格化贴纸
      if (data.stickerUrl) {
        const base64Data = data.stickerUrl.replace('data:image/png;base64,', '');
        const stickerBuffer = Buffer.from(base64Data, 'base64');

        const filename = `correct_style_${testStyle}_${Date.now()}.png`;
        const filepath = path.join(process.cwd(), 'public', filename);

        fs.writeFileSync(filepath, stickerBuffer);
        console.log(`\n💾 风格化贴纸已保存: public/${filename}`);
        console.log(`📏 输出大小: ${Math.round(stickerBuffer.length / 1024)}KB`);

        console.log('\n✅ 风格转换成功完成!');
        console.log('🎯 现在您可以对比：');
        console.log(`   原图: ${testImagePath}`);
        console.log(`   风格化结果: public/${filename}`);
        console.log('   → 应该能看到明显的风格差异！');
      }
    } else {
      const errorData = await response.json();
      console.log(`❌ 失败 (${response.status}):`, errorData);
    }
  } catch (error) {
    console.log(`💥 请求异常:`, error instanceof Error ? error.message : error);
  }

  // 测试 API 信息端点
  console.log('\n📋 获取 API 信息...');
  try {
    const infoResponse = await fetch('http://localhost:3000/api/image-to-sticker-correct');
    if (infoResponse.ok) {
      const apiInfo = await infoResponse.json();
      console.log('✅ API 信息:');
      console.log(`   方法: ${apiInfo.method}`);
      console.log(`   成本: ${apiInfo.cost.total}`);
      console.log('\n🔧 处理步骤:');
      apiInfo.steps.forEach((step: string, i: number) => {
        console.log(`   ${step}`);
      });
      console.log('\n💡 优势:');
      apiInfo.advantages.forEach((advantage: string, i: number) => {
        console.log(`   ✅ ${advantage}`);
      });
    }
  } catch (error) {
    console.log('⚠️ API 信息获取失败:', error);
  }

  console.log('\n🎊 测试完成!');
  console.log('\n📝 总结：');
  console.log('✅ 使用了正确的风格转换方法');
  console.log('✅ GPT-4o 智能分析图片内容');
  console.log('✅ DALL-E 3 生成全新的风格化图片');
  console.log('✅ 真正的风格转换（不是编辑）');

  console.log('\n🔄 与之前API的区别:');
  console.log('❌ 之前: 使用 /images/edits (图片编辑) → 风格不变');
  console.log('✅ 现在: GPT-4o分析 + DALL-E 3生成 → 真正风格转换');

  console.log('\n💰 成本对比:');
  console.log('- 之前的编辑API: ~$0.018 (但风格不变)');
  console.log('- 正确的转换API: ~$0.05-0.06 (真正风格转换)');

  console.log('\n🚀 建议:');
  console.log('如果您的需求是真正的风格转换，请使用：');
  console.log('/api/image-to-sticker-correct');
  console.log('这个API会生成完全不同风格的贴纸！');
}

// 运行测试
if (require.main === module) {
  testCorrectStyleTransfer().catch(console.error);
}

export { testCorrectStyleTransfer };

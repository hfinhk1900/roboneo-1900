/**
 * 测试特定图片的风格转换
 * 使用 test-img.jpg 生成 iOS sticker 风格
 * 运行命令: npx tsx scripts/test-specific-image.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testSpecificImage() {
  console.log('🎨 测试指定图片的风格转换...\n');

  // 使用用户指定的图片
  const testImagePath = path.join(process.cwd(), 'public', 'test-img.jpg');

  if (!fs.existsSync(testImagePath)) {
    console.log('❌ 找不到测试图片: public/test-img.jpg');
    return;
  }

  console.log(`📁 使用图片: ${testImagePath}`);
  console.log(
    `📏 图片大小: ${Math.round(fs.statSync(testImagePath).size / 1024)}KB`
  );

  // 测试iOS风格
  const testStyle = 'ios';

  console.log(`\n🎨 目标风格: ${testStyle.toUpperCase()} Sticker`);
  console.log('🔄 处理流程:');
  console.log('   1️⃣ GPT-4o 分析图片内容 (识别人物、场景、特征)');
  console.log('   2️⃣ DALL-E 3 生成iOS风格贴纸 (可爱、简化、透明背景)');

  const startTime = Date.now();

  try {
    // 读取图片文件
    const imageBuffer = fs.readFileSync(testImagePath);

    // 创建 FormData
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('imageFile', imageBlob, 'test-img.jpg');
    formData.append('style', testStyle);

    console.log('\n📡 开始调用风格转换 API...');
    console.log('⏳ 预计耗时: 15-25秒 (AI分析+生成)');

    // 调用正确的风格转换 API
    const response = await fetch(
      'http://localhost:3000/api/image-to-sticker-correct',
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
      console.log(`   🔧 处理方法: ${data.analysis?.method}`);
      console.log(`   📱 风格描述: ${data.analysis?.styleApplied}`);

      // 显示GPT-4o的分析结果
      if (data.analysis?.originalDescription) {
        console.log('\n🔍 GPT-4o 图片内容分析:');
        console.log('━'.repeat(60));
        console.log(`${data.analysis.originalDescription}`);
        console.log('━'.repeat(60));
      }

      // 保存生成的iOS风格贴纸
      if (data.stickerUrl) {
        const base64Data = data.stickerUrl.replace(
          'data:image/png;base64,',
          ''
        );
        const stickerBuffer = Buffer.from(base64Data, 'base64');

        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')
          .split('T')[0];
        const filename = `test-img_ios_sticker_${timestamp}.png`;
        const filepath = path.join(process.cwd(), 'public', filename);

        fs.writeFileSync(filepath, stickerBuffer);

        console.log('\n💾 生成的贴纸已保存:');
        console.log(`   📁 文件路径: public/${filename}`);
        console.log(
          `   📏 文件大小: ${Math.round(stickerBuffer.length / 1024)}KB`
        );
        console.log('   🖼️  格式: PNG (透明背景)');

        console.log('\n🎯 对比效果:');
        console.log(
          `   📷 原图: public/test-img.jpg (${Math.round(fs.statSync(testImagePath).size / 1024)}KB)`
        );
        console.log(
          `   🎨 贴纸: public/${filename} (${Math.round(stickerBuffer.length / 1024)}KB)`
        );
        console.log('   → 打开两张图片对比，应该看到显著的风格差异！');

        console.log('\n🎉 iOS风格转换完成!');
        console.log('📱 新贴纸特点:');
        console.log('   ✅ 可爱卡通风格');
        console.log('   ✅ 简化的细节');
        console.log('   ✅ 鲜亮的颜色');
        console.log('   ✅ 透明背景');
        console.log('   ✅ 适合消息应用使用');
      }
    } else {
      const errorData = await response.json();
      console.log(`\n❌ 转换失败 (HTTP ${response.status}):`, errorData);

      if (response.status === 500) {
        console.log('\n💡 可能的问题:');
        console.log('   • OpenAI API key 配置问题');
        console.log('   • API 调用限制');
        console.log('   • 图片格式问题');
      }
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(
      `\n💥 请求异常 (耗时 ${Math.round(elapsed / 1000)}秒):`,
      error instanceof Error ? error.message : error
    );

    console.log('\n🔧 故障排查:');
    console.log('   1. 确认开发服务器正在运行: pnpm dev');
    console.log('   2. 检查网络连接');
    console.log('   3. 验证 OpenAI API key 配置');
  }

  console.log('\n📋 测试总结:');
  console.log('━'.repeat(50));
  console.log('🎯 测试目标: test-img.jpg → iOS sticker 风格');
  console.log('🔧 使用API: /api/image-to-sticker-correct');
  console.log('⚡ 技术栈: GPT-4o 分析 + DALL-E 3 生成');
  console.log('💰 预估成本: ~$0.05-0.06');
  console.log('🌟 特色: 真正的风格转换，而非简单编辑');
  console.log('━'.repeat(50));
}

// 运行测试
if (require.main === module) {
  testSpecificImage().catch(console.error);
}

export { testSpecificImage };

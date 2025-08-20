/**
 * 测试所有风格的转换效果
 * 使用 test-img.jpg 生成所有可用的贴纸风格
 * 运行命令: npx tsx scripts/test-all-styles.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

const AVAILABLE_STYLES = ['ios', 'pixel', 'lego', 'snoopy'] as const;

async function testAllStyles() {
  console.log('🎨 测试所有风格转换效果...\n');

  const testImagePath = path.join(process.cwd(), 'public', 'test-img.jpg');

  if (!fs.existsSync(testImagePath)) {
    console.log('❌ 找不到测试图片: public/test-img.jpg');
    return;
  }

  console.log(`📁 源图片: ${testImagePath}`);
  console.log(
    `📏 源大小: ${Math.round(fs.statSync(testImagePath).size / 1024)}KB`
  );

  console.log('\n🎯 将要生成的风格:');
  AVAILABLE_STYLES.forEach((style, index) => {
    const descriptions = {
      ios: '📱 iOS Messages 贴纸风格 - 可爱卡通',
      pixel: '🎮 8位像素艺术风格 - 复古游戏',
      lego: '🧱 乐高积木风格 - 塑料材质',
      snoopy: '🐕 史努比漫画风格 - 简洁线条',
    };
    console.log(
      `   ${index + 1}. ${style.toUpperCase()}: ${descriptions[style]}`
    );
  });

  console.log('\n⚠️  注意: 每个风格转换需要 20-30秒，总计约 2-3分钟');
  console.log('💰 总成本约: $0.20-0.25 (4个风格 × ~$0.05-0.06)');

  console.log('\n🚀 开始批量转换...\n');

  const results = [];

  for (let i = 0; i < AVAILABLE_STYLES.length; i++) {
    const style = AVAILABLE_STYLES[i];
    const startTime = Date.now();

    console.log(
      `🔄 [${i + 1}/${AVAILABLE_STYLES.length}] 处理 ${style.toUpperCase()} 风格...`
    );

    try {
      // 读取图片文件
      const imageBuffer = fs.readFileSync(testImagePath);

      // 创建 FormData
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('imageFile', imageBlob, 'test-img.jpg');
      formData.append('style', style);

      // 调用API
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

        if (data.stickerUrl) {
          // 保存生成的贴纸
          const base64Data = data.stickerUrl.replace(
            'data:image/png;base64,',
            ''
          );
          const stickerBuffer = Buffer.from(base64Data, 'base64');

          const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-')
            .split('T')[0];
          const filename = `test-img_${style}_sticker_${timestamp}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, stickerBuffer);

          console.log(`   ✅ 成功! 耗时: ${Math.round(elapsed / 1000)}秒`);
          console.log(
            `   📁 保存: public/${filename} (${Math.round(stickerBuffer.length / 1024)}KB)`
          );

          results.push({
            style,
            success: true,
            filename,
            fileSize: Math.round(stickerBuffer.length / 1024),
            elapsed: Math.round(elapsed / 1000),
            description:
              data.analysis?.originalDescription?.substring(0, 100) + '...',
          });
        } else {
          console.log('   ❌ 失败: 未收到图片数据');
          results.push({ style, success: false, error: 'No image data' });
        }
      } else {
        const errorData = await response.json();
        console.log(`   ❌ 失败 (${response.status}):`, errorData.error);
        results.push({ style, success: false, error: errorData.error });
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(
        `   💥 异常 (${Math.round(elapsed / 1000)}秒):`,
        error instanceof Error ? error.message : error
      );
      results.push({
        style,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    console.log(''); // 空行分隔
  }

  // 总结报告
  console.log('🎊 批量转换完成!\n');
  console.log('📋 转换结果总结:');
  console.log('━'.repeat(80));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ 成功: ${successful.length}/${results.length}`);
  console.log(`❌ 失败: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n📁 生成的贴纸文件:');
    successful.forEach((result) => {
      console.log(
        `   🎨 ${result.style.toUpperCase()}: public/${result.filename} (${result.fileSize}KB, ${result.elapsed}秒)`
      );
    });

    console.log('\n🎯 对比方法:');
    console.log('   📷 原图: public/test-img.jpg');
    successful.forEach((result) => {
      console.log(
        `   🎨 ${result.style.toUpperCase()}: public/${result.filename}`
      );
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ 失败的转换:');
    failed.forEach((result) => {
      console.log(`   ${result.style.toUpperCase()}: ${result.error}`);
    });
  }

  console.log('\n💡 使用建议:');
  console.log('   • 在文件夹中并排查看所有贴纸对比效果');
  console.log('   • 每种风格都有独特的视觉特征');
  console.log('   • 所有贴纸都带透明背景，适合直接使用');
  console.log('━'.repeat(80));
}

// 运行测试
if (require.main === module) {
  testAllStyles().catch(console.error);
}

export { testAllStyles };

/**
 * 对比提示词版本的效果
 * 使用 test-img.jpg 同时测试原版和改进版提示词
 * 运行命令: npx tsx scripts/compare-prompt-versions.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function comparePromptVersions() {
  console.log('🆚 对比提示词版本效果...\n');

  const testImagePath = path.join(process.cwd(), 'public', 'test-img.jpg');

  if (!fs.existsSync(testImagePath)) {
    console.log('❌ 找不到测试图片: public/test-img.jpg');
    return;
  }

  console.log(`📁 测试图片: ${testImagePath}`);
  console.log(
    `📏 图片大小: ${Math.round(fs.statSync(testImagePath).size / 1024)}KB`
  );

  // 选择一个风格进行对比测试（iOS风格最容易看出差异）
  const testStyle = 'ios';

  console.log(`\n🎨 对比风格: ${testStyle.toUpperCase()}`);
  console.log('🔄 将生成两个版本进行对比:');
  console.log('   📱 V1: 基础版本 (原始简单提示词)');
  console.log('   📱 V2: 改进版本 (详细优化提示词)');

  console.log('\n⚠️  注意: 此测试需要约 1分钟，将生成2张贴纸进行对比');
  console.log('💰 成本约: $0.10-0.12 (2次转换)');

  const results = [];

  // 测试两个版本
  const versions = [
    { name: 'V1 基础版', endpoint: '/api/image-to-sticker-correct' },
    { name: 'V2 改进版', endpoint: '/api/image-to-sticker-improved' },
  ];

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const startTime = Date.now();

    console.log(`\n🔄 [${i + 1}/2] 测试 ${version.name}...`);
    console.log(`📡 API: ${version.endpoint}`);

    try {
      // 读取图片文件
      const imageBuffer = fs.readFileSync(testImagePath);

      // 创建 FormData
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('imageFile', imageBlob, 'test-img.jpg');
      formData.append('style', testStyle);

      // 调用对应版本的API
      const response = await fetch(`http://localhost:3000${version.endpoint}`, {
        method: 'POST',
        body: formData,
      });

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
          const versionTag = i === 0 ? 'v1_basic' : 'v2_improved';
          const filename = `compare_${versionTag}_${testStyle}_${timestamp}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, stickerBuffer);

          console.log(`   ✅ 成功! 耗时: ${Math.round(elapsed / 1000)}秒`);
          console.log(
            `   📁 保存: public/${filename} (${Math.round(stickerBuffer.length / 1024)}KB)`
          );

          // 显示分析结果的差异
          if (data.analysis?.originalDescription) {
            console.log(
              `   🔍 分析质量: ${data.analysis.originalDescription.length} 字符`
            );
            if (i === 1) {
              // 改进版
              console.log(
                `   💡 改进点: ${data.analysis.improvements?.join(', ')}`
              );
            }
          }

          results.push({
            version: version.name,
            success: true,
            filename,
            fileSize: Math.round(stickerBuffer.length / 1024),
            elapsed: Math.round(elapsed / 1000),
            analysisLength: data.analysis?.originalDescription?.length || 0,
            method: data.analysis?.method,
          });
        } else {
          console.log(`   ❌ 失败: 未收到图片数据`);
          results.push({
            version: version.name,
            success: false,
            error: 'No image data',
          });
        }
      } else {
        const errorData = await response.json();
        console.log(`   ❌ 失败 (${response.status}):`, errorData.error);
        results.push({
          version: version.name,
          success: false,
          error: errorData.error,
        });
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(
        `   💥 异常 (${Math.round(elapsed / 1000)}秒):`,
        error instanceof Error ? error.message : error
      );
      results.push({
        version: version.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // 详细对比报告
  console.log('\n🎊 对比测试完成!\n');
  console.log('📊 版本对比结果:');
  console.log('━'.repeat(80));

  const successful = results.filter((r) => r.success);

  if (successful.length === 2) {
    console.log('✅ 两个版本都成功生成');

    console.log('\n📁 生成的对比文件:');
    successful.forEach((result, index) => {
      console.log(
        `   ${index + 1}. ${result.version}: public/${result.filename}`
      );
      console.log(`      • 文件大小: ${result.fileSize}KB`);
      console.log(`      • 生成时间: ${result.elapsed}秒`);
      console.log(`      • 分析详细度: ${result.analysisLength}字符`);
      console.log(`      • 处理方法: ${result.method}`);
    });

    console.log('\n🔍 主要差异预期:');
    console.log('   📱 V1 基础版特点:');
    console.log('     • 使用简单的风格描述');
    console.log('     • 可能丢失原图的一些特征');
    console.log('     • 风格转换较为粗糙');

    console.log('   📱 V2 改进版特点:');
    console.log('     • 使用详细的技术指令');
    console.log('     • 强调保持原主体特征');
    console.log('     • 包含具体的视觉参考');
    console.log('     • 添加禁止事项约束');

    console.log('\n🎯 如何对比查看:');
    console.log('   1. 打开文件管理器');
    console.log('   2. 导航到 public/ 文件夹');
    console.log('   3. 并排查看两个对比文件');
    console.log('   4. 注意观察:');
    console.log('      • 人物特征的保持程度');
    console.log('      • 风格转换的准确性');
    console.log('      • 细节的处理质量');
    console.log('      • 整体视觉效果');
  } else {
    console.log('❌ 部分版本生成失败');
    results.forEach((result) => {
      if (!result.success) {
        console.log(`   ${result.version}: ${result.error}`);
      }
    });
  }

  console.log('\n📝 提示词关键改进点:');
  console.log('━'.repeat(50));
  console.log('🎯 V1 → V2 主要改进:');
  console.log('   ✅ 添加 "CRITICAL REQUIREMENTS" 约束');
  console.log('   ✅ 强调 "保持原图特征" 指令');
  console.log('   ✅ 包含具体技术参数 (线条粗细、颜色等)');
  console.log('   ✅ 添加风格参考 (Memoji, LINE贴纸等)');
  console.log('   ✅ 包含 "FORBIDDEN" 禁止事项');
  console.log('   ✅ 更详细的图片分析要求');

  console.log('\n💡 如果您对效果满意，可以:');
  console.log('   • 使用改进版API: /api/image-to-sticker-improved');
  console.log('   • 或者更新现有API的提示词');
  console.log('   • 根据需要进一步调整提示词内容');

  console.log('━'.repeat(80));
}

// 运行测试
if (require.main === module) {
  comparePromptVersions().catch(console.error);
}

export { comparePromptVersions };

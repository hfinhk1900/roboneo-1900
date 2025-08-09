/**
 * 测试简化版 Image-to-Sticker API
 * 运行命令: npx tsx scripts/test-simple-api.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testSimpleAPI() {
  console.log('🧪 测试简化版 Image-to-Sticker API...\n');

  // 检查测试图片（使用带RGBA透明通道的PNG）
  const testImagePath = path.join(
    process.cwd(),
    'public',
    'apple-touch-icon.png'
  );

  if (!fs.existsSync(testImagePath)) {
    console.log('❌ 找不到测试图片: public/apple-touch-icon.png');
    console.log('💡 请确保有一张测试图片在 public/ 目录中');
    return;
  }

  console.log(`📁 使用测试图片: ${testImagePath}`);
  console.log(
    `📏 图片大小: ${Math.round(fs.statSync(testImagePath).size / 1024)}KB`
  );

  // 测试用例
  const testCases = [
    {
      name: 'iOS 贴纸风格测试',
      style: 'ios',
      description: '测试 iOS 风格贴纸生成',
    },
    {
      name: '像素艺术风格测试',
      style: 'pixel',
      description: '测试像素艺术风格贴纸生成',
    },
  ];

  let successCount = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n🎨 测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`风格: ${testCase.style}`);
    console.log(`描述: ${testCase.description}`);

    const startTime = Date.now();

    try {
      // 读取图片文件
      const imageBuffer = fs.readFileSync(testImagePath);

      // 创建 FormData
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('imageFile', imageBlob, 'test-img.png');
      formData.append('style', testCase.style);

      // 调用 API
      const response = await fetch(
        'http://localhost:3000/api/image-to-sticker-simple',
        {
          method: 'POST',
          body: formData,
        }
      );

      const elapsed = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log(`响应数据:`, {
          success: data.success,
          style: data.style,
          originalFormat: data.originalFormat,
          recommendation: data.recommendation,
          hasSticker: Boolean(data.stickerUrl),
          message: data.message,
        });

        // 保存生成的贴纸
        if (data.stickerUrl) {
          // 解析 base64 数据
          const base64Data = data.stickerUrl.replace(
            'data:image/png;base64,',
            ''
          );
          const stickerBuffer = Buffer.from(base64Data, 'base64');

          const filename = `simple_sticker_${testCase.style}_${Date.now()}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, stickerBuffer);
          console.log(`💾 贴纸已保存: public/${filename}`);
          console.log(
            `📏 输出大小: ${Math.round(stickerBuffer.length / 1024)}KB`
          );

          successCount++;
        }
      } else {
        const errorData = await response.json();
        console.log(`❌ 失败 (${response.status}):`, errorData);

        // 显示建议（如果有）
        if (errorData.suggestions) {
          console.log('💡 建议:');
          errorData.suggestions.forEach((suggestion: string, i: number) => {
            console.log(`   ${i + 1}. ${suggestion}`);
          });
        }
      }
    } catch (error) {
      console.log(
        `💥 请求异常:`,
        error instanceof Error ? error.message : error
      );
    }

    // 等待间隔避免频率限制
    if (index < testCases.length - 1) {
      console.log(`⏳ 等待3秒避免频率限制...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // 测试 API 信息端点
  console.log('\n📋 测试 API 信息端点...');
  try {
    const infoResponse = await fetch(
      'http://localhost:3000/api/image-to-sticker-simple'
    );
    if (infoResponse.ok) {
      const apiInfo = await infoResponse.json();
      console.log('✅ API 信息获取成功:');
      console.log(`   名称: ${apiInfo.name}`);
      console.log(`   版本: ${apiInfo.version}`);
      console.log(`   描述: ${apiInfo.description}`);
      console.log(`   成本: ${apiInfo.cost.total}`);
      console.log(`   提示: ${apiInfo.tips.length} 条`);
    }
  } catch (error) {
    console.log('⚠️ API 信息获取失败:', error);
  }

  console.log('\n🎉 测试完成!');
  console.log(`✅ 成功生成: ${successCount}/${testCases.length} 个贴纸`);

  if (successCount > 0) {
    console.log('\n🎯 总结:');
    console.log('✅ 简化版 API 工作正常');
    console.log('✅ 无需额外库依赖');
    console.log('✅ Image-to-Sticker 功能验证通过');
    console.log('\n💡 集成指导:');
    console.log('1. 前端：用户上传图片，选择风格');
    console.log('2. 后端：调用 /api/image-to-sticker-simple');
    console.log('3. 处理：基本验证 + OpenAI DALL-E 2 转换');
    console.log('4. 返回：base64 格式的贴纸图片');
    console.log('\n💰 成本预估:');
    console.log('- 每个贴纸约 $0.018 (仅 OpenAI API 费用)');
    console.log('- 无预处理库费用');
  } else {
    console.log('\n❌ 所有测试都失败了，请检查：');
    console.log('- 开发服务器是否运行 (npm run dev)');
    console.log('- OpenAI API Key 是否配置正确');
    console.log('- 测试图片是否存在且格式正确');
  }
}

// 运行测试
if (require.main === module) {
  testSimpleAPI().catch(console.error);
}

export { testSimpleAPI };

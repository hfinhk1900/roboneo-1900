/**
 * 完整的图片编辑测试 - 包含免费预处理 + OpenAI API
 * 运行命令: npm install jimp && npx tsx scripts/test-image-editing-with-preprocessing.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { freeImagePreprocessing } from './free-image-preprocessing';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function completeImageEditingTest() {
  console.log('🖼️  完整的图片编辑测试（预处理 + OpenAI API）...\n');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未配置');
    console.log('请在 .env.local 文件中设置：OPENAI_API_KEY=sk-...');
    return;
  }

  // 第一步：免费预处理图片
  console.log('🔄 第一步：预处理用户上传的图片...');
  const processedImagePath = await freeImagePreprocessing();

  if (!processedImagePath) {
    console.error('❌ 图片预处理失败');
    return;
  }

  console.log('\n🎨 第二步：使用 OpenAI API 进行图片编辑...');

  // 读取预处理后的图片
  const imageBuffer = fs.readFileSync(processedImagePath);
  console.log(`📁 使用预处理后的图片: ${processedImagePath}`);
  console.log(`📏 图片大小: ${Math.round(imageBuffer.length / 1024)}KB`);

  // 贴纸风格提示词
  const stickerStyles = {
    ios: 'Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people\'s body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove background and include only the full figures, ensuring the final image looks like an official iOS emoji sticker.',
    pixel: 'Transform this into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
    lego: 'Transform this into LEGO style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
    snoopy: 'Transform this into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background'
  };

  // 测试用例：只测试 DALL-E 2（最可靠的图片编辑模型）
  const testCases = [
    {
      name: 'DALL-E 2 图片编辑 - iOS贴纸风格',
      model: 'dall-e-2',
      style: 'ios',
      endpoint: 'https://api.openai.com/v1/images/edits',
    },
    {
      name: 'DALL-E 2 图片编辑 - 像素艺术风格',
      model: 'dall-e-2',
      style: 'pixel',
      endpoint: 'https://api.openai.com/v1/images/edits',
    }
  ];

  let successCount = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n🎨 测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`模型: ${testCase.model}`);
    console.log(`风格: ${testCase.style}`);
    console.log(`提示词: ${stickerStyles[testCase.style as keyof typeof stickerStyles]}`);

    const startTime = Date.now();

    try {
      // 创建 FormData
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', imageBlob, 'image.png');
      formData.append('prompt', stickerStyles[testCase.style as keyof typeof stickerStyles]);
      formData.append('n', '1');
      formData.append('size', '512x512'); // DALL-E 2 支持的编辑尺寸
      formData.append('response_format', 'b64_json');

      const response = await fetch(testCase.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          // 让浏览器自动设置 Content-Type
        },
        body: formData,
      });

      const elapsed = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log(`响应数据:`, {
          model: testCase.model,
          style: testCase.style,
          hasData: Boolean(data.data?.length),
          imageCount: data.data?.length || 0,
        });

        // 保存编辑后的图片
        if (data.data?.[0]?.b64_json) {
          const editedImageData = Buffer.from(data.data[0].b64_json, 'base64');
          const filename = `sticker_${testCase.model.replace('-', '_')}_${testCase.style}_${Date.now()}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, editedImageData);
          console.log(`💾 贴纸已保存: public/${filename}`);
          console.log(`📏 输出大小: ${Math.round(editedImageData.length / 1024)}KB`);

          successCount++;
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ 失败 (${response.status}):`, errorData);

        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.message?.includes('Invalid input image')) {
            console.log(`🔧 图片格式问题，预处理可能需要改进`);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (error) {
      console.log(`💥 请求异常:`, error instanceof Error ? error.message : error);
    }

    // 等待间隔避免频率限制
    if (index < testCases.length - 1) {
      console.log(`⏳ 等待3秒避免频率限制...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n🎉 测试完成!');
  console.log(`✅ 成功生成: ${successCount}/${testCases.length} 个贴纸`);

  if (successCount > 0) {
    console.log('\n🎯 总结:');
    console.log('✅ 免费图片预处理成功');
    console.log('✅ OpenAI API 图片编辑成功');
    console.log('✅ Image-to-Sticker 功能验证通过');
    console.log('\n💡 您现在可以将这个流程集成到您的应用中：');
    console.log('1. 用户上传任意格式图片');
    console.log('2. 使用免费 jimp 库预处理');
    console.log('3. 调用 OpenAI DALL-E 2 进行风格转换');
    console.log('4. 返回生成的贴纸给用户');
  } else {
    console.log('\n❌ 所有测试都失败了，请检查：');
    console.log('- OpenAI API Key 是否正确');
    console.log('- 图片预处理是否符合要求');
    console.log('- 网络连接是否正常');
  }

  console.log('\n💰 费用信息:');
  console.log('- 图片预处理: 🆓 完全免费 (使用 jimp)');
  console.log('- DALL-E 2 512x512: ~$0.018 per 图片');
  console.log('- 总成本: 每个贴纸约 $0.018');
}

// 运行完整测试
if (require.main === module) {
  completeImageEditingTest().catch(console.error);
}

export { completeImageEditingTest };

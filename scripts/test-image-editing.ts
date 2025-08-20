/**
 * 测试 OpenAI 图片编辑功能（Image-to-Sticker）
 * 运行命令: npx tsx scripts/test-image-editing.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testImageEditing() {
  console.log('🖼️  测试 OpenAI 图片编辑功能（Image-to-Sticker）...\n');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未配置');
    return;
  }

  // 使用预处理后的图片（符合OpenAI API要求的RGBA格式PNG）
  const testImagePath = path.join(
    process.cwd(),
    'public',
    'test-img-processed.png'
  );

  if (!fs.existsSync(testImagePath)) {
    console.log('📷 未找到测试图片 apple-touch-icon.png');
    console.log('请确保 public/ 目录中有 apple-touch-icon.png 文件');
    return;
  }

  // 读取PNG格式的图片
  const imageBuffer = fs.readFileSync(testImagePath);
  const imageBase64 = imageBuffer.toString('base64');

  console.log(`📁 测试图片: ${testImagePath}`);
  console.log(`📏 图片大小: ${Math.round(imageBuffer.length / 1024)}KB`);
  console.log('✅ PNG 格式图片已准备就绪！');

  // 贴纸风格提示词
  const stickerStyles = {
    ios: "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people's body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove background and include only the full figures, ensuring the final image looks like an official iOS emoji sticker.",
    pixel:
      'Transform this into pixel art style sticker: 8-bit retro aesthetic, blocky pixels, limited color palette, bold white outline, transparent background',
    lego: 'Transform this into LEGO style sticker: blocky construction, plastic appearance, bright primary colors, simplified features, bold white outline, transparent background',
    snoopy:
      'Transform this into Snoopy cartoon style sticker: simple lines, minimalist design, charming and cute, bold white outline, transparent background',
  };

  const testCases = [
    {
      name: 'DALL-E 2 图片编辑 - iOS风格',
      model: 'dall-e-2',
      style: 'ios',
      endpoint: 'https://api.openai.com/v1/images/edits',
      method: 'multipart', // DALL-E 2 需要 multipart/form-data 和 PNG
    },
    {
      name: 'GPT-Image-1 图片编辑 - 像素风格',
      model: 'gpt-image-1',
      style: 'pixel',
      endpoint: 'https://api.openai.com/v1/images/edits',
      method: 'multipart', // GPT-Image-1 也需要 multipart/form-data
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🎨 ${testCase.name}`);
    console.log(`模型: ${testCase.model}`);
    console.log(`风格: ${testCase.style}`);
    console.log(
      `提示词: ${stickerStyles[testCase.style as keyof typeof stickerStyles]}`
    );

    const startTime = Date.now();

    try {
      // 所有OpenAI图片编辑都使用 multipart/form-data 格式
      const formData = new FormData();

      // 创建PNG格式的Blob（OpenAI图片编辑API要求RGBA格式的PNG）
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('image', imageBlob, 'image.png');
      formData.append(
        'prompt',
        stickerStyles[testCase.style as keyof typeof stickerStyles]
      );
      formData.append('n', '1');

      // 根据模型设置不同的参数
      if (testCase.model === 'dall-e-2') {
        formData.append('size', '512x512'); // DALL-E 2 支持的编辑尺寸
        formData.append('response_format', 'b64_json'); // DALL-E 2 支持此参数
      } else if (testCase.model === 'gpt-image-1') {
        formData.append('size', '1024x1024'); // GPT-Image-1 支持的尺寸
        formData.append('model', testCase.model); // 指定模型
        // 注意：GPT-Image-1 不支持 response_format 参数
      }

      const response = await fetch(testCase.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data
        },
        body: formData,
      });

      const elapsed = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log('响应数据:', {
          model: testCase.model,
          style: testCase.style,
          hasData: Boolean(data.data?.length),
          imageCount: data.data?.length || 0,
        });

        // 保存编辑后的图片
        if (data.data?.[0]?.b64_json) {
          const editedImageData = Buffer.from(data.data[0].b64_json, 'base64');
          const filename = `edited_${testCase.model.replace('-', '_')}_${testCase.style}_${Date.now()}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, editedImageData);
          console.log(`💾 编辑后的贴纸已保存: public/${filename}`);
          console.log(
            `📏 编辑后大小: ${Math.round(editedImageData.length / 1024)}KB`
          );
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ 失败 (${response.status}):`, errorData);

        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.code === 'model_not_found') {
            console.log(`🔍 模型 "${testCase.model}" 不支持图片编辑`);
          } else if (errorJson.error?.message?.includes('edit')) {
            console.log('🔧 图片编辑参数可能有误');
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (error) {
      console.log(
        '💥 请求异常:',
        error instanceof Error ? error.message : error
      );
    }

    // 等待间隔
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log('\n📋 图片编辑功能总结:');
  console.log('✅ DALL-E 2: 成熟的图片编辑功能，multipart/form-data');
  console.log('🆕 GPT-Image-1: 新的图片编辑功能，可能需要特殊调用方式');
  console.log('❌ DALL-E 3: 不支持图片编辑，仅支持文本生成图片');

  console.log('\n🎯 对您的 Image-to-Sticker 功能的建议:');
  console.log('1. 使用 DALL-E 2 作为主要图片编辑引擎');
  console.log('2. 实现 multipart/form-data 文件上传');
  console.log('3. 预设不同的贴纸风格提示词');
  console.log('4. 添加图片预处理（尺寸、格式转换）');
}

// 运行测试
if (require.main === module) {
  testImageEditing().catch(console.error);
}

export { testImageEditing };

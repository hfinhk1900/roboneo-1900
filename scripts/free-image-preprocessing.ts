/**
 * 免费图片预处理工具 - 使用免费的 jimp 库
 * 将任意格式的图片转换为 OpenAI API 兼容的格式
 * 运行命令: npm install jimp && npx tsx scripts/free-image-preprocessing.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 使用免费的 jimp 库进行图片处理
async function freeImagePreprocessing() {
  // 检查是否安装了 jimp
  let Jimp;
  try {
    const jimpModule = await import('jimp');
    Jimp = jimpModule.default || jimpModule;

    // 检查 Jimp 是否有 read 方法
    if (!Jimp.read) {
      console.log(
        '❌ jimp 库版本不兼容，请尝试: npm uninstall jimp && npm install jimp@^0.22.0 --legacy-peer-deps'
      );
      return;
    }
  } catch (error) {
    console.log('❌ 需要安装 jimp 库: npm install jimp --legacy-peer-deps');
    console.log('💡 jimp 是一个完全免费的纯JavaScript图片处理库');
    return;
  }

  const inputPath = path.join(process.cwd(), 'public', 'test-img.png');
  const outputPath = path.join(
    process.cwd(),
    'public',
    'test-img-openai-ready.png'
  );

  if (!fs.existsSync(inputPath)) {
    console.log('❌ 找不到测试图片:', inputPath);
    return;
  }

  try {
    console.log('🔄 开始免费图片预处理 (使用 jimp)...');

    // 读取原始图片
    const image = await Jimp.read(inputPath);

    console.log('📊 原始图片信息:', {
      width: image.getWidth(),
      height: image.getHeight(),
      mime: image.getMIME(),
      hasAlpha: image.hasAlpha(),
      size: `${Math.round(fs.statSync(inputPath).size / 1024)}KB`,
    });

    // 获取原始尺寸和纵横比
    const originalWidth = image.getWidth();
    const originalHeight = image.getHeight();
    const aspectRatio = originalWidth / originalHeight;

    // OpenAI 支持的尺寸选项
    const supportedSizes = [
      { w: 1024, h: 1024, ratio: 1.0, name: '正方形' },
      { w: 1024, h: 1536, ratio: 0.667, name: '肖像' },
      { w: 1536, h: 1024, ratio: 1.5, name: '风景' },
    ];

    // 选择最接近的支持尺寸
    const closest = supportedSizes.reduce((prev, curr) =>
      Math.abs(curr.ratio - aspectRatio) < Math.abs(prev.ratio - aspectRatio)
        ? curr
        : prev
    );

    console.log(`📏 选择最佳尺寸: ${closest.w}x${closest.h} (${closest.name})`);
    console.log(
      `📐 尺寸调整: ${originalWidth}x${originalHeight} → ${closest.w}x${closest.h}`
    );

    // 创建一个透明背景的画布
    const canvas = new Jimp(closest.w, closest.h, 0x00000000); // 完全透明

    // 计算图片在画布中的位置（居中显示，保持原始比例）
    let resizedWidth: number, resizedHeight: number;

    if (originalWidth / originalHeight > closest.w / closest.h) {
      // 原图更宽，以宽度为准
      resizedWidth = closest.w;
      resizedHeight = Math.round(originalHeight * (closest.w / originalWidth));
    } else {
      // 原图更高，以高度为准
      resizedHeight = closest.h;
      resizedWidth = Math.round(originalWidth * (closest.h / originalHeight));
    }

    // 调整图片大小
    image.resize(resizedWidth, resizedHeight);

    // 计算居中位置
    const x = Math.round((closest.w - resizedWidth) / 2);
    const y = Math.round((closest.h - resizedHeight) / 2);

    console.log(
      `🎯 图片定位: (${x}, ${y}), 尺寸: ${resizedWidth}x${resizedHeight}`
    );

    // 将调整后的图片合成到透明画布上
    canvas.composite(image, x, y);

    // 确保是 PNG 格式并保存
    await canvas.writeAsync(outputPath);

    // 检查处理结果
    const processedImage = await Jimp.read(outputPath);
    const processedSize = fs.statSync(outputPath).size;

    console.log('✅ 免费预处理完成!');
    console.log('📊 处理后图片信息:', {
      width: processedImage.getWidth(),
      height: processedImage.getHeight(),
      mime: processedImage.getMIME(),
      hasAlpha: processedImage.hasAlpha(),
      size: `${Math.round(processedSize / 1024)}KB`,
    });

    // 验证是否符合 OpenAI 要求
    const isValid =
      processedImage.getMIME() === 'image/png' &&
      processedImage.hasAlpha() &&
      processedSize < 4 * 1024 * 1024 && // < 4MB
      [1024, 1536].includes(processedImage.getWidth()) &&
      [1024, 1536].includes(processedImage.getHeight());

    if (isValid) {
      console.log('🎉 图片已符合 OpenAI API 要求!');
      console.log('📝 处理详情:');
      console.log('  ✅ PNG 格式');
      console.log('  ✅ 包含透明通道 (RGBA)');
      console.log('  ✅ 文件大小 < 4MB');
      console.log('  ✅ 尺寸符合 OpenAI 要求');
      console.log(`💾 处理后的图片: ${outputPath}`);

      return outputPath;
    } else {
      console.log('⚠️  图片可能仍有兼容性问题');
      return null;
    }
  } catch (error) {
    console.error('❌ 图片预处理失败:', error);
    return null;
  }
}

// 运行预处理
if (require.main === module) {
  freeImagePreprocessing()
    .then((result) => {
      if (result) {
        console.log('\n🚀 预处理成功！现在可以运行图片编辑测试：');
        console.log('npx tsx scripts/test-image-editing-with-preprocessing.ts');
      }
    })
    .catch(console.error);
}

export { freeImagePreprocessing };

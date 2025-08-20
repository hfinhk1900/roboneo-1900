/**
 * 图片预处理工具 - 模仿 ChatGPT 官方的处理方式
 * 将任意格式的图片转换为 OpenAI API 兼容的格式
 */

import * as fs from 'fs';
import * as path from 'path';

// 需要安装: npm install sharp
// sharp 是一个高性能的图片处理库
async function preprocessImageForOpenAI() {
  // 检查是否安装了 sharp
  let sharp: any;
  try {
    sharp = require('sharp');
  } catch (error) {
    console.log('❌ 需要安装 sharp 库: npm install sharp');
    console.log('💡 Sharp 是 Node.js 最强大的图片处理库，用于格式转换');
    return;
  }

  const inputPath = path.join(process.cwd(), 'public', 'test-img.png');
  const outputPath = path.join(
    process.cwd(),
    'public',
    'test-img-processed.png'
  );

  if (!fs.existsSync(inputPath)) {
    console.log('❌ 找不到测试图片:', inputPath);
    return;
  }

  try {
    console.log('🔄 开始图片预处理...');

    // 获取原始图片信息
    const metadata = await sharp(inputPath).metadata();
    console.log('📊 原始图片信息:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      size: `${Math.round(fs.statSync(inputPath).size / 1024)}KB`,
    });

    // 模仿 ChatGPT 的预处理逻辑
    let processedImage = sharp(inputPath);

    // 1. 确保是 RGBA 格式（4个通道：R, G, B, A）
    if (!metadata.hasAlpha) {
      console.log('🔧 添加透明通道 (RGB → RGBA)');
      processedImage = processedImage.ensureAlpha();
    }

    // 2. 调整尺寸到 OpenAI 支持的比例
    const { width = 0, height = 0 } = metadata;
    const aspectRatio = width / height;

    // OpenAI 支持的尺寸
    const supportedSizes = [
      { w: 1024, h: 1024, ratio: 1.0 }, // 正方形
      { w: 1024, h: 1536, ratio: 0.667 }, // 肖像
      { w: 1536, h: 1024, ratio: 1.5 }, // 风景
    ];

    // 选择最接近的支持尺寸
    const closest = supportedSizes.reduce((prev, curr) =>
      Math.abs(curr.ratio - aspectRatio) < Math.abs(prev.ratio - aspectRatio)
        ? curr
        : prev
    );

    const targetWidth: number = closest.w;
    const targetHeight: number = closest.h;

    console.log(
      `📏 调整尺寸: ${width}x${height} → ${targetWidth}x${targetHeight}`
    );

    // 3. 使用 contain 模式保持原始内容，添加透明边框
    processedImage = processedImage.resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
    });

    // 4. 确保输出为 PNG 格式
    processedImage = processedImage.png({
      compressionLevel: 6, // 中等压缩
      adaptiveFiltering: true,
    });

    // 保存处理后的图片
    await processedImage.toFile(outputPath);

    // 检查处理结果
    const processedMetadata = await sharp(outputPath).metadata();
    const processedSize = fs.statSync(outputPath).size;

    console.log('✅ 预处理完成!');
    console.log('📊 处理后图片信息:', {
      format: processedMetadata.format,
      width: processedMetadata.width,
      height: processedMetadata.height,
      channels: processedMetadata.channels,
      hasAlpha: processedMetadata.hasAlpha,
      size: `${Math.round(processedSize / 1024)}KB`,
    });

    // 验证是否符合 OpenAI 要求
    const isValid =
      processedMetadata.format === 'png' &&
      processedMetadata.hasAlpha &&
      processedSize < 4 * 1024 * 1024 && // < 4MB
      [1024, 1536].includes(processedMetadata.width!) &&
      [1024, 1536].includes(processedMetadata.height!);

    if (isValid) {
      console.log('🎉 图片已符合 OpenAI API 要求!');
      console.log(`💾 处理后的图片: ${outputPath}`);
    } else {
      console.log('⚠️  图片可能仍有兼容性问题');
    }

    return outputPath;
  } catch (error) {
    console.error('❌ 图片预处理失败:', error);
  }
}

// 运行预处理
if (require.main === module) {
  preprocessImageForOpenAI().catch(console.error);
}

export { preprocessImageForOpenAI };

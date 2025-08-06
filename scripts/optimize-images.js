#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 配置
const config = {
  inputDir: path.join(__dirname, '../public'),
  extensions: ['.png', '.jpg', '.jpeg'],
  quality: 85, // WebP质量 (0-100)
  skipPatterns: [
    'favicon',
    'web-app-manifest',
    'apple-touch-icon',
    '.webp' // 跳过已经是WebP的文件
  ]
};

// 获取所有图片文件
async function getImageFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await getImageFiles(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (config.extensions.includes(ext)) {
        // 检查是否应该跳过
        const shouldSkip = config.skipPatterns.some(pattern => 
          filePath.includes(pattern)
        );
        
        if (!shouldSkip) {
          fileList.push(filePath);
        }
      }
    }
  }
  
  return fileList;
}

// 转换单个图片为WebP
async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  
  // 检查WebP文件是否已存在
  try {
    await fs.access(outputPath);
    console.log(`⏭️  Skipping (already exists): ${path.basename(outputPath)}`);
    return null;
  } catch (error) {
    // 文件不存在，继续转换
  }
  
  try {
    const metadata = await sharp(inputPath).metadata();
    const fileSize = (await fs.stat(inputPath)).size;
    
    // 转换为WebP
    await sharp(inputPath)
      .webp({ quality: config.quality })
      .toFile(outputPath);
    
    const webpSize = (await fs.stat(outputPath)).size;
    const reduction = ((fileSize - webpSize) / fileSize * 100).toFixed(1);
    
    console.log(`✅ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`   Size: ${(fileSize / 1024).toFixed(1)}KB → ${(webpSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    
    return {
      original: inputPath,
      webp: outputPath,
      originalSize: fileSize,
      webpSize: webpSize,
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  try {
    // 获取所有图片文件
    const imageFiles = await getImageFiles(config.inputDir);
    console.log(`Found ${imageFiles.length} images to process\n`);
    
    // 转换所有图片
    const results = [];
    for (const file of imageFiles) {
      const result = await convertToWebP(file);
      if (result) {
        results.push(result);
      }
    }
    
    // 显示统计
    if (results.length > 0) {
      const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalWebP = results.reduce((sum, r) => sum + r.webpSize, 0);
      const totalReduction = ((totalOriginal - totalWebP) / totalOriginal * 100).toFixed(1);
      
      console.log('\n📊 Optimization Summary:');
      console.log(`   Files converted: ${results.length}`);
      console.log(`   Total size before: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Total size after: ${(totalWebP / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Total reduction: ${totalReduction}%`);
      
      // 显示最大的文件
      const largestFiles = results
        .sort((a, b) => b.webpSize - a.webpSize)
        .slice(0, 5);
      
      console.log('\n🔍 Largest WebP files (consider further optimization):');
      largestFiles.forEach(file => {
        const name = path.basename(file.webp);
        const size = (file.webpSize / 1024).toFixed(1);
        console.log(`   ${name}: ${size}KB`);
      });
    }
    
    console.log('\n✨ Image optimization complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// 运行脚本
main();

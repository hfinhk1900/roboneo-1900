#!/usr/bin/env node

/**
 * 下载 @imgly/background-removal 模型文件到本地
 * 解决 CDN 访问问题
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('📥 下载 @imgly/background-removal 模型文件');
console.log('=====================================');

const MODEL_DIR = path.join(__dirname, 'public/models');
const CDN_BASE = 'https://cdn.img.ly/packages/background-removal/1.7.0';

// 需要下载的文件列表
const FILES_TO_DOWNLOAD = [
  'isnet/model.onnx',
  'isnet/model.json',
  'isnet_fp16/model.onnx',
  'isnet_fp16/model.json',
  'isnet_quint8/model.onnx',
  'isnet_quint8/model.json'
];

// 创建目录
function createDirectories() {
  const dirs = [
    path.join(MODEL_DIR, 'isnet'),
    path.join(MODEL_DIR, 'isnet_fp16'),
    path.join(MODEL_DIR, 'isnet_quint8')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });
}

// 下载文件
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ 下载完成: ${filepath}`);
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // 删除不完整的文件
      reject(err);
    });
  });
}

// 主函数
async function main() {
  try {
    // 创建目录
    createDirectories();

    // 下载文件
    console.log('\n📥 开始下载模型文件...');

    for (const file of FILES_TO_DOWNLOAD) {
      const url = `${CDN_BASE}/${file}`;
      const filepath = path.join(MODEL_DIR, file);

      try {
        await downloadFile(url, filepath);
      } catch (error) {
        console.error(`❌ 下载失败: ${file} - ${error.message}`);
      }
    }

    console.log('\n🎉 模型文件下载完成！');
    console.log('📁 文件位置:', MODEL_DIR);

    // 显示文件大小
    console.log('\n📊 文件大小:');
    FILES_TO_DOWNLOAD.forEach(file => {
      const filepath = path.join(MODEL_DIR, file);
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  ${file}: ${sizeInMB} MB`);
      }
    });

  } catch (error) {
    console.error('❌ 下载过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();

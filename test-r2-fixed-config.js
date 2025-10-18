#!/usr/bin/env node

/**
 * 测试修复后的 R2 配置
 * 验证环境变量名称匹配
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试修复后的 R2 配置');
console.log('==========================');

console.log('\n🔧 修复内容:');
console.log('1. 将 CLOUDFLARE_R2_ 前缀改为 STORAGE_ 前缀');
console.log('2. 匹配现有的环境变量配置');
console.log('3. 使用正确的存储桶和端点配置');

console.log('\n🔍 检查环境变量文件:');
const envFiles = ['.env.local', '.env'];
envFiles.forEach((file) => {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${file} 存在`);
    const content = fs.readFileSync(envPath, 'utf8');
    const storageVars = content
      .split('\n')
      .filter((line) => line.includes('STORAGE_') && !line.startsWith('#'));
    if (storageVars.length > 0) {
      console.log(`   存储相关变量: ${storageVars.length} 个`);
      storageVars.forEach((line) => {
        const [key] = line.split('=');
        console.log(`   - ${key}`);
      });
    } else {
      console.log('   ⚠️  未找到存储相关环境变量');
    }
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

console.log('\n🔧 现在使用的环境变量:');
const storageVars = [
  'STORAGE_REGION',
  'STORAGE_ENDPOINT',
  'STORAGE_ACCESS_KEY_ID',
  'STORAGE_SECRET_ACCESS_KEY',
  'STORAGE_BUCKET_NAME',
  'STORAGE_PUBLIC_URL',
];

storageVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
  }
});

console.log('\n📋 测试步骤:');
console.log('1. 重启开发服务器以加载修复后的配置');
console.log('2. 测试 Solid Color 功能');
console.log('3. 观察控制台日志和 R2 上传结果');

console.log('\n🔍 预期结果:');
console.log('✅ 环境变量正确加载');
console.log('✅ R2 客户端成功创建');
console.log('✅ 图片成功上传到 R2');
console.log('✅ 在 aibackgrounsolidcolor 文件夹中看到图片');

console.log('\n🎯 开始测试...');
console.log('请重启开发服务器并测试功能！');

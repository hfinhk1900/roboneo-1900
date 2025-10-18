#!/usr/bin/env node

/**
 * 测试 R2 配置和环境变量
 * 检查 R2 上传功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试 R2 配置和环境变量');
console.log('============================');

console.log('\n🔍 检查环境变量文件:');
const envFiles = ['.env.local', '.env', '.env.example'];
envFiles.forEach((file) => {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${file} 存在`);
    const content = fs.readFileSync(envPath, 'utf8');
    const r2Vars = content
      .split('\n')
      .filter(
        (line) => line.includes('CLOUDFLARE_R2_') || line.includes('R2_')
      );
    if (r2Vars.length > 0) {
      console.log(`   R2 相关变量: ${r2Vars.length} 个`);
      r2Vars.forEach((line) => {
        const [key] = line.split('=');
        console.log(`   - ${key}`);
      });
    } else {
      console.log('   ⚠️  未找到 R2 相关环境变量');
    }
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

console.log('\n🔧 必需的 R2 环境变量:');
const requiredVars = [
  'CLOUDFLARE_R2_REGION',
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL',
];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
  }
});

console.log('\n📋 测试步骤:');
console.log('1. 确保所有 R2 环境变量都已正确设置');
console.log('2. 检查 .env.local 文件中的配置');
console.log('3. 重启开发服务器以加载新的环境变量');
console.log('4. 测试 Solid Color 功能');

console.log('\n🚨 常见问题:');
console.log('- 环境变量未设置或拼写错误');
console.log('- 环境变量文件未加载');
console.log('- R2 权限配置不正确');
console.log('- 网络连接问题');

console.log('\n💡 解决方案:');
console.log('1. 检查 .env.local 文件中的 R2 配置');
console.log('2. 确认 R2 存储桶权限设置');
console.log('3. 验证 R2 API 密钥有效性');
console.log('4. 检查网络连接和防火墙设置');

console.log('\n🎯 开始检查...');
console.log('请按照上述步骤检查和配置 R2 环境变量！');

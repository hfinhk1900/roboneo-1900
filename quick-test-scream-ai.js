/**
 * Scream AI 快速配置验证脚本
 *
 * 使用方法：
 * node quick-test-scream-ai.js
 */

// 按照 Next.js 的优先级加载环境变量：.env → .env.local
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

console.log('\n🔍 Scream AI 配置验证\n');
console.log('━'.repeat(60));

// 检查必需的环境变量
const requiredEnvVars = [
  'NANO_BANANA_API_KEY',
  'NANO_BANANA_BASE_URL',
  'NANO_BANANA_MODEL',
];

let allConfigured = true;

console.log('\n📋 环境变量检查：\n');

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  const isConfigured = value && value.trim() !== '';

  if (isConfigured) {
    console.log(
      `✅ ${envVar}: ${envVar.includes('KEY') ? '***已配置***' : value}`
    );
  } else {
    console.log(`❌ ${envVar}: 未配置`);
    allConfigured = false;
  }
}

console.log('\n' + '━'.repeat(60));

if (allConfigured) {
  console.log('\n✅ 所有配置已完成！');
  console.log('\n📝 下一步：');
  console.log('   1. 重启开发服务器：pnpm dev');
  console.log('   2. 访问：http://localhost:3000/scream-ai');
  console.log('   3. 参考测试指南：SCREAM_AI_TEST_GUIDE.md');
  console.log('\n🎉 开始测试 Scream AI 功能！\n');
} else {
  console.log('\n⚠️  配置未完成！');
  console.log('\n📝 请执行以下步骤：');
  console.log('   1. 访问 https://kie.ai/nano-banana 获取 API Key');
  console.log('   2. 在 .env 文件中填写 NANO_BANANA_API_KEY');
  console.log('   3. 重新运行此脚本验证配置');
  console.log('\n💡 提示：.env 文件位于项目根目录\n');
  process.exit(1);
}

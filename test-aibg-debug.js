#!/usr/bin/env node

/**
 * AI Background API 调试脚本
 * 用于诊断具体的错误原因
 */

const fs = require('fs');

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/aibackground/generate',
  testImagePath: 'public/aibg/aibg-test2.png',
  // 请提供有效的 session token
  sessionToken: 'YOUR_SESSION_TOKEN_HERE'
};

// 检查文件是否存在
function checkFiles() {
  console.log('🔍 检查文件...');

  if (!fs.existsSync(CONFIG.testImagePath)) {
    console.log(`❌ 测试图片不存在: ${CONFIG.testImagePath}`);
    return false;
  }
  console.log(`✅ 测试图片存在: ${CONFIG.testImagePath}`);

  if (!fs.existsSync('.env.local')) {
    console.log('❌ .env.local 文件不存在');
    return false;
  }
  console.log('✅ .env.local 文件存在');

  return true;
}

// 检查环境变量
function checkEnvironment() {
  console.log('\n🔧 检查环境变量...');

  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const hasApiKey = envContent.includes('SILICONFLOW_API_KEY');
    const hasValue = envContent.includes('SILICONFLOW_API_KEY=') &&
                    !envContent.includes('SILICONFLOW_API_KEY=your_key_here');

    if (hasApiKey && hasValue) {
      console.log('✅ SILICONFLOW_API_KEY 已配置且有值');
    } else if (hasApiKey) {
      console.log('⚠️  SILICONFLOW_API_KEY 已配置但可能为空');
    } else {
      console.log('❌ SILICONFLOW_API_KEY 未配置');
    }
  } catch (error) {
    console.log('❌ 无法读取 .env.local 文件:', error.message);
  }
}

// 测试服务器连接
async function testServerConnection() {
  console.log('\n🌐 测试服务器连接...');

  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/aibackground/generate`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET 请求成功');
      console.log('📋 可用背景样式:', data.backgroundStyles?.length || 0);
      console.log('🎨 预设颜色:', data.presetColors?.length || 0);
    } else {
      console.log(`❌ GET 请求失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ 服务器连接失败:', error.message);
  }
}

// 测试认证
async function testAuthentication() {
  console.log('\n🔐 测试认证...');

  if (CONFIG.sessionToken === 'YOUR_SESSION_TOKEN_HERE') {
    console.log('⚠️  请先设置有效的 session token');
    return;
  }

  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/auth/get-session`, {
      headers: {
        'Cookie': `better-auth.session_token=${CONFIG.sessionToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 认证成功');
      console.log('👤 用户 ID:', data.user?.id || '未知');
    } else {
      console.log(`❌ 认证失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ 认证测试失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 AI Background API 调试脚本');
  console.log('================================');

  // 检查文件
  if (!checkFiles()) {
    console.log('\n❌ 文件检查失败，请修复后重试');
    return;
  }

  // 检查环境变量
  checkEnvironment();

  // 测试服务器连接
  await testServerConnection();

  // 测试认证
  await testAuthentication();

  console.log('\n📋 调试完成');
  console.log('\n💡 建议:');
  console.log('1. 确保服务器正在运行 (pnpm dev)');
  console.log('2. 检查 .env.local 中的 API 密钥');
  console.log('3. 提供有效的 session token');
  console.log('4. 查看服务器控制台日志');
}

// 运行主函数
main().catch(console.error);


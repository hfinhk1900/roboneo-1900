#!/usr/bin/env node

/**
 * AI Background API 快速测试脚本
 *
 * 这是一个简化版本的测试脚本，用于快速验证 API 是否正常工作
 * 使用第一个场景 (gradient-abstract) 和测试图片 aibg-test.jpg
 */

const fs = require('fs');

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/aibackground/generate',
  testImagePath:
    '/Users/hf/Desktop/Web Template/Products/roboneo art/public/aibg/aibg-test.jpg',
  // 请将此处替换为你的实际 session token
  sessionToken:
    'RL3eLVpyVPXvZhccaXo9nf7jxWdqcseV.BgGYhzR%2BGn6n5X1hioWuQ0pan5KFYlhbL9CqzwxlQeg%3D',
};

// 将图片转换为 base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    console.error('❌ 读取测试图片失败:', error.message);
    process.exit(1);
  }
}

// 发送请求
async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `better-auth.session_token=${CONFIG.sessionToken}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('请求失败:', error.message);
    return { status: 0, data: { error: error.message } };
  }
}

async function quickTest() {
  console.log('🚀 AI Background API 快速测试');
  console.log('📍 API URL:', CONFIG.baseUrl + CONFIG.apiEndpoint);
  console.log('🖼️  测试图片:', CONFIG.testImagePath);

  // 检查文件是否存在
  if (!fs.existsSync(CONFIG.testImagePath)) {
    console.error('❌ 测试图片不存在:', CONFIG.testImagePath);
    return;
  }

  // 检查认证配置
  if (CONFIG.sessionToken === 'YOUR_SESSION_TOKEN_HERE') {
    console.log('\n⚠️  请先配置 sessionToken:');
    console.log('1. 在浏览器中登录应用');
    console.log(
      '2. 开发者工具 -> Application -> Cookies -> better-auth.session_token'
    );
    console.log('3. 复制值并替换 CONFIG.sessionToken\n');
  }

  // 转换图片
  console.log('🔄 转换图片为 base64...');
  const imageBase64 = imageToBase64(CONFIG.testImagePath);
  console.log('✅ 转换完成');

  // 测试 1: 获取背景样式
  console.log('\n📋 测试 1: 获取背景样式');
  const getResult = await sendRequest(CONFIG.baseUrl + CONFIG.apiEndpoint, {
    method: 'GET',
  });

  if (getResult.status === 200) {
    console.log('✅ 成功获取背景样式');
    const styles = getResult.data.backgroundStyles;
    console.log('🎨 可用样式数量:', styles.length);
    if (styles.length > 0) {
      console.log('🎯 第一个样式:', styles[0].id, '-', styles[0].name);
    }
  } else {
    console.error('❌ 获取背景样式失败:', getResult.status, getResult.data);
    return;
  }

  // 测试 2: 使用第一个场景生成 AI 背景
  console.log('\n🤖 测试 2: 生成第一个 AI 背景样式 (gradient-abstract)');
  const generateResult = await sendRequest(
    CONFIG.baseUrl + CONFIG.apiEndpoint,
    {
      method: 'POST',
      body: JSON.stringify({
        image_input: imageBase64,
        backgroundMode: 'background',
        backgroundType: 'gradient-abstract', // 第一个场景
        quality: 'standard',
        steps: 25,
        size: '1024x1024',
        output_format: 'png',
      }),
    }
  );

  console.log('📊 状态码:', generateResult.status);

  if (generateResult.status === 200) {
    console.log('✅ AI 背景生成成功!');
    console.log('🖼️  结果 URL:', generateResult.data.resultUrl);
    console.log('💰 使用 Credits:', generateResult.data.credits_used);
    console.log('💳 剩余 Credits:', generateResult.data.remaining_credits);
    console.log('🎨 背景类型:', generateResult.data.backgroundType);
  } else if (generateResult.status === 401) {
    console.error('❌ 认证失败，请检查 session token');
  } else if (generateResult.status === 402) {
    console.error('❌ Credits 不足');
    console.log('💳 当前 Credits:', generateResult.data.current || 0);
    console.log('🔢 需要 Credits:', generateResult.data.required || 'N/A');
  } else {
    console.error('❌ 生成失败:', generateResult.data);
  }

  console.log('\n🏁 测试完成');

  if (generateResult.status === 200) {
    console.log('\n💡 下一步:');
    console.log('1. 访问生成的图片 URL 查看结果');
    console.log('2. 检查 R2 存储的 aibackgrounds 文件夹');
    console.log('3. 尝试其他背景样式和颜色');
  }
}

// 运行测试
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest, CONFIG };

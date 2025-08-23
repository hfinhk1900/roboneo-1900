#!/usr/bin/env node

/**
 * 简单的 AI Background API 测试
 * 用于快速验证 API 是否工作
 */

const fs = require('fs');

async function testSimple() {
  console.log('🧪 简单 API 测试');
  console.log('================');

  // 1. 测试 GET 端点
  try {
    console.log('\n1️⃣ 测试 GET /api/aibackground/generate');
    const getResponse = await fetch('http://localhost:3000/api/aibackground/generate');
    console.log(`   HTTP 状态: ${getResponse.status}`);

    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   ✅ 成功 - 背景样式: ${data.backgroundStyles?.length || 0}, 颜色: ${data.presetColors?.length || 0}`);
    } else {
      console.log(`   ❌ 失败 - ${getResponse.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 2. 测试 POST 端点（无认证）
  try {
    console.log('\n2️⃣ 测试 POST /api/aibackground/generate (无认证)');
    const postResponse = await fetch('http://localhost:3000/api/aibackground/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });

    console.log(`   HTTP 状态: ${postResponse.status}`);

    if (postResponse.status === 401) {
      console.log('   ✅ 正确 - 返回 401 Unauthorized (需要认证)');
    } else {
      console.log(`   ⚠️  意外状态: ${postResponse.status}`);
    }

    try {
      const errorData = await postResponse.json();
      console.log(`   错误信息: ${JSON.stringify(errorData)}`);
    } catch (e) {
      console.log('   无法解析错误响应');
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 3. 检查环境变量
  console.log('\n3️⃣ 检查环境变量');
  try {
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const hasApiKey = envContent.includes('SILICONFLOW_API_KEY=');
      const hasValue = envContent.includes('SILICONFLOW_API_KEY=') &&
                      !envContent.includes('SILICONFLOW_API_KEY=your_key_here') &&
                      !envContent.includes('SILICONFLOW_API_KEY=""');

      if (hasApiKey && hasValue) {
        console.log('   ✅ SILICONFLOW_API_KEY 已配置且有值');
      } else if (hasApiKey) {
        console.log('   ⚠️  SILICONFLOW_API_KEY 已配置但可能为空');
      } else {
        console.log('   ❌ SILICONFLOW_API_KEY 未配置');
      }
    } else {
      console.log('   ❌ .env.local 文件不存在');
    }
  } catch (error) {
    console.log(`   ❌ 检查失败: ${error.message}`);
  }

  // 4. 检查服务器状态
  console.log('\n4️⃣ 检查服务器状态');
  try {
    const serverResponse = await fetch('http://localhost:3000');
    console.log(`   服务器状态: ${serverResponse.status} ${serverResponse.statusText}`);

    if (serverResponse.ok) {
      console.log('   ✅ 服务器正常运行');
    } else {
      console.log('   ⚠️  服务器响应异常');
    }
  } catch (error) {
    console.log(`   ❌ 服务器连接失败: ${error.message}`);
  }

  console.log('\n📋 测试完成');
}

// 运行测试
testSimple().catch(console.error);


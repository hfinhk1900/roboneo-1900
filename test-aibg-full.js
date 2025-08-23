#!/usr/bin/env node

/**
 * 完整的 AI Background API 测试
 * 模拟前端的完整请求流程
 */

const fs = require('fs');

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testImagePath: 'public/aibg/aibg-test2.png',
  // 请提供有效的 session token
  sessionToken: 'YOUR_SESSION_TOKEN_HERE',
};

// 将图片转换为 base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64String}`;
  } catch (error) {
    console.error('❌ 读取图片失败:', error.message);
    return null;
  }
}

// 测试完整的 API 调用流程
async function testFullFlow() {
  console.log('🚀 完整 API 流程测试');
  console.log('=====================');

  // 1. 检查图片文件
  console.log('\n1️⃣ 检查测试图片');
  if (!fs.existsSync(CONFIG.testImagePath)) {
    console.log(`❌ 测试图片不存在: ${CONFIG.testImagePath}`);
    return;
  }
  console.log(`✅ 测试图片存在: ${CONFIG.testImagePath}`);

  // 2. 转换图片为 base64
  console.log('\n2️⃣ 转换图片为 base64');
  const imageBase64 = imageToBase64(CONFIG.testImagePath);
  if (!imageBase64) {
    console.log('❌ 图片转换失败');
    return;
  }
  console.log(`✅ 图片转换成功: ${imageBase64.length} 字符`);

  // 3. 检查 session token
  console.log('\n3️⃣ 检查 session token');
  if (CONFIG.sessionToken === 'YOUR_SESSION_TOKEN_HERE') {
    console.log('⚠️  请先设置有效的 session token');
    console.log('   从浏览器开发者工具中复制 better-auth.session_token 的值');
    return;
  }
  console.log('✅ Session token 已设置');

  // 4. 构建请求数据
  console.log('\n4️⃣ 构建请求数据');
  const requestPayload = {
    image_input: imageBase64,
    backgroundMode: 'background',
    backgroundType: 'texture-fabric', // 第二个场景
    quality: 'standard',
    steps: 25,
    size: '1024x1024',
    output_format: 'png',
  };

  console.log('请求参数:');
  console.log('- backgroundMode:', requestPayload.backgroundMode);
  console.log('- backgroundType:', requestPayload.backgroundType);
  console.log('- quality:', requestPayload.quality);
  console.log('- steps:', requestPayload.steps);
  console.log('- size:', requestPayload.size);
  console.log('- output_format:', requestPayload.output_format);
  console.log(
    '- image_input:',
    `${requestPayload.image_input.substring(0, 50)}...`
  );

  // 5. 发送 API 请求
  console.log('\n5️⃣ 发送 API 请求');
  try {
    const response = await fetch(
      `${CONFIG.baseUrl}/api/aibackground/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `better-auth.session_token=${CONFIG.sessionToken}`,
        },
        body: JSON.stringify(requestPayload),
      }
    );

    console.log(`HTTP 状态: ${response.status} ${response.statusText}`);

    // 6. 处理响应
    if (response.ok) {
      console.log('✅ 请求成功');
      const result = await response.json();
      console.log('响应数据:');
      console.log('- success:', result.success);
      console.log('- resultUrl:', result.resultUrl ? '已生成' : '未生成');
      console.log('- credits_used:', result.credits_used);
      console.log('- remaining_credits:', result.remaining_credits);
    } else {
      console.log('❌ 请求失败');

      try {
        const errorData = await response.json();
        console.log('错误详情:');
        console.log(JSON.stringify(errorData, null, 2));

        // 分析错误类型
        if (response.status === 401) {
          console.log('🔐 认证失败 - 请检查 session token');
        } else if (response.status === 402) {
          console.log('💳 积分不足');
        } else if (response.status === 400) {
          console.log('📝 请求参数错误');
        } else if (response.status === 503) {
          console.log('🔧 服务不可用');
        } else {
          console.log('❓ 未知错误');
        }
      } catch (parseError) {
        console.log('无法解析错误响应:', parseError.message);
      }
    }
  } catch (error) {
    console.log('❌ 请求发送失败:', error.message);
  }

  console.log('\n📋 测试完成');
}

// 运行测试
testFullFlow().catch(console.error);

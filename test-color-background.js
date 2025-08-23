#!/usr/bin/env node

/**
 * 测试纯色背景模式 - 不需要 AI 服务
 */

const fs = require('fs');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/aibackground/generate',
  testImagePath: '/Users/hf/Desktop/Web Template/Products/roboneo art/public/aibg/aibg-test.jpg',
  sessionToken: 'RL3eLVpyVPXvZhccaXo9nf7jxWdqcseV.BgGYhzR%2BGn6n5X1hioWuQ0pan5KFYlhbL9CqzwxlQeg%3D'
};

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

async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${CONFIG.sessionToken}`,
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('请求失败:', error.message);
    return { status: 0, data: { error: error.message } };
  }
}

async function testColorBackground() {
  console.log('🎨 测试纯色背景模式');
  
  const imageBase64 = imageToBase64(CONFIG.testImagePath);
  console.log('✅ 图片转换完成');
  
  // 测试红色背景
  console.log('\n🔴 测试 1: 红色背景');
  const redResult = await sendRequest(CONFIG.baseUrl + CONFIG.apiEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      image_input: imageBase64,
      backgroundMode: 'color',
      backgroundColor: '#E25241',
      quality: 'standard',
      steps: 20,
      size: '1024x1024',
      output_format: 'png'
    })
  });
  
  console.log('📊 状态码:', redResult.status);
  if (redResult.status === 200) {
    console.log('✅ 红色背景生成成功!');
    console.log('🖼️  结果 URL:', redResult.data.resultUrl);
  } else {
    console.error('❌ 红色背景生成失败:', redResult.data);
  }
  
  // 测试透明背景
  console.log('\n⚪ 测试 2: 透明背景');
  const transparentResult = await sendRequest(CONFIG.baseUrl + CONFIG.apiEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      image_input: imageBase64,
      backgroundMode: 'color',
      backgroundColor: 'transparent',
      quality: 'standard',
      steps: 20,
      size: '1024x1024',
      output_format: 'png'
    })
  });
  
  console.log('📊 状态码:', transparentResult.status);
  if (transparentResult.status === 200) {
    console.log('✅ 透明背景生成成功!');
    console.log('🖼️  结果 URL:', transparentResult.data.resultUrl);
  } else {
    console.error('❌ 透明背景生成失败:', transparentResult.data);
  }
  
  console.log('\n🏁 测试完成');
}

testColorBackground().catch(console.error);

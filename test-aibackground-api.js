#!/usr/bin/env node

/**
 * AI Background API 测试脚本
 * 
 * 测试内容:
 * 1. GET 请求 - 获取可用的背景样式和预设颜色
 * 2. POST 请求 - 测试纯色背景模式
 * 3. POST 请求 - 测试第一个AI背景样式 (Abstract Gradient)
 * 4. POST 请求 - 测试自定义背景样式
 */

const fs = require('fs');
const path = require('path');

// 配置项
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/aibackground/generate',
  testImagePath: '/Users/hf/Desktop/Web Template/Products/roboneo art/public/aibg/aibg-test.jpg',
  // 你需要提供一个有效的 Cookie 或 Authorization Token
  // 从浏览器开发者工具中复制你的登录 session cookie
  authCookie: 'better-auth.session_token=YOUR_SESSION_TOKEN_HERE'
};

// 工具函数：将图片转换为 base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.jpg' || path.extname(imagePath).toLowerCase() === '.jpeg' 
      ? 'image/jpeg' 
      : 'image/png';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('❌ 读取测试图片失败:', error.message);
    console.error('请确保测试图片路径正确:', CONFIG.testImagePath);
    process.exit(1);
  }
}

// 工具函数：发送 HTTP 请求
async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': CONFIG.authCookie,
        ...options.headers
      },
      ...options
    });

    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    console.error('请求失败:', error.message);
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message }
    };
  }
}

// 工具函数：打印测试结果
function printTestResult(testName, response, expectedStatus = 200) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 测试: ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`📊 状态码: ${response.status} (${response.statusText})`);
  
  if (response.status === expectedStatus) {
    console.log('✅ 状态码正确');
  } else {
    console.log(`❌ 状态码错误，期望 ${expectedStatus}，实际 ${response.status}`);
  }
  
  console.log('\n📄 响应数据:');
  console.log(JSON.stringify(response.data, null, 2));
  
  if (response.status >= 400) {
    console.log('❌ 测试失败');
  } else {
    console.log('✅ 测试成功');
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试 AI Background API');
  console.log('📍 API 基础 URL:', CONFIG.baseUrl);
  console.log('🖼️  测试图片路径:', CONFIG.testImagePath);
  
  // 检查测试图片是否存在
  if (!fs.existsSync(CONFIG.testImagePath)) {
    console.error('❌ 测试图片不存在:', CONFIG.testImagePath);
    process.exit(1);
  }
  
  // 检查认证配置
  if (CONFIG.authCookie === 'better-auth.session_token=YOUR_SESSION_TOKEN_HERE') {
    console.log('\n⚠️  警告: 请先配置认证 Cookie');
    console.log('1. 在浏览器中登录你的应用');
    console.log('2. 打开开发者工具 -> Application -> Cookies');
    console.log('3. 复制 better-auth.session_token 的值');
    console.log('4. 修改 CONFIG.authCookie 配置\n');
  }
  
  // 转换测试图片为 base64
  const imageBase64 = imageToBase64(CONFIG.testImagePath);
  console.log('✅ 测试图片已转换为 base64 (长度:', imageBase64.length, '字符)');
  
  try {
    // 测试 1: GET 请求 - 获取可用背景样式
    console.log('\n🔍 开始测试 1: 获取可用背景样式...');
    const getResponse = await sendRequest(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
      method: 'GET'
    });
    printTestResult('获取背景样式和颜色', getResponse);
    
    // 获取第一个背景样式
    let firstBackgroundStyle = null;
    if (getResponse.data.backgroundStyles && getResponse.data.backgroundStyles.length > 0) {
      firstBackgroundStyle = getResponse.data.backgroundStyles[0];
      console.log(`\n🎨 将使用第一个背景样式: ${firstBackgroundStyle.id} (${firstBackgroundStyle.name})`);
    }
    
    // 测试 2: POST 请求 - 纯色背景模式
    console.log('\n🔍 开始测试 2: 纯色背景模式...');
    const colorResponse = await sendRequest(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        image_input: imageBase64,
        backgroundMode: 'color',
        backgroundColor: '#E25241', // 红色
        quality: 'standard',
        steps: 20,
        size: '1024x1024',
        output_format: 'png'
      })
    });
    printTestResult('纯色背景模式 (红色)', colorResponse);
    
    // 测试 3: POST 请求 - 第一个AI背景样式
    if (firstBackgroundStyle) {
      console.log('\n🔍 开始测试 3: AI背景样式 - ' + firstBackgroundStyle.name + '...');
      const aiBackgroundResponse = await sendRequest(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
        method: 'POST',
        body: JSON.stringify({
          image_input: imageBase64,
          backgroundMode: 'background',
          backgroundType: firstBackgroundStyle.id,
          quality: 'standard',
          steps: 25,
          size: '1024x1024',
          output_format: 'png'
        })
      });
      printTestResult(`AI背景样式 - ${firstBackgroundStyle.name}`, aiBackgroundResponse);
    }
    
    // 测试 4: POST 请求 - 自定义背景样式
    console.log('\n🔍 开始测试 4: 自定义背景样式...');
    const customBackgroundResponse = await sendRequest(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        image_input: imageBase64,
        backgroundMode: 'background',
        backgroundType: 'custom',
        customBackgroundDescription: 'beautiful sunset beach scene with palm trees, tropical paradise background, warm golden hour lighting',
        quality: 'standard',
        steps: 30,
        size: '1024x1024',
        output_format: 'png'
      })
    });
    printTestResult('自定义背景样式 (海滩夕阳)', customBackgroundResponse);
    
    // 测试 5: POST 请求 - 透明背景
    console.log('\n🔍 开始测试 5: 透明背景...');
    const transparentResponse = await sendRequest(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
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
    printTestResult('透明背景模式', transparentResponse);
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现未处理的错误:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 测试完成');
  console.log('='.repeat(60));
  
  // 提供一些使用建议
  console.log('\n💡 使用建议:');
  console.log('1. 如果认证失败，请检查 Cookie 配置');
  console.log('2. 如果Credits不足，请先充值');
  console.log('3. 如果生成失败，请检查网络连接和 AI 服务状态');
  console.log('4. 生成的图片会保存在 R2 存储的 aibackgrounds 文件夹中');
}

// 检查是否作为主模块运行
if (require.main === module) {
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error('❌ 此脚本需要 Node.js 18 或更高版本 (当前版本:', nodeVersion, ')');
    console.error('请使用: npm install -g node@18 或更高版本');
    process.exit(1);
  }
  
  // 运行测试
  runTests().catch(console.error);
}

module.exports = { runTests, CONFIG };

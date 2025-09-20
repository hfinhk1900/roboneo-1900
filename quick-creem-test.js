#!/usr/bin/env node

/**
 * 快速 Creem API 测试
 * 简化版本，专注于核心功能测试
 */

const https = require('https');

// 配置
const API_KEY = process.env.CREEM_API_KEY || '';
const BASE_URL = 'api.creem.io';

if (!API_KEY) {
  console.log('❌ 请设置 CREEM_API_KEY 环境变量');
  console.log('使用方法: CREEM_API_KEY=your_key node quick-creem-test.js');
  process.exit(1);
}

console.log('🧪 Creem API 快速测试');
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
console.log(
  `📝 格式检查: ${API_KEY.startsWith('creem_') ? '✅ 正确' : '❌ 错误格式'}`
);

// 测试函数
function testCreemAPI() {
  const postData = JSON.stringify({
    productId: 'prod_rbE5gREcbO1fQUrsCjYXQ', // PRO YEARLY - 测试用
    units: 1,
    customer: {
      email: 'test@example.com',
    },
    successUrl: 'https://example.com/success',
  });

  const options = {
    hostname: BASE_URL,
    port: 443,
    path: '/v1/checkouts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  console.log('\n🚀 发送测试请求...');

  const req = https.request(options, (res) => {
    console.log(`📊 状态码: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📝 响应内容:');
      try {
        const response = JSON.parse(data);
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log(data);
      }

      // 分析结果
      console.log('\n📋 结果分析:');
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ API 调用成功！');
      } else if (res.statusCode === 403) {
        console.log('❌ 403 Forbidden - API 密钥无效或权限不足');
        console.log('💡 建议: 检查 Creem Dashboard 中的 API 密钥');
      } else if (res.statusCode === 401) {
        console.log('❌ 401 Unauthorized - 认证失败');
      } else if (res.statusCode === 404) {
        console.log('⚠️  404 Not Found - 产品不存在（测试 ID，这是正常的）');
        console.log('✅ 但这说明 API 连接正常！');
      } else {
        console.log(`⚠️  意外状态码: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
  });

  req.write(postData);
  req.end();
}

// 运行测试
testCreemAPI();

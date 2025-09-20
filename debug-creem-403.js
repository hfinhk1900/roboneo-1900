#!/usr/bin/env node

/**
 * Creem API 403 错误专项调试
 * 详细分析 403 Forbidden 的具体原因
 */

const https = require('https');

const API_KEY = process.env.CREEM_API_KEY || '';

if (!API_KEY) {
  console.log('❌ 请设置 CREEM_API_KEY 环境变量');
  process.exit(1);
}

console.log('🔍 Creem API 403 错误专项调试');
console.log('='.repeat(50));
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
console.log(`📏 API Key 长度: ${API_KEY.length}`);
console.log(
  `🏷️  API Key 格式: ${API_KEY.startsWith('creem_test_') ? '测试环境' : API_KEY.startsWith('creem_live_') ? '生产环境' : '未知环境'}`
);

// 发送请求的通用函数
function makeRequest(method, path, data = null, additionalHeaders = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'api.creem.io',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'User-Agent': 'CreemDebugScript/1.0',
        ...additionalHeaders,
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
      },
    };

    console.log('\n🌐 ' + method + ' https://api.creem.io' + path);
    console.log('📋 Headers:');
    Object.entries(options.headers).forEach(([key, value]) => {
      if (key === 'x-api-key') {
        console.log(`   ${key}: ${value.substring(0, 12)}...`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });

    if (postData) {
      console.log(`📤 Body: ${postData}`);
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        console.log('📋 响应头:');
        Object.entries(res.headers).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });

        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
          console.log(`📝 响应体: ${JSON.stringify(parsedBody, null, 2)}`);
        } catch (e) {
          console.log(`📝 响应体: ${body}`);
          parsedBody = body;
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody,
        });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ 请求错误: ${error.message}`);
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// 测试 1: 尝试不同的 API 端点
async function testDifferentEndpoints() {
  console.log('\n🧪 测试 1: 尝试不同的 API 端点');
  console.log('-'.repeat(40));

  const endpoints = [
    { method: 'GET', path: '/v1/products', description: '获取产品列表' },
    { method: 'GET', path: '/v1/account', description: '获取账户信息' },
    { method: 'GET', path: '/v1/checkouts', description: '获取 checkout 列表' },
    {
      method: 'POST',
      path: '/v1/checkouts',
      description: '创建 checkout',
      data: {
        productId: 'prod_rbE5gREcbO1fQUrsCjYXQ',
        units: 1,
        customer: { email: 'test@example.com' },
        successUrl: 'https://example.com/success',
      },
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 测试: ${endpoint.description}`);
      const response = await makeRequest(
        endpoint.method,
        endpoint.path,
        endpoint.data
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✅ 请求成功！');
        return true;
      }
      if (response.statusCode === 403) {
        console.log('❌ 403 Forbidden');
        if (response.body?.error) {
          console.log(`💡 错误详情: ${response.body.error}`);
        }
      }
      if (response.statusCode === 404) {
        console.log('⚠️  404 Not Found - 端点可能不存在');
      }
      if (response.statusCode === 401) {
        console.log('❌ 401 Unauthorized - 认证失败');
      }
      if (
        response.statusCode !== 200 &&
        response.statusCode !== 201 &&
        response.statusCode !== 403 &&
        response.statusCode !== 404 &&
        response.statusCode !== 401
      ) {
        console.log(`⚠️  状态码: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }

    // 添加延迟避免速率限制
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

// 测试 2: 尝试不同的认证方式
async function testDifferentAuth() {
  console.log('\n🧪 测试 2: 尝试不同的认证方式');
  console.log('-'.repeat(40));

  const authMethods = [
    { name: 'x-api-key', headers: { 'x-api-key': API_KEY } },
    {
      name: 'Authorization Bearer',
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
    {
      name: 'Authorization Basic',
      headers: {
        Authorization: `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
      },
    },
  ];

  for (const auth of authMethods) {
    try {
      console.log(`\n🔐 测试认证方式: ${auth.name}`);

      const options = {
        hostname: 'api.creem.io',
        port: 443,
        path: '/v1/products',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...auth.headers,
        },
      };

      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              resolve({
                statusCode: res.statusCode,
                body: JSON.parse(body),
              });
            } catch (e) {
              resolve({
                statusCode: res.statusCode,
                body: body,
              });
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      console.log(`   状态码: ${response.statusCode}`);
      if (response.statusCode !== 403) {
        console.log('✅ 这种认证方式可能有效！');
        console.log(`   响应: ${JSON.stringify(response.body, null, 2)}`);
      }
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// 测试 3: 检查 API 密钥状态
async function checkApiKeyStatus() {
  console.log('\n🧪 测试 3: API 密钥状态检查');
  console.log('-'.repeat(40));

  // 尝试一个最简单的请求
  try {
    const response = await makeRequest('GET', '/');
    console.log('根路径响应:', response.statusCode);
  } catch (error) {
    console.log('根路径请求失败:', error.message);
  }

  // 检查是否是速率限制
  console.log('\n🔄 连续请求测试（检查速率限制）:');
  for (let i = 1; i <= 3; i++) {
    try {
      console.log(`请求 ${i}/3...`);
      const response = await makeRequest('POST', '/v1/checkouts', {
        productId: 'test',
        units: 1,
        customer: { email: 'test@example.com' },
      });
      console.log(`   状态码: ${response.statusCode}`);

      if (response.statusCode === 429) {
        console.log('⚠️  检测到速率限制');
        break;
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

// 主函数
async function main() {
  try {
    console.log('\n🎯 开始诊断...\n');

    await testDifferentEndpoints();
    await testDifferentAuth();
    await checkApiKeyStatus();

    console.log('\n📋 诊断总结:');
    console.log('='.repeat(50));
    console.log('💡 可能的解决方案:');
    console.log('1. 检查 Creem Dashboard 中的 API 密钥权限设置');
    console.log('2. 确认 API 密钥是否已激活且未过期');
    console.log('3. 验证账户状态是否正常');
    console.log('4. 联系 Creem 支持确认 API 访问权限');
    console.log('5. 检查是否需要完成账户验证流程');
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

main();

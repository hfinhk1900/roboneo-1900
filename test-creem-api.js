#!/usr/bin/env node

/**
 * Creem API 测试脚本
 * 用于验证测试模式下的 API 密钥和基本功能
 */

const https = require('https');

// 从环境变量或直接输入获取配置
const CREEM_API_KEY = process.env.CREEM_API_KEY || '';
const CREEM_BASE_URL = 'https://api.creem.io';

console.log('🚀 开始测试 Creem API...');
console.log('='.repeat(50));

// 检查 API 密钥格式
function validateApiKey(apiKey) {
  console.log('\n📋 API 密钥验证:');
  console.log(`   长度: ${apiKey.length}`);
  console.log(`   前缀: ${apiKey.substring(0, 10)}...`);

  if (!apiKey) {
    console.log('   ❌ API 密钥为空');
    return false;
  }

  if (apiKey.startsWith('creem_')) {
    console.log('   ✅ 正确的 Creem API 密钥格式');
    return true;
  }
  if (apiKey.startsWith('sk_')) {
    console.log('   ❌ 这是 Stripe API 密钥格式，不是 Creem 的！');
    return false;
  }
  console.log('   ⚠️  未知的 API 密钥格式');
  return false;
}

// 发送 HTTP 请求的辅助函数
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CREEM_BASE_URL);

    const options = {
      method: method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    console.log(`\n🔗 发送请求: ${method} ${url.toString()}`);
    console.log(`   Headers: x-api-key: ${CREEM_API_KEY.substring(0, 8)}...`);

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`   状态码: ${res.statusCode}`);
        console.log(`   响应头: ${JSON.stringify(res.headers, null, 2)}`);

        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
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
      console.log(`   ❌ 请求错误: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试 1: 尝试创建一个简单的 checkout
async function testCreateCheckout() {
  console.log('\n🧪 测试 1: 创建简单的 Checkout');
  console.log('-'.repeat(40));

  try {
    const checkoutData = {
      productId: 'test-product-id',
      units: 1,
      customer: {
        email: 'test@example.com',
      },
      successUrl: 'https://example.com/success',
    };

    const response = await makeRequest('POST', '/v1/checkouts', checkoutData);

    console.log(`   响应体: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('   ✅ Checkout 创建成功！');
      return true;
    }
    if (response.statusCode === 403) {
      console.log('   ❌ 403 Forbidden - API 密钥无效或权限不足');
      return false;
    }
    if (response.statusCode === 401) {
      console.log('   ❌ 401 Unauthorized - 缺少 API 密钥');
      return false;
    }
    if (response.statusCode === 404) {
      console.log('   ❌ 404 Not Found - 产品 ID 不存在');
      return false;
    }
    console.log(`   ⚠️  意外状态码: ${response.statusCode}`);
    return false;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 测试 2: 尝试获取产品信息（如果 API 支持）
async function testRetrieveProduct() {
  console.log('\n🧪 测试 2: 获取产品信息');
  console.log('-'.repeat(40));

  try {
    const response = await makeRequest('GET', '/v1/products/test-product-id');

    console.log(`   响应体: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 200) {
      console.log('   ✅ 产品信息获取成功！');
      return true;
    }
    if (response.statusCode === 404) {
      console.log('   ⚠️  产品不存在（这是正常的，因为我们使用了测试 ID）');
      return true; // 404 说明 API 连接正常，只是产品不存在
    }
    if (response.statusCode === 403) {
      console.log('   ❌ 403 Forbidden - API 密钥无效');
      return false;
    }
    console.log(`   ⚠️  状态码: ${response.statusCode}`);
    return false;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 测试 3: 用您实际的产品 ID 测试
async function testActualProductCheckout() {
  console.log('\n🧪 测试 3: 使用实际产品 ID 测试');
  console.log('-'.repeat(40));

  try {
    const checkoutData = {
      productId: 'prod_rbE5gREcbO1fQUrsCjYXQ', // PRO YEARLY - 从您的错误日志中的产品
      units: 1,
      customer: {
        email: 'test@example.com',
      },
      successUrl: 'https://roboneo-art.vercel.app/success',
    };

    const response = await makeRequest('POST', '/v1/checkouts', checkoutData);

    console.log(`   响应体: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('   ✅ 实际产品 Checkout 创建成功！');
      return true;
    }
    if (response.statusCode === 404) {
      console.log('   ❌ 产品 ID 不存在 - 请检查 Creem Dashboard 中的产品 ID');
      return false;
    }
    if (response.statusCode === 403) {
      console.log('   ❌ 403 Forbidden - API 密钥无效或产品 ID 格式错误');
      return false;
    }
    console.log(`   ⚠️  状态码: ${response.statusCode}`);
    return false;
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log(`🔑 使用 API 密钥: ${CREEM_API_KEY.substring(0, 8)}...`);
  console.log(`🌐 API 基础 URL: ${CREEM_BASE_URL}`);

  // 验证 API 密钥格式
  const isValidKey = validateApiKey(CREEM_API_KEY);

  if (!isValidKey) {
    console.log('\n❌ API 密钥格式验证失败，跳过 API 测试');
    console.log('\n💡 建议:');
    console.log('   1. 确保使用 Creem API 密钥（以 "creem_" 开头）');
    console.log('   2. 不要使用 Stripe API 密钥（以 "sk_" 开头）');
    console.log('   3. 检查 CREEM_API_KEY 环境变量设置');
    return;
  }

  const results = [];

  // 运行所有测试
  results.push(await testCreateCheckout());
  results.push(await testRetrieveProduct());
  results.push(await testActualProductCheckout());

  // 汇总结果
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(50));

  const passedTests = results.filter((r) => r).length;
  const totalTests = results.length;

  console.log(`✅ 通过: ${passedTests}/${totalTests} 个测试`);

  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！Creem API 连接正常');
  } else if (passedTests > 0) {
    console.log('⚠️  部分测试通过，可能存在配置问题');
  } else {
    console.log('❌ 所有测试失败，请检查 API 密钥和配置');
  }

  console.log('\n💡 下一步建议:');
  if (passedTests === 0) {
    console.log('   1. 检查 Creem Dashboard 获取正确的 API 密钥');
    console.log('   2. 确认 API 密钥有 checkout 创建权限');
    console.log('   3. 验证您使用的是测试环境的正确密钥');
  } else if (passedTests < totalTests) {
    console.log('   1. 检查产品 ID 是否在 Creem Dashboard 中存在');
    console.log('   2. 确认产品 ID 格式是否正确');
    console.log('   3. 验证产品是否在测试模式下可用');
  } else {
    console.log('   1. 更新应用中的环境变量');
    console.log('   2. 部署并测试实际的支付流程');
  }
}

// 如果没有提供 API 密钥，提示用户
if (!CREEM_API_KEY) {
  console.log('❌ 未找到 CREEM_API_KEY 环境变量');
  console.log('\n使用方法:');
  console.log('   CREEM_API_KEY=your_api_key node test-creem-api.js');
  console.log('\n或者设置环境变量:');
  console.log('   export CREEM_API_KEY=your_api_key');
  console.log('   node test-creem-api.js');
  process.exit(1);
}

// 运行测试
runTests().catch((error) => {
  console.error('❌ 测试脚本执行失败:', error);
  process.exit(1);
});

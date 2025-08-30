#!/usr/bin/env node

/**
 * 前端集成测试脚本
 * 测试水印去除功能的前端和后端集成
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testImagePath: './public/remove-watermark/watermark0proof.jpg',
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 测试前端页面可访问性
async function testPageAccess() {
  log('\n🌐 测试前端页面访问...', colors.blue);

  try {
    const response = await fetch(`${CONFIG.baseUrl}/remove-watermark`);

    if (response.ok) {
      const html = await response.text();

      // 检查关键元素是否存在
      const checks = [
        { name: 'React hydration', test: html.includes('__NEXT_DATA__') },
        {
          name: 'Remove Watermark title',
          test: html.includes('Remove Image Watermark'),
        },
        {
          name: 'Upload component',
          test: html.includes('upload') || html.includes('Upload'),
        },
        {
          name: 'Generator section',
          test:
            html.includes('RemoveWatermarkGeneratorSection') ||
            html.includes('generator'),
        },
      ];

      log('✅ 页面成功加载', colors.green);

      for (const check of checks) {
        if (check.test) {
          log(`  ✅ ${check.name}: 找到`, colors.green);
        } else {
          log(`  ⚠️ ${check.name}: 未找到`, colors.yellow);
        }
      }

      return true;
    }

    log(`❌ 页面访问失败: ${response.status}`, colors.red);
    return false;
  } catch (error) {
    log(`❌ 页面访问错误: ${error.message}`, colors.red);
    return false;
  }
}

// 测试API端点
async function testApiEndpoints() {
  log('\n🔌 测试API端点...', colors.blue);

  const endpoints = [
    {
      name: 'Watermark Remove Status',
      url: `${CONFIG.baseUrl}/api/watermark/remove`,
      method: 'GET',
      expectedStatus: 200,
    },
    {
      name: 'Watermark History',
      url: `${CONFIG.baseUrl}/api/history/watermark`,
      method: 'GET',
      expectedStatus: 401, // 需要认证
    },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { method: endpoint.method });
      const success = response.status === endpoint.expectedStatus;

      if (success) {
        log(`  ✅ ${endpoint.name}: ${response.status}`, colors.green);
      } else {
        log(
          `  ⚠️ ${endpoint.name}: ${response.status} (期望: ${endpoint.expectedStatus})`,
          colors.yellow
        );
      }

      results.push({ ...endpoint, actualStatus: response.status, success });
    } catch (error) {
      log(`  ❌ ${endpoint.name}: ${error.message}`, colors.red);
      results.push({ ...endpoint, error: error.message, success: false });
    }
  }

  return results;
}

// 测试静态资源
async function testStaticAssets() {
  log('\n📁 测试静态资源...', colors.blue);

  const assets = [
    '/remove-watermark/watermark0proof.jpg',
    // 可以添加更多需要检查的静态资源
  ];

  for (const asset of assets) {
    try {
      const response = await fetch(`${CONFIG.baseUrl}${asset}`);

      if (response.ok) {
        const size = response.headers.get('content-length');
        log(
          `  ✅ ${asset}: ${size ? `${(size / 1024).toFixed(1)}KB` : '可访问'}`,
          colors.green
        );
      } else {
        log(`  ❌ ${asset}: ${response.status}`, colors.red);
      }
    } catch (error) {
      log(`  ❌ ${asset}: ${error.message}`, colors.red);
    }
  }
}

// 测试导航配置
async function testNavigation() {
  log('\n🧭 测试导航配置...', colors.blue);

  try {
    // 检查主页是否包含水印去除的链接
    const response = await fetch(`${CONFIG.baseUrl}/`);

    if (response.ok) {
      const html = await response.text();

      if (
        html.includes('/remove-watermark') ||
        html.includes('Remove Watermark')
      ) {
        log('  ✅ 主页包含水印去除链接', colors.green);
      } else {
        log('  ⚠️ 主页未找到水印去除链接', colors.yellow);
      }

      // 检查导航栏配置
      if (html.includes('AI Tools') || html.includes('Remove Watermark')) {
        log('  ✅ 导航栏配置正确', colors.green);
      } else {
        log('  ⚠️ 导航栏配置可能有问题', colors.yellow);
      }
    }
  } catch (error) {
    log(`  ❌ 导航测试失败: ${error.message}`, colors.red);
  }
}

// 测试环境变量配置
async function testEnvironmentConfig() {
  log('\n⚙️ 测试环境配置...', colors.blue);

  try {
    // 通过API状态端点检查环境配置
    const response = await fetch(`${CONFIG.baseUrl}/api/watermark/remove`);

    if (response.ok) {
      const data = await response.json();

      const requiredFields = [
        'service',
        'status',
        'model',
        'provider',
        'credits_per_image',
      ];

      for (const field of requiredFields) {
        if (data[field]) {
          log(`  ✅ ${field}: ${data[field]}`, colors.green);
        } else {
          log(`  ❌ ${field}: 缺失`, colors.red);
        }
      }

      // 检查关键配置
      if (data.provider === 'SiliconFlow') {
        log('  ✅ SiliconFlow 提供商配置正确', colors.green);
      }

      if (data.model?.includes('FLUX')) {
        log('  ✅ FLUX 模型配置正确', colors.green);
      }
    } else {
      log('  ❌ 无法获取环境配置信息', colors.red);
    }
  } catch (error) {
    log(`  ❌ 环境配置测试失败: ${error.message}`, colors.red);
  }
}

// 生成集成测试报告
function generateIntegrationReport(results) {
  log('\n📊 前端集成测试报告', colors.blue + colors.bold);
  log('═'.repeat(60), colors.blue);

  const { pageAccess, apiResults } = results;

  let totalTests = 1; // 页面访问
  let passedTests = pageAccess ? 1 : 0;

  if (apiResults) {
    totalTests += apiResults.length;
    passedTests += apiResults.filter((r) => r.success).length;
  }

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  log(
    `📈 测试成功率: ${successRate}% (${passedTests}/${totalTests})`,
    successRate >= 80 ? colors.green : colors.yellow
  );

  log(
    `🌐 前端页面: ${pageAccess ? '✅ 正常' : '❌ 异常'}`,
    pageAccess ? colors.green : colors.red
  );

  if (apiResults) {
    log(
      `🔌 API端点: ${apiResults.filter((r) => r.success).length}/${apiResults.length} 正常`,
      colors.blue
    );
  }

  log('═'.repeat(60), colors.blue);
  log(`🕐 测试时间: ${new Date().toLocaleString()}`, colors.blue);
  log(`🌐 测试地址: ${CONFIG.baseUrl}`, colors.blue);

  if (successRate >= 90) {
    log(
      '\n🎉 集成测试全部通过！前端和后端集成正常。',
      colors.green + colors.bold
    );
  } else if (successRate >= 70) {
    log(
      '\n⚠️ 集成测试大部分通过，但有一些问题需要注意。',
      colors.yellow + colors.bold
    );
  } else {
    log('\n❌ 集成测试发现重要问题，需要修复。', colors.red + colors.bold);
  }
}

// 主测试函数
async function runIntegrationTest() {
  log('🧪 水印去除前端集成测试', colors.blue + colors.bold);
  log('═'.repeat(60), colors.blue);

  try {
    // 1. 测试页面访问
    const pageAccess = await testPageAccess();

    // 2. 测试API端点
    const apiResults = await testApiEndpoints();

    // 3. 测试静态资源
    await testStaticAssets();

    // 4. 测试导航配置
    await testNavigation();

    // 5. 测试环境配置
    await testEnvironmentConfig();

    // 6. 生成报告
    generateIntegrationReport({ pageAccess, apiResults });

    return pageAccess && apiResults.every((r) => r.success);
  } catch (error) {
    log(`\n💥 集成测试过程中发生错误: ${error.message}`, colors.red);
    log(error.stack, colors.red);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runIntegrationTest()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTest };

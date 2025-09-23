/**
 * 快速测试免费用户水印功能
 */

// 1. 验证当前登录用户的订阅状态
async function checkCurrentUserSubscription() {
  console.log('🔍 检查当前用户的订阅状态...');

  try {
    const response = await fetch('/api/debug/sticker-watermark');
    const data = await response.json();

    if (response.ok) {
      console.log('✅ 用户订阅状态检查结果:');
      console.log(`👤 用户ID: ${data.userId}`);
      console.log(`📋 有订阅: ${data.isSubscribed ? '是' : '否'}`);
      console.log(
        `🎨 应该添加水印: ${data.shouldApplyWatermark ? '是' : '否'}`
      );
      console.log(`💡 预期结果: ${data.watermarkExpected}`);

      if (data.isSubscribed) {
        console.log('⚠️  当前用户有活跃订阅，不会添加水印');
        console.log('💡 请使用免费账户进行测试');
      } else {
        console.log('✅ 当前用户是免费用户，应该会添加水印');
      }

      return data;
    }

    console.error('❌ 检查失败:', data);
    return null;
  } catch (error) {
    console.error('❌ 请求出错:', error);
    return null;
  }
}

// 2. 详细检查订阅状态和水印逻辑
async function detailedSubscriptionCheck(userId) {
  console.log('🔬 详细检查订阅状态和水印逻辑...');

  try {
    const response = await fetch('/api/debug/sticker-watermark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        action: 'checkSubscriptionForWatermark',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('📊 详细订阅检查结果:');
      console.log(JSON.stringify(data, null, 2));

      const { subscriptionCheck, explanation } = data;
      console.log('\n🎯 关键信息:');
      console.log(`   有订阅: ${subscriptionCheck.isSubscribed}`);
      console.log(`   应该添加水印: ${subscriptionCheck.shouldApplyWatermark}`);
      console.log(`   预期结果: ${explanation.expected}`);

      return data;
    }
    console.error('❌ 详细检查失败:', data);
    return null;
  } catch (error) {
    console.error('❌ 详细检查出错:', error);
    return null;
  }
}

// 3. 测试水印函数本身
async function testWatermarkFunction(userId) {
  console.log('🎨 测试水印函数...');

  try {
    const response = await fetch('/api/debug/sticker-watermark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        action: 'testWatermarkFunction',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('🛠️ 水印函数测试结果:');
      console.log(JSON.stringify(data.watermarkTest, null, 2));

      if (data.watermarkTest.functionAvailable) {
        console.log('✅ 水印函数工作正常');
      } else {
        console.log('❌ 水印函数有问题');
      }

      return data;
    }
    console.error('❌ 水印函数测试失败:', data);
    return null;
  } catch (error) {
    console.error('❌ 水印函数测试出错:', error);
    return null;
  }
}

// 4. 完整的测试流程
async function runCompleteWatermarkTest() {
  console.log('🚀 开始完整的水印测试流程...');
  console.log('='.repeat(50));

  // 步骤1: 检查当前用户
  const currentUser = await checkCurrentUserSubscription();
  if (!currentUser) {
    console.log('❌ 无法获取当前用户信息，请确保已登录');
    return;
  }

  // 步骤2: 详细检查订阅状态
  console.log('\n' + '='.repeat(30));
  const subscriptionDetail = await detailedSubscriptionCheck(
    currentUser.userId
  );

  // 步骤3: 测试水印函数
  console.log('\n' + '='.repeat(30));
  const watermarkTest = await testWatermarkFunction(currentUser.userId);

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试总结:');

  if (currentUser.isSubscribed) {
    console.log('⚠️  用户有订阅 → 不会添加水印');
    console.log('💡 建议: 使用免费账户测试或取消订阅后测试');
  } else {
    console.log('✅ 用户是免费用户 → 应该添加水印');
    console.log('🎯 现在可以进行实际的sticker生成测试');
  }

  if (watermarkTest?.watermarkTest?.functionAvailable) {
    console.log('✅ 水印函数正常工作');
  } else {
    console.log('❌ 水印函数可能有问题');
  }

  console.log('\n🎯 下一步: 生成一张sticker并查看是否有水印');
  console.log('位置: 图片右下角应该有白色的 "ROBONEO.ART" 字样');
}

// 5. 快速检查邮箱用户
async function quickCheckUserByEmail(email) {
  console.log(`🔍 快速检查邮箱用户: ${email}`);

  try {
    const response = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'findUserByEmail',
        email: email,
      }),
    });

    const data = await response.json();

    if (response.ok && data.found) {
      console.log('✅ 找到用户:');
      console.log(`👤 姓名: ${data.user.name}`);
      console.log(`📧 邮箱: ${data.user.email}`);
      console.log(`🆔 用户ID: ${data.user.id}`);
      console.log(
        `📋 有订阅: ${data.subscriptionSummary.hasActiveSubscription ? '是' : '否'}`
      );
      console.log(
        `🎨 应该有水印: ${!data.subscriptionSummary.hasActiveSubscription ? '是' : '否'}`
      );

      return data.user.id;
    }
    console.log('❌ 未找到用户或查找失败');
    return null;
  } catch (error) {
    console.error('❌ 查找出错:', error);
    return null;
  }
}

console.log(`
🧪 水印测试工具已加载

使用方法:
1. runCompleteWatermarkTest() - 运行完整测试流程
2. checkCurrentUserSubscription() - 检查当前用户订阅状态
3. quickCheckUserByEmail('user@example.com') - 通过邮箱检查用户
4. detailedSubscriptionCheck('userId') - 详细订阅检查
5. testWatermarkFunction('userId') - 测试水印函数

推荐使用: runCompleteWatermarkTest()
`);

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runCompleteWatermarkTest,
    checkCurrentUserSubscription,
    quickCheckUserByEmail,
    detailedSubscriptionCheck,
    testWatermarkFunction,
  };
}

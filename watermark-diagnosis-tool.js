/**
 * 🔍 水印功能完整诊断工具
 * 用于测试修复后的水印功能
 */

// 1. 检查当前用户的真实订阅状态
async function diagnoseCurrentUser() {
  console.log('🔍 诊断当前用户的订阅状态...');

  try {
    const response = await fetch('/api/debug/sticker-watermark');
    const data = await response.json();

    if (response.ok) {
      console.log('📊 当前用户状态:');
      console.log(`👤 用户ID: ${data.userId}`);
      console.log(`📋 有订阅: ${data.isSubscribed ? '是' : '否'}`);
      console.log(
        `🎨 应该添加水印: ${data.shouldApplyWatermark ? '是' : '否'}`
      );

      if (data.isSubscribed) {
        console.log('⚠️  当前用户有活跃订阅，生成的图片不会有水印');
        console.log('💡 建议: 使用免费账户测试水印功能');
      } else {
        console.log('✅ 当前用户是免费用户，生成的图片应该有水印');
      }

      return data;
    }
    console.error('❌ 获取用户状态失败:', data);
    return null;
  } catch (error) {
    console.error('❌ 请求出错:', error);
    return null;
  }
}

// 2. 测试订阅状态检查API（修复后）
async function testSubscriptionAPI(userId) {
  console.log(`🔬 测试修复后的订阅状态检查 API (用户: ${userId})...`);

  try {
    const response = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getActiveSubscription',
        userId: userId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('📋 订阅状态检查结果:');
      console.log(`🆔 查询的用户ID: ${userId}`);
      console.log(`📊 有活跃订阅: ${data.hasActiveSubscription ? '是' : '否'}`);
      console.log(
        `🎨 应该添加水印: ${!data.hasActiveSubscription ? '是' : '否'}`
      );

      if (data.subscriptionData) {
        console.log('📄 订阅详情:', {
          status: data.subscriptionData.status,
          plan: data.subscriptionData.priceId,
          created: data.subscriptionData.createdAt,
        });
      }

      return data;
    }
    console.error('❌ 订阅状态检查失败:', data);
    return null;
  } catch (error) {
    console.error('❌ 订阅检查出错:', error);
    return null;
  }
}

// 3. 测试水印函数本身
async function testWatermarkFunction() {
  console.log('🎨 测试水印函数...');

  try {
    const response = await fetch('/api/debug/sticker-watermark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'testWatermarkFunction',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('🛠️ 水印函数测试结果:');
      console.log(
        `✅ 函数可用: ${data.watermarkTest.functionAvailable ? '是' : '否'}`
      );
      console.log(`📝 测试消息: ${data.watermarkTest.message}`);

      if (data.watermarkTest.testImageGenerated) {
        console.log('🖼️ 生成了测试图片');
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

// 4. 创建测试用的免费用户账户
async function createTestFreeUser(email) {
  console.log(`👤 为邮箱 ${email} 创建测试用免费账户...`);
  console.log('💡 请手动注册此邮箱，然后确保它没有任何订阅');

  // 检查用户是否存在
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
      console.log(`🆔 用户ID: ${data.user.id}`);
      console.log(
        `📋 有订阅: ${data.subscriptionSummary.hasActiveSubscription ? '是' : '否'}`
      );

      if (!data.subscriptionSummary.hasActiveSubscription) {
        console.log('🎯 这是一个免费用户，适合测试水印！');
        return data.user.id;
      }
      console.log('⚠️  这个用户有订阅，不适合测试水印');
      return null;
    }
    console.log('❌ 用户不存在，请先注册');
    return null;
  } catch (error) {
    console.error('❌ 查找用户出错:', error);
    return null;
  }
}

// 5. 完整的水印修复验证流程
async function runCompleteWatermarkDiagnosis() {
  console.log('🚀 开始完整的水印修复验证流程...');
  console.log('='.repeat(60));

  // 步骤1: 检查当前用户
  const currentUser = await diagnoseCurrentUser();
  if (!currentUser) {
    console.log('❌ 无法获取当前用户信息，请确保已登录');
    return;
  }

  // 步骤2: 测试修复后的订阅状态检查
  console.log('\n' + '='.repeat(40));
  console.log('🔧 测试修复后的订阅状态检查...');
  const subscriptionTest = await testSubscriptionAPI(currentUser.userId);

  // 步骤3: 测试水印函数
  console.log('\n' + '='.repeat(40));
  console.log('🎨 测试水印函数...');
  const watermarkTest = await testWatermarkFunction();

  // 步骤4: 分析结果
  console.log('\n' + '='.repeat(60));
  console.log('📋 诊断结果总结:');

  if (subscriptionTest && watermarkTest) {
    console.log('\n🔧 修复验证:');

    // 检查订阅状态是否一致
    const stickerResult = currentUser.isSubscribed;
    const subscriptionResult = subscriptionTest.hasActiveSubscription;

    if (stickerResult === subscriptionResult) {
      console.log('✅ 订阅状态检查一致性: 正常');
    } else {
      console.log('❌ 订阅状态检查不一致:');
      console.log(`   Sticker API: ${stickerResult}`);
      console.log(`   Subscription API: ${subscriptionResult}`);
    }

    // 检查水印函数
    if (watermarkTest.watermarkTest?.functionAvailable) {
      console.log('✅ 水印函数: 正常工作');
    } else {
      console.log('❌ 水印函数: 存在问题');
    }

    // 给出建议
    console.log('\n💡 测试建议:');
    if (!currentUser.isSubscribed) {
      console.log('🎯 当前用户是免费用户，现在生成图片应该有水印');
      console.log(
        '📸 建议测试: 生成一张Image to Sticker，检查右下角是否有"ROBONEO.ART"水印'
      );
    } else {
      console.log('⚠️  当前用户有订阅，生成的图片不会有水印');
      console.log('👤 建议: 注册一个新的免费账户来测试水印功能');
    }
  }

  console.log('\n🎯 下一步测试:');
  console.log(
    '1. 如果是免费用户: 生成Image to Sticker/Profile Picture/Productshot等'
  );
  console.log('2. 检查生成的图片右下角是否有白色的"ROBONEO.ART"文字');
  console.log('3. 如果仍然没有水印，检查浏览器控制台是否有错误');
}

// 6. 快速测试特定邮箱用户
async function quickTestUserWatermark(email) {
  console.log(`🔍 快速测试用户 ${email} 的水印功能...`);

  const userId = await createTestFreeUser(email);
  if (!userId) {
    console.log('❌ 无法找到合适的测试用户');
    return;
  }

  const subscriptionResult = await testSubscriptionAPI(userId);
  if (subscriptionResult) {
    if (!subscriptionResult.hasActiveSubscription) {
      console.log('✅ 该用户适合测试水印功能');
      console.log('💡 请用此邮箱登录并生成图片测试');
    } else {
      console.log('❌ 该用户有订阅，不适合测试水印');
    }
  }
}

// 使用说明
console.log(`
🔧 水印修复诊断工具已加载

主要修复：
✅ 修复了 getActiveSubscriptionAction 中使用错误userId的bug
✅ 这个bug导致所有用户都被认为是订阅用户，因此没有水印

使用方法：
1. runCompleteWatermarkDiagnosis() - 运行完整诊断流程 (推荐)
2. diagnoseCurrentUser() - 检查当前用户状态
3. testSubscriptionAPI('userId') - 测试订阅状态API
4. testWatermarkFunction() - 测试水印函数
5. quickTestUserWatermark('email@example.com') - 测试特定用户

🎯 关键修复说明：
原bug: getActiveSubscriptionAction 总是查询 session.user.id 的订阅状态
修复: 现在正确查询传入的 userId 的订阅状态

现在免费用户应该能正常看到水印了！
`);

// Node.js导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runCompleteWatermarkDiagnosis,
    diagnoseCurrentUser,
    testSubscriptionAPI,
    testWatermarkFunction,
    createTestFreeUser,
    quickTestUserWatermark,
  };
}

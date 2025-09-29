/**
 * 订阅状态诊断工具
 * 用于检查用户的订阅状态和数据库记录
 */

// 在浏览器控制台中使用此脚本来诊断订阅问题

async function debugSubscriptionStatus(userId) {
  console.log('🔍 开始诊断用户订阅状态:', userId);

  try {
    // 1. 检查用户的活跃订阅
    console.log('\n1️⃣ 检查活跃订阅...');
    const activeSubResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'getActiveSubscription' }),
    });

    if (activeSubResponse.ok) {
      const activeSubData = await activeSubResponse.json();
      console.log('✅ 活跃订阅查询结果:', activeSubData);
    } else {
      console.error('❌ 活跃订阅查询失败:', await activeSubResponse.text());
    }

    // 2. 检查所有支付记录
    console.log('\n2️⃣ 检查所有支付记录...');
    const allPaymentsResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'getAllPayments' }),
    });

    if (allPaymentsResponse.ok) {
      const allPaymentsData = await allPaymentsResponse.json();
      console.log('✅ 所有支付记录:', allPaymentsData);

      // 分析支付记录
      if (allPaymentsData.success && allPaymentsData.payments) {
        console.log('\n📊 支付记录分析:');
        allPaymentsData.payments.forEach((payment, index) => {
          console.log(`记录 ${index + 1}:`);
          console.log(`  - ID: ${payment.id}`);
          console.log(`  - 订阅ID: ${payment.subscriptionId}`);
          console.log(`  - 状态: ${payment.status}`);
          console.log(`  - 类型: ${payment.type}`);
          console.log(`  - 创建时间: ${payment.createdAt}`);
          console.log(`  - 更新时间: ${payment.updatedAt}`);
          console.log(`  - 取消于期末: ${payment.cancelAtPeriodEnd}`);
          console.log(
            `  - 期间: ${payment.periodStart} - ${payment.periodEnd}`
          );
          console.log('---');
        });
      }
    } else {
      console.error('❌ 支付记录查询失败:', await allPaymentsResponse.text());
    }

    // 3. 检查Stripe实时状态（如果有subscriptionId）
    console.log('\n3️⃣ 检查Stripe实时状态...');
    const stripeCheckResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'checkStripeStatus' }),
    });

    if (stripeCheckResponse.ok) {
      const stripeData = await stripeCheckResponse.json();
      console.log('✅ Stripe实时状态:', stripeData);
    } else {
      console.error('❌ Stripe状态查询失败:', await stripeCheckResponse.text());
    }
  } catch (error) {
    console.error('❌ 诊断过程中出错:', error);
  }
}

// 使用方法说明
console.log(`
🔧 订阅状态诊断工具已加载

使用方法:
debugSubscriptionStatus('用户ID');

示例:
debugSubscriptionStatus('clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

注意: 请确保先创建对应的调试API端点
`);

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugSubscriptionStatus };
}

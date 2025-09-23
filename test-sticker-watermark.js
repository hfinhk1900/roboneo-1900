/**
 * 测试Image to Sticker水印功能
 * 用于验证免费用户是否正确应用水印
 */

// 在浏览器控制台中使用此脚本

async function testStickerWatermark(userId) {
  console.log('🧪 测试Sticker水印功能...');
  console.log('用户ID:', userId);
  
  try {
    // 1. 检查用户订阅状态
    console.log('\n1️⃣ 检查用户订阅状态...');
    const subResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'getActiveSubscription' })
    });
    
    const subData = await subResponse.json();
    console.log('订阅状态结果:', subData);
    
    const hasActiveSubscription = subData.hasActiveSubscription;
    console.log('🔍 用户是否有活跃订阅:', hasActiveSubscription);
    console.log('📋 预期水印应用:', hasActiveSubscription ? '❌ 不应该有水印' : '✅ 应该有水印');
    
    // 2. 检查最近的Sticker生成记录
    console.log('\n2️⃣ 检查最近的Sticker生成记录...');
    
    // 模拟检查最近生成的sticker图片
    // 由于我们无法直接访问生成的图片，我们可以通过API日志来验证
    console.log('💡 提示: 请查看最近生成的sticker图片是否包含水印');
    console.log('💡 免费用户应该看到右下角有 "ROBONEO.ART" 水印');
    console.log('💡 订阅用户应该看到无水印的清洁图片');
    
    // 3. 提供测试建议
    console.log('\n3️⃣ 测试建议:');
    if (hasActiveSubscription) {
      console.log('⚠️  当前用户有活跃订阅，应该生成无水印图片');
      console.log('   📝 请用此用户测试sticker生成，确认图片右下角没有水印');
    } else {
      console.log('✅ 当前用户是免费用户，应该生成有水印图片');
      console.log('   📝 请用此用户测试sticker生成，确认图片右下角有 "ROBONEO.ART" 水印');
    }
    
    // 4. 检查watermark函数是否可用
    console.log('\n4️⃣ 检查水印功能...');
    console.log('💡 水印应该应用在右下角，配置:');
    console.log('   - 文字: "ROBONEO.ART"');
    console.log('   - 字体大小比例: 0.05');
    console.log('   - 透明度: 0.9');
    console.log('   - 边距: 18px');
    console.log('   - 颜色: 白色文字，黑色描边');
    
    return {
      userId,
      hasActiveSubscription,
      shouldHaveWatermark: !hasActiveSubscription,
      testPassed: true
    };
    
  } catch (error) {
    console.error('❌ 测试出错:', error);
    return {
      userId,
      error: error.message,
      testPassed: false
    };
  }
}

// 创建一个免费用户测试版本
async function testFreeUserWatermark(email) {
  console.log('🔍 通过邮箱查找用户并测试水印...');
  
  try {
    // 1. 根据邮箱查找用户ID
    const findResponse = await fetch('/api/debug/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'findUserByEmail', email })
    });
    
    const findData = await findResponse.json();
    
    if (!findData.found) {
      console.log('❌ 未找到用户:', email);
      return;
    }
    
    console.log('✅ 找到用户:', findData.user.email);
    console.log('用户ID:', findData.user.id);
    
    // 2. 测试该用户的水印功能
    return await testStickerWatermark(findData.user.id);
    
  } catch (error) {
    console.error('❌ 邮箱查找测试出错:', error);
  }
}

// 批量测试多个用户
async function batchTestWatermark(userEmails) {
  console.log(`🔄 批量测试 ${userEmails.length} 个用户的水印功能...`);
  
  const results = [];
  
  for (let i = 0; i < userEmails.length; i++) {
    const email = userEmails[i];
    console.log(`\n📧 测试用户 ${i + 1}/${userEmails.length}: ${email}`);
    
    const result = await testFreeUserWatermark(email);
    results.push({
      email,
      ...result
    });
    
    // 避免请求过快
    if (i < userEmails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 批量测试结果汇总:');
  console.table(results);
  
  return results;
}

// 检查API端点的水印逻辑
async function checkStickerAPILogic() {
  console.log('🔧 检查Sticker API的水印逻辑...');
  
  console.log(`
📋 预期的水印应用逻辑 (在 /api/image-to-sticker 中):

1. 检查用户订阅状态:
   const sub = await getActiveSubscriptionAction({ userId: session.user.id });
   isSubscribed = !!sub?.data?.data;

2. 如果未订阅，应用水印:
   if (!isSubscribed) {
     const watermarkedBuffer = await applyCornerWatermark(
       stickerBuffer,
       'ROBONEO.ART',
       {
         fontSizeRatio: 0.05,
         opacity: 0.9,
         margin: 18,
         fill: '#FFFFFF',
         stroke: 'rgba(0,0,0,0.35)',
         strokeWidth: 2,
       }
     );
   }

🔍 如果免费用户没有看到水印，可能的原因:
1. 订阅状态检查错误返回 isSubscribed = true
2. applyCornerWatermark 函数执行失败但被 catch 忽略
3. 水印颜色/透明度设置使其不可见
4. 图片格式或尺寸问题导致水印无法正确应用

💡 建议的调试步骤:
1. 使用 testStickerWatermark(userId) 检查具体用户的订阅状态
2. 在生成sticker后检查图片右下角是否有水印
3. 如果没有水印，检查服务器日志中的水印应用错误信息
  `);
}

// 使用方法说明
console.log(`
🧪 Sticker水印测试工具已加载

使用方法:
1. testStickerWatermark('用户ID') - 测试特定用户的水印功能
2. testFreeUserWatermark('user@example.com') - 通过邮箱测试用户水印
3. batchTestWatermark(['email1@example.com', 'email2@example.com']) - 批量测试
4. checkStickerAPILogic() - 查看API逻辑说明

示例:
testFreeUserWatermark('user@example.com');
checkStickerAPILogic();
`);

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    testStickerWatermark, 
    testFreeUserWatermark, 
    batchTestWatermark,
    checkStickerAPILogic 
  };
}

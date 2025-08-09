/**
 * 使用真实 KIE AI API key 测试 iOS 风格贴纸生成
 * 这将调用实际的 AI 服务生成真实的贴纸
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_BEARER_TOKEN = 'test-token';

async function testRealIOSGeneration() {
  console.log('🍎 使用真实 API key 测试 iOS 风格贴纸生成');
  console.log('='.repeat(60));
  console.log('⚠️  注意：这将使用真实的 KIE AI API 并产生费用');
  console.log('='.repeat(60));

  try {
    // 1. 验证服务器连接
    console.log('\n🔗 1. 验证服务器连接...');
    const pingResponse = await fetch(`${API_BASE_URL}/api/ping`);
    if (!pingResponse.ok) {
      throw new Error('服务器连接失败');
    }
    console.log('✅ 服务器连接正常');

    // 2. 获取 iOS 风格信息
    console.log('\n📋 2. 获取 iOS 风格信息...');
    const stylesResponse = await fetch(`${API_BASE_URL}/api/image-to-sticker-ai?styles=true`, {
      headers: { 'Authorization': `Bearer ${TEST_BEARER_TOKEN}` }
    });

    const stylesResult = await stylesResponse.json();
    if (stylesResult.code !== 200) {
      throw new Error(`获取风格失败: ${stylesResult.msg}`);
    }

    const iosStyle = stylesResult.data.styles.find((s: any) => s.id === 'ios');
    console.log(`✅ iOS 风格: ${iosStyle.name}`);
    console.log(`📝 完整描述: ${iosStyle.description}`);

    // 3. 创建真实的 iOS 风格贴纸任务
    console.log('\n🚀 3. 创建真实的 iOS 风格贴纸任务...');
    console.log('📸 使用图片: 用户提供的测试图片');

    // 使用一个高质量的测试图片 URL
    // 在实际使用中，这里应该是用户上传的图片 URL
    const testImageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop&crop=face";

    const taskResponse = await fetch(`${API_BASE_URL}/api/image-to-sticker-ai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filesUrl: [testImageUrl],
        style: "ios",  // iOS 3D emoji 风格
        size: "1:1"    // 方形格式 (成本最低)
      })
    });

    const taskResult = await taskResponse.json();

    if (taskResult.code !== 200) {
      throw new Error(`任务创建失败: ${taskResult.msg}`);
    }

    const taskId = taskResult.data.taskId;
    console.log(`✅ 任务创建成功: ${taskId}`);
    console.log('🔄 这将调用真实的 KIE AI GPT-4o Image API...');

    // 4. 监控真实的生成过程
    console.log('\n⏳ 4. 监控 iOS 风格贴纸生成进度...');

    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 真实 API 可能需要更长时间
    const checkInterval = 2000; // 2秒检查一次

    while (!completed && attempts < maxAttempts) {
      attempts++;

      await new Promise(resolve => setTimeout(resolve, checkInterval));

      const statusResponse = await fetch(`${API_BASE_URL}/api/image-to-sticker-ai?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${TEST_BEARER_TOKEN}` }
      });

      const statusResult = await statusResponse.json();
      const status = statusResult.data.status;

      console.log(`📊 检查 ${attempts}/${maxAttempts} - 状态: ${status} (${Math.round(attempts * checkInterval / 1000)}s)`);

      if (status === 'completed') {
        completed = true;
        console.log('\n🎉 真实 iOS 风格贴纸生成完成！');
        console.log('📸 生成的真实贴纸:');
        statusResult.data.resultUrls?.forEach((url: string, index: number) => {
          console.log(`   ${index + 1}. ${url}`);
        });

        console.log('\n🎨 真实生成的 iOS 风格特征:');
        console.log('   ✨ 真实的 3D emoji 风格 (由 GPT-4o 生成)');
        console.log('   🎭 AI 重新解释的面部特征和表情');
        console.log('   🌟 专业透明背景处理');
        console.log('   🔄 Apple iOS 官方设计风格');
        console.log('   📱 高质量 1024x1024 输出');

        console.log('\n💰 成本信息:');
        console.log('   🔹 使用了最低成本配置 (1:1, 单变体)');
        console.log('   🔹 调用了 KIE AI GPT-4o Image API');
        console.log('   🔹 具体费用请查看 KIE AI 账户');

      } else if (status === 'failed') {
        console.log('\n❌ 生成失败:');
        console.log(`   错误: ${statusResult.data.error}`);
        throw new Error(`任务失败: ${statusResult.data.error}`);
      } else if (status === 'processing') {
        console.log('   🤖 AI 正在处理图片...');
      }
    }

    if (!completed) {
      console.log('\n⚠️ 任务仍在处理中，这可能需要更长时间');
      console.log(`   任务ID: ${taskId}`);
      console.log('   您可以稍后使用此ID检查状态');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n🔧 可能的解决方案:');
    console.log('   1. 检查 KIE AI API key 是否正确配置');
    console.log('   2. 确认 KIE AI 账户有足够余额');
    console.log('   3. 检查网络连接');
    console.log('   4. 验证图片 URL 是否可访问');
  }
}

// 运行测试
console.log('🔥 准备开始真实的 iOS 风格贴纸生成测试...');
console.log('💡 提示: 这将使用真实的 AI API 服务');

testRealIOSGeneration().then(() => {
  console.log('\n🏁 真实 iOS 风格生成测试完成');
}).catch(console.error);

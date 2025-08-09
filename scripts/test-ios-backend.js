/**
 * 直接测试 iOS 风格贴纸生成 - 使用用户的 test-img.jpg
 * JavaScript 版本，避免 TypeScript 错误
 */

const API_BASE_URL = 'http://localhost:3000';
const BEARER_TOKEN = 'test-token';
const IMAGE_URL = 'http://localhost:3000/test-img.jpg';

async function testIOSGeneration() {
  console.log('🍎 直接测试 iOS 风格贴纸生成');
  console.log('='.repeat(60));
  console.log(`📸 测试图片: ${IMAGE_URL}`);
  console.log('🎨 风格: iOS Sticker (3D emoji 风格)');
  console.log('='.repeat(60));

  try {
    // 1. 验证图片可访问性
    console.log('\n🔍 1. 验证测试图片...');
    try {
      const imageResponse = await fetch(IMAGE_URL);
      if (!imageResponse.ok) {
        throw new Error(`图片无法访问: ${imageResponse.status}`);
      }
      const contentType = imageResponse.headers.get('content-type');
      console.log(`✅ 图片可访问，类型: ${contentType}`);
    } catch (err) {
      throw new Error(`图片访问失败: ${err.message}`);
    }

    // 2. 创建 iOS 风格贴纸任务
    console.log('\n🚀 2. 创建 iOS 风格贴纸任务...');

    const taskResponse = await fetch(`${API_BASE_URL}/api/image-to-sticker-ai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filesUrl: [IMAGE_URL],
        style: "ios",  // iOS 3D emoji 风格
        size: "1:1"    // 方形格式 (成本最低)
      })
    });

    console.log(`📊 响应状态: ${taskResponse.status}`);
    const taskResult = await taskResponse.json();

    console.log('📄 API 响应:');
    console.log(JSON.stringify(taskResult, null, 2));

    if (taskResult.code !== 200) {
      throw new Error(`任务创建失败: ${taskResult.msg}`);
    }

    const taskId = taskResult.data.taskId;
    console.log(`\n✅ 任务创建成功: ${taskId}`);

    // 3. 监控生成过程
    console.log('\n⏳ 3. 监控 iOS 风格贴纸生成...');

    let completed = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!completed && attempts < maxAttempts) {
      attempts++;

      // 第一次立即检查，之后等待3秒
      if (attempts > 1) {
        console.log(`   ⏰ 等待 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      const statusResponse = await fetch(`${API_BASE_URL}/api/image-to-sticker-ai?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
      });

      const statusResult = await statusResponse.json();
      console.log(`\n📊 检查 ${attempts}/${maxAttempts}:`);
      console.log(`   状态: ${statusResult.data.status}`);
      console.log(`   时间: ${new Date().toLocaleTimeString()}`);

      if (statusResult.data.status === 'completed') {
        completed = true;

        console.log('\n🎉 iOS 风格贴纸生成完成！');
        console.log('='.repeat(60));

        const resultUrls = statusResult.data.resultUrls || [];
        console.log('📸 生成的贴纸 URL:');
        resultUrls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });

        console.log('\n🎨 iOS 风格特征:');
        console.log('   ✨ 3D emoji 风格 (匹配 Apple iOS 设计)');
        console.log('   🎭 保持原有面部特征和表情');
        console.log('   🌟 透明背景，专业贴纸质感');
        console.log('   📱 1024x1024 高质量输出');

        console.log('\n💰 成本信息:');
        console.log('   🔹 使用最低成本配置 (1:1格式, 单变体)');
        if (resultUrls[0] && resultUrls[0].includes('test-ios-style-sticker')) {
          console.log('   🧪 [测试模式] 使用模拟结果');
          console.log('   💡 配置真实 API key 后将调用真实 KIE AI API');
        } else {
          console.log('   💳 [生产模式] 调用了真实 KIE AI GPT-4o API');
          console.log('   💰 具体费用请查看 KIE AI 账户');
        }

        console.log('\n📋 完整任务信息:');
        console.log(JSON.stringify(statusResult.data, null, 2));

      } else if (statusResult.data.status === 'failed') {
        console.log('\n❌ 生成失败:');
        console.log(`   错误: ${statusResult.data.error}`);
        throw new Error(`任务失败: ${statusResult.data.error}`);

      } else if (statusResult.data.status === 'processing') {
        console.log('   🤖 AI 正在处理图片...');

      } else {
        console.log(`   ⏳ 状态: ${statusResult.data.status}`);
      }
    }

    if (!completed) {
      console.log('\n⚠️ 任务仍在处理中');
      console.log(`   任务ID: ${taskId}`);
      console.log('   可能需要更长时间，请稍后手动检查');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);

    console.log('\n🔧 可能的解决方案:');
    console.log('   1. 检查服务器是否正常运行 (http://localhost:3000)');
    console.log('   2. 确认 KIE AI API key 配置正确');
    console.log('   3. 验证图片文件 public/test-img.jpg 存在');
    console.log('   4. 检查网络连接');
  }
}

// 开始测试
console.log('🔥 开始直接测试 iOS 风格贴纸生成...');
console.log('⚡ 这是一个纯后端 API 测试');

testIOSGeneration()
  .then(() => {
    console.log('\n🏁 iOS 风格贴纸生成测试完成');
  })
  .catch(error => {
    console.error('\n💥 测试异常:', error.message);
  });

/**
 * 专门测试 iOS 风格贴纸生成
 * 模拟用户上传的图片转换为 iOS 风格贴纸
 */

const BASE_URL = 'http://localhost:3000';
const BEARER_TOKEN = 'test-token';

async function testIOSStyleGeneration() {
  console.log('🍎 测试 iOS 风格贴纸生成');
  console.log('='.repeat(50));

  try {
    // 1. 获取风格信息
    console.log('\n📋 1. 获取 iOS 风格信息...');
    const stylesResponse = await fetch(`${BASE_URL}/api/image-to-sticker-ai?styles=true`, {
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });

    const stylesResult = await stylesResponse.json();
    const iosStyle = stylesResult.data.styles.find((s: any) => s.id === 'ios');

    console.log(`✅ iOS 风格: ${iosStyle.name}`);
    console.log(`📝 描述: ${iosStyle.description.substring(0, 80)}...`);

    // 2. 创建 iOS 风格贴纸任务
    console.log('\n🚀 2. 创建 iOS 风格贴纸任务...');

    const taskResponse = await fetch(`${BASE_URL}/api/image-to-sticker-ai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 模拟用户上传的图片 URL (实际使用时这里会是用户的图片)
        filesUrl: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"],
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

    // 3. 轮询任务状态
    console.log('\n⏳ 3. 等待 iOS 风格贴纸生成...');

    let completed = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!completed && attempts < maxAttempts) {
      attempts++;

      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

      const statusResponse = await fetch(`${BASE_URL}/api/image-to-sticker-ai?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
      });

      const statusResult = await statusResponse.json();
      const status = statusResult.data.status;

      console.log(`📊 尝试 ${attempts}/${maxAttempts} - 状态: ${status}`);

      if (status === 'completed') {
        completed = true;
        console.log('\n🎉 iOS 风格贴纸生成完成！');
        console.log('📸 生成的贴纸:');
        statusResult.data.resultUrls?.forEach((url: string, index: number) => {
          console.log(`   ${index + 1}. ${url}`);
        });

        console.log('\n🎨 风格特征:');
        console.log('   ✨ 3D emoji 风格');
        console.log('   🎭 保持原有表情和姿势');
        console.log('   🌟 透明背景');
        console.log('   🔄 Apple iOS 设计风格');

      } else if (status === 'failed') {
        throw new Error(`任务失败: ${statusResult.data.error}`);
      }
    }

    if (!completed) {
      console.log('⚠️ 任务仍在处理中，请稍后检查状态');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testIOSStyleGeneration().then(() => {
  console.log('\n🏁 iOS 风格测试完成');
}).catch(console.error);

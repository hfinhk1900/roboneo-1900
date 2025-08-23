const fs = require('fs');
const path = require('path');

// 测试去背景API功能
async function testBackgroundRemoval() {
  console.log('🧪 开始测试免费去背景功能...');

  try {
    // 读取测试图片
    const imagePath = path.join(__dirname, 'public/aibg/aibg-test.jpg');

    if (!fs.existsSync(imagePath)) {
      console.error('❌ 测试图片不存在:', imagePath);
      console.log('💡 请确保 public/aibg/aibg-test.jpg 文件存在');
      return;
    }

    // 将图片转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    console.log('📸 测试图片已加载:', imagePath);
    console.log('📊 图片大小:', Math.round(imageBuffer.length / 1024), 'KB');

    // 调用去背景API
    console.log('🚀 调用去背景API...');

    const response = await fetch('http://localhost:3000/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_input: imageBase64,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 调用失败:', response.status, response.statusText);
      console.error('错误详情:', errorText);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ 去背景成功!');
      console.log('📋 返回消息:', result.message);

      // 保存结果图片
      const outputPath = path.join(__dirname, 'public/aibg/bg-removed-result.png');
      const base64Data = result.image.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(outputPath, base64Data, 'base64');

      console.log('💾 结果已保存到:', outputPath);
      console.log('🎉 测试完成!');
    } else {
      console.error('❌ 去背景失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 请确保开发服务器正在运行: pnpm dev');
    }
  }
}

// 运行测试
testBackgroundRemoval();

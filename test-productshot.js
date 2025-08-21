const fs = require('fs');
const path = require('path');

async function testProductShot() {
  try {
    // 1. 读取并转换图片为base64
    const imagePath = path.join(
      __dirname,
      'public/productshots/productshot44.png'
    );
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    console.log('✅ Image loaded and converted to base64');
    console.log(`📁 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // 2. 准备API请求数据
    const requestData = {
      productDescription: 'Professional smartphone case with elegant design',
      sceneType: 'studio-model', // Professional Model scene
      quality: 'standard',
      image_input: imageBase64,
      size: '1024x1024',
      output_format: 'png',
    };

    console.log('🚀 Starting ProductShot generation test...');
    console.log(`📋 Product: ${requestData.productDescription}`);
    console.log(`🎬 Scene: Professional Model (${requestData.sceneType})`);

    // 3. 发送API请求
    const response = await fetch(
      'http://localhost:3000/api/productshot/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: 在实际测试中需要添加有效的认证headers
          Cookie: 'your-session-cookie-here', // 需要替换为有效的session
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ ProductShot generation successful!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));

      if (result.resultUrl) {
        console.log(`🖼️  Generated image URL: ${result.resultUrl}`);
        console.log(`⏱️  Processing time: ${result.processingTime}ms`);
        console.log(`💰 Credits used: ${result.credits_used}`);
      }
    } else {
      console.error('❌ ProductShot generation failed:');
      console.error('📋 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// 运行测试
testProductShot();

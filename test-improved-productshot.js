const fs = require('fs');
const path = require('path');

async function testImprovedProductShot() {
  try {
    console.log('🧪 Testing Improved ProductShot with Proportion Control...\n');

    // 1. 读取测试图片
    const imagePath = path.join(
      __dirname,
      'public/productshots/productshot44.png'
    );
    console.log('📷 Reading test image:', imagePath);

    if (!fs.existsSync(imagePath)) {
      throw new Error('Test image not found: ' + imagePath);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    console.log(
      '✅ Image loaded successfully, size:',
      imageBuffer.length,
      'bytes\n'
    );

    // 2. 测试场景 1 (studio-model) 使用改进的比例控制
    const testPayload = {
      sceneType: 'studio-model',
      image_input: base64Image,
      additionalContext: 'small perfume bottle elegant luxury fragrance',
      quality: 'standard',
      guidance_scale: 4.0,
    };

    console.log(
      '🎯 Testing Scene 1: Professional Model (with proportion improvements)'
    );
    console.log('📝 Test payload:');
    console.log({
      sceneType: testPayload.sceneType,
      hasImageInput: !!testPayload.image_input,
      additionalContext: testPayload.additionalContext,
      quality: testPayload.quality,
      guidance_scale: testPayload.guidance_scale,
    });

    console.log('\n📋 Expected improvements:');
    console.log('  ✅ Size detection: "small" (from "perfume" keyword)');
    console.log('  ✅ Size hints: "small, compact"');
    console.log('  ✅ Enhanced prompt with proportion control');
    console.log('  ✅ Product described as "handheld object"');

    // 3. 调用改进的 API
    console.log('\n🚀 Calling improved ProductShots API...');
    const response = await fetch(
      'http://localhost:3000/api/productshot/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      }
    );

    console.log('📡 Response status:', response.status);
    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Improved API response:');
      console.log({
        success: result.success,
        taskId: result.taskId,
        sceneType: result.sceneType,
        model: result.model,
        provider: result.provider,
        resultUrl: result.resultUrl
          ? 'Generated image URL received'
          : 'No image URL',
      });

      if (result.resultUrl) {
        console.log('\n🖼️  Generated image URL:');
        console.log(result.resultUrl);
        console.log('\n🎯 Please check the image to verify:');
        console.log('  - Model is holding a reasonably sized perfume bottle');
        console.log('  - Product appears as handheld object, not oversized');
        console.log('  - Proportions look natural and realistic');
      }
    } else {
      console.log('\n❌ ERROR! API response:');
      console.log(result);
    }
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

// 运行测试
testImprovedProductShot();

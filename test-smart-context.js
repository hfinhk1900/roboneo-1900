const fs = require('fs');
const path = require('path');

async function testSmartContext() {
  try {
    console.log('🧪 Testing Smart Context System for Different Products...\n');

    // 读取测试图片
    const imagePath = path.join(__dirname, 'public/productshots/productshot44.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    console.log('✅ Image loaded successfully\n');

    // 测试不同场景的智能上下文系统
    const testCases = [
      {
        name: '1. 用户手动指定产品类型 (最高优先级)',
        payload: {
          sceneType: 'studio-model',
          image_input: base64Image,
          productTypeHint: 'small',
          additionalContext: '', // 空上下文
          quality: 'standard'
        },
        expected: {
          category: 'small',
          confidence: 'high',
          source: 'user_hint',
          sceneContext: 'beauty product' // 应该添加场景上下文
        }
      },
      {
        name: '2. 用户描述产品 (高优先级)',
        payload: {
          sceneType: 'lifestyle-casual',
          image_input: base64Image,
          productTypeHint: 'auto',
          additionalContext: 'vintage leather handbag',
          quality: 'standard'
        },
        expected: {
          category: 'medium',
          confidence: 'high',
          source: 'user_input',
          sceneContext: null // 不应该添加，用户已提供描述
        }
      },
      {
        name: '3. 基于场景智能推断 (中等优先级)',
        payload: {
          sceneType: 'elegant-evening',
          image_input: base64Image,
          productTypeHint: 'auto',
          additionalContext: '', // 空上下文
          quality: 'standard'
        },
        expected: {
          category: 'small',
          confidence: 'medium',
          source: 'scene_inference',
          sceneContext: 'luxury item' // 应该添加场景上下文
        }
      },
      {
        name: '4. 街头风格场景 (中型产品推断)',
        payload: {
          sceneType: 'street-style',
          image_input: base64Image,
          productTypeHint: 'auto',
          additionalContext: '',
          quality: 'standard'
        },
        expected: {
          category: 'medium',
          confidence: 'medium',
          source: 'scene_inference',
          sceneContext: 'fashion item'
        }
      }
    ];

    console.log('🎯 Testing scenarios:\n');

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.name}`);
      console.log('📝 Payload:', {
        sceneType: testCase.payload.sceneType,
        productTypeHint: testCase.payload.productTypeHint,
        additionalContext: testCase.payload.additionalContext || '(empty)',
        hasImageInput: !!testCase.payload.image_input
      });

      console.log('🎯 Expected behavior:');
      console.log(`  - Size category: ${testCase.expected.category}`);
      console.log(`  - Confidence: ${testCase.expected.confidence}`);
      console.log(`  - Source: ${testCase.expected.source}`);
      console.log(`  - Scene context: ${testCase.expected.sceneContext || 'none'}`);

      console.log('  ⚠️ Note: Run with temporary auth bypass to test API calls');
    }

    console.log('\n\n🚀 Manual Testing Instructions:');
    console.log('1. Visit: http://localhost:3000/productshot');
    console.log('2. Upload: public/productshots/productshot44.png');
    console.log('3. Try different combinations:');
    console.log('   - Set Product Size to "Small" + any scene');
    console.log('   - Set Product Size to "Auto" + type "handbag" in context');
    console.log('   - Set Product Size to "Auto" + empty context + different scenes');
    console.log('4. Check server logs for detection details');

    console.log('\n📊 Expected Smart Behavior:');
    console.log('✅ User selection always wins (user_hint)');
    console.log('✅ User text descriptions detected (user_input)');
    console.log('✅ Scene-based inference when no user input (scene_inference)');
    console.log('✅ Automatic scene context added when appropriate');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSmartContext();

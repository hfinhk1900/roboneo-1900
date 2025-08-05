/**
 * 直接调用 OpenAI API 测试 gpt-image-1
 * 运行命令: npx tsx scripts/test-direct-openai-api.ts
 */

async function testDirectOpenAI() {
  console.log('🔧 直接调用 OpenAI API 测试 gpt-image-1...\n');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未配置');
    return;
  }

  console.log('🔑 API Key 已配置');

  // 测试用例
  const testCases = [
    {
      name: '验证 gpt-image-1 模型支持',
      endpoint: 'https://api.openai.com/v1/images/generations',
      payload: {
        model: 'gpt-image-1',
        prompt: 'cute cat sticker, simple style, white outline',
        n: 1,
        size: '1024x1024',
        quality: 'low',
        response_format: 'b64_json'
      }
    },
    {
      name: '备选测试 - DALL-E 3',
      endpoint: 'https://api.openai.com/v1/images/generations',
      payload: {
        model: 'dall-e-3',
        prompt: 'cute cat sticker, simple style, white outline',
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`模型: ${testCase.payload.model}`);
    console.log(`端点: ${testCase.endpoint}`);

    const startTime = Date.now();

    try {
      const response = await fetch(testCase.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload),
      });

      const elapsed = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 成功! 耗时: ${elapsed}ms`);
        console.log(`响应数据:`, {
          model: testCase.payload.model,
          hasData: Boolean(data.data?.length),
          imageCount: data.data?.length || 0,
          hasB64: Boolean(data.data?.[0]?.b64_json),
        });

        // 保存图片
        if (data.data?.[0]?.b64_json && process.env.SAVE_TEST_IMAGES === 'true') {
          const fs = await import('fs');
          const path = await import('path');

          const imageData = Buffer.from(data.data[0].b64_json, 'base64');
          const filename = `direct_api_${testCase.payload.model.replace('-', '_')}_${Date.now()}.png`;
          const filepath = path.join(process.cwd(), 'public', filename);

          fs.writeFileSync(filepath, imageData);
          console.log(`💾 已保存: public/${filename}`);
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ 失败 (${response.status}):`, errorData);

        // 尝试解析错误详情
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error?.code === 'model_not_found') {
            console.log(`🔍 模型 "${testCase.payload.model}" 不存在或不可用`);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (error) {
      console.log(`💥 请求异常:`, error instanceof Error ? error.message : error);
    }

    // 等待间隔
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📋 结论:');
  console.log('1. 如果 gpt-image-1 失败，说明模型名称不对或不可用');
  console.log('2. 如果 dall-e-3 成功，说明 API 配置正确');
  console.log('3. 可能需要使用不同的模型名称或等待模型发布');
}

// 运行测试
if (require.main === module) {
  testDirectOpenAI().catch(console.error);
}

export { testDirectOpenAI };

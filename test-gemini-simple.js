#!/usr/bin/env node

/**
 * 简单的Gemini API测试
 * 测试Google Gemini 2.5 thinking模式
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  // 检查API密钥
  if (!process.env.GOOGLE_API_KEY) {
    console.log('❌ 请先设置Google API密钥：');
    console.log('export GOOGLE_API_KEY="your-api-key-here"');
    console.log('\n获取API密钥：');
    console.log('1. 访问 https://aistudio.google.com/app/apikey');
    console.log('2. 创建新的API密钥');
    console.log('3. 复制密钥并设置环境变量');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // 使用Gemini 2.5 Flash模型
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
    });

    console.log('🤖 测试Gemini 2.5 Thinking模式...\n');

    const prompt = `
请帮我写一个简单的JavaScript函数，用于计算两个数的最大公约数。
要求：
1. 使用欧几里得算法
2. 包含错误处理
3. 添加注释说明
4. 提供使用示例

请直接提供代码，不需要额外解释。
`;

    console.log('📝 问题：计算最大公约数的JavaScript函数\n');
    console.log('🔄 正在思考中...\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('💡 回答：\n');
    console.log(text);
  } catch (error) {
    console.error('❌ 错误:', error.message);

    if (error.message.includes('API_KEY')) {
      console.log('\n🔑 API密钥问题，请检查：');
      console.log('1. 密钥是否正确设置');
      console.log('2. 密钥是否有效');
      console.log('3. 是否启用了Generative AI API');
    }
  }
}

// 运行测试
testGemini();

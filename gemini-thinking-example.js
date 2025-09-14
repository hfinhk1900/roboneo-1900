#!/usr/bin/env node

/**
 * Google Gemini 2.5 Thinking Mode Programming Example
 * 使用Google Gemini 2.5 thinking模式进行编程
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// 配置Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function runGeminiThinking() {
  try {
    // 获取Gemini 2.5 Flash模型（支持thinking模式）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    console.log('🤖 启动Gemini 2.5 Thinking模式...\n');

    // 编程任务示例
    const programmingTask = `
请帮我解决这个编程问题：

任务：创建一个React组件，用于显示用户列表，包含以下功能：
1. 从API获取用户数据
2. 显示用户头像、姓名、邮箱
3. 支持搜索和过滤
4. 响应式设计
5. 加载状态和错误处理

请提供完整的代码实现，包括：
- React组件代码
- TypeScript类型定义
- 样式文件
- 使用说明

要求使用现代React最佳实践。
`;

    console.log('📝 编程任务：');
    console.log(programmingTask);
    console.log('\n🔄 正在思考中...\n');

    // 调用Gemini thinking模式
    const result = await model.generateContent(programmingTask);
    const response = await result.response;
    const text = response.text();

    console.log('💡 Gemini思考结果：\n');
    console.log('=' * 50);
    console.log(text);
    console.log('=' * 50);
  } catch (error) {
    console.error('❌ 错误:', error.message);

    if (error.message.includes('API_KEY')) {
      console.log('\n🔑 请设置Google API密钥：');
      console.log('export GOOGLE_API_KEY="your-api-key-here"');
    }
  }
}

// 运行示例
if (require.main === module) {
  runGeminiThinking();
}

module.exports = { runGeminiThinking };


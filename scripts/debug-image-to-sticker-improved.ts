import path from 'path';
import fs from 'fs/promises';

// --- 配置 ---
const API_URL = 'http://localhost:3000/api/image-to-sticker-improved';
// 您可以更改为任何您想测试的本地图片路径
const TEST_IMAGE_PATH = path.resolve(process.cwd(), 'public/test-img.png');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/debug-output');
// ---

/**
 * 运行一次API测试
 * @param style 要测试的贴纸风格
 */
async function runTest(style: string) {
  console.log(`\n🚀 开始测试风格: ${style}`);
  console.log(`📸 使用图片: ${path.basename(TEST_IMAGE_PATH)}`);
  console.log(`📡 调用API: ${API_URL}`);

  try {
    // 确保输出目录存在
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 读取图片文件
    const imageBuffer = await fs.readFile(TEST_IMAGE_PATH);
    const imageFile = new File([imageBuffer], path.basename(TEST_IMAGE_PATH), {
      type: 'image/png',
    });

    // 构建 FormData
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    formData.append('style', style);

    console.log('⏳ 正在发送请求，请稍候...');
    const startTime = Date.now();

    // 发送请求
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`⏱️  请求耗时: ${duration.toFixed(2)}s`);

    // 解析响应
    const responseData = await response.json();

    if (!response.ok) {
      console.error(`❌ 测试失败 (状态码: ${response.status})`);
      console.error('错误响应:', responseData);
      return;
    }

    console.log('✅ 测试成功!');

    // 打印关键分析信息
    if (responseData.analysis) {
      console.log('--- 🤖 AI 分析 ---');
      console.log(`🎨 应用风格: ${responseData.analysis.styleApplied}`);
      console.log(
        `📝 优化后提示词: "${responseData.analysis.optimizedPrompt}"`
      );
      console.log('--------------------');
    }

    // 保存结果图片
    if (responseData.stickerUrl) {
      const base64Data = responseData.stickerUrl.split(',')[1];
      const outputFileName = `debug_${style}_${Date.now()}.png`;
      const outputFilePath = path.join(OUTPUT_DIR, outputFileName);
      await fs.writeFile(outputFilePath, base64Data, 'base64');
      console.log(`🖼️  输出图片已保存到: ${outputFilePath}`);
    }
  } catch (error) {
    console.error(`❌ 测试过程中发生意外错误:`, error);
  }
}

/**
 * 主函数
 */
async function main() {
  const supportedStyles = ['ios', 'pixel', 'lego', 'snoopy'];
  const styleToTest = process.argv[2]; // 从命令行读取第一个参数作为style

  if (!styleToTest) {
    console.log('👋 欢迎使用 API 调试脚本');
    console.log('请提供一个要测试的风格。');
    console.log(
      `用法: pnpm tsx scripts/debug-image-to-sticker-improved.ts <style>`
    );
    console.log(`可用风格: ${supportedStyles.join(', ')}`);
    return;
  }

  if (!supportedStyles.includes(styleToTest)) {
    console.error(`❌ 无效的风格 "${styleToTest}"`);
    console.error(`可用风格: ${supportedStyles.join(', ')}`);
    return;
  }

  await runTest(styleToTest);
}

main();

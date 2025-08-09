import path from 'path';
import fs from 'fs/promises';

// --- 配置 ---
const API_URL = 'http://localhost:3000/api/image-to-sticker';
const TEST_IMAGE_PATH = path.resolve(process.cwd(), 'public/test-img2.png');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/debug-output');
const SUPPORTED_STYLES = ['ios', 'lego', 'pixel', 'snoopy'] as const;
type StickerStyle = (typeof SUPPORTED_STYLES)[number];
// ---

/**
 * 运行一次API测试
 * @param style 要测试的贴纸风格
 */
async function runTest(style: StickerStyle) {
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

    console.log('⏳ 正在生成贴纸，请稍候...');
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`⏱️ API 响应耗时: ${elapsed.toFixed(2)} 秒`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 测试失败 (状态码: ${response.status})`);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('错误响应:', JSON.stringify(errorJson, null, 2));
      } catch {
        console.error('错误响应 (非 JSON):', errorText);
      }
      return;
    }

    const result = await response.json();
    console.log('✅ 测试成功!');

    if (result.stickerUrl) {
      console.log(`🖼️  图片已上传到 R2!`);
      console.log(`🔗 URL: ${result.stickerUrl}`);
    } else {
      console.warn('⚠️ API 响应中未找到 stickerUrl');
      console.log('完整响应:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ 脚本执行异常:', error);
  }
}

/**
 * 主函数，解析命令行参数并执行测试
 */
async function main() {
  const style = process.argv[2] as StickerStyle;

  if (!style) {
    console.error('❌ 请提供一个要测试的风格作为参数。');
    console.error(`用法: pnpm tsx scripts/test-sticker-style.ts [style]`);
    console.error(`支持的风格: ${SUPPORTED_STYLES.join(', ')}`);
    process.exit(1);
  }

  if (!SUPPORTED_STYLES.includes(style)) {
    console.error(`❌ 无效的风格: "${style}"`);
    console.error(`支持的风格: ${SUPPORTED_STYLES.join(', ')}`);
    process.exit(1);
  }

  console.log(`--- 开始测试单个贴纸风格: ${style} ---`);
  await runTest(style);
  console.log(`\n--- 测试完成: ${style} ---`);
}

main().catch((err) => {
  console.error('测试脚本发生致命错误:', err);
  process.exit(1);
});

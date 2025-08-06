/**
 * 文件验证功能测试脚本
 * 测试 OpenAI API 图片验证的各种场景
 * 运行命令: npx tsx scripts/test-file-validation.ts
 */

import fs from 'fs';
import path from 'path';
import { validateImageFile, OPENAI_IMAGE_CONFIG, getFileSizeDisplay } from '../src/lib/image-validation';

// 模拟 File 对象 (Node.js 环境)
class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = Date.now();
  }
}

// 测试用例定义
interface TestCase {
  name: string;
  file: MockFile;
  expectedValid: boolean;
  expectedError?: string;
}

// 创建测试用例
const testCases: TestCase[] = [
  // ✅ 正常测试用例
  {
    name: "正常 JPEG 文件 (2MB)",
    file: new MockFile("test.jpg", 2 * 1024 * 1024, "image/jpeg"),
    expectedValid: true
  },
  {
    name: "正常 PNG 文件 (1MB)",
    file: new MockFile("test.png", 1 * 1024 * 1024, "image/png"),
    expectedValid: true
  },
  {
    name: "正常 WebP 文件 (3MB)",
    file: new MockFile("test.webp", 3 * 1024 * 1024, "image/webp"),
    expectedValid: true
  },
  {
    name: "边界值测试 - 刚好4MB",
    file: new MockFile("boundary.jpg", 4 * 1024 * 1024, "image/jpeg"),
    expectedValid: true
  },

  // ❌ 文件大小错误测试用例
  {
    name: "文件过大 (5MB)",
    file: new MockFile("large.jpg", 5 * 1024 * 1024, "image/jpeg"),
    expectedValid: false,
    expectedError: "File size exceeds the 4MB limit"
  },
  {
    name: "文件过大 (10MB)",
    file: new MockFile("huge.png", 10 * 1024 * 1024, "image/png"),
    expectedValid: false,
    expectedError: "File size exceeds the 4MB limit"
  },
  {
    name: "文件过小 (500 bytes)",
    file: new MockFile("tiny.jpg", 500, "image/jpeg"),
    expectedValid: false,
    expectedError: "File is too small"
  },

  // ❌ 文件格式错误测试用例
  {
    name: "不支持的格式 - GIF",
    file: new MockFile("animated.gif", 1 * 1024 * 1024, "image/gif"),
    expectedValid: false,
    expectedError: "File type not supported"
  },
  {
    name: "不支持的格式 - BMP",
    file: new MockFile("bitmap.bmp", 1 * 1024 * 1024, "image/bmp"),
    expectedValid: false,
    expectedError: "File type not supported"
  },
  {
    name: "不支持的格式 - SVG",
    file: new MockFile("vector.svg", 1 * 1024 * 1024, "image/svg+xml"),
    expectedValid: false,
    expectedError: "File type not supported"
  },
  {
    name: "非图片文件 - PDF",
    file: new MockFile("document.pdf", 1 * 1024 * 1024, "application/pdf"),
    expectedValid: false,
    expectedError: "File type not supported"
  },
  {
    name: "非图片文件 - 文本",
    file: new MockFile("text.txt", 1 * 1024 * 1024, "text/plain"),
    expectedValid: false,
    expectedError: "File type not supported"
  }
];

// 运行测试
async function runTests() {
  console.log('🧪 开始文件验证测试...\n');
  console.log('📋 OpenAI API 配置:');
  console.log(`   最大文件大小: ${getFileSizeDisplay(OPENAI_IMAGE_CONFIG.maxFileSize)}`);
  console.log(`   支持格式: ${OPENAI_IMAGE_CONFIG.allowedFileTypes.join(', ')}`);
  console.log(`   最大尺寸: ${OPENAI_IMAGE_CONFIG.maxDimensions.width}x${OPENAI_IMAGE_CONFIG.maxDimensions.height}px`);
  console.log(`   最小尺寸: ${OPENAI_IMAGE_CONFIG.minDimensions.width}x${OPENAI_IMAGE_CONFIG.minDimensions.height}px\n`);

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    try {
      const result = validateImageFile(testCase.file as any);

      // 检查验证结果是否符合预期
      if (result.isValid === testCase.expectedValid) {
        if (!testCase.expectedValid && testCase.expectedError) {
          // 检查错误信息是否包含预期的关键词
          if (result.error && result.error.includes(testCase.expectedError.split(' ')[0])) {
            console.log(`✅ ${testCase.name}`);
            console.log(`   预期: 失败 (${testCase.expectedError})`);
            console.log(`   实际: 失败 (${result.error})`);
            passedTests++;
          } else {
            console.log(`❌ ${testCase.name}`);
            console.log(`   预期错误: ${testCase.expectedError}`);
            console.log(`   实际错误: ${result.error || 'None'}`);
            failedTests++;
          }
        } else {
          console.log(`✅ ${testCase.name}`);
          console.log(`   预期: ${testCase.expectedValid ? '通过' : '失败'}`);
          console.log(`   实际: ${result.isValid ? '通过' : '失败'}`);
          passedTests++;
        }
      } else {
        console.log(`❌ ${testCase.name}`);
        console.log(`   预期: ${testCase.expectedValid ? '通过' : '失败'}`);
        console.log(`   实际: ${result.isValid ? '通过' : '失败'}`);
        console.log(`   错误: ${result.error || 'None'}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`💥 ${testCase.name}`);
      console.log(`   异常: ${error}`);
      failedTests++;
    }
    console.log('');
  }

  // 输出测试结果
  console.log('📊 测试结果汇总:');
  console.log(`   总测试数: ${testCases.length}`);
  console.log(`   通过: ${passedTests} ✅`);
  console.log(`   失败: ${failedTests} ❌`);
  console.log(`   成功率: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！文件验证功能正常工作。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查验证逻辑。');
  }
}

// API 端点测试
async function testApiEndpoint() {
  console.log('\n🌐 测试 API 端点...');

  try {
    // 测试 GET 请求 (获取 API 信息)
    const response = await fetch('http://localhost:3000/api/image-to-sticker');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API 端点可访问');
      console.log(`   版本: ${data.version || 'Unknown'}`);
      console.log(`   名称: ${data.name || 'Unknown'}`);
    } else {
      console.log(`❌ API 端点访问失败: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ API 端点测试失败: ${error}`);
    console.log('   提示: 请确保开发服务器在 http://localhost:3000 运行');
  }
}

// 创建测试图片文件
async function createTestImages() {
  console.log('\n📁 创建测试图片文件...');

  const testDir = path.join(process.cwd(), 'test-images');

  try {
    // 创建测试目录
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }

    // 检查是否有现有的测试图片
    const existingImages = fs.readdirSync(testDir).filter(file =>
      file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp')
    );

    if (existingImages.length > 0) {
      console.log(`✅ 找到 ${existingImages.length} 个测试图片:`);
      existingImages.forEach(file => {
        const filePath = path.join(testDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${file} (${getFileSizeDisplay(stats.size)})`);
      });
    } else {
      console.log('⚠️  没有找到测试图片文件');
      console.log('   建议: 在 test-images/ 目录下放置一些测试图片');
    }

    return { testDir, existingImages };
  } catch (error) {
    console.log(`❌ 创建测试目录失败: ${error}`);
    return { testDir: null, existingImages: [] };
  }
}

// 主函数
async function main() {
  console.log('🚀 开始文件验证功能全面测试\n');

  // 1. 运行单元测试
  await runTests();

  // 2. 创建并检查测试图片
  const { testDir, existingImages } = await createTestImages();

  // 3. 测试 API 端点
  await testApiEndpoint();

  // 4. 提供使用建议
  console.log('\n💡 使用建议:');
  console.log('1. 确保开发服务器正在运行: npm run dev');
  console.log('2. 在浏览器中打开 http://localhost:3000 测试前端验证');
  console.log('3. 测试文件上传功能:');
  console.log('   • 点击上传：点击上传区域选择文件');
  console.log('   • 拖拽上传：将文件拖拽到上传区域');
  console.log('   • 格式测试：尝试上传 JPEG/PNG/WebP/GIF 等格式');
  console.log('   • 大小测试：尝试上传不同大小的文件 (建议测试 <4MB 和 >4MB)');
  console.log('4. 查看浏览器控制台和网络面板的错误信息');

  if (existingImages.length > 0) {
    console.log('5. 可以使用 test-images/ 目录下的图片进行测试');
  }

  console.log('\n✨ 测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

export { runTests, testApiEndpoint, createTestImages };

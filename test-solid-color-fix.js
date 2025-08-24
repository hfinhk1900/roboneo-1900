#!/usr/bin/env node

/**
 * 测试 Solid Color 模式按钮修复
 * 验证上传图片后选择 Solid Color 模式时按钮是否可用
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试 Solid Color 模式按钮修复');
console.log('=====================================');

// 检查测试图片是否存在
const testImagePath = path.join(__dirname, 'public/aibg/aibg-test.jpg');
if (!fs.existsSync(testImagePath)) {
  console.log('⚠️  测试图片不存在，请确保 public/aibg/aibg-test.jpg 存在');
  console.log('   或者使用其他图片进行测试');
} else {
  console.log('✅ 测试图片存在:', testImagePath);
}

console.log('\n📋 测试步骤:');
console.log('1. 访问 http://localhost:3000/aibackground');
console.log('2. 上传图片 (public/aibg/aibg-test.jpg 或其他图片)');
console.log('3. 选择 "Solid Color" 模式');
console.log('4. 检查 "Process Image" 按钮是否可用 (不应该被禁用)');
console.log('5. 点击按钮测试本地推理功能');

console.log('\n🔍 预期结果:');
console.log('✅ 上传图片后，Solid Color 模式下的按钮应该可用');
console.log('✅ 点击按钮后应该开始本地推理');
console.log(
  '✅ 不应该出现 "Invalid base URL" 或 "Resource metadata not found" 错误'
);

console.log('\n🚨 如果按钮仍然被禁用:');
console.log('- 检查浏览器控制台是否有错误');
console.log('- 确认 backgroundMode 设置为 "color"');
console.log('- 确认 uploadedImage 不为空');

console.log('\n🌐 浏览器兼容性检查:');
console.log('- 确保浏览器支持 WebGL 和 WebAssembly');
console.log('- 推荐使用 Chrome、Firefox 或 Safari 最新版本');

console.log('\n📝 调试信息:');
console.log('- 打开浏览器开发者工具');
console.log('- 查看 Console 标签页的日志输出');
console.log('- 查看 Network 标签页的请求情况');

console.log('\n🎯 开始测试...');
console.log('请按照上述步骤在浏览器中测试功能');

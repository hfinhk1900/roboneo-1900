#!/usr/bin/env node

/**
 * 测试改进的去背景功能
 * 验证智能边缘检测和背景移除
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试改进的去背景功能');
console.log('============================');

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
console.log('4. 点击 "Process Image" 按钮');
console.log('5. 观察改进的去背景处理过程');

console.log('\n🔍 预期结果:');
console.log('✅ 智能检测图片边缘的背景色');
console.log('✅ 自动调整阈值进行更精确的匹配');
console.log('✅ 考虑颜色相似度和亮度差异');
console.log('✅ 在控制台显示检测结果信息');

console.log('\n🎯 改进功能:');
console.log('- 边缘颜色检测算法');
console.log('- 自适应阈值调整 (50)');
console.log('- 亮度差异计算');
console.log('- 实时调试信息输出');

console.log('\n⚙️  新配置参数:');
console.log('- threshold: 50 (更宽松的匹配)');
console.log('- 自动边缘背景色检测');
console.log('- 亮度差异阈值');
console.log('- 智能颜色相似度计算');

console.log('\n🔧 技术改进:');
console.log('- 采样图片边缘像素');
console.log('- 统计最常见的边缘颜色');
console.log('- 使用检测到的颜色作为背景色');
console.log('- 结合颜色和亮度进行判断');

console.log('\n📝 调试信息:');
console.log('- 打开浏览器开发者工具');
console.log('- 查看 Console 标签页');
console.log('- 寻找 "🎨 背景检测结果:" 日志');
console.log('- 观察检测到的背景色信息');

console.log('\n🚨 使用建议:');
console.log('- 适合有纯色背景的图片');
console.log('- 背景色应该在图片边缘');
console.log('- 主体与背景对比度越高效果越好');
console.log('- 可以尝试不同的图片进行测试');

console.log('\n🎯 开始测试...');
console.log('请按照上述步骤在浏览器中测试功能');
console.log('注意观察控制台的调试信息！');

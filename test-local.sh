#!/bin/bash

# 本地测试启动脚本
# 用于快速启动优化后的 KIE AI API 测试

echo "🚀 启动本地测试环境..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env.local ]; then
    echo "❌ 未找到 .env.local 文件"
    echo "请创建 .env.local 文件并配置必要的环境变量"
    exit 1
fi

# 检查模拟模式设置
if grep -q "MOCK_KIE_API=true" .env.local; then
    echo "✅ 模拟模式已启用 (MOCK_KIE_API=true)"
    echo "   - 不需要真实 KIE API Key"
    echo "   - 不消耗 Credits"
    echo "   - 返回占位图片"
else
    echo "⚠️  生产模式已启用 (MOCK_KIE_API=false)"
    echo "   - 需要真实 KIE API Key"
    echo "   - 会消耗 Credits"
    echo "   - 返回真实 AI 图片"
fi

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "🌐 启动开发服务器..."
echo ""
echo "========================================="
echo "📍 访问地址: http://localhost:3000"
echo "📍 测试页面: http://localhost:3000/test-sticker (如果创建了专用测试页)"
echo "========================================="
echo ""
echo "📝 测试步骤："
echo "1. 使用 Google 账号登录"
echo "2. 在首页 Hero 部分找到 AI 贴纸生成器"
echo "3. 选择风格并输入提示词"
echo "4. 点击生成并观察进度"
echo ""
echo "🔍 调试提示："
echo "- 按 F12 打开开发者工具查看网络请求"
echo "- 查看 Console 标签中的日志"
echo "- 观察轮询请求 (GET /api/image-to-sticker-optimized)"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev

#!/bin/bash

# 增加文件描述符限制（针对 macOS EMFILE 错误）
ulimit -n 65536

# 设置环境变量禁用文件监视，使用轮询模式
export CHOKIDAR_USEPOLLING=true
export CHOKIDAR_INTERVAL=1000
export WATCHPACK_POLLING=true

# 允许 Next.js 字体加载失败后继续运行
export NEXT_FONT_GOOGLE_MOCKED_RESPONSES='[{"url":"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap","data":""}]'

# 启动开发服务器
echo "🚀 Starting Next.js development server with increased file limits..."
echo "📊 File descriptor limit: $(ulimit -n)"
echo "🌐 Network: Allowing Google Fonts fallback"
echo ""

pnpm dev


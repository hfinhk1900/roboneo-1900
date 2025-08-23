

#!/bin/bash

# 设置去背景服务环境

echo "🚀 开始安装去背景服务..."

# 检查 Python 是否已安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装 Python 3"
    exit 1
fi

# 创建虚拟环境
echo "📦 创建虚拟环境..."
python3 -m venv bg_removal_env

# 激活虚拟环境
echo "⚡ 激活虚拟环境..."
source bg_removal_env/bin/activate

# 安装依赖
echo "📋 安装依赖包..."
pip install -r scripts/requirements-bg-removal.txt

echo "✅ 去背景服务安装完成！"
echo ""
echo "使用方法："
echo "1. 激活环境: source bg_removal_env/bin/activate"
echo "2. 运行服务: python background_removal_service.py -i input.jpg -o output.png"
echo "3. 退出环境: deactivate"

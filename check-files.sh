#!/bin/bash
echo "🔍 检查测试图片文件..."
echo "📂 当前目录: $(pwd)"
echo ""

if [[ -f "stand.png" ]]; then
    echo "✅ stand.png 存在 ($(ls -lh stand.png | awk '{print $5}'))"
else
    echo "❌ stand.png 不存在"
fi

if [[ -f "productshot2.jpg" ]]; then
    echo "✅ productshot2.jpg 存在 ($(ls -lh productshot2.jpg | awk '{print $5}'))"
else
    echo "❌ productshot2.jpg 不存在"
fi

echo ""
if [[ -f "stand.png" && -f "productshot2.jpg" ]]; then
    echo "🎉 所有测试图片已准备完毕！"
    echo "💡 现在可以运行: source .env && node test-dual-image-support.js stand.png productshot2.jpg"
else
    echo "⚠️ 请确保两张图片都保存到项目根目录"
fi

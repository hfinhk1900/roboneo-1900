#!/bin/bash

echo "🚀 开始 AI 图像生成测试（允许长时间处理）"
echo "⏱️  最大等待时间: 120 秒"
echo "📁 测试图片: public/blocks/exercice.png (14KB)"
echo ""

# 显示开始时间
start_time=$(date +%s)
echo "🕐 开始时间: $(date)"
echo ""

# 显示进度指示器的函数
show_progress() {
    local pid=$1
    local delay=5
    local dots=""

    while kill -0 $pid 2>/dev/null; do
        dots="$dots."
        elapsed=$(($(date +%s) - start_time))
        echo -ne "\r⏳ 处理中${dots} (已等待 ${elapsed}s)"
        sleep $delay
        if [ ${#dots} -gt 10 ]; then
            dots=""
        fi
    done
    echo ""
}

echo "📤 发送请求到 image-to-sticker API..."

# 在后台执行 curl 请求
curl -X POST http://localhost:3000/api/image-to-sticker \
  -F "imageFile=@public/blocks/exercice.png" \
  -F "style=ios" \
  --max-time 120 \
  -w "\n📊 HTTP状态码: %{http_code}\n⏱️  总时间: %{time_total}s\n📡 连接时间: %{time_connect}s\n" \
  -s > /tmp/api_response.json &

# 获取 curl 进程 ID
curl_pid=$!

# 显示进度
show_progress $curl_pid

# 等待 curl 完成
wait $curl_pid
curl_exit_code=$?

# 显示结果
echo ""
echo "🏁 请求完成！"
echo "📋 退出码: $curl_exit_code"

if [ $curl_exit_code -eq 0 ]; then
    echo "✅ 请求成功完成"
    echo ""
    echo "📊 API 响应:"
    cat /tmp/api_response.json | jq . 2>/dev/null || cat /tmp/api_response.json
elif [ $curl_exit_code -eq 28 ]; then
    echo "⏰ 请求超时 (120s)"
    echo "💡 AI 图像生成可能需要更长时间，请检查服务器日志"
else
    echo "❌ 请求失败"
    echo "📊 响应内容:"
    cat /tmp/api_response.json
fi

echo ""
end_time=$(date +%s)
total_time=$((end_time - start_time))
echo "🕐 结束时间: $(date)"
echo "⏱️  总耗时: ${total_time}s"

# 清理临时文件
rm -f /tmp/api_response.json

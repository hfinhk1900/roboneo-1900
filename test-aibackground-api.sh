#!/bin/bash

# AI Background API 测试脚本
# 测试内容：使用 aibg-test2.png 图片，选择第二个场景 (texture-fabric)

# 配置项
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/aibackground/generate"
TEST_IMAGE="public/aibg/aibg-test2.png"
BACKGROUND_TYPE="texture-fabric"  # 第二个场景：织物纹理

echo "🎨 AI Background API 测试脚本"
echo "================================"
echo "测试图片: $TEST_IMAGE"
echo "选择场景: $BACKGROUND_TYPE (织物纹理)"
echo "API 端点: $BASE_URL$API_ENDPOINT"
echo ""

# 检查图片文件是否存在
if [ ! -f "$TEST_IMAGE" ]; then
    echo "❌ 错误: 测试图片 '$TEST_IMAGE' 不存在"
    echo "请确保图片文件存在于正确路径"
    exit 1
fi

echo "✅ 测试图片检查通过"

# 检查必要的命令是否存在
if ! command -v base64 &> /dev/null; then
    echo "❌ 错误: 需要 base64 命令但未找到"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ 错误: 需要 curl 命令但未找到"
    exit 1
fi

echo "✅ 系统命令检查通过"

# 将图片转换为 Base64
echo ""
echo "🔄 正在将图片转换为 Base64..."
IMAGE_BASE64=$(base64 "$TEST_IMAGE" | tr -d '\n')

if [ -z "$IMAGE_BASE64" ]; then
    echo "❌ 错误: 图片转换失败"
    exit 1
fi

echo "✅ 图片转换完成 (${#IMAGE_BASE64} 字符)"

# 提示用户输入认证信息
echo ""
echo "🔐 认证信息"
echo "请从浏览器获取认证信息："
echo "1. 访问 $BASE_URL 并登录"
echo "2. 打开开发者工具 (F12)"
echo "3. 在 Application/Storage 标签页中找到 Cookies"
echo "4. 复制 'better-auth.session_token' 的值"
echo ""

read -p "请输入 Session Token: " SESSION_TOKEN

if [ -z "$SESSION_TOKEN" ]; then
    echo "❌ 错误: Session Token 不能为空"
    exit 1
fi

echo "✅ Session Token 已输入"

# 构建请求数据
echo ""
echo "📤 准备 API 请求..."

JSON_PAYLOAD=$(cat <<EOF
{
  "image_input": "data:image/png;base64,${IMAGE_BASE64}",
  "backgroundMode": "background",
  "backgroundType": "${BACKGROUND_TYPE}",
  "quality": "standard",
  "steps": 30,
  "output_format": "png"
}
EOF
)

echo "请求参数:"
echo "- 背景模式: background (AI 生成背景)"
echo "- 背景类型: $BACKGROUND_TYPE"
echo "- 质量: standard"
echo "- 步数: 30"
echo "- 输出格式: png"

# 发送 API 请求
echo ""
echo "🚀 正在发送 API 请求..."
echo "请稍候，这可能需要几秒钟..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s" \
    -X POST "$BASE_URL$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
    -d "$JSON_PAYLOAD")

# 解析响应
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_TIME=$(echo "$RESPONSE" | grep "TIME:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:" | grep -v "TIME:")

echo ""
echo "📥 API 响应"
echo "================================"
echo "HTTP 状态码: $HTTP_STATUS"
echo "响应时间: ${RESPONSE_TIME}秒"

# 检查响应状态
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 请求成功"

    # 尝试使用 jq 美化输出
    if command -v jq &> /dev/null; then
        echo ""
        echo "响应内容 (美化):"
        echo "$RESPONSE_BODY" | jq .
    else
        echo ""
        echo "响应内容 (原始):"
        echo "$RESPONSE_BODY"
        echo ""
        echo "💡 提示: 安装 jq 可以获得更好的输出格式"
        echo "   macOS: brew install jq"
        echo "   Ubuntu: sudo apt install jq"
    fi

    # 提取结果 URL
    if command -v jq &> /dev/null; then
        RESULT_URL=$(echo "$RESPONSE_BODY" | jq -r '.resultUrl // empty')
        if [ -n "$RESULT_URL" ] && [ "$RESULT_URL" != "null" ]; then
            echo ""
            echo "🎉 生成成功!"
            echo "结果图片 URL: $RESULT_URL"
        fi
    fi

elif [ "$HTTP_STATUS" = "401" ]; then
    echo "❌ 认证失败 (401 Unauthorized)"
    echo "请检查 Session Token 是否正确"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"

elif [ "$HTTP_STATUS" = "402" ]; then
    echo "❌ 积分不足 (402 Payment Required)"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"

elif [ "$HTTP_STATUS" = "400" ]; then
    echo "❌ 请求参数错误 (400 Bad Request)"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"

elif [ "$HTTP_STATUS" = "503" ]; then
    echo "❌ 服务不可用 (503 Service Unavailable)"
    echo "AI 服务可能暂时不可用，请稍后重试"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"

else
    echo "❌ 请求失败 (HTTP $HTTP_STATUS)"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "================================"
echo "测试完成"
echo ""
echo "💡 故障排除提示:"
echo "- 确保应用正在运行 (npm run dev 或 pnpm dev)"
echo "- 检查 Session Token 是否有效"
echo "- 确认网络连接正常"
echo "- 查看应用日志获取更多信息"

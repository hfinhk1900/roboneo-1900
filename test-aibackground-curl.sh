#!/bin/bash

# AI Background API Curl 测试脚本
# 使用 curl 命令测试 AI Background API

# 配置
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/aibackground/generate"
TEST_IMAGE_PATH="/Users/hf/Desktop/Web Template/Products/roboneo art/public/aibg/aibg-test.jpg"

# 颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 AI Background API Curl 测试开始"
echo "📍 API URL: $BASE_URL$API_ENDPOINT"
echo "🖼️  测试图片: $TEST_IMAGE_PATH"

# 检查测试图片是否存在
if [ ! -f "$TEST_IMAGE_PATH" ]; then
    echo -e "${RED}❌ 测试图片不存在: $TEST_IMAGE_PATH${NC}"
    exit 1
fi

# 检查是否有 base64 命令
if ! command -v base64 &> /dev/null; then
    echo -e "${RED}❌ base64 命令不可用${NC}"
    exit 1
fi

# 将图片转换为 base64
echo "🔄 正在将图片转换为 base64..."
IMAGE_BASE64="data:image/jpeg;base64,$(base64 -i "$TEST_IMAGE_PATH")"
echo "✅ 图片转换完成 (长度: ${#IMAGE_BASE64} 字符)"

# 你需要先获取有效的 session token
echo -e "${YELLOW}⚠️  请先配置认证信息:${NC}"
echo "1. 在浏览器中登录你的应用"
echo "2. 打开开发者工具 -> Application -> Cookies"
echo "3. 复制 better-auth.session_token 的值"
echo "4. 将下面的 YOUR_SESSION_TOKEN_HERE 替换为实际值"
echo ""

# Session Token - 请替换为实际值
SESSION_TOKEN="YOUR_SESSION_TOKEN_HERE"

if [ "$SESSION_TOKEN" = "YOUR_SESSION_TOKEN_HERE" ]; then
    echo -e "${YELLOW}⚠️  警告: 请先配置 SESSION_TOKEN${NC}"
fi

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE} 测试 1: 获取可用背景样式${NC}"
echo -e "${BLUE}===================================${NC}"

curl -X GET \
  "$BASE_URL$API_ENDPOINT" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE} 测试 2: 纯色背景 (红色)${NC}"
echo -e "${BLUE}===================================${NC}"

curl -X POST \
  "$BASE_URL$API_ENDPOINT" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image_input\": \"$IMAGE_BASE64\",
    \"backgroundMode\": \"color\",
    \"backgroundColor\": \"#E25241\",
    \"quality\": \"standard\",
    \"steps\": 20,
    \"size\": \"1024x1024\",
    \"output_format\": \"png\"
  }" \
  -w "\n状态码: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE} 测试 3: 第一个AI背景样式${NC}"
echo -e "${BLUE}===================================${NC}"

curl -X POST \
  "$BASE_URL$API_ENDPOINT" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image_input\": \"$IMAGE_BASE64\",
    \"backgroundMode\": \"background\",
    \"backgroundType\": \"gradient-abstract\",
    \"quality\": \"standard\",
    \"steps\": 25,
    \"size\": \"1024x1024\",
    \"output_format\": \"png\"
  }" \
  -w "\n状态码: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE} 测试 4: 自定义背景样式${NC}"
echo -e "${BLUE}===================================${NC}"

curl -X POST \
  "$BASE_URL$API_ENDPOINT" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image_input\": \"$IMAGE_BASE64\",
    \"backgroundMode\": \"background\",
    \"backgroundType\": \"custom\",
    \"customBackgroundDescription\": \"beautiful sunset beach scene with palm trees, tropical paradise background, warm golden hour lighting\",
    \"quality\": \"standard\",
    \"steps\": 30,
    \"size\": \"1024x1024\",
    \"output_format\": \"png\"
  }" \
  -w "\n状态码: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE} 测试 5: 透明背景${NC}"
echo -e "${BLUE}===================================${NC}"

curl -X POST \
  "$BASE_URL$API_ENDPOINT" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"image_input\": \"$IMAGE_BASE64\",
    \"backgroundMode\": \"color\",
    \"backgroundColor\": \"transparent\",
    \"quality\": \"standard\",
    \"steps\": 20,
    \"size\": \"1024x1024\",
    \"output_format\": \"png\"
  }" \
  -w "\n状态码: %{http_code}\n" \
  | jq '.' 2>/dev/null || cat

echo -e "\n${GREEN}🏁 测试完成${NC}"
echo ""
echo -e "${YELLOW}💡 使用说明:${NC}"
echo "1. 请先启动开发服务器: npm run dev"
echo "2. 配置有效的 SESSION_TOKEN (从浏览器开发者工具获取)"
echo "3. 确保有足够的 Credits"
echo "4. 生成的图片会保存在 R2 存储的 aibackgrounds 文件夹中"

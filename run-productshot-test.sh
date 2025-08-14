#!/bin/bash

# ProductShot API 测试脚本 - 简化版
echo "🚀 ProductShot API Test - Simplified Version"
echo "============================================="

# 检查是否提供了session token
if [ -z "$1" ]; then
  echo "❌ Error: Session token required"
  echo ""
  echo "📋 Usage: ./run-productshot-test.sh YOUR_SESSION_TOKEN"
  echo ""
  echo "🔑 To get your session token:"
  echo "   1. Open http://localhost:3000 in browser"
  echo "   2. Login to your account"
  echo "   3. Open Dev Tools (F12)"
  echo "   4. Go to Application > Cookies"
  echo "   5. Copy 'better-auth.session_token' value"
  echo ""
  exit 1
fi

SESSION_TOKEN="$1"
echo "✅ Session token provided: ${SESSION_TOKEN:0:20}..."

# 检查输入图片
IMAGE_PATH="public/productshots/productshot44.png"
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Error: Input image not found"
  exit 1
fi

echo "✅ Input image found: $IMAGE_PATH"

# 转换图片为base64
echo "🔄 Converting image to base64..."
IMAGE_BASE64=$(base64 -i "$IMAGE_PATH")

# 发送API请求
echo "🌐 Sending ProductShot generation request..."
echo "📋 Product: Professional smartphone case with elegant design"
echo "🎬 Scene: Professional Model"

RESPONSE=$(curl -s -X POST "http://localhost:3000/api/productshot/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -d "{
    \"productDescription\": \"Professional smartphone case with elegant design\",
    \"sceneType\": \"studio-model\",
    \"quality\": \"standard\",
    \"image_input\": \"$IMAGE_BASE64\",
    \"size\": \"1024x1024\",
    \"output_format\": \"png\"
  }" \
  -w "\nHTTP_STATUS:%{http_code}")

# 解析响应
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo ""
echo "📊 Results:"
echo "   Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! ProductShot generated successfully!"
  echo ""
  echo "📄 Full Response:"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

  # 提取结果URL
  RESULT_URL=$(echo "$RESPONSE_BODY" | grep -o '"resultUrl":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$RESULT_URL" ]; then
    echo ""
    echo "🖼️  Generated Image URL: $RESULT_URL"
    echo "💾 This image is saved in R2 storage productshots folder"
    echo ""
    echo "🔗 You can view the generated image at:"
    echo "   $RESULT_URL"
  fi
else
  echo "❌ FAILED with status $HTTP_STATUS"
  echo "📋 Error: $RESPONSE_BODY"
fi

echo ""
echo "�� Test completed!"

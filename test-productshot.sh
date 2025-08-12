#!/bin/bash

# ProductShot API 测试脚本
echo "🚀 Starting ProductShot API Test..."
echo "================================="

# 1. 检查输入图片是否存在
IMAGE_PATH="public/productshots/productshot44.png"
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Error: Input image not found at $IMAGE_PATH"
  exit 1
fi

echo "✅ Input image found: $IMAGE_PATH"
echo "📁 Image size: $(du -h "$IMAGE_PATH" | cut -f1)"

# 2. 转换图片为base64
echo "🔄 Converting image to base64..."
IMAGE_BASE64=$(base64 -i "$IMAGE_PATH")
echo "✅ Image converted to base64 (length: ${#IMAGE_BASE64} characters)"

# 3. 准备JSON数据
JSON_DATA=$(cat <<EOF
{
  "productDescription": "Professional smartphone case with elegant design",
  "sceneType": "studio-model",
  "quality": "standard",
  "image_input": "$IMAGE_BASE64",
  "size": "1024x1024",
  "output_format": "png"
}
EOF
)

echo "📋 Test Configuration:"
echo "   Product: Professional smartphone case with elegant design"
echo "   Scene: Professional Model (studio-model)"
echo "   Quality: standard"
echo "   Size: 1024x1024"
echo "   Format: PNG"
echo ""

# 4. 发送API请求
echo "🌐 Sending API request..."
echo "⚠️  Note: This test requires a valid session cookie"
echo ""

# 使用curl发送请求 (需要手动添加有效的session cookie)
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/productshot/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-session-token-here" \
  -d "$JSON_DATA" \
  -w "\nHTTP_STATUS_CODE:%{http_code}")

# 5. 解析响应
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS_CODE:/d')

echo "📊 API Response:"
echo "   Status Code: $HTTP_STATUS"
echo "   Response: $RESPONSE_BODY"
echo ""

# 6. 解析结果
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ ProductShot generation successful!"

  # 尝试提取结果URL
  RESULT_URL=$(echo "$RESPONSE_BODY" | grep -o '"resultUrl":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$RESULT_URL" ]; then
    echo "🖼️  Generated image URL: $RESULT_URL"
    echo "💾 This image should be saved in R2 storage under 'productshots' folder"
  fi

  # 提取处理时间
  PROCESSING_TIME=$(echo "$RESPONSE_BODY" | grep -o '"processingTime":[0-9]*' | cut -d: -f2)
  if [ ! -z "$PROCESSING_TIME" ]; then
    echo "⏱️  Processing time: ${PROCESSING_TIME}ms"
  fi

else
  echo "❌ ProductShot generation failed with status: $HTTP_STATUS"
  echo "📋 Error details: $RESPONSE_BODY"
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Replace 'your-session-token-here' with a valid session token"
echo "   2. You can get a session token by:"
echo "      - Open browser dev tools on http://localhost:3000"
echo "      - Go to Application > Cookies"
echo "      - Copy the 'better-auth.session_token' value"
echo "   3. Re-run this script with the valid token"
echo ""
echo "�� Test completed!"

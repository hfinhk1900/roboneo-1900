#!/bin/bash

# ProductShot API 调试测试脚本
echo "🐛 ProductShot API Debug Test"
echo "=============================="

SESSION_TOKEN="$1"
if [ -z "$SESSION_TOKEN" ]; then
  echo "❌ Session token required"
  exit 1
fi

echo "✅ Session token: ${SESSION_TOKEN:0:20}..."

# 测试1：纯文本生成（不带图片输入）
echo ""
echo "📋 Test 1: Text-only ProductShot generation"
echo "   Product: Professional smartphone case with elegant design"
echo "   Scene: Professional Model"
echo "   No image input"

RESPONSE1=$(curl -s -X POST "http://localhost:3000/api/productshot/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -d '{
    "productDescription": "Professional smartphone case with elegant design",
    "sceneType": "studio-model",
    "quality": "standard",
    "size": "1024x1024",
    "output_format": "png"
  }' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS:/d')

echo "📊 Test 1 Results:"
echo "   Status: $HTTP_STATUS1"

if [ "$HTTP_STATUS1" = "200" ]; then
  echo "✅ SUCCESS! Text-only generation worked!"
  echo "📄 Response: $RESPONSE_BODY1"

  # 提取结果URL
  RESULT_URL1=$(echo "$RESPONSE_BODY1" | grep -o '"resultUrl":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$RESULT_URL1" ]; then
    echo "🖼️  Generated Image URL: $RESULT_URL1"
  fi
else
  echo "❌ FAILED: $RESPONSE_BODY1"
fi

echo ""
echo "================================"
echo ""

# 测试2：小图片测试（如果测试1成功）
if [ "$HTTP_STATUS1" = "200" ]; then
  echo "📋 Test 2: With smaller image input"

  # 创建一个小的测试图片（1x1像素）
  echo "🔄 Creating small test image..."
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" > small_test.b64
  SMALL_IMAGE=$(cat small_test.b64)

  RESPONSE2=$(curl -s -X POST "http://localhost:3000/api/productshot/generate" \
    -H "Content-Type: application/json" \
    -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
    -d "{
      \"productDescription\": \"Professional smartphone case with elegant design\",
      \"sceneType\": \"studio-model\",
      \"quality\": \"standard\",
      \"image_input\": \"$SMALL_IMAGE\",
      \"size\": \"1024x1024\",
      \"output_format\": \"png\"
    }" \
    -w "\nHTTP_STATUS:%{http_code}")

  HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | cut -d: -f2)
  RESPONSE_BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS:/d')

  echo "📊 Test 2 Results:"
  echo "   Status: $HTTP_STATUS2"

  if [ "$HTTP_STATUS2" = "200" ]; then
    echo "✅ SUCCESS! Small image generation worked!"
    echo "📄 Response: $RESPONSE_BODY2"

    RESULT_URL2=$(echo "$RESPONSE_BODY2" | grep -o '"resultUrl":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$RESULT_URL2" ]; then
      echo "🖼️  Generated Image URL: $RESULT_URL2"
    fi
  else
    echo "❌ FAILED: $RESPONSE_BODY2"
  fi

  # 清理
  rm -f small_test.b64
else
  echo "⏭️  Skipping Test 2 due to Test 1 failure"
fi

echo ""
echo "🎯 Debug test completed!"
echo ""
echo "📋 Analysis:"
if [ "$HTTP_STATUS1" = "200" ]; then
  echo "   ✅ API authentication works"
  echo "   ✅ Text-only generation works"
  if [ "$HTTP_STATUS2" = "200" ]; then
    echo "   ✅ Image input works with small images"
    echo "   🔍 The issue might be with large image size"
    echo "   💡 Suggestion: Try resizing productshot44.png to smaller size"
  else
    echo "   ❌ Image input has issues"
    echo "   🔍 The problem is with image processing"
  fi
else
  echo "   ❌ Basic API call failed"
  echo "   🔍 Check SiliconFlow API configuration"
fi

#!/bin/bash

# API 测试脚本
# 用于测试优化后的 KIE AI API

API_URL="http://localhost:3000/api/test-sticker"
STYLES=("ios" "pixel" "lego" "snoopy")
PROMPTS=("A cute cat" "A robot dancing" "A magical unicorn" "A happy dog")

echo "🧪 KIE AI API 自动化测试"
echo "========================="
echo ""
echo "API 端点: $API_URL"
echo "测试风格: ${STYLES[@]}"
echo ""

# 测试计数器
SUCCESS_COUNT=0
FAILED_COUNT=0

# 测试每个风格
for i in ${!STYLES[@]}; do
    STYLE=${STYLES[$i]}
    PROMPT=${PROMPTS[$i]}
    
    echo "----------------------------------------"
    echo "📝 测试 $((i+1))/4: $STYLE 风格"
    echo "   提示词: $PROMPT"
    echo ""
    
    # 创建任务
    echo "1️⃣  创建任务..."
    CREATE_RESPONSE=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"prompt\": \"$PROMPT\", \"style\": \"$STYLE\"}" 2>/dev/null)
    
    # 提取 taskId
    TASK_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['taskId'])" 2>/dev/null)
    
    if [ -z "$TASK_ID" ]; then
        echo "❌ 创建任务失败"
        FAILED_COUNT=$((FAILED_COUNT+1))
        continue
    fi
    
    echo "   ✅ 任务 ID: $TASK_ID"
    echo ""
    
    # 轮询任务状态
    echo "2️⃣  轮询任务状态..."
    MAX_ATTEMPTS=10
    ATTEMPT=0
    COMPLETED=false
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        ATTEMPT=$((ATTEMPT+1))
        
        # 获取状态
        STATUS_RESPONSE=$(curl -s -X GET "$API_URL?taskId=$TASK_ID" 2>/dev/null)
        TASK_STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['status'])" 2>/dev/null)
        TASK_PROGRESS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(int(d['data']['progress']))" 2>/dev/null)
        
        # 显示进度条
        PROGRESS_BAR=""
        FILLED=$((TASK_PROGRESS/10))
        for j in $(seq 1 10); do
            if [ $j -le $FILLED ]; then
                PROGRESS_BAR="${PROGRESS_BAR}█"
            else
                PROGRESS_BAR="${PROGRESS_BAR}░"
            fi
        done
        
        echo -ne "\r   进度: [$PROGRESS_BAR] ${TASK_PROGRESS}% "
        
        if [ "$TASK_STATUS" = "completed" ]; then
            RESULT_URL=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['resultUrl'])" 2>/dev/null)
            echo ""
            echo "   ✅ 任务完成!"
            echo "   🖼️  图片: $RESULT_URL"
            COMPLETED=true
            SUCCESS_COUNT=$((SUCCESS_COUNT+1))
            break
        fi
        
        sleep 1
    done
    
    if [ "$COMPLETED" = false ]; then
        echo ""
        echo "   ❌ 任务超时"
        FAILED_COUNT=$((FAILED_COUNT+1))
    fi
    
    echo ""
done

echo "----------------------------------------"
echo ""
echo "📊 测试结果汇总"
echo "==============="
echo "✅ 成功: $SUCCESS_COUNT"
echo "❌ 失败: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
    echo "🎉 所有测试通过!"
else
    echo "⚠️  有 $FAILED_COUNT 个测试失败"
fi

echo ""
echo "📝 注意事项："
echo "- 这是模拟 API，返回占位图片"
echo "- 生产环境需要真实 KIE API key"
echo "- 轮询机制避免了回调复杂性"
echo ""

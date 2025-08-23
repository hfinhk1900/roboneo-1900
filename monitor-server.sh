#!/bin/bash

# 服务器监视脚本
# 持续监控 Next.js 开发服务器的状态

echo "🔍 服务器监视脚本启动"
echo "================================"
echo "监视目标: Next.js 开发服务器 (localhost:3000)"
echo "按 Ctrl+C 停止监视"
echo ""

# 计数器
CHECK_COUNT=0
ERROR_COUNT=0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 监视函数
monitor_server() {
    while true; do
        CHECK_COUNT=$((CHECK_COUNT + 1))
        TIMESTAMP=$(date '+%H:%M:%S')

        # 检查服务器进程
        if pgrep -f "next dev" > /dev/null; then
            PROCESS_STATUS="${GREEN}✅ 运行中${NC}"
        else
            PROCESS_STATUS="${RED}❌ 未运行${NC}"
        fi

        # 检查 HTTP 响应
        HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
        if [ "$HTTP_RESPONSE" = "200" ]; then
            HTTP_STATUS="${GREEN}✅ 200 OK${NC}"
        else
            HTTP_STATUS="${RED}❌ HTTP $HTTP_RESPONSE${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi

        # 检查响应时间
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000 2>/dev/null)
        if [ -n "$RESPONSE_TIME" ] && [ "$RESPONSE_TIME" != "0.000" ]; then
            if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
                TIME_STATUS="${GREEN}⚡ ${RESPONSE_TIME}s${NC}"
            elif (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
                TIME_STATUS="${YELLOW}⏱️  ${RESPONSE_TIME}s${NC}"
            else
                TIME_STATUS="${RED}🐌 ${RESPONSE_TIME}s${NC}"
            fi
        else
            TIME_STATUS="${RED}❌ 无响应${NC}"
        fi

        # 检查内存使用
        if pgrep -f "next dev" > /dev/null; then
            NEXT_PID=$(pgrep -f "next dev" | head -1)
            if [ -n "$NEXT_PID" ]; then
                MEMORY_USAGE=$(ps -o rss= -p "$NEXT_PID" 2>/dev/null | awk '{print $1/1024}')
                if [ -n "$MEMORY_USAGE" ]; then
                    MEMORY_MB=$(printf "%.1f" "$MEMORY_USAGE")
                    if (( $(echo "$MEMORY_MB < 500" | bc -l) )); then
                        MEMORY_STATUS="${GREEN}💾 ${MEMORY_MB}MB${NC}"
                    elif (( $(echo "$MEMORY_MB < 1000" | bc -l) )); then
                        MEMORY_STATUS="${YELLOW}💾 ${MEMORY_MB}MB${NC}"
                    else
                        MEMORY_STATUS="${RED}💾 ${MEMORY_MB}MB${NC}"
                    fi
                else
                    MEMORY_STATUS="${YELLOW}💾 未知${NC}"
                fi
            else
                MEMORY_STATUS="${RED}💾 无进程${NC}"
            fi
        else
            MEMORY_STATUS="${RED}💾 无进程${NC}"
        fi

        # 显示状态
        echo -e "[$TIMESTAMP] 检查 #$CHECK_COUNT | 进程: $PROCESS_STATUS | HTTP: $HTTP_STATUS | 响应时间: $TIME_STATUS | 内存: $MEMORY_STATUS"

        # 每10次检查显示统计信息
        if [ $((CHECK_COUNT % 10)) -eq 0 ]; then
            echo ""
            echo -e "${BLUE}📊 统计信息${NC}"
            echo -e "总检查次数: $CHECK_COUNT"
            echo -e "错误次数: ${RED}$ERROR_COUNT${NC}"
            echo -e "成功率: $(( (CHECK_COUNT - ERROR_COUNT) * 100 / CHECK_COUNT ))%"
            echo ""
        fi

        # 等待5秒
        sleep 5
    done
}

# 启动监视
echo -e "${BLUE}🚀 开始监视服务器...${NC}"
echo ""

# 捕获 Ctrl+C 信号
trap 'echo ""; echo -e "${YELLOW}⏹️  监视已停止${NC}"; echo -e "总检查次数: $CHECK_COUNT"; echo -e "错误次数: $ERROR_COUNT"; exit 0' INT

# 启动监视
monitor_server

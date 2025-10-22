#!/bin/bash

# Scream AI Server Monitor Script
# Monitors dev server logs for Scream AI API calls

echo "=================================="
echo "🎬 Scream AI Server Monitor"
echo "=================================="
echo ""
echo "Monitoring server logs for Scream AI API activity..."
echo "Press Ctrl+C to stop"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get server PID
SERVER_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$SERVER_PID" ]; then
    echo -e "${RED}❌ Development server not running${NC}"
    echo "Start it with: pnpm dev"
    exit 1
fi

echo -e "${GREEN}✅ Server running (PID: $SERVER_PID)${NC}"
echo -e "${BLUE}📡 Listening for /api/scream-ai/* requests...${NC}"
echo ""

# Monitor dev.log if exists, otherwise just show instructions
if [ -f "dev.log" ]; then
    tail -f dev.log | grep --line-buffered "scream-ai\|POST /api/scream-ai\|Scene\|preset"
else
    echo -e "${YELLOW}💡 Tip: To capture logs, run dev server with:${NC}"
    echo "   pnpm dev 2>&1 | tee dev.log"
    echo ""
    echo -e "${BLUE}Monitor this terminal for API requests${NC}"
    echo ""

    # Show recent requests if any
    if command -v lsof &> /dev/null; then
        echo -e "${BLUE}Current connections to port 3000:${NC}"
        lsof -i :3000 | head -10
    fi
fi


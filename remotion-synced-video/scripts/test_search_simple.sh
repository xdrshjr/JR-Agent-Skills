#!/bin/bash
# 简化版图片搜索测试 - 使用浏览器截图验证

QUERY="${1:-futuristic AI robot}"
OUTPUT_DIR="${2:-/tmp/test-images}"

echo "═══════════════════════════════════════════"
echo "🖼️  图片搜索测试 (截图验证版)"
echo "═══════════════════════════════════════════"
echo ""
echo "搜索: \"$QUERY\""
echo "输出: $OUTPUT_DIR"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 1. 打开 Google Images
echo "🔍 Step 1: 打开 Google Images..."
SEARCH_URL="https://www.google.com/search?tbm=isch\u0026q=$(echo "$QUERY" | sed 's/ /+/g')\u0026tbs=isz:l"

agent-browser open "$SEARCH_URL"

# 2. 等待加载
echo "⏳ Step 2: 等待页面加载 (4s)..."
agent-browser wait 4000

# 3. 截图保存
echo "📸 Step 3: 截图保存..."
SCREENSHOT="$OUTPUT_DIR/search_screenshot.png"
agent-browser screenshot "$SCREENSHOT"
echo "   ✓ 截图已保存: $SCREENSHOT"

# 4. 点击第一张图片获取大图
echo "🖱️  Step 4: 点击第一张图片..."
agent-browser snapshot -i > /tmp/snapshot.txt 2>&1

# 找到第一个图片元素并点击
cat /tmp/snapshot.txt | head -50

echo ""
echo "═══════════════════════════════════════════"
echo "✅ 测试完成！请查看截图: $SCREENSHOT"
echo "═══════════════════════════════════════════"

# 5. 关闭浏览器
agent-browser close

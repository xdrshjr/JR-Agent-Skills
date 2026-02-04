#!/bin/bash
# 图片搜索测试 - 使用语义定位

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-/tmp/test-images-final}"

echo "═══════════════════════════════════════════"
echo "🖼️  图片搜索测试 - 语义定位版"
echo "═══════════════════════════════════════════"
echo ""
echo "搜索: \"$QUERY\""
echo ""

mkdir -p "$OUTPUT_DIR"

# 1. 打开 Google
echo "🔍 Step 1: 打开 Google..."
agent-browser open "https://www.google.com"
agent-browser wait 2000

# 2. 找到搜索框并输入
echo "⌨️  Step 2: 输入搜索词..."
agent-browser find placeholder "Search" fill "$QUERY"
agent-browser wait 1000

# 3. 按回车搜索
echo "🔎 Step 3: 执行搜索..."
agent-browser press Enter
agent-browser wait 3000

# 4. 截图搜索结果
echo "📸 Step 4: 截图搜索结果..."
agent-browser screenshot "$OUTPUT_DIR/01_search_results.png"

# 5. 点击 Images 标签
echo "🖼️  Step 5: 切换到图片标签..."
agent-browser find text "Images" click
agent-browser wait 4000

# 6. 截图图片结果
echo "📸 Step 6: 截图图片结果页..."
agent-browser screenshot "$OUTPUT_DIR/02_image_results.png"
echo "   ✓ 图片页截图完成"

# 7. 点击第一张图片
echo "🖱️  Step 7: 点击第一张图片..."
agent-browser snapshot -i > /tmp/snapshot2.txt

# 找到图片元素（通常是带有 img 标签的元素）
echo "   查看可交互元素..."
head -30 /tmp/snapshot2.txt

# 8. 获取当前页面大图链接
echo ""
echo "🔗 Step 8: 提取当前页面大图 URL..."
agent-browser eval "document.querySelector('img[jsname]')?.src || document.querySelector('img[alt]')?.src" 2>/dev/null | head -5

echo ""
echo "═══════════════════════════════════════════"
echo "✅ 测试完成！"
echo "═══════════════════════════════════════════"
echo ""
echo "📁 截图文件:"
ls -la "$OUTPUT_DIR/"

agent-browser close

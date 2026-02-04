#!/bin/bash
# 图片搜索测试 - 改进版

QUERY="${1:-futuristic technology}"
OUTPUT_DIR="${2:-/tmp/test-images}"

echo "═══════════════════════════════════════════"
echo "🖼️  图片搜索测试 v2"
echo "═══════════════════════════════════════════"
echo ""
echo "搜索: \"$QUERY\""
echo ""

mkdir -p "$OUTPUT_DIR"

# 1. 打开 Google
echo "🔍 Step 1: 打开 Google..."
agent-browser open "https://www.google.com"
agent-browser wait 2000

# 2. 输入搜索词
echo "⌨️  Step 2: 输入搜索词..."
agent-browser fill @e9 "$QUERY"
agent-browser wait 500

# 3. 搜索
echo "🔎 Step 3: 执行搜索..."
agent-browser press Enter
agent-browser wait 3000

# 4. 截图
echo "📸 Step 4: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_search.png"
echo "   ✓ 搜索页截图: step1_search.png"

# 5. 点击 Images 标签
echo "🖼️  Step 5: 切换到图片标签..."
agent-browser click @e4 2>/dev/null || agent-browser find text "Images" click
agent-browser wait 4000

# 6. 截图图片结果页
echo "📸 Step 6: 截图图片结果..."
agent-browser screenshot "$OUTPUT_DIR/step2_images.png"
echo "   ✓ 图片页截图: step2_images.png"

# 7. 获取页面源码中的图片链接
echo "🔗 Step 7: 提取图片链接..."

# 获取页面内容并提取图片 URL
agent-browser eval "Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s && s.includes('googleusercontent')).slice(0,5)" 2>/dev/null | tee /tmp/img_urls.txt

echo ""
echo "═══════════════════════════════════════════"
echo "✅ 测试完成！"
echo "═══════════════════════════════════════════"
echo ""
echo "📁 输出文件:"
ls -la "$OUTPUT_DIR/"

if [ -f /tmp/img_urls.txt ]; then
    echo ""
    echo "🔗 找到的图片链接:"
    cat /tmp/img_urls.txt
fi

agent-browser close

#!/bin/bash
# Bing Images 爬取脚本 v3 - 简化版

QUERY="${1:-futuristic robot}"
OUTPUT_DIR="${2:-./bing_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 爬取工具 v3"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Bing Images (英文界面更稳定)
echo "📌 Step 1: 打开 Bing Images..."
ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$QUERY'''))" 2>/dev/null || echo "$QUERY")
SEARCH_URL="https://www.bing.com/images/search?q=${ENCODED_QUERY}"

agent-browser open "$SEARCH_URL"
sleep 5
echo "   ✓ 页面已加载"

# 步骤 2: 截图查看
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_bing.png"

# 步骤 3: 使用 JS 提取所有图片
echo "📌 Step 3: 提取图片..."

JS_RESULT=$(agent-browser eval '
  Array.from(document.querySelectorAll("img"))
    .filter(img => img.src && img.src.includes("bing.net"))
    .slice(0, 10)
    .map(img => img.src)
' 2>&1)

echo "   JS 返回: ${JS_RESULT:0:200}"

# 步骤 4: 关闭浏览器
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 步骤 5: 解析 URL
echo "📌 Step 5: 解析 URL..."
echo "$JS_RESULT" | grep -oE 'https://[^"[:space:]]+bing\.net[^"[:space:]]+' | head -10 > /tmp/img_urls.txt || true

if [ ! -s /tmp/img_urls.txt ]; then
  echo "⚠️ 尝试备用提取方法..."
  echo "$JS_RESULT" | grep -oE 'https://[^"\[\],]+' | head -10 > /tmp/img_urls.txt || true
fi

# 步骤 6: 下载
echo "📌 Step 6: 下载图片..."

if [ -s /tmp/img_urls.txt ]; then
  echo "   找到 $(wc -l < /tmp/img_urls.txt) 个 URL"
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    [[ "$URL" =~ ^https ]] || continue
    
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] ${URL:0:50}..."
    
    curl -sL "$URL" \
      -H "User-Agent: Mozilla/5.0" \
      -H "Referer: https://www.bing.com/" \
      --max-time 20 \
      -o "$OUTPUT_FILE" 2>/dev/null && echo "     ✓ 完成" || echo "     ✗ 失败"
    
    # 检查文件
    if [ -f "$OUTPUT_FILE" ]; then
      SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      if [ "$SIZE" -lt 1024 ]; then
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    fi
  done < /tmp/img_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ 完成! 成功下载 $COUNT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "⚠️ 未找到图片 URL"
fi

# 显示结果
echo ""
echo "📁 文件列表:"
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "  无文件"

rm -f /tmp/img_urls.txt

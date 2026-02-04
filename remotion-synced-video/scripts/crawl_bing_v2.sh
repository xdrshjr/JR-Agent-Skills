#!/bin/bash
# Bing Images 爬取脚本 v2 - 改进解析

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-./bing_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 爬取工具 v2"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Bing Images
echo "📌 Step 1: 打开 Bing Images..."
ENCODED_QUERY=$(echo "$QUERY" | sed 's/ /+/g')
SEARCH_URL="https://www.bing.com/images/search?q=${ENCODED_QUERY}"

agent-browser open "$SEARCH_URL"
sleep 5
echo "   ✓ 页面已打开"

# 步骤 2: 点击"大尺寸"筛选
echo "📌 Step 2: 设置大尺寸筛选..."
agent-browser find text "Large" click 2>/dev/null || \
agent-browser find text "Size" click 2>/dev/null || true
sleep 2

# 步骤 3: 截图
echo "📌 Step 3: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_bing.png"

# 步骤 4: 使用 JavaScript 提取图片
echo "📌 Step 4: 提取图片 URL..."

JS_CODE='
(function() {
  const results = [];
  const seen = new Set();
  
  // 查找所有图片元素
  document.querySelectorAll("img").forEach(img => {
    const src = img.src;
    // Bing 缩略图通常来自 bing.net/th
    if (src && src.includes("bing.net/th") && !seen.has(src)) {
      seen.add(src);
      results.push({
        thumb: src,
        alt: img.alt || ""
      });
    }
  });
  
  return results.slice(0, 10);
})()
'

RESULT=$(agent-browser eval "$JS_CODE" 2>&1 || echo "[]")
echo "   提取结果: ${RESULT:0:200}"

# 保存结果
echo "$RESULT" > /tmp/bing_img_data.txt

# 步骤 5: 关闭浏览器
echo "📌 Step 5: 关闭浏览器..."
agent-browser close

# 步骤 6: 提取缩略图 URL
echo "📌 Step 6: 解析并下载..."

grep -oE 'https://[^"[:space:]]+bing\.net/th[^"[:space:]]+' /tmp/bing_img_data.txt | head -20 > /tmp/thumb_urls.txt || true

if [ -s /tmp/thumb_urls.txt ]; then
  echo "   找到 $(wc -l < /tmp/thumb_urls.txt) 个缩略图"
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] 下载: ${URL:0:60}..."
    
    if curl -sL "$URL" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
         -H "Referer: https://www.bing.com/" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 5120 ]; then
        echo "   ✓ 成功 ($((FILE_SIZE/1024)) KB)"
      else
        echo "   ✗ 文件太小"
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    else
      echo "   ✗ 下载失败"
      rm -f "$OUTPUT_FILE"
      COUNT=$((COUNT - 1))
    fi
  done < /tmp/thumb_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "📊 完成 - 成功下载 $COUNT/$LIMIT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "⚠️ 未找到图片 URL"
fi

# 清理
rm -f /tmp/thumb_urls.txt /tmp/bing_img_data.txt

# 显示结果
echo ""
ls -lh "$OUTPUT_DIR/" 2>/dev/null || true

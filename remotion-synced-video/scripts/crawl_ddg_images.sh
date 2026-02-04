#!/bin/bash
# 图片爬取脚本 v3 - 使用 DuckDuckGo (更友好)

set -e

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-./downloaded_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  DuckDuckGo Images 爬取工具"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo "输出目录: $OUTPUT_DIR"
echo "数量限制: $LIMIT"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 DuckDuckGo Images
echo "📌 Step 1: 打开 DuckDuckGo Images..."
ENCODED_QUERY=$(echo "$QUERY" | sed 's/ /+/g')
SEARCH_URL="https://duckduckgo.com/?q=${ENCODED_QUERY}\u0026iax=images\u0026ia=images"

agent-browser open "$SEARCH_URL"
sleep 4
echo "   ✓ 页面已打开"

# 步骤 2: 截图
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_ddg.png"
echo "   ✓ 截图已保存"

# 步骤 3: 提取图片 URL
echo "📌 Step 3: 提取图片 URL..."

# 使用 JavaScript 提取图片链接
JS_CODE='
(function() {
  const urls = [];
  const seen = new Set();
  
  // 查找所有图片
  document.querySelectorAll("img").forEach(img => {
    const src = img.src || img.dataset?.src;
    if (src && src.startsWith("http") && !seen.has(src) && !src.includes("duckduckgo")) {
      seen.add(src);
      urls.push(src);
    }
  });
  
  return urls.slice(0, 10);
})()
'

RESULT=$(agent-browser eval "$JS_CODE" 2>&1 || echo "[]")
echo "   找到的图片: $RESULT"

# 保存结果
echo "$RESULT" > /tmp/ddg_result.txt

# 提取 URL
grep -oE 'https://[^"[:space:]]+\.(jpg|jpeg|png|webp)' /tmp/ddg_result.txt > /tmp/img_urls.txt 2>/dev/null || true

# 如果没有找到，尝试更宽松的匹配
if [ ! -s /tmp/img_urls.txt ]; then
  grep -oE 'https://[^"[:space:]]+' /tmp/ddg_result.txt | grep -v "duckduckgo" | head -20 > /tmp/img_urls.txt
fi

# 步骤 4: 关闭浏览器
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 步骤 5: 下载图片
if [ -s /tmp/img_urls.txt ]; then
  echo ""
  echo "📌 Step 5: 下载图片..."
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    
    COUNT=$((COUNT + 1))
    EXT="${URL##*.}"
    [ "$EXT" = "$URL" ] && EXT="jpg"
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}.${EXT}"
    
    echo ""
    echo "   [$COUNT/$LIMIT] 下载: ${URL:0:60}..."
    
    if curl -sL "$URL" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 10240 ]; then
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
  done < /tmp/img_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "📊 完成 - 成功下载 $COUNT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo ""
  echo "⚠️ 未找到图片 URL"
  echo "请查看截图: $OUTPUT_DIR/step1_ddg.png"
fi

# 清理
rm -f /tmp/ddg_result.txt /tmp/img_urls.txt

# 显示结果
ls -lh "$OUTPUT_DIR/" 2>/dev/null || true

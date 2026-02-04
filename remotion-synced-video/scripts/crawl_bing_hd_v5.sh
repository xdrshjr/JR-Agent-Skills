#!/bin/bash
# Bing Images 高清爬取脚本 v5 - 修复URL提取

QUERY="${1:-futuristic AI robot}"
OUTPUT_DIR="${2:-./bing_images_hd}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 高清爬取工具 v5"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Bing
echo "📌 Step 1: 打开 Bing Images..."
ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$QUERY'''))" 2>/dev/null || echo "$QUERY")
agent-browser open "https://www.bing.com/images/search?q=${ENCODED_QUERY}"
sleep 5
echo "   ✓ 页面已加载"

# 步骤 2: 截图
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_search.png"

# 步骤 3: 提取图片URL
echo "📌 Step 3: 提取图片 URL..."

JS_CODE='
(function() {
  var urls = [];
  var seen = new Set();
  document.querySelectorAll("a[m]").forEach(function(a) {
    try {
      var m = JSON.parse(a.getAttribute("m"));
      if (m.murl && !seen.has(m.murl)) {
        seen.add(m.murl);
        urls.push(m.murl);
      }
    } catch (e) {}
  });
  return urls.join("\n");
})()
'

URLS=$(agent-browser eval "$JS_CODE" 2>&1)
echo "   提取到的URL:"
echo "$URLS" | head -10 | while read line; do echo "      $line"; done

# 保存到文件
echo "$URLS" > /tmp/img_urls.txt

# 步骤 4: 关闭浏览器
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 步骤 5: 下载
echo "📌 Step 5: 下载高清图..."

if [ -s /tmp/img_urls.txt ]; then
  TOTAL=$(wc -l < /tmp/img_urls.txt)
  echo "   找到 $TOTAL 个URL"
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    [[ "$URL" =~ ^https ]] || continue
    
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}_hd.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] ${URL:0:60}..."
    
    if curl -sL "$URL" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
         -H "Accept: image/webp,image/apng,image/*,*/*;q=0.8" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 102400 ]; then
        echo "      ✅ 高清图 ($((FILE_SIZE/1024)) KB)"
      elif [ "$FILE_SIZE" -gt 51200 ]; then
        echo "      ✓ 较大图片 ($((FILE_SIZE/1024)) KB)"
      elif [ "$FILE_SIZE" -gt 10240 ]; then
        echo "      ⚠️ 中等质量 ($((FILE_SIZE/1024)) KB)"
        # 保留中等质量的图片
      else
        echo "      ❌ 文件太小 ($((FILE_SIZE/1024)) KB)，删除"
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    else
      echo "      ❌ 下载失败"
    fi
  done < /tmp/img_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ 完成! 成功下载 $COUNT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "⚠️ 未找到图片URL"
fi

rm -f /tmp/img_urls.txt
echo ""
ls -lh "$OUTPUT_DIR/"

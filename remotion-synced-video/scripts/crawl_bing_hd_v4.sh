#!/bin/bash
# Bing Images 高清爬取脚本 v4 - 从 m 属性提取

QUERY="${1:-futuristic AI robot}"
OUTPUT_DIR="${2:-./bing_images_hd}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 高清爬取工具 v4"
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

# 步骤 3: 从 m 属性提取图片数据
echo "📌 Step 3: 提取图片数据..."

JS_CODE='
(function() {
  var results = [];
  var seen = new Set();
  
  // Bing 将图片数据存储在 m 属性中
  document.querySelectorAll("a[m]").forEach(function(a) {
    try {
      var m = a.getAttribute("m");
      if (m) {
        var data = JSON.parse(m);
        if (data.murl && !seen.has(data.murl)) {
          seen.add(data.murl);
          results.push({
            url: data.murl,
            width: data.ow || 0,
            height: data.oh || 0,
            title: data.t || ""
          });
        }
      }
    } catch (e) {}
  });
  
  return results.slice(0, 20);
})()
'

RESULT=$(agent-browser eval "$JS_CODE" 2>&1)
echo "   提取结果: ${RESULT:0:300}"

# 解析URL
echo "$RESULT" | grep -oE 'https://[^"\{\}\[\],]+' | head -20 > /tmp/img_urls.txt

# 步骤 4: 关闭浏览器
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 步骤 5: 下载
echo "📌 Step 5: 下载高清图..."

if [ -s /tmp/img_urls.txt ]; then
  echo "   找到 $(wc -l < /tmp/img_urls.txt) 个URL"
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}_hd.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] ${URL:0:50}..."
    
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
      else
        echo "      ❌ 文件太小"
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    else
      echo "      ❌ 下载失败"
    fi
  done < /tmp/img_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ 完成! 成功下载 $COUNT/$LIMIT 张高清图"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "⚠️ 未找到图片URL"
fi

rm -f /tmp/img_urls.txt
ls -lh "$OUTPUT_DIR/"

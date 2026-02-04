#!/bin/bash
# Bing Images 高清爬取脚本 - 直接从源码提取大图URL

QUERY="${1:-futuristic AI robot}"
OUTPUT_DIR="${2:-./bing_images_hd}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 高清爬取工具 v2"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo "输出目录: $OUTPUT_DIR"
echo "目标数量: $LIMIT 张高清图"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Bing Images
echo "📌 Step 1: 打开 Bing Images..."
ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$QUERY'''))" 2>/dev/null || echo "$QUERY")
SEARCH_URL="https://www.bing.com/images/search?q=${ENCODED_QUERY}"

agent-browser open "$SEARCH_URL"
sleep 5
echo "   ✓ 页面已加载"

# 步骤 2: 截图
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_search.png"

# 步骤 3: 获取页面HTML并提取高清图URL
echo "📌 Step 3: 提取高清图 URL..."

HTML=$(agent-browser eval 'document.body.innerHTML' 2>/dev/null)

# 保存HTML用于调试
echo "$HTML" > /tmp/bing_page.html

# 从HTML中提取 imgurl 参数 (这是Bing存储原始图片URL的方式)
# imgurl 后面跟着的是经过URL编码的原始图片链接
echo "$HTML" | grep -oE 'imgurl=[^\u0026"]+' | sed 's/imgurl=//' | while read -r url; do
  # URL解码
  python3 -c "import urllib.parse; print(urllib.parse.unquote('$url'))" 2>/dev/null
done | sort -u | head -20 > /tmp/hd_urls.txt

# 同时尝试直接提取图片链接
echo "$HTML" | grep -oE 'https://[^"\u003c\u003e]+\.(jpg|jpeg|png)' | grep -v "bing" | sort -u | head -20 >> /tmp/hd_urls.txt

# 去重
sort -u /tmp/hd_urls.txt > /tmp/hd_urls_unique.txt
mv /tmp/hd_urls_unique.txt /tmp/hd_urls.txt

TOTAL_URLS=$(wc -l < /tmp/hd_urls.txt 2>/dev/null || echo "0")
echo "   找到 $TOTAL_URLS 个潜在的高清图 URL"

# 步骤 4: 关闭浏览器
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 步骤 5: 下载高清图
echo "📌 Step 5: 下载高清图..."

if [ "$TOTAL_URLS" -gt 0 ]; then
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
      
      if [ "$FILE_SIZE" -gt 102400 ]; then  # 大于 100KB 认为是高清图
        echo "      ✅ 高清图 ($((FILE_SIZE/1024)) KB)"
      elif [ "$FILE_SIZE" -gt 51200 ]; then
        echo "      ✓ 较大图片 ($((FILE_SIZE/1024)) KB)"
      elif [ "$FILE_SIZE" -gt 10240 ]; then
        echo "      ⚠️ 中等质量 ($((FILE_SIZE/1024)) KB)"
      else
        echo "      ❌ 文件太小 ($((FILE_SIZE/1024)) KB)，删除"
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    else
      echo "      ❌ 下载失败"
      COUNT=$((COUNT - 1))
    fi
  done < /tmp/hd_urls.txt
  
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "📊 完成! 成功下载 $COUNT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "⚠️ 未找到高清图 URL"
fi

# 清理
rm -f /tmp/hd_urls.txt /tmp/bing_page.html

# 显示结果
echo ""
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "目录为空"
echo "═══════════════════════════════════════════════════════════"

#!/bin/bash
# Bing Images 爬取脚本

set -e

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-./bing_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 爬取工具"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo "输出目录: $OUTPUT_DIR"
echo "数量限制: $LIMIT"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Bing Images (使用大尺寸筛选)
echo "📌 Step 1: 打开 Bing Images..."
ENCODED_QUERY=$(echo "$QUERY" | sed 's/ /+/g')
SEARCH_URL="https://www.bing.com/images/search?q=${ENCODED_QUERY}\u0026qft=+filterui:imagesize-large"

agent-browser open "$SEARCH_URL"
sleep 5
echo "   ✓ 页面已打开"

# 步骤 2: 截图
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_bing.png"
echo "   ✓ 截图已保存"

# 步骤 3: 获取页面源码
echo "📌 Step 3: 提取图片 URL..."
HTML=$(agent-browser eval 'document.body.innerHTML' 2>/dev/null)
echo "${HTML:0:500}" > /tmp/bing_html_snippet.txt
echo "   HTML 长度: ${#HTML}"

# 保存完整 HTML
echo "$HTML" > /tmp/bing_full.html

# 步骤 4: 提取图片 URL (Bing 图片通常在 murl 参数中)
echo "📌 Step 4: 解析图片链接..."

# Bing 图片 URL 通常在 data 属性或 murl 参数中
grep -oE 'murl=[^\u0026"]+' /tmp/bing_full.html | sed 's/murl=//' | urldecode 2>/dev/null | head -20 > /tmp/img_urls.txt || true

# 如果没找到，尝试其他模式
if [ ! -s /tmp/img_urls.txt ]; then
  grep -oE 'https://[^"[:space:]]+\.(jpg|jpeg|png)' /tmp/bing_full.html | grep -v "bing.com" | head -20 > /tmp/img_urls.txt || true
fi

# 步骤 5: 关闭浏览器
echo "📌 Step 5: 关闭浏览器..."
agent-browser close

# 步骤 6: 下载图片
if [ -s /tmp/img_urls.txt ]; then
  echo ""
  echo "📌 Step 6: 下载图片..."
  echo "   找到 $(wc -l < /tmp/img_urls.txt) 个 URL"
  
  COUNT=0
  while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
    [ -z "$URL" ] && continue
    
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] 下载..."
    echo "   URL: ${URL:0:70}..."
    
    if curl -sL "$URL" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
         -H "Referer: https://www.bing.com/" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 10240 ]; then
        echo "   ✓ 成功 ($((FILE_SIZE/1024)) KB)"
      else
        echo "   ✗ 文件太小，删除"
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
  echo "📊 完成 - 成功下载 $COUNT/$LIMIT 张图片"
  echo "═══════════════════════════════════════════════════════════"
else
  echo ""
  echo "⚠️ 未找到图片 URL"
  echo "   已保存 HTML 到 /tmp/bing_full.html 供检查"
fi

# 清理
rm -f /tmp/img_urls.txt

# 显示结果
echo ""
echo "📁 输出目录内容:"
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "  无"

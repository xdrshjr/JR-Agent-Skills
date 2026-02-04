#!/bin/bash
# 图片爬取脚本 - 使用 agent-browser CLI
# 爬取 Google Images 并下载高清图片

set -e

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-./downloaded_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Google Images 爬取工具"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo "输出目录: $OUTPUT_DIR"
echo "数量限制: $LIMIT"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Google Images
echo "📌 Step 1: 打开 Google Images..."
ENCODED_QUERY=$(echo "$QUERY" | sed 's/ /+/g')
SEARCH_URL="https://www.google.com/search?tbm=isch\u0026q=${ENCODED_QUERY}\u0026tbs=isz:l"

agent-browser open "$SEARCH_URL"
echo "   ✓ 页面已打开"

# 步骤 2: 等待加载
echo ""
echo "📌 Step 2: 等待页面加载..."
agent-browser wait 5000
echo "   ✓ 加载完成"

# 步骤 3: 获取页面源码并提取图片 URL
echo ""
echo "📌 Step 3: 提取图片 URL..."

# 使用 JavaScript 提取图片链接
JS_CODE='
(function() {
  const images = [];
  const seen = new Set();
  
  // 查找所有图片元素
  document.querySelectorAll("img").forEach(img => {
    let src = img.dataset?.src || img.src;
    if (src && src.includes("googleusercontent.com") && !seen.has(src)) {
      seen.add(src);
      images.push(src);
    }
  });
  
  return images.slice(0, 10);
})()
'

# 保存 JS 到临时文件
JS_FILE=$(mktemp)
echo "$JS_CODE" > "$JS_FILE"

# 执行 JS 并获取结果
RESULT=$(agent-browser eval "$JS_CODE" 2>&1 || echo "[]")
echo "   原始结果: $RESULT"

# 解析图片 URL (从结果中提取)
echo "$RESULT" > /tmp/img_result.txt

# 步骤 4: 关闭浏览器
echo ""
echo "📌 Step 4: 关闭浏览器..."
agent-browser close
echo "   ✓ 浏览器已关闭"

# 步骤 5: 下载图片
echo ""
echo "📌 Step 5: 下载图片..."

# 从结果中提取 URL (简单解析)
grep -oE 'https://[^"[:space:]]+googleusercontent[^"[:space:]]+' /tmp/img_result.txt > /tmp/img_urls.txt 2>/dev/null || true

if [ ! -s /tmp/img_urls.txt ]; then
  echo "   ⚠️ 未找到图片 URL"
  exit 1
fi

echo "   找到 $(wc -l < /tmp/img_urls.txt) 个潜在 URL"

# 下载前 N 张图片
COUNT=0
while IFS= read -r URL && [ $COUNT -lt $LIMIT ]; do
  if [ -n "$URL" ]; then
    COUNT=$((COUNT + 1))
    OUTPUT_FILE="$OUTPUT_DIR/img_${COUNT}.jpg"
    
    echo ""
    echo "   [$COUNT/$LIMIT] 下载图片..."
    echo "   URL: ${URL:0:80}..."
    
    # 使用 curl 下载
    if curl -sL "$URL" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
         -H "Referer: https://www.google.com/" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      # 检查文件大小
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 10240 ]; then
        SIZE_KB=$((FILE_SIZE / 1024))
        echo "   ✓ 成功 (${SIZE_KB} KB)"
      else
        echo "   ✗ 文件太小，可能下载失败"
        rm -f "$OUTPUT_FILE"
        COUNT=$((COUNT - 1))
      fi
    else
      echo "   ✗ 下载失败"
      rm -f "$OUTPUT_FILE"
      COUNT=$((COUNT - 1))
    fi
  fi
done < /tmp/img_urls.txt

# 清理
rm -f "$JS_FILE" /tmp/img_result.txt /tmp/img_urls.txt

# 结果
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 下载完成"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "下载的图片:"
ls -lh "$OUTPUT_DIR/"/*.jpg 2>/dev/null || echo "  无"
echo ""
echo "输出目录: $OUTPUT_DIR"
echo "═══════════════════════════════════════════════════════════"

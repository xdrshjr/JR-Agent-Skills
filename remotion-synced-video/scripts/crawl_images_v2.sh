#!/bin/bash
# 图片爬取脚本 v2 - 稳健交互版

set -e

QUERY="${1:-futuristic AI technology}"
OUTPUT_DIR="${2:-./downloaded_images}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Google Images 爬取工具 v2"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "搜索词: $QUERY"
echo "输出目录: $OUTPUT_DIR"
echo "数量限制: $LIMIT"
echo ""

mkdir -p "$OUTPUT_DIR"

# 步骤 1: 打开 Google
echo "📌 Step 1: 打开 Google..."
agent-browser open "https://www.google.com"
sleep 2

# 步骤 2: 找到搜索框并输入
echo "📌 Step 2: 输入搜索词..."
agent-browser find placeholder "Search" type "$QUERY" 2>/dev/null || \
agent-browser find role "combobox" type "$QUERY" 2>/dev/null || \
{ echo "   尝试直接搜索..."; agent-browser open "https://www.google.com/search?q=$(echo $QUERY | sed 's/ /+/g')"; }

sleep 2
agent-browser press Enter
sleep 3

# 步骤 3: 截图查看状态
echo "📌 Step 3: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_search.png"
echo "   ✓ 搜索页截图已保存"

# 步骤 4: 点击 Images 标签
echo "📌 Step 4: 切换到 Images..."
agent-browser find text "Images" click 2>/dev/null || \
agent-browser find text "图片" click 2>/dev/null || \
echo "   ⚠️ 未能点击 Images 标签"

sleep 4

# 步骤 5: 截图图片页
echo "📌 Step 5: 截图图片结果..."
agent-browser screenshot "$OUTPUT_DIR/step2_images.png"
echo "   ✓ 图片页截图已保存"

# 步骤 6: 点击第一张图片获取大图
echo "📌 Step 6: 点击第一张图片..."

# 获取交互元素列表
agent-browser snapshot -i > /tmp/snapshot.txt 2>&1 || true

# 查找第一个图片相关的可点击元素
# 通常图片结果页的图片会有 alt 或 title
cat /tmp/snapshot.txt | head -50

echo ""
echo "📌 Step 7: 提取图片 URL..."

# 尝试多种方式提取图片 URL
# 方式1: 查找大图
IMG_URL=$(agent-browser eval 'document.querySelector("img[jsname]")?.src || document.querySelector("img[data-src]")?.dataset?.src' 2>/dev/null | grep -oE 'https://[^"[:space:]]+' | head -1)

if [ -z "$IMG_URL" ]; then
  # 方式2: 从页面源码提取
  HTML=$(agent-browser eval 'document.body.innerHTML' 2>/dev/null)
  echo "$HTML" > /tmp/page_html.txt
  IMG_URL=$(grep -oE 'https://[^"[:space:]]+googleusercontent[^"[:space:]]+' /tmp/page_html.txt | head -1)
fi

# 步骤 8: 关闭浏览器
echo "📌 Step 8: 关闭浏览器..."
agent-browser close

if [ -n "$IMG_URL" ]; then
  echo ""
  echo "✓ 找到图片 URL: ${IMG_URL:0:80}..."
  echo ""
  echo "📥 开始下载..."
  
  # 下载图片
  for i in $(seq 1 $LIMIT); do
    OUTPUT_FILE="$OUTPUT_DIR/img_$i.jpg"
    echo "  [$i/$LIMIT] 下载到 $OUTPUT_FILE..."
    
    curl -sL "$IMG_URL" \
      -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
      -H "Referer: https://www.google.com/" \
      --max-time 30 \
      -o "$OUTPUT_FILE" 2>/dev/null && echo "    ✓ 成功" || echo "    ✗ 失败"
  done
else
  echo ""
  echo "⚠️ 未能提取图片 URL"
  echo "请查看截图了解页面状态:"
  ls -la "$OUTPUT_DIR/"*.png 2>/dev/null || true
fi

# 结果
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 完成"
echo "═══════════════════════════════════════════════════════════"
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "目录为空"

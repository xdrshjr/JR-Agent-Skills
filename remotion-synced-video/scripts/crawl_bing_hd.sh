#!/bin/bash
# Bing Images 高清爬取脚本 - 点击缩略图获取大图

QUERY="${1:-futuristic AI robot}"
OUTPUT_DIR="${2:-./bing_images_hd}"
LIMIT="${3:-3}"

echo "═══════════════════════════════════════════════════════════"
echo "🖼️  Bing Images 高清爬取工具"
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
sleep 4
echo "   ✓ 页面已加载"

# 步骤 2: 截图初始页面
echo "📌 Step 2: 截图..."
agent-browser screenshot "$OUTPUT_DIR/step1_search.png"

# 步骤 3: 逐一点击获取高清图
echo "📌 Step 3: 点击获取高清图..."

for i in $(seq 1 $LIMIT); do
  echo ""
  echo "   [$i/$LIMIT] 处理第 $i 张图片..."
  
  # 点击第一个缩略图
  echo "      点击缩略图..."
  agent-browser eval 'document.querySelector("a[href*=\"imgurl\"]")?.click()' 2>/dev/null || \
  agent-browser eval 'document.querySelector(".mimg")?.closest("a")?.click()' 2>/dev/null || true
  
  # 等待大图预览加载
  sleep 3
  
  # 截图预览弹窗
  agent-browser screenshot "$OUTPUT_DIR/step${i}_preview.png" 2>/dev/null || true
  
  # 步骤 4: 提取高清图 URL
  echo "      提取高清图 URL..."
  
  # 大图通常在预览弹窗中
  HD_JS='
(function() {
  var img = document.querySelector("img.noPic") || 
            document.querySelector(".imgContainer img") ||
            document.querySelector("[class*=\"imageContainer\"] img");
  if (img) return img.src;
  
  var match = document.body.innerHTML.match(/imgurl=([^&]+)/);
  if (match) return decodeURIComponent(match[1]);
  
  return null;
})()
'
  
  HD_URL=$(agent-browser eval "$HD_JS" 2>/dev/null)
  
  if [ -z "$HD_URL" ] || [ "$HD_URL" = "null" ]; then
    echo "      未找到高清图，尝试备用方法..."
    # 从页面源码提取
    HTML=$(agent-browser eval 'document.body.innerHTML' 2>/dev/null)
    HD_URL=$(echo "$HTML" | grep -oE 'https://[^"<>]+\.(jpg|jpeg|png)' | grep -v "bing" | head -1)
  fi
  
  if [ -n "$HD_URL" ] && [ "$HD_URL" != "null" ] && [[ "$HD_URL" =~ ^https ]]; then
    echo "      URL: ${HD_URL:0:50}..."
    
    # 步骤 5: 下载高清图
    OUTPUT_FILE="$OUTPUT_DIR/img_${i}_hd.jpg"
    echo "      下载中..."
    
    if curl -sL "$HD_URL" \
         -H "User-Agent: Mozilla/5.0" \
         -H "Referer: https://www.bing.com/" \
         --max-time 30 \
         -o "$OUTPUT_FILE" 2>/dev/null; then
      
      FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "0")
      
      if [ "$FILE_SIZE" -gt 51200 ]; then
        echo "      ✅ 高清图! ($((FILE_SIZE/1024)) KB)"
      elif [ "$FILE_SIZE" -gt 10240 ]; then
        echo "      ⚠️ 中等质量 ($((FILE_SIZE/1024)) KB)"
      else
        echo "      ❌ 文件太小 ($((FILE_SIZE/1024)) KB)，删除"
        rm -f "$OUTPUT_FILE"
      fi
    else
      echo "      ❌ 下载失败"
    fi
  else
    echo "      ❌ 未能提取高清图 URL"
  fi
  
  # 关闭预览弹窗
  agent-browser press Escape 2>/dev/null || true
  agent-browser eval 'document.querySelector("[class*=\"close\"]")?.click()' 2>/dev/null || true
  sleep 1
done

# 关闭浏览器
echo ""
echo "📌 Step 4: 关闭浏览器..."
agent-browser close

# 显示结果
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 完成!"
echo "═══════════════════════════════════════════════════════════"
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "目录为空"
echo "═══════════════════════════════════════════════════════════"

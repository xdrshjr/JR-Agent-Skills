#!/bin/bash

# 下载视频素材
# 用法: ./download_video.sh <search_query> <output_dir> [count]

QUERY="$1"
OUTPUT_DIR="${2:-public/videos}"
COUNT="${3:-5}"

if [ -z "$QUERY" ]; then
  echo "用法: $0 <搜索关键词> [输出目录] [数量]"
  echo "示例: $0 'yorkshire terrier puppy' public/videos 5"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "搜索: $QUERY"
echo "下载 $COUNT 个视频到 $OUTPUT_DIR"
echo "=========================================="

# 使用 yt-dlp 搜索并下载
yt-dlp \
  -f "mp4[height<=720]" \
  -o "$OUTPUT_DIR/video%(playlist_index)s.%(ext)s" \
  "ytsearch${COUNT}:${QUERY}" \
  2>&1 | grep -E "(download|Destination|error|ERROR)"

echo ""
echo "✅ 下载完成！"
ls -la "$OUTPUT_DIR"

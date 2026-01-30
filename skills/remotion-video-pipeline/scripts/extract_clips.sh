#!/bin/bash

# 从视频中提取多个片段
# 用法: ./extract_clips.sh <input_video> <output_dir> <clip_duration>

INPUT="$1"
OUTPUT_DIR="${2:-public/videos}"
DURATION="${3:-10}"

if [ -z "$INPUT" ]; then
  echo "用法: $0 <输入视频> [输出目录] [片段时长秒]"
  echo "示例: $0 raw.mp4 public/videos 10"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# 获取视频总时长
TOTAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT" | cut -d. -f1)

echo "视频总时长: ${TOTAL_DURATION}s"
echo "提取 ${DURATION}s 片段到 $OUTPUT_DIR"
echo "=========================================="

# 提取5个等间隔的片段
for i in 1 2 3 4 5; do
  START=$(( (TOTAL_DURATION - DURATION * 5) * i / 5 ))
  if [ $START -lt 0 ]; then START=0; fi
  
  OUTPUT="$OUTPUT_DIR/clip${i}.mp4"
  echo "提取片段 $i: ${START}s - $((START + DURATION))s"
  
  ffmpeg -i "$INPUT" -ss $START -t $DURATION -c:v libx264 -c:a aac "$OUTPUT" -y 2>&1 | tail -1
  
  echo "  ✅ $OUTPUT"
done

echo ""
echo "✅ 提取完成！"
ls -la "$OUTPUT_DIR"/clip*.mp4

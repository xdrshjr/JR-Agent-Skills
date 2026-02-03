#!/bin/bash

# 渲染所有场景并拼接

PROJECT_DIR="/Users/xdrshjr/clawd/skills/hf-papers-reporter/video-project"
OUTPUT_DIR="$PROJECT_DIR/output"
mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_DIR"

echo "🎬 开始渲染视频场景..."

# 渲染每个场景
for scene in intro ideastory spatial dynamic ocr conceptmoe planing qwen3asr outro; do
  echo "Rendering Scene-$scene..."
  npx remotion render src/index.tsx "Scene-$scene" "$OUTPUT_DIR/scene-$scene.mp4" --log=error
done

# 创建拼接列表
echo "Creating file list for concatenation..."
> "$OUTPUT_DIR/filelist.txt"
for scene in intro ideastory spatial dynamic ocr conceptmoe planing qwen3asr outro; do
  echo "file 'scene-$scene.mp4'" >> "$OUTPUT_DIR/filelist.txt"
done

# 拼接视频
echo "🎞️ 拼接视频..."
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/filelist.txt" -c copy "$OUTPUT_DIR/final.mp4"

# 压缩视频以适应Telegram（16MB限制）
echo "📦 压缩视频..."
ffmpeg -y -i "$OUTPUT_DIR/final.mp4" \
  -vcodec h264 -acodec aac \
  -b:v 1.5M -b:a 128k \
  -movflags +faststart \
  "$OUTPUT_DIR/final_compressed.mp4"

echo "✅ 视频制作完成!"
echo "输出文件: $OUTPUT_DIR/final_compressed.mp4"
ls -lh "$OUTPUT_DIR/"*.mp4

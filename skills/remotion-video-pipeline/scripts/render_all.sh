#!/bin/bash

# 一键渲染所有场景并拼接
# 用法: ./render_all.sh [scenes.json]

SCENES_FILE="${1:-scenes.json}"
OUTPUT_DIR="out"

echo "🎬 Remotion Video Pipeline - 批量渲染"
echo "=========================================="

# 1. 测量音频时长
echo "📏 步骤1: 测量音频时长..."
if [ -d "public/audio" ]; then
  echo "{" > audio-durations.json
  first=true
  for file in public/audio/*.mp3; do
    if [ -f "$file" ]; then
      filename=$(basename "$file" .mp3)
      duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" | cut -d. -f1)
      if [ -z "$duration" ]; then duration=5; fi
      duration=$((duration + 1))  # 加1秒缓冲
      
      if [ "$first" = true ]; then first=false; else echo "," >> audio-durations.json; fi
      echo "  \"$filename\": $duration" >> audio-durations.json
    fi
  done
  echo "" >> audio-durations.json
  echo "}" >> audio-durations.json
  echo "  ✅ audio-durations.json 已生成"
fi

# 2. 渲染所有场景
echo ""
echo "🎨 步骤2: 渲染场景..."
mkdir -p "$OUTPUT_DIR"

# 从scenes.json获取场景ID
scenes=$(python3 -c "import json; print(' '.join([s['id'] for s in json.load(open('$SCENES_FILE'))]))")

for scene_id in $scenes; do
  echo "  渲染 Scene-$scene_id..."
  npx remotion render src/index.tsx "Scene-$scene_id" "$OUTPUT_DIR/scene-$scene_id.mp4" 2>&1 | grep -E "(Encoded|Error|error)" | tail -1
done

# 3. 拼接视频
echo ""
echo "🎞️ 步骤3: 拼接视频..."
FILELIST="$OUTPUT_DIR/filelist.txt"
> "$FILELIST"
for scene_id in $scenes; do
  echo "file 'scene-$scene_id.mp4'" >> "$FILELIST"
done

ffmpeg -f concat -i "$FILELIST" -c copy "$OUTPUT_DIR/final.mp4" -y 2>&1 | tail -3
echo "  ✅ final.mp4 已生成"

# 4. 压缩视频
echo ""
echo "🗜️ 步骤4: 压缩视频..."
ffmpeg -i "$OUTPUT_DIR/final.mp4" -c:v libx264 -b:v 1.5M -c:a aac -b:a 128k "$OUTPUT_DIR/final_compressed.mp4" -y 2>&1 | tail -1
echo "  ✅ final_compressed.mp4 已生成"

# 5. 统计信息
echo ""
echo "📊 输出文件:"
ls -lh "$OUTPUT_DIR"/final*.mp4

echo ""
echo "✅ 全部完成！"
echo ""
echo "下一步 - 添加BGM:"
echo "  ./scripts/add_bgm.sh $OUTPUT_DIR/final_compressed.mp4 bgm.mp4 $OUTPUT_DIR/final_with_bgm.mp4 0.5"

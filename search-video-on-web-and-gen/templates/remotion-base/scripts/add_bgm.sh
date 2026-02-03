#!/bin/bash
# add_bgm.sh - 为视频添加背景音乐
# 使用方法: ./add_bgm.sh <输入视频> <背景音乐> <输出视频> [BGM音量]

INPUT_VIDEO="$1"
BGM_FILE="$2"
OUTPUT_VIDEO="$3"
BGM_VOLUME="${4:-0.3}"  # 默认BGM音量为30%

if [ -z "$INPUT_VIDEO" ] || [ -z "$BGM_FILE" ] || [ -z "$OUTPUT_VIDEO" ]; then
    echo "用法: $0 <输入视频> <背景音乐> <输出视频> [BGM音量(0.0-1.0)]"
    echo "示例: $0 final.mp4 bgm.mp3 output.mp4 0.3"
    exit 1
fi

if [ ! -f "$INPUT_VIDEO" ]; then
    echo "错误: 输入视频不存在: $INPUT_VIDEO"
    exit 1
fi

if [ ! -f "$BGM_FILE" ]; then
    echo "错误: 背景音乐不存在: $BGM_FILE"
    exit 1
fi

echo "🎵 正在添加背景音乐..."
echo "   输入视频: $INPUT_VIDEO"
echo "   背景音乐: $BGM_FILE"
echo "   BGM音量: ${BGM_VOLUME} (${BGM_VOLUME}x)"
echo "   输出视频: $OUTPUT_VIDEO"

ffmpeg -i "$INPUT_VIDEO" -i "$BGM_FILE" \
    -filter_complex "[1:a]volume=${BGM_VOLUME}[bgm];[0:a][bgm]amix=inputs=2:duration=first[a]" \
    -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 128k \
    -y "$OUTPUT_VIDEO"

if [ $? -eq 0 ]; then
    echo "✅ 完成! 输出: $OUTPUT_VIDEO"
else
    echo "❌ 添加背景音乐失败"
    exit 1
fi

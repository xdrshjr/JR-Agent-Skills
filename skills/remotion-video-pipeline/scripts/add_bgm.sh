#!/bin/bash

# 添加背景音乐
# 用法: ./add_bgm.sh <input_video> <bgm_file> <output_video> [bgm_volume]

INPUT="$1"
BGM="$2"
OUTPUT="$3"
VOLUME="${4:-0.5}"

if [ -z "$INPUT" ] || [ -z "$BGM" ] || [ -z "$OUTPUT" ]; then
  echo "用法: $0 <输入视频> <背景音乐> <输出视频> [音量]"
  echo "示例: $0 video.mp4 bgm.mp3 output.mp4 0.5"
  echo ""
  echo "音量说明:"
  echo "  0.3 = 30% (很轻)"
  echo "  0.5 = 50% (推荐)"
  echo "  1.0 = 100% (与原声相同)"
  exit 1
fi

# 获取视频时长
VIDEO_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT" | cut -d. -f1)
BGM_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$BGM" | cut -d. -f1)

echo "视频时长: ${VIDEO_DURATION}s"
echo "BGM时长: ${BGM_DURATION}s"
echo "BGM音量: ${VOLUME} ($(echo "$VOLUME * 100" | bc)%)"
echo "=========================================="

# 如果BGM比视频长，截取；如果短，循环
if [ $BGM_DURATION -gt $VIDEO_DURATION ]; then
  BGM_FILTER="atrim=0:${VIDEO_DURATION},asetpts=PTS-STARTPTS,volume=${VOLUME}"
else
  # 循环BGM以匹配视频长度
  LOOPS=$(( (VIDEO_DURATION / BGM_DURATION) + 1 ))
  BGM_FILTER="aloop=loop=${LOOPS}:size=${BGM_DURATION}*48000,atrim=0:${VIDEO_DURATION},asetpts=PTS-STARTPTS,volume=${VOLUME}"
fi

echo "混音中..."

ffmpeg -i "$INPUT" -i "$BGM" -filter_complex "
  [1:a]${BGM_FILTER}[bgm];
  [0:a][bgm]amix=inputs=2:duration=longest:dropout_transition=2[a]
" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$OUTPUT" -y 2>&1 | tail -5

echo ""
echo "✅ 完成: $OUTPUT"
ls -la "$OUTPUT"

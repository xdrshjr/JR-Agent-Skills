#!/bin/bash

# 批量生成TTS音频
# 用法: ./generate_tts.sh <scenes.json> <output_dir> [voice_type]

SCENES_FILE="${1:-scenes.json}"
OUTPUT_DIR="${2:-public/audio}"
VOICE="${3:-zh_male_jieshuoxiaoming_moon_bigtts}"

# 加载豆包TTS环境变量
if [ -f ~/.env ]; then
  export $(grep -v '^#' ~/.env | xargs)
elif [ -f ~/clawd/skills/doubao-open-tts/.env ]; then
  export $(grep -v '^#' ~/clawd/skills/doubao-open-tts/.env | xargs)
fi

mkdir -p "$OUTPUT_DIR"

echo "使用音色: $VOICE"
echo "=========================="

# 解析scenes.json并生成TTS
python3 << EOF
import json
import subprocess
import sys

with open('$SCENES_FILE', 'r', encoding='utf-8') as f:
    scenes = json.load(f)

for scene in scenes:
    scene_id = scene['id']
    tts_text = scene.get('ttsText', '')
    
    if not tts_text:
        # 如果没有ttsText，尝试组合其他字段
        parts = [scene.get('title', '')]
        if scene.get('subtitle'):
            parts.append(scene['subtitle'])
        if scene.get('paragraphs'):
            parts.extend(scene['paragraphs'])
        tts_text = '。'.join([p for p in parts if p])
    
    if tts_text:
        output_file = f"$OUTPUT_DIR/{scene_id}.mp3"
        print(f"生成 {scene_id}.mp3...")
        
        cmd = [
            'python3', 
            '$HOME/clawd/skills/doubao-open-tts/scripts/tts.py',
            tts_text,
            '-v', '$VOICE',
            '-o', output_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✅ {output_file}")
        else:
            print(f"  ❌ 失败: {result.stderr}")
    else:
        print(f"跳过 {scene_id}: 无文案")

print("\n✅ TTS生成完成！")
EOF

ls -la "$OUTPUT_DIR"

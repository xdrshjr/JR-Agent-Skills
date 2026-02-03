#!/bin/bash

# HF Papers to Video - Render Pipeline

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/output"

echo "🎬 HF Papers Video Renderer"
echo "============================"

cd "$PROJECT_DIR"

# Check dependencies
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Install Node.js first."
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Install ffmpeg first."
    exit 1
fi

# Render each scene
echo ""
echo "Rendering scenes..."

for scene in intro ideastory spatial dynamic ocr conceptmoe planing qwen3asr outro; do
    echo ""
    echo "[$scene] Rendering..."
    npx remotion render src/index.tsx "Scene-$scene" "$OUTPUT_DIR/scene-$scene.mp4" --log=error || echo "Warning: $scene failed"
done

# Create concatenation list
echo ""
echo "Creating file list..."
> "$OUTPUT_DIR/filelist.txt"
for scene in intro ideastory spatial dynamic ocr conceptmoe planing qwen3asr outro; do
    if [ -f "$OUTPUT_DIR/scene-$scene.mp4" ]; then
        echo "file 'scene-$scene.mp4'" >> "$OUTPUT_DIR/filelist.txt"
    fi
done

# Concatenate
echo ""
echo "Concatenating scenes..."
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/filelist.txt" -c copy "$OUTPUT_DIR/final.mp4"

# Compress for Telegram
echo ""
echo "Compressing for Telegram (16MB limit)..."
ffmpeg -y -i "$OUTPUT_DIR/final.mp4" \
    -vcodec h264 -acodec aac \
    -b:v 600k -b:a 80k \
    -movflags +faststart \
    "$OUTPUT_DIR/final_telegram.mp4"

echo ""
echo "✅ Done!"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR/"*.mp4 | grep -v scene-

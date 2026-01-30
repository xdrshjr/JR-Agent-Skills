#!/bin/bash

# 快速创建视频项目
# 用法: ./create_video.sh <项目名> <输出路径>

PROJECT_NAME="$1"
OUTPUT_PATH="${2:-.}"

if [ -z "$PROJECT_NAME" ]; then
  echo "用法: $0 <项目名> [输出路径]"
  echo "示例: $0 '约克夏介绍' ~/output/yorkie"
  exit 1
fi

SKILL_DIR="$HOME/clawd/skills/remotion-video-pipeline"
FULL_PATH="$OUTPUT_PATH"

echo "🎬 创建视频项目: $PROJECT_NAME"
echo "输出路径: $FULL_PATH"
echo "=========================================="

# 创建目录
mkdir -p "$FULL_PATH"
cd "$FULL_PATH"

# 复制模板
echo "复制模板文件..."
cp -r "$SKILL_DIR/templates/remotion-base/src" .
cp -r "$SKILL_DIR/templates/remotion-base/public" .
cp "$SKILL_DIR/templates/remotion-base/scenes.json" .
cp "$SKILL_DIR/templates/remotion-base/tsconfig.json" .
cp "$SKILL_DIR/templates/remotion-base/package.json" .

# 初始化npm
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install 2>&1 | tail -5
fi

# 创建脚本链接
mkdir -p scripts
ln -sf "$SKILL_DIR/scripts/generate_tts.sh" scripts/
ln -sf "$SKILL_DIR/scripts/download_video.sh" scripts/
ln -sf "$SKILL_DIR/scripts/extract_clips.sh" scripts/
ln -sf "$SKILL_DIR/scripts/add_bgm.sh" scripts/
ln -sf "$SKILL_DIR/scripts/render_all.sh" scripts/

echo ""
echo "✅ 项目创建完成!"
echo ""
echo "📁 项目结构:"
tree -L 2 -I node_modules . 2>/dev/null || find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' | head -20

echo ""
echo "📝 下一步:"
echo "  1. cd $FULL_PATH"
echo "  2. 编辑 scenes.json 配置内容"
echo "  3. ./scripts/download_video.sh '搜索关键词' public/videos 5"
echo "  4. ./scripts/generate_tts.sh scenes.json public/audio"
echo "  5. ./scripts/render_all.sh"
echo "  6. ./scripts/add_bgm.sh out/final_compressed.mp4 bgm.mp3 final.mp4 0.5"

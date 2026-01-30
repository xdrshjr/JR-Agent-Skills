#!/bin/bash
# Quick Start Script for Remotion Synced Video with Unsplash

set -e

echo "🚀 Remotion Synced Video - 快速启动"
echo ""

# 检查环境变量
if [ -z "$UNSPLASH_ACCESS_KEY" ]; then
  echo "❌ 错误: 未设置 UNSPLASH_ACCESS_KEY 环境变量"
  echo ""
  echo "请按以下步骤获取："
  echo "1. 访问 https://unsplash.com/developers"
  echo "2. 注册并创建新应用"
  echo "3. 复制 Access Key"
  echo "4. 运行: export UNSPLASH_ACCESS_KEY='你的密钥'"
  echo ""
  exit 1
fi

# 检查参数
if [ $# -lt 1 ]; then
  echo "用法: ./quickstart.sh <项目目录>"
  echo "示例: ./quickstart.sh ./my-video"
  exit 1
fi

PROJECT_DIR=$1
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📁 创建项目目录: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 初始化 npm 项目
echo "📦 初始化 npm 项目..."
npm init -y

# 安装依赖
echo "📦 安装依赖..."
npm install @remotion/cli remotion react react-dom axios

# 创建目录结构
echo "📂 创建目录结构..."
mkdir -p src/scenes src/components src/utils public/audio public/images segments out

# 复制模板文件
echo "📄 复制模板文件..."
cp "$SKILL_DIR/src/components/UnsplashImage.tsx" src/components/
cp "$SKILL_DIR/src/components/GradientOverlay.tsx" src/components/
cp "$SKILL_DIR/src/components/Typography.tsx" src/components/
cp "$SKILL_DIR/src/components/index.ts" src/components/
cp "$SKILL_DIR/src/scenes/SceneTemplate.tsx" src/scenes/
cp "$SKILL_DIR/src/index.tsx" src/
cp "$SKILL_DIR/scenes.json" .
cp "$SKILL_DIR/scripts/search_images.js" scripts/

# 更新 package.json
echo "📝 配置 package.json..."
cat > package.json << 'EOF'
{
  "name": "my-video",
  "version": "1.0.0",
  "scripts": {
    "dev": "remotion preview src/index.tsx",
    "build": "remotion render src/index.tsx",
    "upgrade": "remotion upgrade"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "remotion": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "axios": "^1.6.0"
  }
}
EOF

echo ""
echo "✅ 项目创建完成！"
echo ""
echo "下一步："
echo "1. cd $PROJECT_DIR"
echo "2. 编辑 scenes.json 配置你的场景"
echo "3. node scripts/search_images.js scenes.json public/images"
echo "4. npm run dev"
echo ""

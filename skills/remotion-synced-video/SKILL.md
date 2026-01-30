---
name: remotion-synced-video
description: Create synchronized videos with Remotion, TTS, and Unsplash images - professional-grade videos with real imagery, perfect audio sync, and polished visual design.
metadata:
  tags: remotion, video, tts, audio-sync, unsplash, images, react, professional
---

# Remotion Synced Video with Unsplash

创建专业级视频，集成真实图片、完美音频同步和精美视觉设计。使用 Remotion + TTS + Unsplash，生成具有顶级大厂风格的视频内容。

## ✨ Features

- 🖼️ **Unsplash 真实图片** - 自动搜索并下载高质量相关图片
- ✅ **完美音视频同步** - 每个场景等待音频播放完成
- 🎙️ **多 TTS 支持** - 支持豆包、Volcano 或任何 TTS 服务
- 🎬 **模块化场景架构** - 易于编辑的场景组件
- 📐 **动态时长计算** - 根据音频时长自动计算帧数
- 🔧 **FFmpeg 拼接** - 无缝合并所有场景
- 🎨 **专业视觉风格** - 预设顶级大厂设计模板

## 工作流程

```
脚本 → TTS 音频 → 搜索 Unsplash 图片 → 测量时长 → 渲染场景 → 拼接视频
```

## 前置要求

```bash
# 安装 Remotion
npm install @remotion/cli remotion react react-dom

# 安装 FFmpeg
brew install ffmpeg  # macOS

# 安装依赖
npm install axios
```

## Unsplash API 配置

### 1. 获取 Unsplash Access Key

1. 访问 [Unsplash Developers](https://unsplash.com/developers)
2. 注册并创建新应用
3. 获取 **Access Key**

### 2. 设置环境变量

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export UNSPLASH_ACCESS_KEY="your_access_key_here"

# 立即生效
source ~/.zshrc
```

## 项目结构

```
my-video/
├── src/
│   ├── index.tsx              # 注册所有 compositions
│   ├── scenes/                # 场景组件
│   │   ├── SceneTemplate.tsx  # 专业风格模板
│   │   └── ...
│   ├── components/            # 共享组件
│   │   ├── UnsplashImage.tsx  # 图片展示组件
│   │   ├── GradientOverlay.tsx # 渐变遮罩
│   │   └── Typography.tsx     # 排版组件
│   └── utils/
│       └── imageSearch.ts     # Unsplash 搜索工具
├── scripts/
│   ├── search_images.js       # 图片搜索脚本
│   └── download_images.js     # 图片下载脚本
├── public/
│   ├── audio/                 # TTS 音频文件
│   └── images/                # Unsplash 图片
├── segments/                  # 场景视频输出
├── out/
│   └── final.mp4             # 最终视频
└── package.json
```

## 快速开始

### 1. 创建项目

```bash
mkdir my-video && cd my-video
npm init -y
npm install @remotion/cli remotion react react-dom axios
```

### 2. 创建图片搜索脚本

创建 `scripts/search_images.js`：

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('❌ 请设置 UNSPLASH_ACCESS_KEY 环境变量');
  process.exit(1);
}

// 搜索 Unsplash 图片
async function searchUnsplash(query, perPage = 5) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      },
      params: {
        query: query,
        per_page: perPage,
        orientation: 'landscape',  // 16:9 横屏
        content_filter: 'high'     // 高质量内容
      }
    });
    
    return response.data.results.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,      // 1080px 宽度
      thumb: photo.urls.small,      // 缩略图
      download_url: photo.links.download_location,
      author: photo.user.name,
      description: photo.description || photo.alt_description
    }));
  } catch (error) {
    console.error('搜索失败:', error.message);
    return [];
  }
}

// 下载图片
async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ 下载完成: ${path.basename(outputPath)}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('下载失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node scripts/search_images.js <场景JSON> <输出目录>');
    console.log('示例: node scripts/search_images.js scenes.json public/images');
    process.exit(1);
  }
  
  const scenesFile = args[0];
  const outputDir = args[1];
  
  // 读取场景配置
  const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = [];
  
  for (const scene of scenes) {
    console.log(`\n🔍 搜索: "${scene.searchQuery}"`);
    
    const images = await searchUnsplash(scene.searchQuery, 3);
    
    if (images.length > 0) {
      // 选择第一张图片
      const selected = images[0];
      const filename = `scene-${scene.id}-${selected.id}.jpg`;
      const outputPath = path.join(outputDir, filename);
      
      // 下载图片
      await downloadImage(selected.url, outputPath);
      
      results.push({
        sceneId: scene.id,
        imagePath: `images/${filename}`,
        author: selected.author,
        query: scene.searchQuery
      });
    } else {
      console.log(`⚠️ 未找到图片: ${scene.searchQuery}`);
    }
  }
  
  // 保存映射文件
  fs.writeFileSync(
    path.join(outputDir, '../image-map.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✨ 全部完成！');
  console.log(`📁 图片映射: public/image-map.json`);
}

main().catch(console.error);
```

### 3. 创建专业场景组件模板

创建 `src/components/UnsplashImage.tsx`：

```typescript
import React from 'react';
import {Img, staticFile, useCurrentFrame, interpolate} from 'remotion';

interface UnsplashImageProps {
  src: string;
  style?: React.CSSProperties;
  animation?: 'zoom' | 'fade' | 'slide' | 'none';
}

export const UnsplashImage: React.FC<UnsplashImageProps> = ({
  src,
  style = {},
  animation = 'zoom'
}) => {
  const frame = useCurrentFrame();
  
  // Ken Burns 缩放效果
  const zoomScale = animation === 'zoom' 
    ? interpolate(frame, [0, 300], [1, 1.15], {extrapolateRight: 'clamp'})
    : 1;
  
  // 淡入效果
  const opacity = animation === 'fade'
    ? interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'})
    : 1;
  
  // 滑动效果
  const translateX = animation === 'slide'
    ? interpolate(frame, [0, 300], [50, 0], {extrapolateRight: 'clamp'})
    : 0;
  
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${zoomScale}) translateX(${translateX}px)`,
        opacity,
        ...style
      }}
    />
  );
};
```

创建 `src/components/GradientOverlay.tsx`：

```typescript
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';

interface GradientOverlayProps {
  variant?: 'dark' | 'light' | 'colored' | 'vignette';
  intensity?: number;  // 0-1
  color?: string;
}

export const GradientOverlay: React.FC<GradientOverlayProps> = ({
  variant = 'dark',
  intensity = 0.6,
  color = '#000000'
}) => {
  const frame = useCurrentFrame();
  
  // 动态强度变化
  const dynamicIntensity = interpolate(
    frame,
    [0, 60],
    [0, intensity],
    {extrapolateRight: 'clamp'}
  );
  
  const gradients = {
    dark: `linear-gradient(180deg, 
      rgba(0,0,0,${dynamicIntensity * 0.3}) 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.5}) 50%, 
      rgba(0,0,0,${dynamicIntensity}) 100%)`,
    
    light: `linear-gradient(180deg, 
      rgba(255,255,255,${dynamicIntensity * 0.2}) 0%, 
      rgba(255,255,255,${dynamicIntensity * 0.4}) 100%)`,
    
    colored: `linear-gradient(135deg, 
      ${color}${Math.round(dynamicIntensity * 255).toString(16).padStart(2, '0')} 0%, 
      transparent 60%)`,
    
    vignette: `radial-gradient(ellipse at center, 
      transparent 0%, 
      rgba(0,0,0,${dynamicIntensity * 0.8}) 100%)`
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: gradients[variant],
        pointerEvents: 'none'
      }}
    />
  );
};
```

创建 `src/components/Typography.tsx`：

```typescript
import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

interface TitleProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export const Title: React.FC<TitleProps> = ({children, delay = 0, style = {}}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + 25], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <h1
      style={{
        fontSize: 72,
        fontWeight: 800,
        color: '#ffffff',
        margin: 0,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        textShadow: '0 4px 30px rgba(0,0,0,0.3)',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {children}
    </h1>
  );
};

interface SubtitleProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export const Subtitle: React.FC<SubtitleProps> = ({children, delay = 10, style = {}}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  const translateY = interpolate(frame, [delay, delay + 25], [30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <p
      style={{
        fontSize: 32,
        fontWeight: 400,
        color: 'rgba(255,255,255,0.9)',
        margin: '16px 0 0 0',
        lineHeight: 1.4,
        textShadow: '0 2px 20px rgba(0,0,0,0.3)',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {children}
    </p>
  );
};

interface CaptionProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export const Caption: React.FC<CaptionProps> = ({children, delay = 20, style = {}}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [delay, delay + 15], [0, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  
  return (
    <span
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      {children}
    </span>
  );
};
```

创建 `src/scenes/SceneTemplate.tsx`（专业风格模板）：

```typescript
import React from 'react';
import {AbsoluteFill, Audio, staticFile, Sequence} from 'remotion';
import {UnsplashImage} from '../components/UnsplashImage';
import {GradientOverlay} from '../components/GradientOverlay';
import {Title, Subtitle, Caption} from '../components/Typography';

interface SceneTemplateProps {
  audioSrc?: string;
  imageSrc?: string;
  caption?: string;
  title: string;
  subtitle?: string;
  variant?: 'hero' | 'split' | 'minimal' | 'overlay';
  imageAnimation?: 'zoom' | 'fade' | 'slide' | 'none';
}

export const SceneTemplate: React.FC<SceneTemplateProps> = ({
  audioSrc,
  imageSrc = 'images/default.jpg',
  caption,
  title,
  subtitle,
  variant = 'hero',
  imageAnimation = 'zoom'
}) => {
  const variants = {
    hero: {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 120px'
      },
      overlay: 'dark' as const
    },
    split: {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 80px'
      },
      overlay: 'vignette' as const
    },
    minimal: {
      container: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        textAlign: 'left' as const,
        padding: '80px'
      },
      overlay: 'dark' as const
    },
    overlay: {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 100px'
      },
      overlay: 'colored' as const
    }
  };
  
  const currentVariant = variants[variant];
  
  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a1a'}}>
      {/* 背景图片 */}
      {imageSrc && (
        <UnsplashImage 
          src={imageSrc} 
          animation={imageAnimation}
        />
      )}
      
      {/* 渐变遮罩 */}
      <GradientOverlay variant={currentVariant.overlay} intensity={0.7} />
      
      {/* 内容区域 */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          ...currentVariant.container
        }}
      >
        {caption && <Caption delay={5}>{caption}</Caption>}
        <Title delay={15}>{title}</Title>
        {subtitle && <Subtitle delay={30}>{subtitle}</Subtitle>}
      </AbsoluteFill>
      
      {/* 音频 */}
      {audioSrc && <Audio src={staticFile(audioSrc)} volume={1} />}
    </AbsoluteFill>
  );
};
```

### 4. 创建场景配置

创建 `scenes.json`：

```json
[
  {
    "id": "intro",
    "searchQuery": "technology future abstract",
    "title": "人工智能的未来",
    "subtitle": "探索改变世界的技术力量",
    "variant": "hero",
    "caption": "Introduction"
  },
  {
    "id": "problem",
    "searchQuery": "complex data visualization",
    "title": "数据爆炸时代",
    "subtitle": "传统方法已无法满足需求",
    "variant": "split",
    "caption": "The Challenge"
  },
  {
    "id": "solution",
    "searchQuery": "ai neural network blue",
    "title": "智能解决方案",
    "subtitle": "让 AI 为您处理复杂任务",
    "variant": "minimal",
    "caption": "Our Solution"
  }
]
```

### 5. 完整工作流脚本

创建 `scripts/full_workflow.sh`：

```bash
#!/bin/bash
set -e

echo "🎬 开始生成专业视频"

# 配置
SCENES_FILE="scenes.json"
PUBLIC_DIR="public"
AUDIO_DIR="$PUBLIC_DIR/audio"
IMAGE_DIR="$PUBLIC_DIR/images"
SEGMENTS_DIR="segments"
FPS=30

# 创建目录
mkdir -p "$AUDIO_DIR" "$IMAGE_DIR" "$SEGMENTS_DIR"

# 1. 搜索并下载图片
echo ""
echo "🖼️  步骤 1: 搜索 Unsplash 图片"
node scripts/search_images.js "$SCENES_FILE" "$IMAGE_DIR"

# 2. 生成 TTS 音频
echo ""
echo "🎙️  步骤 2: 生成 TTS 音频"

# 读取场景并生成音频
scenes=$(cat "$SCENES_FILE" | jq -c '.[]')

while IFS= read -r scene; do
  id=$(echo "$scene" | jq -r '.id')
  title=$(echo "$scene" | jq -r '.title')
  subtitle=$(echo "$scene" | jq -r '.subtitle // empty')
  
  # 组合文本
  text="$title。$subtitle"
  
  echo "生成音频: $id"
  
  # 使用豆包 TTS（假设有 tts.py 脚本）
  # python tts.py "$text" -v zh_female_cancan_mars_bigtts -o "$AUDIO_DIR/$id.mp3"
  
  # 或者使用其他 TTS 服务
  
done <<< "$scenes"

# 3. 获取音频时长并渲染
echo ""
echo "🎬 步骤 3: 渲染场景"

# 读取图片映射
imageMap=$(cat "$PUBLIC_DIR/image-map.json" | jq -c '.[]')

while IFS= read -r item; do
  sceneId=$(echo "$item" | jq -r '.sceneId')
  imagePath=$(echo "$item" | jq -r '.imagePath')
  
  audioFile="$AUDIO_DIR/$sceneId.mp3"
  
  if [ -f "$audioFile" ]; then
    # 获取音频时长
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$audioFile")
    frames=$(echo "$duration * $FPS" | bc | xargs printf "%.0f")
    
    echo "渲染 $sceneId: ${duration}s = ${frames} frames"
    
    # 渲染场景
    npx remotion render src/index.tsx "Scene-$sceneId" "$SEGMENTS_DIR/$sceneId.mp4" --props="{\"imageSrc\":\"$imagePath\",\"audioSrc\":\"audio/$sceneId.mp3\"}"
  else
    echo "⚠️  跳过 $sceneId (无音频文件)"
  fi
done <<< "$imageMap"

# 4. 拼接视频
echo ""
echo "🔧 步骤 4: 拼接视频"

# 创建拼接列表
ls -1 "$SEGMENTS_DIR"/*.mp4 | sed "s|^|file '../|" | sed "s|$|'|" > concat_list.txt

# 拼接
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy out/final.mp4 -y

echo ""
echo "✅ 视频生成完成: out/final.mp4"
```

### 6. 注册 Compositions

更新 `src/index.tsx`：

```typescript
import {Composition, staticFile, registerRoot} from 'remotion';
import {SceneTemplate} from './scenes/SceneTemplate';
import scenes from '../scenes.json';
import imageMap from '../public/image-map.json';

const FPS = 30;

// 获取场景配置
const getSceneConfig = (sceneId: string) => {
  return scenes.find(s => s.id === sceneId);
};

// 获取图片路径
const getImagePath = (sceneId: string) => {
  const mapping = imageMap.find(m => m.sceneId === sceneId);
  return mapping ? mapping.imagePath : 'images/default.jpg';
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {scenes.map((scene, index) => {
        const audioFile = `audio/${scene.id}.mp3`;
        const imagePath = getImagePath(scene.id);
        
        // 这里需要根据实际音频时长设置 durationInFrames
        // 可以通过脚本动态生成或手动设置
        const defaultDuration = 180; // 6秒 @ 30fps
        
        return (
          <Composition
            key={scene.id}
            id={`Scene-${scene.id}`}
            component={SceneTemplate}
            durationInFrames={defaultDuration}
            fps={FPS}
            width={1920}
            height={1080}
            defaultProps={{
              audioSrc: audioFile,
              imageSrc: imagePath,
              caption: scene.caption,
              title: scene.title,
              subtitle: scene.subtitle,
              variant: scene.variant || 'hero',
              imageAnimation: 'zoom'
            }}
          />
        );
      })}
    </>
  );
};

registerRoot(RemotionRoot);
```

## 视觉风格指南

### 专业设计原则

1. **Typography**
   - 标题: 72px, font-weight 800
   - 副标题: 32px, font-weight 400
   - 说明: 14px, uppercase, letter-spacing 0.1em

2. **Color Palette**
   - 主背景: `#1a1a1a`
   - 主文字: `#ffffff`
   - 次要文字: `rgba(255,255,255,0.9)`
   - 遮罩: 渐变从 30% 到 100% 透明度

3. **Animation**
   - 淡入: 20-25 帧
   - Ken Burns: 300 帧内从 1.0 缩放到 1.15
   - Easing: `Easing.out(Easing.cubic)`

4. **Layout**
   - Hero: 居中，全屏图片
   - Split: 左文右图（或反之）
   - Minimal: 底部对齐，简洁文字

### Unsplash 搜索关键词建议

| 场景类型 | 推荐关键词 |
|---------|-----------|
| 科技 | `technology abstract blue`, `digital network`, `futuristic interface` |
| 自然 | `landscape mountain sunset`, `ocean waves aerial`, `forest mist` |
| 商业 | `modern office workspace`, `business meeting professional`, `city skyline` |
| 创意 | `creative design studio`, `colorful abstract art`, `minimal architecture` |

## 完整示例

```bash
# 1. 创建项目
mkdir my-video && cd my-video
npm init -y
npm install @remotion/cli remotion react react-dom axios

# 2. 设置环境变量
export UNSPLASH_ACCESS_KEY="your_key_here"

# 3. 创建场景配置
cat > scenes.json << 'EOF'
[
  {
    "id": "intro",
    "searchQuery": "artificial intelligence robot future",
    "title": "AI 革命",
    "subtitle": "正在改变我们的世界",
    "variant": "hero"
  }
]
EOF

# 4. 搜索图片
node scripts/search_images.js scenes.json public/images

# 5. 生成音频并渲染
# ... (TTS 步骤)

# 6. 预览
npx remotion preview src/index.tsx

# 7. 渲染
npx remotion render src/index.tsx Scene-intro out/intro.mp4
```

## 高级技巧

### 1. 动态背景颜色提取

```typescript
// 从图片提取主色调作为渐变
import {getDominantColor} from './utils/color';

const dominantColor = await getDominantColor(imagePath);
<GradientOverlay variant="colored" color={dominantColor} />
```

### 2. 多图轮播

```typescript
<Sequence from={0} durationInFrames={150}>
  <UnsplashImage src="image1.jpg" animation="fade" />
</Sequence>
<Sequence from={150} durationInFrames={150}>
  <UnsplashImage src="image2.jpg" animation="fade" />
</Sequence>
```

### 3. 文字遮罩效果

```typescript
// 文字使用图片作为背景
<h1 style={{
  backgroundImage: `url(${imageSrc})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  backgroundSize: 'cover'
}}>
  标题文字
</h1>
```

## 常见问题

### Q: Unsplash API 限制？
A: 免费版每小时 50 次请求。如需更多，可申请提升限额或使用缓存。

### Q: 图片尺寸不合适？
A: Unsplash 返回多种尺寸：`raw`, `full`, `regular`, `small`, `thumb`。建议使用 `regular` (1080px)。

### Q: 需要图片署名？
A: 根据 Unsplash 许可，建议署名词作者。可在视频结尾添加致谢页面。

---

**Pro Tip**: 使用 `orientation: 'landscape'` 确保获取 16:9 横屏图片，与视频比例匹配！

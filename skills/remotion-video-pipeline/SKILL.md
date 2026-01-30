---
name: remotion-video-pipeline
description: Automated video production pipeline - search video素材, generate TTS narration with Doubao, create professional videos with Remotion, add background music. All-in-one video content factory.
metadata:
  tags: remotion, video, pipeline, tts, doubao, automation, content-creation, youtube, bgm
---

# Remotion Video Pipeline

一站式视频生产流水线：搜索视频素材 → 生成豆包TTS配音 → Remotion专业渲染 → 添加背景音乐。快速将文字内容转化为精美短视频。

## ✨ Features

- 🔍 **智能素材搜索** - 使用 yt-dlp 自动搜索并下载 YouTube 视频素材
- ✂️ **自动剪辑** - FFmpeg 自动裁剪、转码视频片段
- 🎙️ **豆包TTS配音** - 使用豆包（火山引擎）高质量语音合成
- 🎬 **Remotion渲染** - 专业级视频渲染，支持视频/图片背景
- 🎵 **背景音乐** - 自动添加免版权BGM，智能音量平衡
- 📦 **全流程自动化** - 一条命令完成从素材到成品

## 前置要求

```bash
# 1. 安装依赖
brew install ffmpeg yt-dlp
npm install -g @remotion/cli

# 2. 安装豆包 TTS skill
cd ~/clawd/skills/doubao-open-tts
pip install -r requirements.txt

# 3. 配置火山引擎密钥
cp ~/clawd/skills/doubao-open-tts/.env.example.txt ~/.env
# 编辑 .env 添加你的密钥
```

## 快速开始

### 方式一：使用脚本（推荐）

```bash
# 创建视频项目
cd ~/clawd/skills/remotion-video-pipeline
./scripts/create-video.sh "约克夏犬介绍" ~/output/yorkie

# 按提示操作：
# 1. 编辑 scenes.json 设置内容
# 2. 运行渲染脚本
# 3. 获取成品视频
```

### 方式二：手动流程

```bash
# 1. 创建项目
mkdir my-video && cd my-video
npm init -y
npm install @remotion/cli remotion react react-dom axios

# 2. 复制模板
cp -r ~/clawd/skills/remotion-video-pipeline/templates/remotion-base/* .

# 3. 下载视频素材
yt-dlp -f "18" -o "raw_video.%(ext)s" "ytsearch1:关键词"
ffmpeg -i raw_video.mp4 -ss 00:00:10 -t 10 clip1.mp4

# 4. 生成TTS音频
python3 ~/clawd/skills/doubao-open-tts/scripts/tts.py "你的文案" \
  -v zh_male_jieshuoxiaoming_moon_bigtts -o audio/intro.mp3

# 5. 渲染视频
npx remotion render src/index.tsx Scene-intro out/intro.mp4

# 6. 添加BGM
ffmpeg -i final.mp4 -i bgm.mp3 -filter_complex \
  "[1:a]volume=0.5[bgm];[0:a][bgm]amix=inputs=2:duration=longest[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac output.mp4
```

## 项目结构

```
my-video/
├── scenes.json              # 场景配置（核心文件）
├── audio-durations.json     # 音频时长配置（自动生成）
├── src/
│   ├── index.tsx           # Remotion入口
│   ├── scenes/
│   │   └── SceneTemplate.tsx
│   └── components/         # UI组件
├── public/
│   ├── audio/              # TTS音频
│   ├── images/             # 图片素材
│   └── videos/             # 视频素材
├── out/                    # 输出目录
└── scripts/
    ├── generate_tts.sh     # 批量生成TTS
    ├── download_video.sh   # 下载视频素材
    └── add_bgm.sh          # 添加背景音乐
```

## 场景配置 (scenes.json)

```json
[
  {
    "id": "intro",
    "searchQuery": "yorkshire terrier puppy", 
    "title": "约克夏犬",
    "subtitle": "迷你的外表，巨大的个性",
    "caption": "INTRODUCTION",
    "variant": "hero",
    "videoSrc": "videos/clip1.mp4",
    "ttsText": "约克夏犬，迷你的外表，巨大的个性。"
  },
  {
    "id": "content",
    "title": "起源与历史", 
    "variant": "content-rich",
    "videoSrc": "videos/clip2.mp4",
    "paragraphs": ["段落1", "段落2"],
    "bulletPoints": ["要点1", "要点2"],
    "ttsText": "约克夏犬起源于19世纪的英国约克郡..."
  }
]
```

### 配置字段说明

| 字段 | 说明 |
|------|------|
| `id` | 场景唯一标识 |
| `searchQuery` | 搜索视频素材的关键词 |
| `title` | 主标题 |
| `subtitle` | 副标题 |
| `caption` | 章节标签（大写） |
| `variant` | 布局变体：hero/centered/content-rich/minimal |
| `videoSrc` | 视频素材路径 |
| `ttsText` | 配音文案 |
| `paragraphs` | 段落内容数组 |
| `bulletPoints` | 要点列表 |

## 自动化脚本

### 1. 批量生成TTS

```bash
./scripts/generate_tts.sh scenes.json public/audio

# 可选参数：
# -v 指定音色（默认：解说小明）
# -s 指定语速
```

### 2. 下载视频素材

```bash
./scripts/download_video.sh "搜索关键词" public/videos 5

# 参数说明：
# $1 - 搜索关键词
# $2 - 输出目录
# $3 - 下载数量（默认5）
```

### 3. 自动剪辑片段

```bash
./scripts/extract_clips.sh raw_video.mp4 public/videos/ 10

# 从视频中自动提取多个10秒片段
```

### 4. 添加背景音乐

```bash
./scripts/add_bgm.sh input.mp4 bgm.mp3 output.mp4 0.5

# 参数说明：
# $1 - 输入视频
# $2 - 背景音乐
# $3 - 输出视频
# $4 - BGM音量（相对于原声，默认0.5=50%）
```

### 5. 一键渲染全部

```bash
./scripts/render_all.sh

# 自动：
# 1. 测量音频时长
# 2. 渲染所有场景
# 3. 拼接最终视频
# 4. 压缩输出
```

## 推荐音色

### 中文男声（新闻/解说类）

| 音色 | Voice Type | 特点 | 权限 |
|------|------------|------|------|
| 解说小明 | `zh_male_jieshuoxiaoming_moon_bigtts` | 自然解说风格 | ⭐ 无需权限 |
| 新闻小志 | `zh_male_xinwenxiaozhi_mars_bigtts` | 标准新闻播报 | 需开通 |
| 经典小明 | `zh_male_jingdianxiaoming_mars_bigtts` | 纪录片风格 | 需开通 |
| 小莫 | `zh_male_xiaomo_mars_bigtts` | 温暖友好 | 需开通 |

### 中文女声

| 音色 | Voice Type | 特点 |
|------|------------|------|
| 灿灿 | `zh_female_cancan_mars_bigtts` | 活泼女声 |
| 新闻小静 | `zh_female_xinwenxiaojing_mars_bigtts` | 专业新闻 |

## 免费BGM来源

1. **Free Music Archive** - `https://freemusicarchive.org`
2. **Incompetech** - `https://incompetech.com`
3. **ccMixter** - `http://ccmixter.org`
4. **Musopen** - `https://musopen.org`

搜索关键词：`cute`, `happy`, `upbeat`, `pet`, `playful`, `warm`

## 完整示例流程

```bash
# 1. 创建视频目录
mkdir -p ~/output/my-video && cd ~/output/my-video

# 2. 初始化项目
cp -r ~/clawd/skills/remotion-video-pipeline/templates/remotion-base/* .
npm install

# 3. 编辑 scenes.json 定义内容
vim scenes.json

# 4. 下载视频素材
~/clawd/skills/remotion-video-pipeline/scripts/download_video.sh \
  "yorkshire terrier puppy" public/videos 5

# 5. 提取片段
ffmpeg -i public/videos/video1.mp4 -ss 00:00:10 -t 10 public/videos/clip1.mp4

# 6. 生成TTS
~/clawd/skills/remotion-video-pipeline/scripts/generate_tts.sh scenes.json public/audio

# 7. 渲染所有场景
~/clawd/skills/remotion-video-pipeline/scripts/render_all.sh

# 8. 添加BGM
curl -L -o bgm.mp3 "https://files.freemusicarchive.org/..."
~/clawd/skills/remotion-video-pipeline/scripts/add_bgm.sh \
  out/final.mp4 bgm.mp4 out/final_with_bgm.mp4 0.5

# ✅ 完成！
```

## 输出文件

- `out/scene-*.mp4` - 单个场景视频
- `out/final.mp4` - 完整视频（未压缩）
- `out/final_compressed.mp4` - 压缩版（推荐分享）
- `out/final_with_bgm.mp4` - 带背景音乐版本

## 常见问题

**Q: 视频太大怎么办？**
```bash
ffmpeg -i input.mp4 -b:v 1.5M -b:a 128k output.mp4
```

**Q: 如何调整BGM音量？**
```bash
# 修改 add_bgm.sh 中的 volume 参数
# 0.3 = 30%, 0.5 = 50%, 1.0 = 100%
```

**Q: TTS生成失败？**
- 检查 `.env` 中的火山引擎密钥
- 确保音色不需要额外权限（推荐解说小明）
- 检查网络连接

**Q: 如何修改场景时长？**
音频时长自动测量，如需手动调整：
```bash
# 编辑 audio-durations.json
{
  "intro": 10,    # 单位：秒
  "content": 15
}
```

## 最佳实践

1. **文案长度** - 每场景 50-80 字，对应 5-10 秒
2. **视频时长** - 短视频 30-60 秒最佳
3. **BGM音量** - 设为解说音量的 30-50%
4. **素材搜索** - 使用英文关键词效果最佳
5. **色彩统一** - 在 scenes.json 中设置统一的 accentColor

---

**用这个 skill，30分钟就能做出一条精美的科普短视频！** 🎬

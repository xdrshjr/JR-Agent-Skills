# Remotion Video Pipeline

一站式视频生产流水线，快速将文字内容转化为精美短视频。

## 快速开始

```bash
# 创建新项目
~/clawd/skills/remotion-video-pipeline/scripts/create_video.sh "我的视频" ~/output/myvideo

# 进入项目
cd ~/output/myvideo

# 1. 编辑 scenes.json 配置内容
# 2. 下载素材
./scripts/download_video.sh "搜索关键词" public/videos 5

# 3. 生成TTS配音
./scripts/generate_tts.sh scenes.json public/audio

# 4. 渲染视频
./scripts/render_all.sh

# 5. 添加BGM（可选）
./scripts/add_bgm.sh out/final_compressed.mp4 bgm.mp3 final.mp4 0.5
```

## 详细文档

参见 [SKILL.md](./SKILL.md)

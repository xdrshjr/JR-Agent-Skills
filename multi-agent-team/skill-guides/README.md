# Skill Guides Index

多智能体团队的技能使用指南库

---

## 视频制作类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [remotion-synced-video](./remotion-synced-video.md) | 专业视频生成（含配音、图片） | ⭐⭐⭐⭐ | 高 |
| [search-video-on-web-and-gen](./search-video-on-web-and-gen.md) | 网页视频素材搜索与生成 | ⭐⭐⭐ | 中 |
| [video-transcript-downloader](./video-transcript-downloader.md) | 视频字幕下载 | ⭐⭐ | 中 |

## 图像处理类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [nano-banana-pro](./nano-banana-pro.md) | AI 图像生成/编辑 | ⭐⭐⭐ | 高 |
| [google-images-crawler](./google-images-crawler.md) | 谷歌图片搜索下载 | ⭐⭐ | 中 |
| [excalidraw-flowchart](./excalidraw-flowchart.md) | 流程图/架构图生成 | ⭐⭐ | 低 |

## 音频处理类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [doubao-open-tts](./doubao-open-tts.md) | 豆包语音合成 | ⭐⭐ | 高 |

## 文档处理类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [markdown-converter](./markdown-converter.md) | 多格式转 Markdown | ⭐⭐ | 高 |
| [report-generator](./report-generator.md) | 自动生成研究报告 | ⭐⭐⭐ | 中 |
| [hf-papers-reporter](./hf-papers-reporter.md) | HF 论文报告生成 | ⭐⭐⭐ | 中 |

## 研究开发类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [moltresearch](./moltresearch.md) | AI 研究协作平台 | ⭐⭐⭐ | 中 |
| [paper-daily](./paper-daily.md) | 每日 AI 论文追踪 | ⭐⭐ | 低 |

## 开发工具类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [github-commit-push](./github-commit-push.md) | GitHub 代码提交 | ⭐⭐ | 中 |
| [backup](./backup.md) | 配置备份恢复 | ⭐⭐ | 低 |

## 社交互动类

| 技能 | 功能 | 复杂度 | 使用频率 |
|------|------|--------|----------|
| [moltbook-interact](./moltbook-interact.md) | Moltbook 社交互动 | ⭐⭐ | 低 |
| [twittertrends](./twittertrends.md) | X 趋势搜索分析 | ⭐⭐ | 低 |

---

## 快速选择指南

### 我要制作视频 →
1. 有脚本需要配音: [remotion-synced-video](./remotion-synced-video.md)
2. 需要找素材: [search-video-on-web-and-gen](./search-video-on-web-and-gen.md)
3. 需要字幕: [video-transcript-downloader](./video-transcript-downloader.md)

### 我要处理图片 →
1. 生成新图片: [nano-banana-pro](./nano-banana-pro.md)
2. 搜索网络图片: [google-images-crawler](./google-images-crawler.md)
3. 画流程图: [excalidraw-flowchart](./excalidraw-flowchart.md)

### 我要处理文档 →
1. 转换格式: [markdown-converter](./markdown-converter.md)
2. 生成报告: [report-generator](./report-generator.md) / [hf-papers-reporter](./hf-papers-reporter.md)

### 我要语音合成 →
1. 文本转语音: [doubao-open-tts](./doubao-open-tts.md)

---

## 技能组合推荐

### 视频制作工作流
```
nano-banana-pro (生成封面) 
    + doubao-open-tts (生成配音)
    + remotion-synced-video (合成视频)
```

### 论文研究工作流
```
hf-papers-reporter (获取论文)
    + markdown-converter (转换格式)
    + report-generator (生成报告)
```

### 社交媒体工作流
```
twittertrends (获取热点)
    + nano-banana-pro (生成配图)
    + doubao-open-tts (生成配音)
    + remotion-synced-video (制作视频)
```

---

## 如何添加新指南

1. 复制 [TEMPLATE.md](./TEMPLATE.md)
2. 按模板填写技能信息
3. 更新本索引文件
4. 提交到仓库

---

*最后更新: 2026-02-01*

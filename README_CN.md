# JR-Agent-Skills

这是一个 **AI Agent 技能集合（SKILL Collection）** 项目，为 AI Agent 提供各种实用能力的模块化封装。

## 项目简介

本项目旨在收集和整理各种 AI Agent 可用的技能模块，每个技能都是一个独立的功能单元，可以方便地集成到 AI Agent 系统中。

## 技能列表

### 1. doubao-open-tts
- **功能**: 基于豆包（火山引擎）API 的文本转语音服务
- **特点**: 支持200+种音色、多种音频格式、可调节语速和音量
- **路径**: [`doubao-open-tts/`](./doubao-open-tts/)

### 2. paper-daily
- **功能**: 每日 AI 论文追踪工具 - 自动获取 arXiv AI 分类的最新论文
- **特点**: 每日论文列表、摘要提取、支持导出为 Markdown/Word 格式
- **路径**: [`paper-daily/`](./paper-daily/)

### 3. remotion
- **功能**: Remotion 最佳实践 - 使用 React 创建视频
- **特点**: 3D内容、动画、音频处理、资源管理、时间控制、过渡效果等
- **路径**: [`remotion/`](./remotion/)

### 4. remotion-synced-video
- **功能**: 使用 Remotion、TTS 和 Unsplash 图片创建专业级同步视频
- **特点**: 真实图片融入、完美音视频同步、丰富内容展示、精美视觉设计
- **路径**: [`remotion-synced-video/`](./remotion-synced-video/)

## 快速开始

每个技能目录下都有独立的文档和使用说明，请进入对应目录查看详细信息。

```bash
# 查看某个技能的使用说明
cd doubao-open-tts
cat SKILL.md

cd paper-daily
cat SKILL.md

cd remotion
cat SKILL.md

cd remotion-synced-video
cat SKILL.md
```

## 项目结构

```
JR-Agent-Skills/
├── README.md                    # 英文版
├── README_CN.md                 # 本文件（中文版）
├── doubao-open-tts/             # 豆包TTS技能
│   ├── SKILL.md
│   ├── scripts/
│   └── ...
├── paper-daily/                 # 每日AI论文追踪
│   ├── SKILL.md
│   ├── scripts/
│   └── ...
├── remotion/                    # Remotion最佳实践
│   ├── SKILL.md
│   ├── rules/
│   └── ...
└── remotion-synced-video/       # 专业视频生成
    ├── SKILL.md
    ├── src/
    └── ...
```

## 开发者

**xdrshjr**
- GitHub: [@xdrshjr](https://github.com/xdrshjr)

## 贡献

欢迎提交新的技能模块！请确保：
1. 每个技能放在独立的目录中
2. 包含详细的 README 或 SKILL.md 文档
3. 提供使用示例

## 许可证

MIT License

---

**语言**: [English](./README.md) | [中文](./README_CN.md)

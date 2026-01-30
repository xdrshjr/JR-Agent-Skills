# JR-Agent-Skills

这是一个 **AI Agent 技能集合（SKILL Collection）** 项目，为 AI Agent 提供各种实用能力的模块化封装。

## 项目简介

本项目旨在收集和整理各种 AI Agent 可用的技能模块，每个技能都是一个独立的功能单元，可以方便地集成到 AI Agent 系统中。

## 技能列表

### 1. doubao-open-tts
- **功能**: 基于豆包（火山引擎）API 的文本转语音服务
- **特点**: 支持200+种音色、多种音频格式、可调节语速和音量
- **路径**: [`doubao-open-tts/`](./doubao-open-tts/)

## 快速开始

每个技能目录下都有独立的 README 文档和使用说明，请进入对应目录查看详细信息。

```bash
# 查看某个技能的使用说明
cd doubao-open-tts
cat README.md
```

## 项目结构

```
JR-Agent-Skills/
├── README.md              # 本文件
├── doubao-open-tts/       # 豆包TTS技能
│   ├── README.md
│   ├── scripts/
│   └── ...
└── [更多技能...]/         # 未来添加的技能
```

## 开发者

**xdrshjr**
- GitHub: [@xdrshjr](https://github.com/xdrshjr)

## 贡献

欢迎提交新的技能模块！请确保：
1. 每个技能放在独立的目录中
2. 包含详细的 README 文档
3. 提供使用示例

## 许可证

MIT License

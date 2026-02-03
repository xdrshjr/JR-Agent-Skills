# JR-Agent-Skills

这是一个 **AI Agent 技能集合（SKILL Collection）** 项目，为 AI Agent 提供各种实用能力的模块化封装。

## 项目简介

本项目旨在收集和整理各种 AI Agent 可用的技能模块，每个技能都是一个独立的功能单元，可以方便地集成到 AI Agent 系统中。

## 技能列表

### 🌐 网页自动化
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **agent-browser** | 浏览器自动化，支持网页导航、截图、表单填写和数据提取 | [`agent-browser/`](./agent-browser/) |

### 🎙️ 语音与音频
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **doubao-open-tts** | 基于豆包（火山引擎）API 的文本转语音服务，支持200+种音色 | [`doubao-open-tts/`](./doubao-open-tts/) |

### 🎨 图像生成
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **nano-banana-pro** | 使用 Google Nano Banana Pro (Gemini) API 进行 AI 图像生成 | [`nano-banana-pro/`](./nano-banana-pro/) |
| **volcengine-image-gen** | 使用火山引擎（Seedream）模型生成高质量图像 | [`volcengine-image-gen/`](./volcengine-image-gen/) |
| **google-images-crawler** | 从 Google 图片搜索爬取高分辨率原图 | [`google-images-crawler/`](./google-images-crawler/) |
| **excalidraw-flowchart** | 从描述创建 Excalidraw 流程图，支持 DSL 和 DOT 格式 | [`excalidraw-flowchart/`](./excalidraw-flowchart/) |

### 🎬 视频创作
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **hf-papers-to-video** | 将 Hugging Face Daily Papers 转换为专业视频摘要，带 AI 配音 | [`hf-papers-to-video/`](./hf-papers-to-video/) |
| **remotion-synced-video** | 使用 Remotion、TTS 和 Unsplash 图片创建同步视频 | [`remotion-synced-video/`](./remotion-synced-video/) |
| **search-video-on-web-and-gen** | 在网页上搜索视频素材并生成专业视频 | [`search-video-on-web-and-gen/`](./search-video-on-web-and-gen/) |
| **remotion** | Remotion 在 React 中创建视频的最佳实践和工具 | [`remotion/`](./remotion/) |
| **video-transcript-downloader** | 从 YouTube 和其他网站下载视频、音频、字幕和转录文本 | [`video-transcript-downloader/`](./video-transcript-downloader/) |

### 📄 文档与研究
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **hf-papers-reporter** | 从 Hugging Face Daily Papers 生成 Word 报告，包含摘要和图表 | [`hf-papers-reporter/`](./hf-papers-reporter/) |
| **paper-daily** | 每日论文追踪和管理工具 | [`paper-daily/`](./paper-daily/) |
| **tech-analysis-reporter** | 通过多轮对话生成专业技术分析报告 | [`tech-analysis-reporter/`](./tech-analysis-reporter/) |
| **report-generator** | 通用报告生成工具 | [`report-generator/`](./report-generator/) |

### 🤖 Agent 工具
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **multi-agent-team** | 多智能体团队协作，支持动态角色（3个执行者 + 1个QA） | [`multi-agent-team/`](./multi-agent-team/) |
| **long-term-task** | 长期任务管理，支持多轮对话和双心跳监控 | [`long-term-task/`](./long-term-task/) |
| **session-cleaner** | 清理和管理 OpenClaw 会话，关闭子 Agent 并重置上下文 | [`session-cleaner/`](./session-cleaner/) |
| **auto-updater** | 自动每日更新 Clawdbot 和已安装技能，附带变更摘要 | [`auto-updater/`](./auto-updater/) |

### 🔧 开发工具
| 技能 | 功能描述 | 路径 |
|------|---------|------|
| **github-commit-push** | 完整的 Git 提交和推送工作流，支持远程配置和冲突处理 | [`github-commit-push/`](./github-commit-push/) |

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
├── README.md                    # 英文版
├── README_CN.md                 # 本文件（中文版）
├── agent-browser/               # 浏览器自动化
├── auto-updater/                # 自动更新工具
├── doubao-open-tts/             # 豆包 TTS
├── excalidraw-flowchart/        # 流程图创建
├── github-commit-push/          # Git 工作流
├── google-images-crawler/       # 图片爬取
├── hf-papers-reporter/          # HF 论文转 Word
├── hf-papers-to-video/          # HF 论文转视频
├── long-term-task/              # 长期任务管理
├── multi-agent-team/            # 多智能体团队
├── nano-banana-pro/             # Gemini 图像生成
├── paper-daily/                 # 论文追踪
├── remotion/                    # Remotion 工具
├── remotion-synced-video/       # 同步视频创建
├── report-generator/            # 报告生成
├── search-video-on-web-and-gen/ # 视频搜索与生成
├── session-cleaner/             # 会话清理
├── tech-analysis-reporter/      # 技术分析报告
├── video-transcript-downloader/ # 视频下载
└── volcengine-image-gen/        # 火山引擎图像生成
```

## 开发者

**xdrshjr**
- GitHub: [@xdrshjr](https://github.com/xdrshjr)

## 贡献

欢迎提交新的技能模块！请确保：
1. 每个技能放在独立的目录中
2. 包含详细的 README 文档
3. 提供使用示例
4. 同时更新 README.md 和 README_CN.md

## 许可证

MIT License

---

**语言**: [English](./README.md) | [中文](./README_CN.md)

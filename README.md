<p align="center">
  <img src="./logo.png" alt="JR-Agent-Skills Logo" width="180">
</p>

<h1 align="center">JR-OpenClaw-Skills</h1>

<p align="center">
  <b>A curated collection of modular AI Agent skills for OpenClaw</b>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
  <img src="https://img.shields.io/badge/Skills-19-brightgreen.svg" alt="19 Skills">
  <img src="https://img.shields.io/badge/Platform-OpenClaw-orange.svg" alt="Platform: OpenClaw">
</p>

<p align="center">
  <a href="./README_CN.md">中文</a> •
  <a href="#-skill-catalog">Skills</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📖 Overview

**JR-OpenClaw-Skills** is a comprehensive collection of ready-to-use skill modules designed for AI Agents running on [OpenClaw](https://github.com/openclaw/openclaw). Each skill is a self-contained functional unit that can be seamlessly integrated into your agent workflow.

Whether you need web automation, media generation, document processing, or multi-agent coordination — we've got you covered.

## ✨ Features

- 🎯 **Modular Design** — Each skill is independent and plug-and-play
- 📚 **Well Documented** — Every skill includes detailed README with examples
- 🚀 **Production Ready** — Battle-tested skills used in real-world scenarios
- 🔄 **Active Maintenance** — Regular updates and new skill additions
- 🌐 **Multi-language Support** — Documentation in both English and Chinese

## 📦 Skill Catalog

### 🌐 Web Automation
| Skill | Description | Path |
|:------|:------------|:-----|
| **agent-browser** | Browser automation for web navigation, screenshots, form filling, and data extraction | [`agent-browser/`](./agent-browser/) |

### 🎙️ Voice & Audio
| Skill | Description | Path |
|:------|:------------|:-----|
| **doubao-open-tts** | Text-to-speech service based on Doubao (Volcano Engine) API with 200+ voices | [`doubao-open-tts/`](./doubao-open-tts/) |

### 🎨 Image Generation
| Skill | Description | Path |
|:------|:------------|:-----|
| **nano-banana-pro** | AI image generation using Google's Nano Banana Pro (Gemini) API | [`nano-banana-pro/`](./nano-banana-pro/) |
| **volcengine-image-gen** | High-quality image generation using Volcano Engine (Seedream) models | [`volcengine-image-gen/`](./volcengine-image-gen/) |
| **google-images-crawler** | Crawl high-resolution images from Google Images search | [`google-images-crawler/`](./google-images-crawler/) |
| **excalidraw-flowchart** | Create Excalidraw flowcharts from descriptions (DSL & DOT support) | [`excalidraw-flowchart/`](./excalidraw-flowchart/) |

### 🎬 Video Creation
| Skill | Description | Path |
|:------|:------------|:-----|
| **hf-papers-to-video** | Transform Hugging Face Daily Papers into professional video summaries | [`hf-papers-to-video/`](./hf-papers-to-video/) |
| **remotion-synced-video** | Create synchronized videos with Remotion, TTS, and Unsplash images | [`remotion-synced-video/`](./remotion-synced-video/) |
| **search-video-on-web-and-gen** | Search video materials on the web and generate professional videos | [`search-video-on-web-and-gen/`](./search-video-on-web-and-gen/) |
| **remotion** | Best practices and utilities for Remotion video creation in React | [`remotion/`](./remotion/) |
| **video-transcript-downloader** | Download videos, audio, subtitles and transcripts from YouTube and other sites | [`video-transcript-downloader/`](./video-transcript-downloader/) |

### 📄 Document & Research
| Skill | Description | Path |
|:------|:------------|:-----|
| **hf-papers-reporter** | Generate Word reports from Hugging Face Daily Papers with abstracts and figures | [`hf-papers-reporter/`](./hf-papers-reporter/) |
| **paper-daily** | Daily paper tracking and management utilities | [`paper-daily/`](./paper-daily/) |
| **tech-analysis-reporter** | Generate professional technical analysis reports through multi-round dialogue | [`tech-analysis-reporter/`](./tech-analysis-reporter/) |
| **report-generator** | Generic report generation utilities | [`report-generator/`](./report-generator/) |

### 🤖 Agent Utilities
| Skill | Description | Path |
|:------|:------------|:-----|
| **multi-agent-team** | Multi-agent team collaboration with dynamic roles (3 executors + 1 QA) | [`multi-agent-team/`](./multi-agent-team/) |
| **long-term-task** | Long-term task management with multi-round dialogue and dual-heartbeat monitoring | [`long-term-task/`](./long-term-task/) |
| **session-cleaner** | Clean up and manage OpenClaw sessions, kill sub-agents and reset context | [`session-cleaner/`](./session-cleaner/) |
| **auto-updater** | Automatically update Clawdbot and installed skills daily with change summaries | [`auto-updater/`](./auto-updater/) |

### 🔧 Development Tools
| Skill | Description | Path |
|:------|:------------|:-----|
| **github-commit-push** | Complete git commit and push workflow with remote configuration and conflict handling | [`github-commit-push/`](./github-commit-push/) |

## 🚀 Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and configured
- Required API keys for specific skills (see individual skill READMEs)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/xdrshjr/JR-OpenClaw-Skills.git
cd JR-OpenClaw-Skills
```

2. Navigate to any skill directory:
```bash
cd doubao-open-tts
```

3. Follow the skill's README for setup and usage instructions.

### Usage Example

```bash
# Example: Using doubao-open-tts skill
cd doubao-open-tts
python3 scripts/tts.py "Hello, World!" -v zh_female_cancan_mars_bigtts -o output.mp3
```

## 📁 Project Structure

```
JR-OpenClaw-Skills/
├── 📄 README.md                    # This file (English)
├── 📄 README_CN.md                 # Chinese version
├── 🖼️  logo.png                    # Project logo
│
├── 🌐 agent-browser/               # Browser automation
├── 🔄 auto-updater/                # Auto-update utility
├── 🎙️  doubao-open-tts/             # Doubao TTS
├── 📊 excalidraw-flowchart/        # Flowchart creation
├── 🔧 github-commit-push/          # Git workflow
├── 🖼️  google-images-crawler/       # Image crawling
├── 📄 hf-papers-reporter/          # HF papers to Word
├── 🎬 hf-papers-to-video/          # HF papers to video
├── 📋 long-term-task/              # Long-term task management
├── 👥 multi-agent-team/            # Multi-agent team coordination
├── 🎨 nano-banana-pro/             # Gemini image generation
├── 📰 paper-daily/                 # Paper tracking
├── 🎬 remotion/                    # Remotion utilities
├── 🎥 remotion-synced-video/       # Synced video creation
├── 📊 report-generator/            # Report generation
├── 🔍 search-video-on-web-and-gen/ # Video search & generation
├── 🧹 session-cleaner/             # Session cleanup
├── 📈 tech-analysis-reporter/      # Tech analysis reports
├── 📥 video-transcript-downloader/ # Video download
└── 🎨 volcengine-image-gen/        # Volcano image generation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](#) for details.

### Guidelines

- 🔹 Each skill should be in its own directory
- 📖 Include comprehensive README documentation
- 💡 Provide clear usage examples
- 🔄 Update both `README.md` and `README_CN.md` when adding skills

## 👨‍💻 Developer

**xdrshjr**

[![GitHub](https://img.shields.io/badge/GitHub-@xdrshjr-181717?style=flat&logo=github)](https://github.com/xdrshjr)

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the OpenClaw community
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README_CN.md">中文</a>
</p>

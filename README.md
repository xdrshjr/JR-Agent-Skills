<p align="center">
  <img src="./logo.png" alt="JR-Agent-Skills Logo" width="200">
</p>

# JR-Agent-Skills

This is an **AI Agent Skill Collection** project, providing modular encapsulation of various practical capabilities for AI Agents.

## Overview

This project aims to collect and organize skill modules available for AI Agents. Each skill is an independent functional unit that can be easily integrated into AI Agent systems.

## Skills

### 🌐 Web Automation
| Skill | Description | Path |
|-------|-------------|------|
| **agent-browser** | Browser automation for web navigation, screenshots, form filling, and data extraction | [`agent-browser/`](./agent-browser/) |

### 🎙️ Voice & Audio
| Skill | Description | Path |
|-------|-------------|------|
| **doubao-open-tts** | Text-to-speech service based on Doubao (Volcano Engine) API, supporting 200+ voices | [`doubao-open-tts/`](./doubao-open-tts/) |

### 🎨 Image Generation
| Skill | Description | Path |
|-------|-------------|------|
| **nano-banana-pro** | AI image generation using Google's Nano Banana Pro (Gemini) API | [`nano-banana-pro/`](./nano-banana-pro/) |
| **volcengine-image-gen** | High-quality image generation using Volcano Engine (Seedream) models | [`volcengine-image-gen/`](./volcengine-image-gen/) |
| **google-images-crawler** | Crawl high-resolution images from Google Images search | [`google-images-crawler/`](./google-images-crawler/) |
| **excalidraw-flowchart** | Create Excalidraw flowcharts from descriptions, supporting DSL and DOT formats | [`excalidraw-flowchart/`](./excalidraw-flowchart/) |

### 🎬 Video Creation
| Skill | Description | Path |
|-------|-------------|------|
| **hf-papers-to-video** | Transform Hugging Face Daily Papers into professional video summaries with AI narration | [`hf-papers-to-video/`](./hf-papers-to-video/) |
| **remotion-synced-video** | Create synchronized videos with Remotion, TTS, and Unsplash images | [`remotion-synced-video/`](./remotion-synced-video/) |
| **search-video-on-web-and-gen** | Search video materials on the web and generate professional videos | [`search-video-on-web-and-gen/`](./search-video-on-web-and-gen/) |
| **remotion** | Best practices and utilities for Remotion video creation in React | [`remotion/`](./remotion/) |
| **video-transcript-downloader** | Download videos, audio, subtitles and transcripts from YouTube and other sites | [`video-transcript-downloader/`](./video-transcript-downloader/) |

### 📄 Document & Research
| Skill | Description | Path |
|-------|-------------|------|
| **hf-papers-reporter** | Generate Word reports from Hugging Face Daily Papers with abstracts and figures | [`hf-papers-reporter/`](./hf-papers-reporter/) |
| **paper-daily** | Daily paper tracking and management utilities | [`paper-daily/`](./paper-daily/) |
| **tech-analysis-reporter** | Generate professional technical analysis reports through multi-round dialogue | [`tech-analysis-reporter/`](./tech-analysis-reporter/) |
| **report-generator** | Generic report generation utilities | [`report-generator/`](./report-generator/) |

### 🤖 Agent Utilities
| Skill | Description | Path |
|-------|-------------|------|
| **multi-agent-team** | Multi-agent team collaboration with dynamic roles (3 executors + 1 QA) | [`multi-agent-team/`](./multi-agent-team/) |
| **long-term-task** | Long-term task management with multi-round dialogue and dual-heartbeat monitoring | [`long-term-task/`](./long-term-task/) |
| **session-cleaner** | Clean up and manage OpenClaw sessions, kill sub-agents and reset context | [`session-cleaner/`](./session-cleaner/) |
| **auto-updater** | Automatically update Clawdbot and installed skills daily with change summaries | [`auto-updater/`](./auto-updater/) |

### 🔧 Development Tools
| Skill | Description | Path |
|-------|-------------|------|
| **github-commit-push** | Complete git commit and push workflow with remote configuration and conflict handling | [`github-commit-push/`](./github-commit-push/) |

## Quick Start

Each skill directory has its own README and usage instructions. Navigate to the corresponding directory for detailed information.

```bash
# View a skill's documentation
cd doubao-open-tts
cat README.md
```

## Project Structure

```
JR-Agent-Skills/
├── README.md                    # This file (English)
├── README_CN.md                 # Chinese version
├── agent-browser/               # Browser automation
├── auto-updater/                # Auto-update utility
├── doubao-open-tts/             # Doubao TTS
├── excalidraw-flowchart/        # Flowchart creation
├── github-commit-push/          # Git workflow
├── google-images-crawler/       # Image crawling
├── hf-papers-reporter/          # HF papers to Word
├── hf-papers-to-video/          # HF papers to video
├── long-term-task/              # Long-term task mgmt
├── multi-agent-team/            # Multi-agent team
├── nano-banana-pro/             # Gemini image gen
├── paper-daily/                 # Paper tracking
├── remotion/                    # Remotion utilities
├── remotion-synced-video/       # Synced video creation
├── report-generator/            # Report generation
├── search-video-on-web-and-gen/ # Video search & gen
├── session-cleaner/             # Session cleanup
├── tech-analysis-reporter/      # Tech analysis reports
├── video-transcript-downloader/ # Video download
└── volcengine-image-gen/        # Volcano image gen
```

## Developer

**xdrshjr**
- GitHub: [@xdrshjr](https://github.com/xdrshjr)

## Contributing

New skill modules are welcome! Please ensure:
1. Each skill is in its own directory
2. Include detailed README documentation
3. Provide usage examples
4. Add the skill to both README.md and README_CN.md

## License

MIT License

---

**Languages**: [English](./README.md) | [中文](./README_CN.md)

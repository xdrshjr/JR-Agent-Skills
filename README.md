# JR-Agent-Skills

A **SKILL Collection** project for AI Agents, providing modular encapsulation of various practical capabilities.

## Overview

This project aims to collect and organize skill modules available for AI Agents. Each skill is an independent functional unit that can be easily integrated into AI Agent systems.

## Skills

### 1. doubao-open-tts
- **Function**: Text-to-speech service based on Doubao (Volcano Engine) API
- **Features**: 200+ voices, multiple audio formats, adjustable speed and volume
- **Path**: [`doubao-open-tts/`](./doubao-open-tts/)

### 2. paper-daily
- **Function**: Daily AI paper tracker - automatically fetches latest papers from arXiv AI category
- **Features**: Daily paper list, abstracts, export to Markdown/Word
- **Path**: [`paper-daily/`](./paper-daily/)

### 3. remotion
- **Function**: Best practices for Remotion - Video creation in React
- **Features**: 3D content, animations, audio, assets, timing, transitions, and more
- **Path**: [`remotion/`](./remotion/)

### 4. remotion-synced-video
- **Function**: Create professional synchronized videos with Remotion, TTS, and Unsplash images
- **Features**: Real imagery, perfect audio sync, rich content support, polished visual design
- **Path**: [`remotion-synced-video/`](./remotion-synced-video/)

## Quick Start

Each skill directory has its own README and usage instructions. Navigate to the corresponding directory for detailed information.

```bash
# View a skill's documentation
cd doubao-open-tts
cat SKILL.md

cd paper-daily
cat SKILL.md

cd remotion
cat SKILL.md

cd remotion-synced-video
cat SKILL.md
```

## Project Structure

```
JR-Agent-Skills/
├── README.md                    # This file
├── README_CN.md                 # Chinese version
├── doubao-open-tts/             # Doubao TTS skill
│   ├── SKILL.md
│   ├── scripts/
│   └── ...
├── paper-daily/                 # Daily AI paper tracker
│   ├── SKILL.md
│   ├── scripts/
│   └── ...
├── remotion/                    # Remotion best practices
│   ├── SKILL.md
│   ├── rules/
│   └── ...
└── remotion-synced-video/       # Professional video creation
    ├── SKILL.md
    ├── src/
    └── ...
```

## Developer

**xdrshjr**
- GitHub: [@xdrshjr](https://github.com/xdrshjr)

## Contributing

New skill modules are welcome! Please ensure:
1. Each skill is in its own directory
2. Include detailed README or SKILL.md documentation
3. Provide usage examples

## License

MIT License

---

**Languages**: [English](./README.md) | [中文](./README_CN.md)

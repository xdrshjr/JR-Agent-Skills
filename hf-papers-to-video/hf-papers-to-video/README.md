# HF Papers to Video Generator

> Transform Hugging Face Daily Papers into professional video summaries

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This skill automates the entire pipeline from academic paper extraction to professional video generation:

1. **Extract** - Scrape HF Daily Papers, download PDFs, extract key content
2. **Filter** - AI-powered image filtering to keep only relevant figures
3. **Script** - Generate structured video scripts from paper content
4. **Narrate** - Professional TTS voice synthesis
5. **Render** - React-based video composition with smooth animations
6. **Export** - Optimized compression for social media

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
export VOLCANO_TTS_APPID="your_app_id"
export VOLCANO_TTS_ACCESS_TOKEN="your_token"
export VOLCANO_TTS_SECRET_KEY="your_secret"

# Run full pipeline
npm run full
```

## Project Structure

```
hf-papers-to-video/
├── SKILL.md              # Full documentation
├── scenes.json           # Scene configuration
├── package.json          # Node dependencies
├── scripts/              # Python automation scripts
│   ├── extract_papers.py
│   ├── filter_images.py
│   ├── generate_tts.py
│   └── render.sh
├── src/                  # Remotion video components
│   ├── components/
│   ├── scenes/
│   └── index.tsx
└── output/               # Generated videos
```

## Key Features

### 🖼️ Smart Image Filtering

Removes icons, headers, and irrelevant images using:
- Size analysis (filter tiny icons)
- Content detection (filter blank images)
- Color diversity (filter monochrome headers)

### 🎬 Smooth Animations

Uses sine wave for natural floating animation (no jitter):
```typescript
const floatY = Math.sin((frame % 120) / 120 * Math.PI * 2) * 8;
```

### 🎙️ Professional TTS

Default voice: **解说小明** (News anchor style)
- Natural, professional delivery
- Synchronized with visual elements
- Dynamic duration calculation

### 📦 Optimized Export

Two-pass compression for Telegram (16MB limit):
- Pass 1: 1.5M bitrate (~20MB)
- Pass 2: 600K bitrate (~15MB)

## Customization

### Scene Configuration

Edit `scenes.json` to customize:
- Layout (side-left, side-right, background)
- Animation style (zoom, float, fade)
- Color accents
- Content (title, paragraphs, bullet points)

### Animation Speed

Adjust in `src/components/ImageCard.tsx`:
```typescript
const floatProgress = (frame % 240) / 240;  // Slower (8 seconds)
const floatY = Math.sin(floatProgress * Math.PI * 2) * 15;  // Larger amplitude
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Images shaking | Use sine wave instead of `repeat` mode |
| Video too large | Use two-pass compression with lower bitrate |
| TTS error | Check Volcano Engine credentials and quota |
| Sync issues | Verify audio-durations.json matches actual audio |

## License

MIT License - See [LICENSE](LICENSE) for details

## Credits

- [Remotion](https://remotion.dev) for video rendering
- [Doubao/Volcano](https://volcengine.com) for TTS
- [Hugging Face](https://huggingface.co/papers) for Daily Papers

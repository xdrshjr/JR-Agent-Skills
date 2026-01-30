# doubao-open-tts

A text-to-speech (TTS) service using Doubao (Volcano Engine) API to convert text into natural-sounding speech.

## Features

- 🎙️ **200+ Voice Options** - Multiple voices for various scenarios
- 🔊 **Multiple Audio Formats** - Supports mp3, pcm, wav
- ⚡ **Adjustable Parameters** - Speed and volume control
- 📦 **Dual Interface** - Command-line tool + Python API
- 🎯 **Voice Categorization** - Browse voices by category

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Create a `.env` file with your API credentials:

```bash
VOLCANO_TTS_APPID=your_app_id
VOLCANO_TTS_ACCESS_TOKEN=your_access_token
VOLCANO_TTS_SECRET_KEY=your_secret_key
```

Get your credentials from [Volcano Engine Console](https://console.volcengine.com/).

### Usage

**Command Line:**
```bash
python scripts/tts.py "Hello, this is a test"
python scripts/tts.py -f input.txt -o output.mp3
python scripts/tts.py --list-voices
```

**Python API:**
```python
from scripts.tts import VolcanoTTS

tts = VolcanoTTS()
tts.synthesize("Hello world", output_file="output.mp3")
```

## Developer

Developed by [xdrshjr](https://github.com/xdrshjr)

## License

MIT

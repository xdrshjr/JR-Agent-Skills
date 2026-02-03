#!/usr/bin/env python3
"""
Generate TTS audio for video narration
"""

import os
import sys
import json
from pathlib import Path

WORK_DIR = Path(__file__).parent.parent
AUDIO_DIR = WORK_DIR / "public" / "audio"
SCENES_FILE = WORK_DIR / "scenes.json"

# Default voice (News anchor style)
DEFAULT_VOICE = "zh_male_jieshuoxiaoming_moon_bigtts"

def generate_tts(text, output_path, voice=DEFAULT_VOICE):
    """Generate TTS using Doubao/Volcano"""
    
    # Check for required environment variables
    required = ['VOLCANO_TTS_APPID', 'VOLCANO_TTS_ACCESS_TOKEN', 'VOLCANO_TTS_SECRET_KEY']
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        print(f"❌ Missing environment variables: {missing}")
        print("Set them in your shell or .env file")
        return False
    
    # Use the doubao-open-tts skill
    tts_script = Path.home() / "clawd" / "skills" / "doubao-open-tts" / "scripts" / "tts.py"
    
    if not tts_script.exists():
        print(f"❌ TTS script not found: {tts_script}")
        return False
    
    cmd = f'python3 "{tts_script}" "{text}" -v {voice} -o "{output_path}"'
    result = os.system(cmd)
    
    return result == 0

def main():
    print("🎙️  TTS Generator")
    print("=" * 50)
    
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    if not SCENES_FILE.exists():
        print(f"❌ Scenes file not found: {SCENES_FILE}")
        return
    
    with open(SCENES_FILE) as f:
        scenes = json.load(f)
    
    print(f"Generating audio for {len(scenes)} scenes...\n")
    
    success_count = 0
    for scene in scenes:
        scene_id = scene['id']
        
        # Build narration text from content
        text_parts = [scene.get('title', '')]
        
        if 'paragraphs' in scene:
            text_parts.extend(scene['paragraphs'])
        
        if 'bulletPoints' in scene:
            text_parts.extend(scene['bulletPoints'])
        
        narration = ' '.join(text_parts)
        
        if not narration.strip():
            continue
        
        output_path = AUDIO_DIR / f"{scene_id}.mp3"
        
        print(f"Scene: {scene_id}")
        print(f"Text: {narration[:100]}...")
        
        if generate_tts(narration, output_path):
            print(f"✓ Saved to {output_path}\n")
            success_count += 1
        else:
            print(f"✗ Failed\n")
    
    print(f"\n✅ Generated {success_count}/{len(scenes)} audio files")

if __name__ == "__main__":
    main()

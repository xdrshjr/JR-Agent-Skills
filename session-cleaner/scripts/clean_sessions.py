#!/usr/bin/env python3
"""
Session Cleaner - Clean up OpenClaw sessions
Keeps only the current main session, removes all others
"""

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

def clean_sessions():
    """Clean all sessions except current main session"""
    
    sessions_file = Path.home() / ".openclaw/agents/main/sessions/sessions.json"
    sessions_dir = Path.home() / ".openclaw/agents/main/sessions"
    
    if not sessions_file.exists():
        print("❌ sessions.json not found")
        return 1
    
    # Backup
    backup_name = f"sessions.json.backup.{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    backup_path = sessions_dir / backup_name
    shutil.copy2(sessions_file, backup_path)
    print(f"✅ Backup created: {backup_name}")
    
    # Load and clean
    with open(sessions_file, 'r') as f:
        data = json.load(f)
    
    # Keep only current main session
    current_session = {}
    if "agent:main:main" in data:
        current_session["agent:main:main"] = data["agent:main:main"]
    
    deleted = len(data) - len(current_session)
    
    # Save cleaned data
    with open(sessions_file, 'w') as f:
        json.dump(current_session, f, indent=2)
    
    # Clean up old session transcript files (optional)
    current_id = current_session.get("agent:main:main", {}).get("sessionId", "")
    cleaned_transcripts = 0
    
    for transcript in sessions_dir.glob("*.jsonl"):
        if current_id not in transcript.name and not transcript.name.startswith("."):
            # Rename to .deleted instead of removing (safer)
            deleted_name = f"{transcript.name}.deleted.{datetime.now().strftime('%Y-%m-%dT%H-%M-%S')}Z"
            try:
                transcript.rename(sessions_dir / deleted_name)
                cleaned_transcripts += 1
            except:
                pass
    
    print(f"✅ Cleaned {deleted} session records")
    print(f"✅ Archived {cleaned_transcripts} transcript files")
    print(f"✅ Current session preserved: agent:main:main")
    
    return 0

if __name__ == "__main__":
    sys.exit(clean_sessions())

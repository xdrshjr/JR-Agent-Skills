#!/usr/bin/env python3
"""生成论文视频文案和TTS"""

import os
import sys
import json
from pathlib import Path

# 添加 doubao tts 路径
sys.path.insert(0, str(Path.home() / "clawd/skills/doubao-open-tts"))

# 文案定义 - 总时长控制在60秒左右
SCRIPTS = {
    "intro": "欢迎来到今日AI论文精选。今天为你带来五篇前沿研究，涵盖自动科研、视觉生成、模型架构、机器人操控和OCR技术。",
    
    "paper1": "第一篇，Idea2Story。这是一个自动化流水线，能将研究概念转化为完整的科学论文。它通过构建知识图谱，实现从文献综述到论文撰写的全流程自动化。",
    
    "paper2": "第二篇，SpatialGenEval。这是首个系统评估文生图模型空间智能的基准测试。它包含1230个测试用例，涵盖25个真实场景，揭示当前模型在空间推理上的核心瓶颈。",
    
    "paper3": "第三篇，LongCat-Flash-Lite。这是一种新型语言模型架构，发现扩展嵌入层比扩展专家更有效。模型拥有685亿参数，但仅激活30亿，在编程任务上表现卓越。",
    
    "paper4": "第四篇，DynamicVLA。这是一个专为动态物体操控设计的视觉语言动作模型。它采用4亿参数轻量级架构，通过连续推理显著降低延迟，支持机器人实时操控运动物体。",
    
    "paper5": "第五篇，OCRVerse。这是首个端到端统一的OCR解决方案，同时支持文本中心和视觉中心识别。它能处理报纸、图表、网页等多元数据，采用两阶段训练策略实现跨域融合。",
    
    "outro": "以上就是今天的五篇AI前沿论文。感谢观看，我们明天再见！"
}

# 使用灿灿音色 - 活泼好听的女声
VOICE = "zh_female_cancan_mars_bigtts"

def generate_tts():
    """生成所有场景的TTS"""
    public_audio = Path("public/audio")
    public_audio.mkdir(parents=True, exist_ok=True)
    
    # 加载环境变量
    env_path = Path.home() / "clawd/skills/doubao-open-tts/.env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    durations = {}
    
    for scene_id, text in SCRIPTS.items():
        output_path = public_audio / f"{scene_id}.mp3"
        
        # 调用豆包TTS
        cmd = f'''cd ~/clawd/skills/doubao-open-tts && python3 scripts/tts.py "{text}" -v {VOICE} -o {output_path}'''
        print(f"生成 {scene_id} 音频...")
        os.system(cmd)
        
        # 获取音频时长
        if output_path.exists():
            import subprocess
            result = subprocess.run(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                 '-of', 'default=noprint_wrappers=1:nokey=1', str(output_path)],
                capture_output=True, text=True
            )
            try:
                duration = float(result.stdout.strip())
                durations[scene_id] = int(duration) + 2  # 加2秒缓冲
                print(f"  ✓ 时长: {duration:.1f}秒")
            except:
                durations[scene_id] = 5
    
    # 保存时长配置
    with open("audio-durations.json", "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    
    print(f"\n音频生成完成，总时长: {sum(durations.values())}秒")
    return durations

if __name__ == "__main__":
    generate_tts()

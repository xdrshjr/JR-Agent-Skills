#!/usr/bin/env python3
"""
技术报告生成器主脚本
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# 配置
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_BASE = "/tmp/tech-analysis-output"

def run_analysis(source, is_github=True, token=None):
    """运行项目分析"""
    script = f"{SKILL_DIR}/scripts/analyze_project.py"
    
    cmd = ["python3", script, source]
    if not is_github:
        cmd.append("--local")
    if token:
        cmd.extend(["--token", token])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"分析失败: {result.stderr}")
        return None
    
    return json.loads(result.stdout)

def generate_chapter(chapter_num, project_info, output_dir):
    """生成单个章节"""
    prompt_file = f"{SKILL_DIR}/templates/prompts/{chapter_num:02d}-chapter-prompt.md"
    output_file = f"{output_dir}/{chapter_num:02d}-chapter.md"
    
    # 读取prompt模板
    with open(prompt_file, 'r') as f:
        prompt_template = f.read()
    
    # 填充变量
    prompt = prompt_template.format(
        project_name=project_info.get("project_name", "项目"),
        project_info=json.dumps(project_info, ensure_ascii=False, indent=2)
    )
    
    # TODO: 调用AI生成内容
    # 这里应该调用sessions_spawn或其他方式生成内容
    
    print(f"生成章节: {output_file}")
    return output_file

def generate_image(prompt, output_path):
    """生成配图"""
    nano_banana_script = os.path.expanduser("~/clawd/skills/nano-banana-pro/scripts/generate_image.py")
    
    # 加载环境变量
    env_file = os.path.expanduser("~/clawd/skills/nano-banana-pro/.env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    cmd = [
        "uv", "run", nano_banana_script,
        "--prompt", prompt,
        "--filename", output_path,
        "--resolution", "2K"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

def convert_to_word(md_file, output_file, title_font="黑体", body_font="仿宋"):
    """转换为Word"""
    script = f"{SKILL_DIR}/scripts/convert_to_word.py"
    
    cmd = [
        "python3", script,
        md_file, output_file,
        title_font, body_font
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

def main():
    """主函数"""
    print("🚀 技术报告生成器")
    print("=" * 50)
    
    # 这里应该实现完整的流程
    # 1. 多轮对话收集需求
    # 2. 分析项目
    # 3. 生成章节
    # 4. 生成配图
    # 5. 合并并转换
    
    print("\n请使用触发词 '自媒体软件分析报告' 开始")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
长期任务 Skill 使用示例
演示如何创建任务和注册 cron job
"""

import sys
import json
import os
from pathlib import Path

# 添加路径 - 支持环境变量覆盖
skill_dir = os.environ.get("LTT_SKILL_DIR")
if skill_dir:
    SCRIPT_DIR = Path(skill_dir) / "scripts"
else:
    SCRIPT_DIR = Path.home() / "clawd" / "skills" / "long-term-task" / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))

from task_manager import create_task

def example_create_learning_task():
    """
    示例：创建一个"每天学习 HF 论文"的长期任务
    """
    print("=" * 60)
    print("示例：创建'每天学习 Hugging Face 论文'任务")
    print("=" * 60)
    
    # 任务配置（这些应该来自对话收集）
    result = create_task(
        name="learn-hf-papers",
        display_name="每天学习 Hugging Face 论文",
        task_type="research",
        goals=[
            "每天学习一篇 Hugging Face Daily Paper",
            "提取论文核心内容",
            "整理个人笔记",
            "积累100篇论文知识"
        ],
        milestones=[
            {"name": "完成10篇", "target": 10},
            {"name": "完成30篇", "target": 30},
            {"name": "完成50篇", "target": 50},
            {"name": "完成100篇", "target": 100}
        ],
        frequency="daily",
        notification=True
    )
    
    print("\n✅ 任务创建成功！")
    print(f"任务ID: {result['task_id']}")
    print(f"任务名称: {result['display_name']}")
    print(f"存储目录: {result['task_dir']}")
    
    print("\n" + "-" * 60)
    print("执行心跳配置:")
    print(json.dumps(result['cron_configs']['exec_job'], indent=2, ensure_ascii=False))

    print("\n" + "-" * 60)
    print("检查心跳配置:")
    print(json.dumps(result['cron_configs']['check_job'], indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 60)
    print("下一步操作:")
    print("1. 使用 cron 工具注册这两个心跳任务")
    print("2. 任务将自动开始执行")
    print("3. 每天收到进度报告")
    print("=" * 60)
    
    return result

def example_create_project_task():
    """
    示例：创建一个项目开发类长期任务
    """
    print("\n" + "=" * 60)
    print("示例：创建'开发个人网站'任务")
    print("=" * 60)
    
    result = create_task(
        name="build-personal-website",
        display_name="开发个人作品集网站",
        task_type="project-dev",
        goals=[
            "设计网站架构",
            "开发前端页面",
            "实现后端API",
            "部署上线"
        ],
        milestones=[
            {"name": "完成设计稿", "target": 1},
            {"name": "前端开发完成", "target": 2},
            {"name": "后端开发完成", "target": 3},
            {"name": "网站上线", "target": 4}
        ],
        frequency="daily",
        notification=True
    )
    
    print("\n✅ 任务创建成功！")
    print(f"任务ID: {result['task_id']}")
    
    return result

def print_cron_setup_instructions(result: dict):
    """
    打印 cron 设置说明
    """
    print("\n" + "=" * 60)
    print("Cron Job 注册命令（需要在 Moltbot 中执行）:")
    print("=" * 60)
    
    task_id = result['task_id']
    name = result['name']

    exec_job = result['cron_configs']['exec_job']
    check_job = result['cron_configs']['check_job']
    
    print(f"""
# 注册执行心跳
cron({{
    "action": "add",
    "job": {json.dumps(exec_job, indent=4, ensure_ascii=False)}
}})

# 注册检查心跳
cron({{
    "action": "add", 
    "job": {json.dumps(check_job, indent=4, ensure_ascii=False)}
}})
""")
    
    print("=" * 60)

if __name__ == "__main__":
    print("长期任务 Skill - 使用示例\n")
    
    # 示例1：学习任务
    result1 = example_create_learning_task()
    print_cron_setup_instructions(result1)
    
    # 示例2：项目任务
    result2 = example_create_project_task()
    print_cron_setup_instructions(result2)
    
    print("\n示例完成！")
    print("运行: python3 example.py 查看此演示")

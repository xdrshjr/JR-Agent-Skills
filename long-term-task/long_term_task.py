#!/usr/bin/env python3
"""
长期任务 Skill 主入口
集成对话、任务创建、心跳注册
"""

import sys
import json
from pathlib import Path

# 添加 scripts 目录到路径
SCRIPT_DIR = Path(__file__).parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR))

from dialog import DialogEngine, process_dialog_answer
from task_manager import create_task

SKILL_DIR = Path.home() / "clawd" / "skills" / "long-term-task"
MEMORY_DIR = SKILL_DIR / "memory" / "long-term-tasks"

def main():
    """主入口"""
    if len(sys.argv) < 2:
        print("Usage: long_term_task.py <command> [args...]")
        print("")
        print("Commands:")
        print("  create <type>     - 创建新任务 (type: project-dev/research/general)")
        print("  dialog <type>     - 启动对话模式")
        print("  list              - 列出所有任务")
        print("  status <task-id>  - 查看任务状态")
        print("  pause <task-id>   - 暂停任务")
        print("  resume <task-id>  - 恢复任务")
        print("  delete <task-id>  - 删除任务")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create":
        task_type = sys.argv[2] if len(sys.argv) > 2 else "general"
        start_create_flow(task_type)
    elif command == "dialog":
        task_type = sys.argv[2] if len(sys.argv) > 2 else "general"
        start_dialog_mode(task_type)
    elif command == "list":
        list_tasks()
    elif command == "status":
        if len(sys.argv) < 3:
            print("Usage: long_term_task.py status <task-id>")
            sys.exit(1)
        show_status(sys.argv[2])
    elif command == "pause":
        if len(sys.argv) < 3:
            print("Usage: long_term_task.py pause <task-id>")
            sys.exit(1)
        pause_task(sys.argv[2])
    elif command == "resume":
        if len(sys.argv) < 3:
            print("Usage: long_term_task.py resume <task-id>")
            sys.exit(1)
        resume_task(sys.argv[2])
    elif command == "delete":
        if len(sys.argv) < 3:
            print("Usage: long_term_task.py delete <task-id>")
            sys.exit(1)
        delete_task(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

def start_create_flow(task_type: str):
    """启动创建流程"""
    print(f"🎯 启动长期任务创建")
    print(f"类型: {task_type}")
    print("\n请告诉我这个任务的具体需求，我将通过对话来收集信息。")
    print("可以直接描述，我会引导你完成。\n")

def start_dialog_mode(task_type: str):
    """启动对话模式"""
    engine = DialogEngine()
    print(engine.start_dialog(task_type))

def list_tasks():
    """列出所有任务"""
    index_file = MEMORY_DIR / "index.md"
    if index_file.exists():
        with open(index_file, "r") as f:
            print(f.read())
    else:
        print("暂无长期任务")

def show_status(task_id: str):
    """显示任务状态"""
    # 查找任务目录
    task_dirs = [d for d in MEMORY_DIR.iterdir() if d.is_dir() and d.name.startswith(f"task-{task_id}")]
    
    if not task_dirs:
        print(f"任务 #{task_id} 不存在")
        return
    
    status_file = task_dirs[0] / "status.md"
    if status_file.exists():
        with open(status_file, "r") as f:
            print(f.read())
    else:
        print(f"任务 #{task_id} 状态文件不存在")

def pause_task(task_id: str):
    """暂停任务"""
    print(f"暂停任务 #{task_id} - 功能待实现")
    print("需要更新 config.json 中的 status 字段")

def resume_task(task_id: str):
    """恢复任务"""
    print(f"恢复任务 #{task_id} - 功能待实现")
    print("需要更新 config.json 中的 status 字段")

def delete_task(task_id: str):
    """删除任务"""
    print(f"删除任务 #{task_id} - 功能待实现")
    print("需要：")
    print("1. 删除 cron job")
    print("2. 删除任务目录")
    print("3. 更新索引")

if __name__ == "__main__":
    main()

"""CLI 入口 - ltt 命令"""

import sys
import json
from pathlib import Path
from typing import Optional

from .manager import TaskManager
from .executor import Executor
from .checker import Checker
from .task import Task


def main():
    """ltt 命令入口"""
    import argparse
    
    parser = argparse.ArgumentParser(
        prog="ltt",
        description="Long Term Task - 长期任务管理器",
    )
    parser.add_argument(
        "--work-dir",
        default=None,
        help="工作目录（默认 ~/.ltt）",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # === create 命令 ===
    create_parser = subparsers.add_parser("create", help="创建新任务")
    create_parser.add_argument("--name", required=True, help="任务名称")
    create_parser.add_argument("--goals", required=True, help="目标列表，逗号分隔")
    create_parser.add_argument("--schedule", default="manual", 
                              choices=["manual", "hourly", "daily", "weekly"],
                              help="执行计划")
    create_parser.add_argument("--interval", type=float, default=30,
                              help="汇报间隔（分钟，默认 30）")
    create_parser.add_argument("--reporter", default="file",
                              choices=["file", "webhook"],
                              help="上报器类型")
    create_parser.add_argument("--webhook-url", default=None,
                              help="Webhook URL（reporter=webhook 时使用）")
    create_parser.add_argument("--json", action="store_true",
                              help="以 JSON 格式输出")
    
    # === list 命令 ===
    list_parser = subparsers.add_parser("list", help="列出任务")
    list_parser.add_argument("--status", default=None,
                            choices=["idle", "running", "completed", "failed", "paused"],
                            help="按状态过滤")
    list_parser.add_argument("--json", action="store_true",
                            help="以 JSON 格式输出")
    
    # === status 命令 ===
    status_parser = subparsers.add_parser("status", help="查看任务状态")
    status_parser.add_argument("task_id", help="任务 ID")
    status_parser.add_argument("--json", action="store_true",
                              help="以 JSON 格式输出")
    
    # === exec 命令 ===
    exec_parser = subparsers.add_parser("exec", help="执行任务")
    exec_parser.add_argument("task_id", help="任务 ID")
    
    # === check 命令 ===
    check_parser = subparsers.add_parser("check", help="检查任务状态")
    check_parser.add_argument("task_id", help="任务 ID")
    check_parser.add_argument("--format", choices=["json", "text"], default="text",
                             help="输出格式")
    
    # === pause 命令 ===
    pause_parser = subparsers.add_parser("pause", help="暂停任务")
    pause_parser.add_argument("task_id", help="任务 ID")
    
    # === resume 命令 ===
    resume_parser = subparsers.add_parser("resume", help="恢复任务")
    resume_parser.add_argument("task_id", help="任务 ID")
    
    # === delete 命令 ===
    delete_parser = subparsers.add_parser("delete", help="删除任务")
    delete_parser.add_argument("task_id", help="任务 ID")
    delete_parser.add_argument("--hard", action="store_true",
                              help="硬删除（否则为软删除）")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # 确定工作目录
    work_dir = Path(args.work_dir) if args.work_dir else None
    manager = TaskManager(work_dir)
    
    # 执行命令
    try:
        if args.command == "create":
            cmd_create(args, manager)
        elif args.command == "list":
            cmd_list(args, manager)
        elif args.command == "status":
            cmd_status(args, manager)
        elif args.command == "exec":
            cmd_exec(args, manager)
        elif args.command == "check":
            cmd_check(args, manager)
        elif args.command == "pause":
            cmd_pause(args, manager)
        elif args.command == "resume":
            cmd_resume(args, manager)
        elif args.command == "delete":
            cmd_delete(args, manager)
    except Exception as e:
        print(f"[Error] {e}", file=sys.stderr)
        sys.exit(1)


def cmd_create(args, manager: TaskManager):
    """创建任务"""
    goals = [g.strip() for g in args.goals.split(",") if g.strip()]
    
    reporter_config = {}
    if args.reporter == "webhook":
        if not args.webhook_url:
            print("[Error] --webhook-url is required when reporter=webhook", file=sys.stderr)
            sys.exit(1)
        reporter_config["url"] = args.webhook_url
    
    task = manager.create_task(
        name=args.name,
        goals=goals,
        schedule=args.schedule,
        report_interval_minutes=args.interval,
        reporter_type=args.reporter,
        reporter_config=reporter_config,
    )
    
    if args.json:
        print(json.dumps({
            "task_id": task.id,
            "name": task.name,
            "goals": task.goals,
            "status": task.status,
        }, indent=2, ensure_ascii=False))
    else:
        print(f"✅ 任务创建成功")
        print(f"ID: {task.id}")
        print(f"名称: {task.name}")
        print(f"目标数: {len(task.goals)}")
        print(f"状态: {task.status}")
        print(f"\n使用 'ltt exec {task.id}' 启动任务")


def cmd_list(args, manager: TaskManager):
    """列出任务"""
    tasks = manager.list_tasks(status=args.status)
    
    if args.json:
        result = [{
            "id": t.id,
            "name": t.name,
            "status": t.status,
            "progress": f"{t.progress_percent:.1f}%",
            "steps": f"{t.current_step}/{t.total_steps}",
        } for t in tasks]
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        if not tasks:
            print("暂无任务")
            return
        
        print(f"{'ID':<10} {'名称':<20} {'状态':<12} {'进度':<10} {'步骤'}")
        print("-" * 60)
        for t in tasks:
            print(f"{t.id:<10} {t.name:<20} {t.status:<12} {t.progress_percent:>6.1f}%  {t.current_step}/{t.total_steps}")


def cmd_status(args, manager: TaskManager):
    """查看任务状态"""
    task = manager.get_task(args.task_id)
    if not task:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)
    
    if args.json:
        print(json.dumps({
            "id": task.id,
            "name": task.name,
            "status": task.status,
            "progress_percent": task.progress_percent,
            "current_step": task.current_step,
            "total_steps": task.total_steps,
            "current_goal": task.current_goal,
            "config": task.config,
            "state": task.state,
        }, indent=2, ensure_ascii=False, default=str))
    else:
        print(f"📋 任务详情: {task.name}")
        print(f"ID: {task.id}")
        print(f"状态: {task.status}")
        print(f"进度: {task.progress_percent:.1f}% ({task.current_step}/{task.total_steps})")
        if task.current_goal:
            print(f"当前目标: {task.current_goal}")
        
        recent_events = task.get_recent_events(5)
        if recent_events:
            print(f"\n📊 最近事件:")
            for e in recent_events:
                print(f"  [{e.get('timestamp', '?')[:19]}] {e.get('event', 'unknown')}")


def cmd_exec(args, manager: TaskManager):
    """执行任务"""
    task = manager.get_task(args.task_id)
    if not task:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)
    
    executor = Executor(task.task_dir, task.id)
    success = executor.run()
    sys.exit(0 if success else 1)


def cmd_check(args, manager: TaskManager):
    """检查任务"""
    task = manager.get_task(args.task_id)
    if not task:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)
    
    checker = Checker(task.task_dir, task.id)
    result = checker.check()
    
    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"📊 任务检查报告: {result['task_name']}")
        print(f"状态: {result['status']}")
        print(f"进度: {result['progress']['percent']:.1f}%")
        
        if result.get("is_orphan"):
            print("\n⚠️ 警告: 执行器进程失联！")
        
        if result["issues"]:
            print(f"\n发现 {len(result['issues'])} 个问题")
        
        if result["needs_attention"]:
            print("\n🔔 需要关注！")
    
    sys.exit(2 if result.get("needs_attention") else 0)


def cmd_pause(args, manager: TaskManager):
    """暂停任务"""
    if manager.pause_task(args.task_id):
        print(f"⏸️ 任务 {args.task_id} 已暂停")
    else:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)


def cmd_resume(args, manager: TaskManager):
    """恢复任务"""
    if manager.resume_task(args.task_id):
        print(f"▶️ 任务 {args.task_id} 已恢复")
    else:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)


def cmd_delete(args, manager: TaskManager):
    """删除任务"""
    soft = not args.hard
    if manager.delete_task(args.task_id, soft=soft):
        if soft:
            print(f"🗑️ 任务 {args.task_id} 已软删除")
        else:
            print(f"🗑️ 任务 {args.task_id} 已永久删除")
    else:
        print(f"[Error] 任务不存在: {args.task_id}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
长期任务检查器
被 cron job 调用，检查任务进度并决定是否启动新执行
核心逻辑：基于上一次执行状态决策
"""

import sys
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, Tuple

def get_tasks_dir() -> Path:
    """获取任务存储目录，支持环境变量覆盖"""
    env_path = os.environ.get("LTT_TASKS_DIR")
    if env_path:
        return Path(env_path)
    return Path.home() / "clawd" / "skills" / "long-term-task" / "memory" / "long-term-tasks"

TASKS_DIR = get_tasks_dir()

def get_task_dir(task_id: str) -> Path:
    """
    获取任务目录
    优先精确匹配，如果没有则尝试模糊匹配（只返回第一个匹配）
    """
    task_id_str = str(task_id)
    
    # 首先尝试精确匹配
    for d in TASKS_DIR.iterdir():
        if not d.is_dir():
            continue
        if d.name.startswith(f"task-{task_id_str}-") or d.name == f"task-{task_id_str}":
            return d
    
    # 如果没有精确匹配，尝试模糊匹配
    matches = []
    for d in TASKS_DIR.iterdir():
        if not d.is_dir():
            continue
        if d.name.startswith(f"task-{task_id_str}"):
            matches.append(d)
    
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"[checker] 警告: 找到多个匹配目录: {[d.name for d in matches]}")
        print(f"[checker] 使用第一个: {matches[0].name}")
        return matches[0]
    
    return TASKS_DIR / f"task-{task_id_str}"

def load_task_config(task_id: str) -> Dict:
    """加载任务配置"""
    config_path = get_task_dir(task_id) / "config.json"
    with open(config_path, "r") as f:
        return json.load(f)

def load_execution_state(task_id: str) -> Dict:
    """加载执行状态"""
    state_path = get_task_dir(task_id) / "execution-state.json"
    if state_path.exists():
        with open(state_path, "r") as f:
            return json.load(f)
    return {
        "status": "idle",
        "last_start": None,
        "last_end": None,
        "last_result": None,
        "current_step": 0,
        "retry_count": 0
    }

def parse_timestamp(ts: Optional[str]) -> Optional[datetime]:
    """解析时间戳"""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except:
        return None

def should_execute_now(state: Dict, config: Dict) -> Tuple[bool, str]:
    """
    基于当前状态决定是否应该执行
    返回: (是否应该执行, 原因说明)
    """
    current_status = state.get("status", "idle")
    
    # 状态1: 正在执行中 -> 跳过
    if current_status == "running":
        last_start = parse_timestamp(state.get("last_start"))
        if last_start:
            elapsed = datetime.now() - last_start
            if elapsed < timedelta(hours=1):  # 1小时内认为还在执行
                return False, f"任务正在执行中（已运行 {elapsed.total_seconds()//60} 分钟），跳过本次"
            else:
                # 执行超过1小时，可能是僵尸进程
                return True, "检测到执行超时（>1小时），强制重新执行"
        return False, "任务状态为 running，跳过本次"
    
    # 状态2: 刚刚完成 -> 等待下一次周期
    if current_status == "completed":
        last_end = parse_timestamp(state.get("last_end"))
        if last_end:
            elapsed = datetime.now() - last_end
            min_interval = 300  # 最小间隔5分钟
            if elapsed.total_seconds() < min_interval:
                return False, f"任务刚刚完成（{elapsed.total_seconds()//60} 分钟前），等待下次周期"
        return True, "上次执行成功，准备下次执行"
    
    # 状态3: 失败 -> 检查重试次数
    if current_status == "failed":
        retry_count = state.get("retry_count", 0)
        last_result = state.get("last_result", {})
        last_error = last_result.get("error", "")
        
        if retry_count >= 3:
            return False, f"已连续失败 {retry_count} 次，停止自动重试，等待人工介入"
        
        # 检查上次失败时间
        last_end = parse_timestamp(state.get("last_end"))
        if last_end:
            elapsed = datetime.now() - last_end
            # 失败后等待一段时间再重试（指数退避）
            wait_minutes = min(2 ** retry_count * 5, 60)  # 最多等待60分钟
            if elapsed.total_seconds() < wait_minutes * 60:
                remaining = wait_minutes * 60 - elapsed.total_seconds()
                return False, f"上次失败（{retry_count}次），将在 {remaining//60} 分钟后重试"
        
        return True, f"上次执行失败（第{retry_count}次），尝试自动修复后重试"
    
    # 状态4: 空闲 -> 正常执行
    if current_status == "idle":
        return True, "任务空闲，正常执行"
    
    # 其他未知状态
    return True, f"未知状态 '{current_status}'，尝试执行"

def check_execution_health(task_id: str, state: Dict) -> Dict:
    """
    检查执行健康状态，生成报告
    """
    report = {
        "healthy": True,
        "issues": [],
        "recommendations": []
    }
    
    # 检查重试次数
    retry_count = state.get("retry_count", 0)
    if retry_count >= 3:
        report["healthy"] = False
        report["issues"].append(f"已连续失败 {retry_count} 次")
        report["recommendations"].append("建议人工检查错误原因")
    elif retry_count > 0:
        report["issues"].append(f"最近有 {retry_count} 次失败")
        report["recommendations"].append("继续观察，下次将自动重试")
    
    # 检查执行间隔
    last_end = parse_timestamp(state.get("last_end"))
    if last_end:
        elapsed = datetime.now() - last_end
        if elapsed > timedelta(hours=24):
            report["healthy"] = False
            report["issues"].append(f"超过24小时未执行")
            report["recommendations"].append("检查任务调度是否正常")
    
    # 检查步骤进度
    current_step = state.get("current_step", 0)
    config = load_task_config(task_id)
    total_steps = len(config.get("goals", []))
    if total_steps > 0:
        progress = current_step / total_steps * 100
        report["progress"] = f"{current_step}/{total_steps} ({progress:.1f}%)"
    
    return report

def read_recent_logs(task_id: str, lines: int = 30) -> str:
    """读取最近的执行日志"""
    log_path = get_task_dir(task_id) / "log.md"
    if not log_path.exists():
        return "暂无执行日志"
    
    with open(log_path, "r") as f:
        content = f.read()
    
    # 返回最后 N 行
    lines_list = content.split("\n")
    return "\n".join(lines_list[-lines:])

def generate_notification(task_id: str, state: Dict, health: Dict, decision: Tuple[bool, str]) -> dict:
    """
    生成通知消息
    返回包含 Telegram 消息和结构化数据的字典
    """
    should_exec, reason = decision
    config = load_task_config(task_id)
    task_name = config.get('display_name', config.get('name', task_id))
    
    # Telegram 消息（带格式）
    msg = f"📊 **长期任务检查报告**\n\n"
    msg += f"**任务**: {task_name} (#{task_id})\n"
    msg += f"**当前状态**: {state.get('status', 'unknown')}\n"
    msg += f"**当前步骤**: {state.get('current_step', 0)}\n"
    
    if "progress" in health:
        msg += f"**总体进度**: {health['progress']}\n"
    
    msg += f"\n**检查决策**: {'✅ 将执行' if should_exec else '⏸️ 跳过'}\n"
    msg += f"**原因**: {reason}\n"
    
    if health["issues"]:
        msg += f"\n⚠️ **发现问题**:\n"
        for issue in health["issues"]:
            msg += f"- {issue}\n"
    
    if health["recommendations"]:
        msg += f"\n💡 **建议**:\n"
        for rec in health["recommendations"]:
            msg += f"- {rec}\n"
    
    # 添加最近日志摘要
    logs = read_recent_logs(task_id, 10)
    if logs and logs != "暂无执行日志":
        msg += f"\n**最近日志**:\n```\n{logs[:200]}...\n```"
    
    # 返回结构化数据，方便调用者处理
    return {
        "telegram_message": msg,
        "structured_data": {
            "task_id": task_id,
            "task_name": task_name,
            "status": state.get('status', 'unknown'),
            "current_step": state.get('current_step', 0),
            "progress": health.get('progress'),
            "should_execute": should_exec,
            "reason": reason,
            "issues": health["issues"],
            "recommendations": health["recommendations"],
            "needs_attention": len(health["issues"]) > 0 or not should_exec
        }
    }

def trigger_execution(task_id: str, with_fix: bool = False) -> bool:
    """
    触发执行器
    在实际实现中，这里可以调用 executor.py 或直接返回指令
    """
    print(f"[checker] 触发任务 #{task_id} 执行")
    if with_fix:
        print(f"[checker] 将尝试自动修复后执行")
    return True

def output_notification_for_agent(notification_data: dict):
    """
    输出结构化通知，供调用者（Moltbot agent）解析并发送
    格式：JSON 包裹在标记之间，便于解析
    """
    print("---NOTIFICATION_JSON_START---")
    print(json.dumps(notification_data, indent=2, ensure_ascii=False))
    print("---NOTIFICATION_JSON_END---")
    
    # 同时输出人类可读的摘要
    print("\n---NOTIFICATION_SUMMARY---")
    data = notification_data["structured_data"]
    print(f"任务: {data['task_name']} (#{data['task_id']})")
    print(f"状态: {data['status']}, 步骤: {data['current_step']}")
    print(f"决策: {'执行' if data['should_execute'] else '跳过'}")
    if data['issues']:
        print(f"问题: {', '.join(data['issues'])}")
    print(f"需要关注: {'是' if data['needs_attention'] else '否'}")
    print("---END---")

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('--help', '-h', 'help'):
        print("""Usage: checker.py <task-id> [--notify]

Options:
  --notify    输出结构化通知数据，供调用者发送到 Telegram

Examples:
  # 普通检查（只记录到文件）
  python3 checker.py 001
  
  # 检查并生成通知（需要调用者发送）
  python3 checker.py 001 --notify
  
Note: 当使用 --notify 时，checker 会输出 JSON 格式的通知数据。
      调用者（Moltbot agent）应该:
      1. 解析 ---NOTIFICATION_JSON_START--- 和 ---NOTIFICATION_JSON_END--- 之间的 JSON
      2. 使用 message 工具发送 telegram_message 到用户
      3. 根据 structured_data.needs_attention 判断是否需要特别提醒
""")
        sys.exit(1)
    
    task_id = sys.argv[1]
    should_notify = "--notify" in sys.argv
    
    print(f"[checker] 开始检查任务 #{task_id}")
    
    try:
        # 加载状态
        state = load_execution_state(task_id)
        config = load_task_config(task_id)
        
        # 基于状态决策
        should_exec, reason = should_execute_now(state, config)
        
        # 健康检查
        health = check_execution_health(task_id, state)
        
        print(f"[checker] 决策: {'执行' if should_exec else '跳过'} - {reason}")
        
        # 生成通知
        notification_data = generate_notification(task_id, state, health, (should_exec, reason))
        
        if should_notify:
            output_notification_for_agent(notification_data)
            
            # 给调用者的提示
            if notification_data["structured_data"]["needs_attention"]:
                print("\n[ALERT] 此任务需要关注，建议立即通知用户")
        
        # 如果需要执行，返回执行指令
        if should_exec:
            print("\n---EXECUTE_COMMAND---")
            print(f"python3 scripts/executor.py {task_id}", end="")
            if state.get('status') == 'failed':
                print(" --attempt-fix", end="")
            print()
            print("---END---")
        
        # 记录检查日志（带轮转）
        check_log = get_task_dir(task_id) / "check-log.md"
        
        # 简单的日志轮转检查
        if check_log.exists():
            size_kb = check_log.stat().st_size / 1024
            if size_kb > 500:  # 超过 500KB 则轮转
                backup = check_log.parent / "check-log.1.md"
                if backup.exists():
                    backup.unlink()
                check_log.rename(backup)
                # 创建新文件并保留头部
                with open(check_log, "w") as f:
                    f.write("# 检查日志\n\n")
                    f.write(f"## [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 日志轮转\n\n")
                    f.write(f"之前的日志已归档到 check-log.1.md\n")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"\n## [{timestamp}] 检查\n\n"
        log_entry += f"**决策**: {'执行' if should_exec else '跳过'}\n\n"
        log_entry += f"**原因**: {reason}\n\n"
        if health["issues"]:
            log_entry += f"**问题**: {', '.join(health['issues'])}\n\n"
        
        with open(check_log, "a") as f:
            f.write(log_entry)
        
        print(f"\n[checker] 检查完成")
        
    except Exception as e:
        print(f"[checker] 检查异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

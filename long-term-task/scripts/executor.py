#!/usr/bin/env python3
"""
长期任务执行器
被 cron job 调用，执行具体的任务步骤
支持状态机：running -> completed/failed
"""

import sys
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict

# 任务存储路径 - 支持环境变量覆盖
def get_tasks_dir() -> Path:
    """获取任务存储目录，支持环境变量覆盖"""
    env_path = os.environ.get("LTT_TASKS_DIR")
    if env_path:
        return Path(env_path)
    # 默认路径
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
        # 精确匹配: task-{task_id}-name 或 task-{task_id}
        if d.name.startswith(f"task-{task_id_str}-") or d.name == f"task-{task_id_str}":
            return d
    
    # 如果没有精确匹配，尝试模糊匹配（兼容旧任务）
    matches = []
    for d in TASKS_DIR.iterdir():
        if not d.is_dir():
            continue
        if d.name.startswith(f"task-{task_id_str}"):
            matches.append(d)
    
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        # 多个匹配，返回第一个但打印警告
        print(f"[executor] 警告: 找到多个匹配目录: {[d.name for d in matches]}")
        print(f"[executor] 使用第一个: {matches[0].name}")
        return matches[0]
    
    # 没有匹配，返回默认路径
    return TASKS_DIR / f"task-{task_id_str}"

def load_task_config(task_id: str) -> dict:
    """加载任务配置"""
    config_path = get_task_dir(task_id) / "config.json"
    with open(config_path, "r") as f:
        return json.load(f)

def load_execution_state(task_id: str) -> Dict:
    """加载执行状态（状态机核心）"""
    state_path = get_task_dir(task_id) / "execution-state.json"
    if state_path.exists():
        with open(state_path, "r") as f:
            return json.load(f)
    return {
        "status": "idle",  # idle, running, completed, failed
        "last_start": None,
        "last_end": None,
        "last_result": None,
        "current_step": 0,
        "retry_count": 0,
        "lock_pid": None
    }

def save_execution_state(task_id: str, state: Dict):
    """保存执行状态"""
    state_path = get_task_dir(task_id) / "execution-state.json"
    with open(state_path, "w") as f:
        json.dump(state, f, indent=2)

def acquire_lock(task_id: str) -> bool:
    """
    获取执行锁，防止重复执行
    返回 True 表示获取成功，False 表示已有其他进程在执行
    """
    state = load_execution_state(task_id)
    current_pid = os.getpid()
    
    # 检查是否有锁
    if state.get("status") == "running":
        lock_pid = state.get("lock_pid")
        if lock_pid:
            # 检查进程是否还在运行
            try:
                os.kill(lock_pid, 0)
                # 进程存在，说明真的在执行中
                print(f"[executor] 任务 #{task_id} 已有进程 {lock_pid} 在执行中，跳过")
                return False
            except OSError:
                # 进程不存在，可能是之前崩溃留下的锁
                print(f"[executor] 检测到僵尸锁，清理并继续")
        else:
            print(f"[executor] 任务 #{task_id} 状态为 running 但没有锁信息，跳过")
            return False
    
    # 获取锁
    state["status"] = "running"
    state["lock_pid"] = current_pid
    state["last_start"] = datetime.now().isoformat()
    save_execution_state(task_id, state)
    return True

def release_lock(task_id: str, success: bool, result: dict):
    """释放锁并更新状态"""
    state = load_execution_state(task_id)
    state["status"] = "completed" if success else "failed"
    state["lock_pid"] = None
    state["last_end"] = datetime.now().isoformat()
    state["last_result"] = {
        "success": success,
        "action": result.get("action", ""),
        "error": result.get("error", None)
    }
    
    if success:
        state["retry_count"] = 0
        state["current_step"] = state.get("current_step", 0) + 1
    else:
        state["retry_count"] = state.get("retry_count", 0) + 1
    
    save_execution_state(task_id, state)

def rotate_log_if_needed(log_path: Path, max_size_kb: int = 500, max_files: int = 5):
    """
    轮转日志文件，防止无限增长
    max_size_kb: 单个日志文件最大大小（KB）
    max_files: 保留的备份文件数量
    """
    if not log_path.exists():
        return
    
    # 检查文件大小
    size_kb = log_path.stat().st_size / 1024
    if size_kb < max_size_kb:
        return
    
    # 轮转现有备份文件
    for i in range(max_files - 1, 0, -1):
        old_backup = log_path.parent / f"{log_path.stem}.{i}{log_path.suffix}"
        new_backup = log_path.parent / f"{log_path.stem}.{i + 1}{log_path.suffix}"
        if old_backup.exists():
            if i == max_files - 1:
                old_backup.unlink()  # 删除最旧的
            else:
                old_backup.rename(new_backup)
    
    # 将当前日志移到 .1
    backup_path = log_path.parent / f"{log_path.stem}.1{log_path.suffix}"
    log_path.rename(backup_path)
    
    # 创建新日志文件，保留头部信息
    with open(backup_path, "r") as f:
        content = f.read()
        # 提取文件头部（第一个标题块）
        lines = content.split("\n")
        header_lines = []
        for line in lines:
            header_lines.append(line)
            if line.startswith("##") and "任务创建" in line:
                break
    
    with open(log_path, "w") as f:
        f.write("\n".join(header_lines))
        f.write(f"\n\n## [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 日志轮转\n\n")
        f.write(f"之前的日志已归档到 {backup_path.name}\n")

def log_execution(task_id: str, result: dict):
    """记录执行日志"""
    log_path = get_task_dir(task_id) / "log.md"
    
    # 先检查并轮转日志
    rotate_log_if_needed(log_path, max_size_kb=500, max_files=5)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"\n## [{timestamp}] 执行记录\n\n"
    log_entry += f"**状态**: {'✅ 成功' if result['success'] else '❌ 失败'}\n\n"
    log_entry += f"**执行内容**: {result.get('action', 'N/A')}\n\n"
    log_entry += f"**结果**: \n{result.get('details', '无详细结果')}\n\n"
    
    if not result['success'] and 'error' in result:
        log_entry += f"**错误详情**: \n```\n{result['error']}\n```\n\n"
    
    # 追加到日志文件
    with open(log_path, "a") as f:
        f.write(log_entry)

def update_status_file(task_id: str, state: Dict, result: dict):
    """更新任务状态文件（Markdown）"""
    status_path = get_task_dir(task_id) / "status.md"
    
    # 读取现有内容
    content = ""
    if status_path.exists():
        with open(status_path, "r") as f:
            content = f.read()
    
    # 提取基础信息部分（保留）
    lines = content.split("\n")
    base_info = []
    for line in lines:
        if line.startswith("## 执行状态"):
            break
        base_info.append(line)
    
    # 构建新的执行状态部分
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_section = f"\n## 执行状态\n\n"
    new_section += f"**当前状态**: {state.get('status', 'unknown')}\n\n"
    new_section += f"**当前步骤**: {state.get('current_step', 0)}\n\n"
    new_section += f"**最后执行**: {state.get('last_start', 'N/A')}\n\n"
    new_section += f"**最后结果**: {'✅ 成功' if result.get('success') else '❌ 失败'}\n\n"
    
    if state.get('retry_count', 0) > 0:
        new_section += f"**重试次数**: {state['retry_count']}\n\n"
    
    # 写入文件
    with open(status_path, "w") as f:
        f.write("\n".join(base_info) + new_section)

def try_auto_fix(task_id: str, last_error: str) -> bool:
    """
    尝试自动修复常见问题（通用框架级别）
    返回 True 表示可以继续执行（可能已修复或决定重试）
    返回 False 表示无法自动修复，需要人工介入
    
    注意：具体的项目级修复应在任务配置中定义，或通过子智能体执行
    """
    print(f"[executor] 尝试自动修复...")
    print(f"[executor] 错误信息: {last_error[:200]}...")
    
    task_dir = get_task_dir(task_id)
    config = load_task_config(task_id)
    fixes_applied = []
    
    # === 通用修复策略（框架级别）===
    
    # 修复1: 网络/超时错误 - 指数退避等待
    if any(kw in last_error.lower() for kw in ["network", "connection", "timeout", "unable to connect"]):
        retry_count = config.get("retry_count", 0)
        wait_time = min(2 ** retry_count * 5, 300)  # 最多5分钟
        print(f"[executor] 检测到网络错误，等待 {wait_time} 秒后重试...")
        time.sleep(wait_time)
        fixes_applied.append(f"网络超时，指数退避等待 {wait_time} 秒")
    
    # 修复2: 文件/目录缺失 - 创建任务标准目录
    if any(kw in last_error.lower() for kw in ["no such file", "file not found", "directory not found"]):
        standard_dirs = ["data", "output", "logs"]
        created = []
        for dir_name in standard_dirs:
            d = task_dir / dir_name
            if not d.exists():
                d.mkdir(parents=True, exist_ok=True)
                created.append(dir_name)
        if created:
            fixes_applied.append(f"创建标准目录: {', '.join(created)}")
            print(f"[executor] ✓ 已创建目录: {created}")
    
    # 修复3: 权限错误
    if "permission denied" in last_error.lower():
        # 只修复任务目录内的权限
        scripts_dir = task_dir / "scripts"
        if scripts_dir.exists():
            fixed_count = 0
            for script in scripts_dir.glob("*"):
                if script.is_file():
                    try:
                        os.chmod(script, 0o755)
                        fixed_count += 1
                    except:
                        pass
            if fixed_count > 0:
                fixes_applied.append(f"修复 {fixed_count} 个脚本权限")
                print(f"[executor] ✓ 已修复 {fixed_count} 个文件权限")
    
    # === 项目特定修复（通过配置或钩子）===
    
    # 检查任务配置中是否定义了自定义修复命令
    custom_fixes = config.get("auto_fix", {})
    if custom_fixes:
        print(f"[executor] 检查自定义修复策略...")
        for error_pattern, fix_command in custom_fixes.items():
            if error_pattern.lower() in last_error.lower():
                print(f"[executor] 匹配到自定义修复: {error_pattern}")
                print(f"[executor] 执行: {fix_command}")
                # 记录但不直接执行（安全考虑），让子智能体决定
                fixes_applied.append(f"[自定义] {error_pattern}: {fix_command}")
    
    # 记录修复尝试
    log_path = task_dir / "auto_fix_log.md"
    timestamp = datetime.now().strftime("Y-%m-%d %H:%M:%S")
    log_entry = f"\n## [{timestamp}] 自动修复尝试\n\n"
    log_entry += f"**错误摘要**: {last_error[:200]}...\n\n"
    
    if fixes_applied:
        log_entry += f"**应用的修复**: \n"
        for fix in fixes_applied:
            log_entry += f"- {fix}\n"
        log_entry += f"\n**结果**: 已应用 {len(fixes_applied)} 项修复，可以继续执行\n"
        print(f"[executor] ✓ 已应用 {len(fixes_applied)} 项通用修复")
    else:
        log_entry += f"**结果**: 无适用的通用修复策略\n"
    
    with open(log_path, "a") as f:
        f.write(log_entry)
    
    # 只要有修复（哪怕是等待），就返回 True 允许重试
    # 真正的项目级修复应由子智能体根据任务配置执行
    return len(fixes_applied) > 0

def execute_research_task(task_id: str, config: dict, state: dict, current_step: int) -> dict:
    """执行研究类任务步骤"""
    goals = config.get("goals", [])
    goal = goals[current_step] if current_step < len(goals) else "研究任务步骤"
    
    # 研究任务通常涉及：数据下载、文献阅读、实验运行等
    # 这里返回执行指令，由调用者（子智能体）根据具体情况执行
    return {
        "success": True,
        "action": f"研究任务步骤 {current_step + 1}: {goal}",
        "details": f"任务类型: research\n当前步骤: {current_step + 1}/{len(goals)}\n目标: {goal}\n\n请根据目标执行具体操作，如:\n- 下载/处理数据\n- 运行训练/实验脚本\n- 分析结果并记录",
        "task_type": "research",
        "step": current_step + 1,
        "goal": goal,
        "timestamp": datetime.now().isoformat()
    }

def execute_project_dev_task(task_id: str, config: dict, state: dict, current_step: int) -> dict:
    """执行项目开发类任务步骤"""
    goals = config.get("goals", [])
    goal = goals[current_step] if current_step < len(goals) else "开发任务步骤"
    
    return {
        "success": True,
        "action": f"开发任务步骤 {current_step + 1}: {goal}",
        "details": f"任务类型: project-dev\n当前步骤: {current_step + 1}/{len(goals)}\n目标: {goal}\n\n请执行开发操作，如:\n- 编写/修改代码\n- 运行测试\n- 提交代码",
        "task_type": "project-dev",
        "step": current_step + 1,
        "goal": goal,
        "timestamp": datetime.now().isoformat()
    }

def execute_general_task(task_id: str, config: dict, state: dict, current_step: int) -> dict:
    """执行通用类任务步骤"""
    goals = config.get("goals", [])
    goal = goals[current_step] if current_step < len(goals) else "通用任务步骤"
    
    return {
        "success": True,
        "action": f"通用任务步骤 {current_step + 1}: {goal}",
        "details": f"任务类型: general\n当前步骤: {current_step + 1}/{len(goals)}\n目标: {goal}",
        "task_type": "general",
        "step": current_step + 1,
        "goal": goal,
        "timestamp": datetime.now().isoformat()
    }

def execute_task_step(task_id: str, attempt_fix: bool = True) -> dict:
    """
    执行任务的当前步骤
    根据任务类型调用相应的执行函数
    """
    config = load_task_config(task_id)
    state = load_execution_state(task_id)
    
    # 如果是重试且之前失败了，先尝试修复
    if attempt_fix and state.get("status") == "failed" and state.get("retry_count", 0) > 0:
        last_error = state.get("last_result", {}).get("error", "")
        if last_error:
            fixed = try_auto_fix(task_id, last_error)
            if not fixed:
                return {
                    "success": False,
                    "action": "自动修复失败",
                    "details": f"上次错误: {last_error}\n无法自动修复，需要人工介入",
                    "error": last_error,
                    "needs_human": True
                }
    
    current_step = state.get("current_step", 0)
    goals = config.get("goals", [])
    task_type = config.get("type", "general")
    
    # 检查是否已完成所有目标
    if current_step >= len(goals):
        return {
            "success": True,
            "action": "任务已完成",
            "details": f"所有 {len(goals)} 个目标已完成",
            "task_type": task_type,
            "step": current_step,
            "completed": True,
            "timestamp": datetime.now().isoformat()
        }
    
    # 根据任务类型执行不同操作
    task_executors = {
        "research": execute_research_task,
        "project-dev": execute_project_dev_task,
        "general": execute_general_task
    }
    
    executor = task_executors.get(task_type, execute_general_task)
    result = executor(task_id, config, state, current_step)
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: executor.py <task-id> [--attempt-fix]")
        sys.exit(1)
    
    task_id = sys.argv[1]
    attempt_fix = "--attempt-fix" in sys.argv
    
    print(f"[executor] 开始执行任务 #{task_id}")
    
    # 获取执行锁
    if not acquire_lock(task_id):
        print(f"[executor] 任务 #{task_id} 正在执行中，本次跳过")
        sys.exit(0)
    
    try:
        # 执行任务
        result = execute_task_step(task_id, attempt_fix=attempt_fix)
        
        # 记录日志
        log_execution(task_id, result)
        
        # 释放锁并更新状态
        release_lock(task_id, result["success"], result)
        
        # 更新状态文件
        state = load_execution_state(task_id)
        update_status_file(task_id, state, result)
        
        if result["success"]:
            print(f"[executor] 任务执行成功")
            sys.exit(0)
        else:
            print(f"[executor] 任务执行失败: {result.get('error', '未知错误')}")
            if result.get("needs_human"):
                print(f"[executor] ⚠️ 需要人工介入")
            sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "action": "执行异常",
            "details": str(e),
            "error": str(e)
        }
        log_execution(task_id, error_result)
        release_lock(task_id, False, error_result)
        
        state = load_execution_state(task_id)
        update_status_file(task_id, state, error_result)
        
        print(f"[executor] 任务执行异常: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
长期任务管理器
创建新任务、注册 cron job、管理任务状态
"""

import json
import os
from datetime import datetime
from pathlib import Path

def get_tasks_dir() -> Path:
    """获取任务存储目录，支持环境变量覆盖"""
    env_path = os.environ.get("LTT_TASKS_DIR")
    if env_path:
        return Path(env_path)
    return Path.home() / "clawd" / "skills" / "long-term-task" / "memory" / "long-term-tasks"

TASKS_DIR = get_tasks_dir()
INDEX_FILE = TASKS_DIR / "index.md"

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
        print(f"[task_manager] 警告: 找到多个匹配目录: {[d.name for d in matches]}")
        print(f"[task_manager] 使用第一个: {matches[0].name}")
        return matches[0]

    # 没有匹配，返回默认路径
    return TASKS_DIR / f"task-{task_id_str}"

def get_next_task_id() -> str:
    """获取下一个任务ID"""
    existing = [d for d in TASKS_DIR.iterdir() if d.is_dir() and d.name.startswith("task-")]
    if not existing:
        return "001"
    
    ids = [int(d.name.split("-")[1].split("-")[0]) for d in existing]
    return f"{max(ids) + 1:03d}"

def create_task_directory(task_id: str, name: str) -> Path:
    """创建任务目录"""
    task_dir = TASKS_DIR / f"task-{task_id}-{name}"
    task_dir.mkdir(parents=True, exist_ok=True)
    return task_dir


def list_all_tasks() -> list:
    """列出所有任务"""
    tasks = []
    if not TASKS_DIR.exists():
        return tasks
    
    for task_dir in TASKS_DIR.iterdir():
        if task_dir.is_dir() and task_dir.name.startswith("task-"):
            config_path = task_dir / "config.json"
            if config_path.exists():
                try:
                    with open(config_path, "r") as f:
                        config = json.load(f)
                    tasks.append({
                        "task_id": config.get("task_id"),
                        "name": config.get("name"),
                        "display_name": config.get("display_name"),
                        "status": config.get("status"),
                        "type": config.get("type"),
                        "dir": str(task_dir)
                    })
                except Exception:
                    pass
    return tasks


def pause_task(task_id: str) -> bool:
    """
    暂停任务
    将 config.json 中的 status 改为 paused
    """
    task_dir = get_task_dir(task_id)
    config_path = task_dir / "config.json"
    
    if not config_path.exists():
        return False
    
    with open(config_path, "r") as f:
        config = json.load(f)
    
    old_status = config.get("status", "active")
    config["status"] = "paused"
    config["paused_at"] = datetime.now().isoformat()
    config["previous_status"] = old_status
    
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    # 记录到状态文件
    status_path = task_dir / "status.md"
    if status_path.exists():
        with open(status_path, "a") as f:
            f.write(f"\n## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] 任务已暂停\n")
            f.write(f"**原状态**: {old_status}\n")
    
    return True


def resume_task(task_id: str) -> bool:
    """
    恢复任务
    将 config.json 中的 status 改回 previous_status 或 active
    """
    task_dir = get_task_dir(task_id)
    config_path = task_dir / "config.json"
    
    if not config_path.exists():
        return False
    
    with open(config_path, "r") as f:
        config = json.load(f)
    
    if config.get("status") != "paused":
        return False  # 不是暂停状态
    
    previous_status = config.get("previous_status", "active")
    config["status"] = previous_status
    config["resumed_at"] = datetime.now().isoformat()
    
    # 清理暂停相关字段
    config.pop("paused_at", None)
    config.pop("previous_status", None)
    
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    # 记录到状态文件
    status_path = task_dir / "status.md"
    if status_path.exists():
        with open(status_path, "a") as f:
            f.write(f"\n## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] 任务已恢复\n")
            f.write(f"**恢复为状态**: {previous_status}\n")
    
    return True


def delete_task(task_id: str, soft_delete: bool = True) -> bool:
    """
    删除任务
    soft_delete=True: 重命名目录为 .deleted 后缀
    soft_delete=False: 永久删除
    """
    task_dir = get_task_dir(task_id)
    
    if not task_dir.exists():
        return False
    
    if soft_delete:
        deleted_dir = task_dir.parent / f"{task_dir.name}.deleted"
        # 如果已存在，添加时间戳
        if deleted_dir.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            deleted_dir = task_dir.parent / f"{task_dir.name}.deleted.{timestamp}"
        task_dir.rename(deleted_dir)
    else:
        import shutil
        shutil.rmtree(task_dir)
    
    return True


def update_task_config(task_id: str, updates: dict) -> bool:
    """
    更新任务配置
    updates: 要更新的字段字典
    """
    task_dir = get_task_dir(task_id)
    config_path = task_dir / "config.json"
    
    if not config_path.exists():
        return False
    
    with open(config_path, "r") as f:
        config = json.load(f)
    
    # 更新字段
    config.update(updates)
    config["updated_at"] = datetime.now().isoformat()
    
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    return True


def get_task_info(task_id: str) -> dict:
    """获取任务详细信息"""
    task_dir = get_task_dir(task_id)
    config_path = task_dir / "config.json"
    state_path = task_dir / "execution-state.json"
    
    if not config_path.exists():
        return None
    
    with open(config_path, "r") as f:
        config = json.load(f)
    
    info = {
        "config": config,
        "dir": str(task_dir)
    }
    
    # 加载执行状态
    if state_path.exists():
        with open(state_path, "r") as f:
            info["execution_state"] = json.load(f)
    
    return info

def create_config_file(task_dir: Path, config: dict):
    """创建任务配置文件"""
    config_path = task_dir / "config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def create_status_file(task_dir: Path, task_id: str, name: str, display_name: str):
    """创建任务状态文件"""
    status_path = task_dir / "status.md"
    content = f"""# 任务状态: {name}

## 基本信息
- **任务ID**: {task_id}
- **显示名称**: {display_name}
- **创建时间**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
- **状态**: idle (待启动)
- **当前步骤**: 0
- **重试次数**: 0

## 执行状态（与 execution-state.json 同步）
| 字段 | 值 | 说明 |
|------|-----|------|
| status | idle | idle/running/completed/failed |
| current_step | 0 | 当前执行步骤 |
| retry_count | 0 | 连续失败次数 |
| lock_pid | null | 执行进程ID |
| last_start | null | 最后开始时间 |
| last_end | null | 最后结束时间 |

## 最后执行
- **时间**: 未执行
- **结果**: N/A
- **步骤**: N/A

## 下一步
- **预计执行**: 等待首次执行
"""
    with open(status_path, "w") as f:
        f.write(content)

def create_log_file(task_dir: Path):
    """创建执行日志文件"""
    log_path = task_dir / "log.md"
    content = f"""# 执行日志

## 任务创建
- **时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **操作**: 任务创建完成，等待首次执行

"""
    with open(log_path, "w") as f:
        f.write(content)

def create_execution_state_file(task_dir: Path):
    """创建执行状态文件（状态机核心）"""
    state_path = task_dir / "execution-state.json"
    state = {
        "status": "idle",
        "last_start": None,
        "last_end": None,
        "last_result": None,
        "current_step": 0,
        "retry_count": 0,
        "lock_pid": None
    }
    with open(state_path, "w") as f:
        json.dump(state, f, indent=2)

def update_index(task_id: str, name: str, display_name: str, task_type: str):
    """更新任务索引"""
    if not INDEX_FILE.exists():
        with open(INDEX_FILE, "w") as f:
            f.write("# 长期任务索引\n\n")
    
    entry = f"\n## Task #{task_id}: {display_name}\n"
    entry += f"- **ID**: {task_id}\n"
    entry += f"- **名称**: {name}\n"
    entry += f"- **类型**: {task_type}\n"
    entry += f"- **创建时间**: {datetime.now().strftime('%Y-%m-%d')}\n"
    entry += f"- **目录**: `task-{task_id}-{name}/`\n"
    
    with open(INDEX_FILE, "a") as f:
        f.write(entry)

def get_cron_schedule(frequency: str) -> dict:
    """根据频率生成 cron 配置"""
    schedules = {
        "hourly": {"kind": "cron", "expr": "0 * * * *", "tz": "Asia/Shanghai"},
        "daily": {"kind": "cron", "expr": "0 9 * * *", "tz": "Asia/Shanghai"},
        "weekly": {"kind": "cron", "expr": "0 9 * * 1", "tz": "Asia/Shanghai"},
    }
    return schedules.get(frequency, schedules["daily"])

def generate_cron_registration(task_id: str, name: str, frequency: str) -> dict:
    """
    生成 cron job 注册配置
    返回可直接用于 cron.add 的配置字典
    """
    exec_schedule = get_cron_schedule(frequency)
    check_schedule = get_cron_schedule("daily")
    
    exec_job_config = {
        "name": f"ltt-exec-{task_id}-{name}",
        "schedule": exec_schedule,
        "payload": {
            "kind": "agentTurn",
            "message": f"执行长期任务 #{task_id} ({name}): 请读取任务配置，执行当前步骤，并记录日志。使用 ~/clawd/skills/long-term-task/scripts/executor.py {task_id}",
            "model": "kimi-code/kimi-for-coding",
            "thinking": "low"
        },
        "sessionTarget": "isolated"
    }
    
    check_job_config = {
        "name": f"ltt-check-{task_id}-{name}",
        "schedule": check_schedule,
        "payload": {
            "kind": "agentTurn",
            "message": f"检查长期任务 #{task_id} ({name}) 进度: 读取 execution-state.json，生成报告并通知用户。使用 ~/clawd/skills/long-term-task/scripts/checker.py {task_id} --notify",
            "model": "kimi-code/kimi-for-coding",
            "thinking": "low"
        },
        "sessionTarget": "isolated"
    }
    
    return {
        "exec_job": exec_job_config,
        "check_job": check_job_config
    }

def create_task(
    name: str,
    display_name: str,
    task_type: str,
    goals: list,
    milestones: list,
    frequency: str = "daily",
    notification: bool = True
) -> dict:
    """
    创建新的长期任务
    
    返回包含任务信息和 cron job 配置的字典
    """
    # 生成任务ID
    task_id = get_next_task_id()
    
    # 创建目录结构
    task_dir = create_task_directory(task_id, name)
    
    # 准备配置
    config = {
        "task_id": task_id,
        "name": name,
        "display_name": display_name,
        "type": task_type,
        "created_at": datetime.now().isoformat(),
        "schedule": {
            "execution": frequency,
            "check": "daily"
        },
        "goals": goals,
        "milestones": milestones,
        "current_step": 0,
        "status": "active",
        "notification": notification
    }
    
    # 创建文件
    create_config_file(task_dir, config)
    create_status_file(task_dir, task_id, name, display_name)
    create_log_file(task_dir)
    create_execution_state_file(task_dir)
    update_index(task_id, name, display_name, task_type)
    
    # 生成 cron job 配置和注册指南
    cron_configs = generate_cron_registration(task_id, name, frequency)
    
    # 创建注册指南文件
    setup_path = task_dir / "setup-cron.md"
    setup_content = f"""# Cron Job 注册指南

## 任务信息
- **任务ID**: {task_id}
- **任务名称**: {name}
- **显示名称**: {display_name}

## 注册命令

请在 Moltbot 中执行以下命令注册双心跳任务：

### 1. 注册执行心跳

```json
{cron_configs['exec_job']['name']}
```

使用配置:
```json
{json.dumps(cron_configs['exec_job'], indent=2, ensure_ascii=False)}
```

### 2. 注册检查心跳

```json
{cron_configs['check_job']['name']}
```

使用配置:
```json
{json.dumps(cron_configs['check_job'], indent=2, ensure_ascii=False)}
```

### 3. 或直接运行 Python 注册

```python
from skills.long_term_task.scripts.task_manager import register_task_cron_jobs

register_task_cron_jobs("{task_id}", "{name}", "{frequency}")
```

## 手动执行测试

在注册前，可以先手动测试执行器：

```bash
cd ~/clawd/skills/long-term-task
python3 scripts/executor.py {task_id}
```

测试检查器：

```bash
python3 scripts/checker.py {task_id} --notify
```

## 取消任务

如需取消任务，删除对应的 cron job：

- 执行心跳: `ltt-exec-{task_id}-{name}`
- 检查心跳: `ltt-check-{task_id}-{name}`
"""
    with open(setup_path, "w") as f:
        f.write(setup_content)
    
    return {
        "task_id": task_id,
        "name": name,
        "display_name": display_name,
        "task_dir": str(task_dir),
        "cron_configs": cron_configs,
        "setup_guide": str(setup_path),
        "registration_complete": False  # 需要手动或使用 register_task_cron_jobs 完成
    }


def register_task_cron_jobs(task_id: str, name: str, frequency: str = "daily") -> dict:
    """
    注册任务的 cron jobs
    注意：此函数会尝试调用 Moltbot 的 cron 工具
    如果不在 Moltbot 环境中，会返回需要手动执行的命令
    """
    configs = generate_cron_registration(task_id, name, frequency)
    
    result = {
        "task_id": task_id,
        "registered": [],
        "failed": [],
        "manual_commands": []
    }

    # 实际注册需要调用者（主智能体）使用 cron.add 工具
    result["status"] = "manual_required"
    result["message"] = "请在 Moltbot 中使用 cron.add 工具注册以下 jobs"
    result["configs"] = configs

    return result

# 示例用法
if __name__ == "__main__":
    # 测试创建任务
    result = create_task(
        name="learn-hf-papers",
        display_name="学习 Hugging Face 论文",
        task_type="research",
        goals=["每天学习一篇 HF 论文", "整理摘要和笔记"],
        milestones=[
            {"name": "10篇完成", "target": 10},
            {"name": "30篇完成", "target": 30}
        ],
        frequency="daily",
        notification=True
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))

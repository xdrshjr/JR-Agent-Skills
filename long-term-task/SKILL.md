# Long Term Task Skill

## 概述

这是一个**通用长期任务管理 Skill**，用于协调多个智能体完成需要长时间运行的任务。

**设计原则**:
1. **Skill 只管基础设施** - 任务调度、状态管理、进度追踪
2. **Agent 决定业务逻辑** - 具体执行什么、怎么通知用户
3. **零侵入** - Agent 不需要修改代码，通过 CLI 或 SDK 使用

## 使用场景

- 每天定时学习 HF 论文
- 持续监控某个数据源
- 多步骤数据处理流程
- 需要定期汇报进度的长期项目

## Agent 使用方式

### 方式1: CLI（推荐 OpenClaw 使用）

```python
import subprocess
import json

# 创建任务
result = subprocess.run(
    ["ltt", "create", 
     "--work-dir", "./.ltt",
     "--name", "hf-paper-learning",
     "--goals", "下载今日论文,选择Top3,提取摘要,生成笔记",
     "--interval", "30"],  # 每30分钟汇报一次
    capture_output=True, text=True
)

# 解析任务 ID
task_id = None
for line in result.stdout.split("\n"):
    if line.startswith("ID: "):
        task_id = line.replace("ID: ", "").strip()

# 手动触发执行（或配置 cron）
subprocess.run(["ltt", "exec", task_id, "--work-dir", "./.ltt"])

# 检查状态并读取事件
result = subprocess.run(
    ["ltt", "check", task_id, "--work-dir", "./.ltt", "--format", "json"],
    capture_output=True, text=True
)
data = json.loads(result.stdout)

# 根据事件决定如何通知用户
for event in data.get("recent_events", []):
    if event["event"] == "progress_milestone":
        message.send(user, f"🎯 任务进度: {event['data']['milestone_percent']}%")
```

### 方式2: Python SDK（推荐 Claude Code 使用）

```python
from long_term_task import TaskManager, FileReporter, ProgressTracker

# 创建管理器
manager = TaskManager(work_dir="./.ltt")

# 创建任务
task = manager.create_task(
    name="数据处理",
    goals=["下载数据", "清洗数据", "分析数据"],
    report_interval_minutes=30,
)

# 获取任务状态
task = manager.get_task(task.id)
print(f"当前步骤: {task.current_goal}")
print(f"进度: {task.progress_percent}%")

# 读取事件
for event in task.get_recent_events(5):
    print(f"[{event['timestamp']}] {event['event']}")
```

## 与 OpenClaw 集成

### 1. 创建长期任务

当用户说"创建长期任务"时，Agent 应该：

1. **多轮对话收集需求**（10个问题）
2. **计算汇报间隔**（根据任务预估时长）
3. **创建任务并配置 cron**

```python
# 示例: Agent 创建 HF 论文学习任务
def create_hf_paper_task():
    # 创建任务
    result = subprocess.run([
        "ltt", "create",
        "--work-dir", "./.ltt",
        "--name", "daily-hf-papers",
        "--goals", "下载论文列表,筛选Top3,下载PDF,提取摘要,生成笔记",
        "--schedule", "daily",
        "--interval", "60"  # 每小时汇报
    ], capture_output=True, text=True)
    
    task_id = parse_task_id(result.stdout)
    
    # 配置执行心跳（每早9点执行）
    cron.add(
        name=f"ltt-exec-{task_id}",
        schedule={"kind": "cron", "expr": "0 9 * * *"},
        payload={
            "kind": "systemEvent",
            "text": f"执行长期任务 #{task_id}"
        }
    )
    
    # 配置检查心跳（每天10点检查）
    cron.add(
        name=f"ltt-check-{task_id}",
        schedule={"kind": "cron", "expr": "0 10 * * *"},
        payload={
            "kind": "systemEvent",
            "text": f"检查长期任务 #{task_id} 进度"
        }
    )
    
    return task_id
```

### 2. 处理执行事件

当执行心跳触发时，Agent 应该：

```python
def on_exec_trigger(task_id):
    # 1. 先检查当前状态
    result = subprocess.run(
        ["ltt", "check", task_id, "--format", "json"],
        capture_output=True, text=True
    )
    status = json.loads(result.stdout)
    
    # 2. 如果正在运行，跳过
    if status["status"] == "running":
        return
    
    # 3. 执行当前步骤
    task = manager.get_task(task_id)
    current_goal = task.current_goal
    
    if current_goal == "下载论文列表":
        download_papers()
        # 标记步骤完成
        subprocess.run(["ltt", "exec", task_id])  # 触发进度更新
    elif current_goal == "筛选Top3":
        select_top3()
        subprocess.run(["ltt", "exec", task_id])
    # ...
```

### 3. 进度通知

Agent 监听任务事件并决定如何通知用户：

```python
def check_and_notify(task_id):
    result = subprocess.run(
        ["ltt", "status", task_id, "--json"],
        capture_output=True, text=True
    )
    task = json.loads(result.stdout)
    
    # 检查最近事件
    for event in task["state"]["events"][-5:]:
        event_type = event["event"]
        data = event["data"]
        
        if event_type == "task_started":
            message.send(user, f"🚀 任务开始: {task['name']}")
            
        elif event_type == "progress_periodic":
            msg = f"📊 {task['name']} 进度: {data['progress_percent']:.0f}%"
            if data.get("estimated_remaining_seconds"):
                mins = data["estimated_remaining_seconds"] // 60
                msg += f"，预计还剩 {mins} 分钟"
            message.send(user, msg)
            
        elif event_type == "progress_milestone":
            message.send(user, 
                f"🎯 {task['name']} 达到里程碑: {data['milestone_percent']}%")
            
        elif event_type == "task_completed":
            elapsed = data["elapsed_seconds"] // 60
            message.send(user, 
                f"✅ {task['name']} 完成！耗时 {elapsed} 分钟")
            
        elif event_type == "task_failed_final":
            message.send(user, 
                f"❌ {task['name']} 失败: {data.get('error', '未知错误')}")
            
        elif event_type == "executor_orphaned":
            message.send(user, 
                f"⚠️ {task['name']} 执行器失联，可能需要重启")
```

## 汇报间隔计算

如果用户没有指定汇报间隔，Agent 应该根据预估时长自动计算：

```python
def calculate_interval(estimated_minutes):
    if estimated_minutes < 10:
        return 2  # 每2分钟
    elif estimated_minutes < 30:
        return 5  # 每5分钟
    elif estimated_minutes < 60:
        return 10  # 每10分钟
    elif estimated_minutes < 240:
        return 30  # 每30分钟
    elif estimated_minutes < 480:
        return 60  # 每1小时
    else:
        return 120  # 每2小时
```

## 多智能体协作

### 创建子任务

```python
# 父任务创建多个子任务并行执行
subtask_a = manager.create_subtask(
    parent_id=parent_id,
    goal="下载数据A",
)

subtask_b = manager.create_subtask(
    parent_id=parent_id,
    goal="下载数据B",
)

# 启动子任务
subprocess.run(["ltt", "exec", subtask_a.id])
subprocess.run(["ltt", "exec", subtask_b.id])

# 等待子任务完成
while True:
    task_a = manager.get_task(subtask_a.id)
    task_b = manager.get_task(subtask_b.id)
    
    if task_a.is_completed and task_b.is_completed:
        # 两个子任务都完成了，执行合并
        subprocess.run(["ltt", "exec", parent_id])  # 执行父任务下一步
        break
    
    time.sleep(60)
```

### 全局白板

智能体通过白板共享进度：

```python
# 智能体A
from long_term_task import ProgressTracker, FileReporter

reporter = FileReporter(task_dir)
tracker = ProgressTracker(task_id, reporter, ...)
tracker.report_to_whiteboard("agent-a", {
    "progress": 50,
    "status": "处理中",
    "current_item": "paper-001"
})

# 智能体B 读取
import json
whiteboard_path = task_dir / "whiteboard.json"
with open(whiteboard_path) as f:
    board = json.load(f)
    agent_a_progress = board["agents"]["agent-a"]["progress"]
```

## 最佳实践

### 1. 错误处理

```python
try:
    result = subprocess.run(
        ["ltt", "exec", task_id],
        capture_output=True, text=True, timeout=3600
    )
    if result.returncode != 0:
        # 检查失败原因
        check_result = subprocess.run(
            ["ltt", "check", task_id, "--format", "json"],
            capture_output=True, text=True
        )
        status = json.loads(check_result.stdout)
        if status.get("retry_count", 0) >= 3:
            message.send(user, "任务连续失败3次，需要人工介入")
except subprocess.TimeoutExpired:
    # 执行超时，可能是 orphan
    message.send(user, "任务执行超时，请检查状态")
```

### 2. 定期清理

```python
# 删除已完成的任务
for task in manager.list_tasks():
    if task.is_completed:
        # 保留7天后删除
        completed_at = task.state.get("last_end")
        if is_older_than(completed_at, days=7):
            manager.delete_task(task.id, soft=True)
```

## 故障排除

| 问题 | 原因 | 解决 |
|------|------|------|
| 任务状态卡在 running | 执行器崩溃 | checker 会检测 orphan 并标记 |
| 收不到进度通知 | reporter 配置错误 | 检查 state.json 中的事件 |
| 多个执行器同时运行 | 锁竞争 | Skill 内部有文件锁保护 |
| 状态文件损坏 | 异常退出 | 删除 state.json 重置 |

## 参考

- CLI: `ltt --help`
- 源码: `src/long_term_task/`
- 示例: `examples/`

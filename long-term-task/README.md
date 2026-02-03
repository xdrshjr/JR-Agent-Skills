# Long Term Task

通用长期任务管理 Skill，支持多智能体协作。

## 特性

- 🎯 **全生命周期通知** - 开始/定期/关键节点/完成/失败
- 🔒 **进程安全** - 文件锁 + 原子写入，支持并发访问
- 🛡️ **容错设计** - Orphan 检测、指数退避重试、自动恢复
- 🔄 **多智能体协作** - 子任务双向通知、全局白板
- 🧩 **双接口** - Python SDK + CLI，支持 Claude Code 和 OpenClaw

## 安装

```bash
# 方式1: pip 安装
pip install long-term-task

# 方式2: 本地开发安装
git clone https://github.com/xdrshjr/long-term-task.git
cd long-term-task
pip install -e .
```

## 快速开始

### CLI 方式（OpenClaw 推荐）

```bash
# 创建任务
ltt create --name "学习 HF 论文" --goals "下载,分析,总结" --interval 30
# 输出: ✅ 任务创建成功 ID: abc12345

# 执行任务
ltt exec abc12345

# 检查状态
ltt check abc12345

# 列出所有任务
ltt list
```

### Python SDK 方式（Claude Code 推荐）

```python
from long_term_task import TaskManager, FileReporter

# 创建管理器
manager = TaskManager(work_dir="./.ltt")

# 创建任务
task = manager.create_task(
    name="数据处理",
    goals=["下载数据", "清洗数据", "分析数据", "生成报告"],
    report_interval_minutes=30,
    milestones=[25, 50, 75, 100],
)

print(f"任务创建成功: {task.id}")

# 手动执行任务（通常由 cron 调用）
import subprocess
subprocess.run(["ltt", "exec", task.id, "--work-dir", "./.ltt"])

# 检查状态
task = manager.get_task(task.id)
print(f"进度: {task.progress_percent}%")
```

### OpenClaw 集成示例

```python
# OpenClaw Agent 代码
import subprocess
import json

# 1. 创建任务
result = subprocess.run(
    ["ltt", "create", "--work-dir", "./.ltt", 
     "--name", "hf-papers", 
     "--goals", "下载,分析,总结",
     "--interval", "30"],
    capture_output=True, text=True
)

# 解析任务 ID
for line in result.stdout.split("\n"):
    if line.startswith("ID: "):
        task_id = line.replace("ID: ", "").strip()
        break

# 2. 添加到 cron（执行心跳）
# 每30分钟执行一次
cron.add(
    name=f"ltt-exec-{task_id}",
    schedule={"kind": "cron", "expr": "*/30 * * * *"},
    payload={
        "command": f"ltt exec {task_id} --work-dir ./.ltt"
    }
)

# 3. 添加检查心跳（每天检查一次）
cron.add(
    name=f"ltt-check-{task_id}",
    schedule={"kind": "cron", "expr": "0 10 * * *"},
    payload={
        "command": f"ltt check {task_id} --work-dir ./.ltt --format=json"
    }
)

# 4. Agent 读取状态并发送通知
import time
while True:
    result = subprocess.run(
        ["ltt", "check", task_id, "--work-dir", "./.ltt", "--format=json"],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    
    # 读取最近事件
    if data.get("needs_attention"):
        message.send(user, f"⚠️ 任务需要关注: {data['task_name']}")
    
    time.sleep(300)  # 每5分钟检查一次
```

## Reporter 类型

| 类型 | 用途 | 配置 |
|------|------|------|
| `file` (默认) | 写入 state.json，适合轮询 | 无需配置 |
| `webhook` | HTTP 回调，主动推送 | `{"url": "..."}` |
| `callback` | 函数回调（仅 SDK） | 传入函数 |

### Webhook Reporter 示例

```bash
ltt create --name "测试" --goals "步骤1,步骤2" \
  --reporter webhook \
  --webhook-url "https://your-server.com/webhook"
```

Webhook 推送格式：
```json
{
  "event": "progress_periodic",
  "data": {
    "task_id": "abc123",
    "progress_percent": 50,
    "elapsed_seconds": 1800
  },
  "timestamp": "2026-02-03T10:00:00"
}
```

## 事件类型

| 事件 | 说明 |
|------|------|
| `task_started` | 任务开始 |
| `progress_periodic` | 定期汇报 |
| `progress_milestone` | 关键节点（25%, 50%, 75%, 100%） |
| `task_completed` | 任务完成 |
| `task_failed_final` | 最终失败（重试耗尽） |
| `executor_orphaned` | 执行器失联 |
| `whiteboard_update` | 全局白板更新 |

## 目录结构

```
~/.ltt/
├── index.json              # 任务索引
└── tasks/
    ├── task-abc12345/
    │   ├── config.json     # 任务配置
    │   ├── state.json      # 状态 + 事件
    │   └── state.lock      # 文件锁
    └── task-def67890/
        └── ...
```

## CLI 命令

```
ltt create     创建任务
ltt list       列出任务
ltt status     查看详情
ltt exec       执行任务
ltt check      检查状态
ltt pause      暂停任务
ltt resume     恢复任务
ltt delete     删除任务
```

## 架构

```
┌──────────────────────────────────────────────────────┐
│  Agent Layer (Claude Code / OpenClaw / Other)        │
│  - 调用 SDK 或 CLI                                   │
│  - 读取 state.json 获取进度                          │
│  - 决定如何通知用户                                   │
├──────────────────────────────────────────────────────┤
│  Skill Layer (long-term-task)                        │
│  ├─ TaskManager   创建/管理任务                       │
│  ├─ Executor      执行 + 进度追踪                     │
│  ├─ Checker       兜底检查                            │
│  ├─ Reporter      上报抽象（File/Webhook/Callback）   │
│  └─ StateManager  状态管理 + 文件锁                   │
└──────────────────────────────────────────────────────┘
```

## License

MIT

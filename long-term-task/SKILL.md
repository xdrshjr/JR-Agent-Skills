# Long-Term Task Skill

description: "创建并管理长期任务，通过多轮对话收集需求，自动生成双心跳任务（执行+检查），自动执行并定期汇报进度"

---

# 长期任务管理器

## 概述

帮助用户创建、执行和跟踪长期任务。通过结构化对话收集需求，自动生成执行心跳和检查心跳，实现任务的自动化管理。

## 核心流程

```
用户说"创建长期任务"
        ↓
启动多轮对话（每轮10问题）
        ↓
收集需求 → 生成任务配置
        ↓
注册双心跳任务（执行器+检查器）
        ↓
自动执行 + 定期汇报
```

## 双心跳设计

### 执行心跳 (Job A)
- **命名**: `ltt-exec-<task-id>`
- **频率**: 可配置（每小时/每天/每周）
- **职责**:
  1. 获取执行锁（防止重复执行）
  2. 执行当前步骤
  3. 自动修复常见问题
  4. 记录执行日志
  5. 更新状态（completed/failed）
  6. 释放锁

### 检查心跳 (Job B)
- **命名**: `ltt-check-<task-id>`
- **频率**: 每天一次
- **职责**:
  1. **读取 execution-state.json 状态**
  2. **基于上一次结果决策**:
     - `running` → 跳过（避免重复）
     - `completed` → 正常执行下一步
     - `failed` → 尝试自动修复后重试
  3. 汇总进度
  4. Telegram 通知用户

## 使用方法

### ⚠️ 重要：必须先进行多轮对话！

**创建长期任务时，严禁跳过对话阶段直接生成任务！**

用户说：
- "创建长期任务"
- "新建长期任务"
- "长期任务"

**你的第一步必须是：** 启动多轮10问题对话，收集用户需求。

---

### 对话流程（强制性）

```
用户说"创建长期任务"
        ↓
   【必须执行】启动多轮10问题对话
        ↓
   收集完整需求后才能生成任务
```

#### 步骤 1：选择任务类型（影响问题模板）
- 项目开发类
- 研究类
- 通用类

#### 步骤 2：🔄 多轮10问题对话（核心！不能跳过！）

**⚠️ 这是强制性步骤，必须在生成任务之前完成！**

- 每轮提出 **10个结构化问题**
- 用户回答后**评估完整度**
- **不够则进入下一轮**（继续提问）
- 用户可随时说"可以了"结束对话
- **对话完成前，禁止生成任何任务文件或 cron job！**

#### 步骤 3：配置执行参数
- 任务名称（默认自动生成）
- 执行频率
- 通知方式

#### 步骤 4：生成任务（必须在对话完成后！）
- 创建任务状态文件
- 注册两个 cron job
- 确认启动

---

### ❌ 常见错误（必须避免）

| 错误行为 | 正确做法 |
|---------|---------|
| 用户说"创建任务"后立即生成配置 | 先启动多轮对话收集需求 |
| 只问1-2个问题就结束 | 至少完成一轮10个问题，评估完整度 |
| 跳过对话直接创建 cron job | 对话完成前禁止创建任何任务组件 |
| 假设已知用户需求 | 必须通过对话确认所有需求细节 |

## 文件结构

```
~/clawd/skills/long-term-task/
├── SKILL.md                    # 本文件
├── scripts/
│   ├── dialog.py              # 对话引擎
│   ├── task_manager.py        # 任务管理
│   ├── executor.py            # 执行器
│   └── checker.py             # 检查器
├── templates/
│   ├── question-sets/
│   │   ├── project-dev.md     # 项目开发模板
│   │   ├── research.md        # 研究模板
│   │   └── general.md         # 通用模板
│   └── task-template.md       # 任务状态模板
└── memory/long-term-tasks/    # 任务存储
    ├── index.md               # 任务索引
    ├── task-001-{name}/
    │   ├── config.json        # 任务配置
    │   ├── status.md          # 当前状态
    │   └── log.md             # 执行日志
    └── task-002-{name}/
        └── ...
```

## 任务状态文件

### config.json
```json
{
  "task_id": "001",
  "name": "learn-hf-papers",
  "display_name": "学习 Hugging Face 论文",
  "type": "research",
  "created_at": "2026-02-02T10:30:00+08:00",
  "schedule": {
    "execution": "daily",
    "check": "daily"
  },
  "goals": ["每天学习一篇 HF 论文", "整理摘要"],
  "milestones": [
    {"name": "第10篇", "target": 10},
    {"name": "第30篇", "target": 30}
  ],
  "current_step": 0,
  "status": "active"
}
```

### status.md
```markdown
# 任务状态: learn-hf-papers

## 基本信息
- **任务ID**: 001
- **创建时间**: 2026-02-02
- **状态**: 进行中
- **当前进度**: 5/100

## 最后执行
- **时间**: 2026-02-02 09:00
- **结果**: ✅ 成功
- **步骤**: 下载并学习了 "Paper Name"

## 下一步
- **预计执行**: 2026-02-03 09:00
- **任务**: 学习第6篇论文
```

### execution-state.json (状态机核心)
```json
{
  "status": "completed",
  "last_start": "2026-02-02T09:00:00+08:00",
  "last_end": "2026-02-02T09:05:00+08:00",
  "last_result": {
    "success": true,
    "action": "学习论文",
    "error": null
  },
  "current_step": 5,
  "retry_count": 0,
  "lock_pid": null
}
```

**状态流转**:
```
        ┌─────────┐
        │  idle   │ ← 初始状态
        └────┬────┘
             │ acquire_lock()
             ▼
        ┌─────────┐
        │ running │ ← 获取锁，开始执行
        └────┬────┘
             │ release_lock()
       ┌─────┴─────┐
       ▼           ▼
  ┌────────┐  ┌────────┐
  │completed│  │ failed │ ← 执行结果
  └────┬───┘  └────┬───┘
       │           │ retry
       │           ▼
       │      ┌────────┐
       │      │ retry? │ ← 检查重试次数
       │      └───┬────┘
       │          │ yes
       └──────────┘
```

### log.md
```markdown
# 执行日志

## 2026-02-02

### 09:00 执行记录
**状态**: ✅ 成功
**执行内容**: 学习论文 "BERT: Pre-training..."
**结果**: 
- 已下载 PDF
- 提取摘要
- 保存到 notes/

### 09:05 检查记录
**检查器**: 每日检查
**结果**: 正常执行，进度 5/100
**通知**: 已发送 Telegram 消息
```

## Cron Job 配置

### 执行心跳示例
```json
{
  "name": "ltt-exec-001-learn-hf-papers",
  "schedule": {"kind": "cron", "expr": "0 9 * * *", "tz": "Asia/Shanghai"},
  "payload": {
    "kind": "agentTurn",
    "message": "执行长期任务 #001 (learn-hf-papers): 学习今日 Hugging Face 论文",
    "model": "kimi-code/kimi-for-coding"
  },
  "sessionTarget": "isolated"
}
```

### 检查心跳示例
```json
{
  "name": "ltt-check-001-learn-hf-papers",
  "schedule": {"kind": "cron", "expr": "0 10 * * *", "tz": "Asia/Shanghai"},
  "payload": {
    "kind": "agentTurn",
    "message": "检查长期任务 #001 (learn-hf-papers) 进度。\n\n步骤：\n1. 运行: python3 ~/clawd/skills/long-term-task/scripts/checker.py 001 --notify\n2. 解析输出中的 ---NOTIFICATION_JSON_START--- 到 ---NOTIFICATION_JSON_END--- 之间的 JSON\n3. 如果 structured_data.needs_attention 为 true，或用户需要通知，使用 message 工具发送 telegram_message 到用户\n4. 如果输出包含 ---EXECUTE_COMMAND---，解析并执行对应的 executor 命令",
    "model": "kimi-code/kimi-for-coding",
    "thinking": "low"
  },
  "sessionTarget": "isolated"
}
```

### 通知机制说明

检查器 (`checker.py`) 本身不直接发送 Telegram 消息，而是输出结构化数据：

1. **JSON 数据**：包含 `telegram_message`（可直接发送的格式化消息）和 `structured_data`（结构化信息）
2. **摘要信息**：人类可读的任务状态摘要
3. **执行指令**：如果需要执行，会输出具体的 executor 命令

调用者（Moltbot agent）的责任：
- 解析 JSON 输出
- 根据 `needs_attention` 判断是否发送通知
- 使用 `message` 工具发送 `telegram_message`
- 根据需要执行后续的 executor 命令

## 状态机决策逻辑

检查器在每次心跳时根据 `execution-state.json` 中的状态进行决策：

| 状态 | 决策 | 说明 |
|------|------|------|
| `running` | **跳过** | 任务正在执行中，避免重复启动 |
| `completed` | **执行** | 上次成功，继续下一步 |
| `failed` | **条件执行** | 根据重试次数决定是否重试 |
| `idle` | **执行** | 初始状态，正常执行 |

### 失败重试策略

```python
if status == "failed":
    if retry_count >= 3:
        # 连续失败3次，停止自动重试
        return "跳过，等待人工介入"
    else:
        # 指数退避等待
        wait_time = 2^retry_count * 5  # 5, 10, 20 分钟
        if 已过等待时间:
            return "尝试自动修复后重试"
```

## 错误处理

### 自动修复策略（通用框架级别）

执行器提供以下通用修复：

| 错误类型 | 修复策略 |
|---------|---------|
| **网络/超时** | 指数退避等待（5/10/20/40/80秒） |
| **文件缺失** | 自动创建任务标准目录（data/output/logs） |
| **权限错误** | 修复任务目录内脚本权限 |

### 项目特定修复

在 `config.json` 中定义自定义修复策略：

```json
{
  "auto_fix": {
    "bfloat16": "python3 scripts/fix_bfloat16.py",
    "out of memory": "python3 scripts/reduce_batch_size.py",
    "cuda": "export CUDA_VISIBLE_DEVICES=0"
  }
}
```

执行器会：
1. 先应用通用修复
2. 检查错误是否匹配 `auto_fix` 中的模式
3. 记录匹配的策略（但不直接执行，由子智能体决定）
4. 返回是否可以继续重试

真正的项目级代码修改应由子智能体根据任务上下文执行。

### 无法自动修复时
- 记录详细错误信息
- 标记任务状态为 `failed`
- 增加 `retry_count`
- 检查心跳通知用户
- 等待用户介入

## 用户命令

### 查询任务
- "查看长期任务"
- "任务 #001 状态"
- "我的长期任务"

### 管理任务（已实现）

在 `scripts/task_manager.py` 中可用以下函数：

```python
# 列出所有任务
tasks = list_all_tasks()
# 返回: [{"task_id": "001", "name": "...", "status": "active"}, ...]

# 暂停任务
pause_task("001")  # 将状态改为 paused，记录暂停时间

# 恢复任务  
resume_task("001")  # 恢复原状态

# 删除任务（软删除，重命名目录）
delete_task("001", soft_delete=True)

# 永久删除
delete_task("001", soft_delete=False)

# 更新任务配置
update_task_config("001", {"schedule": {"execution": "weekly"}})

# 获取任务信息
info = get_task_info("001")
# 返回: {"config": {...}, "execution_state": {...}, "dir": "..."}
```

### 任务状态流转
```
active → pause_task() → paused → resume_task() → active
active → delete_task() → [目录重命名为 .deleted]
paused → delete_task() → [目录重命名为 .deleted]
```

## 设计原则

1. **自动化优先**: 尽量少让用户操心
2. **透明可追溯**: 所有操作都有日志
3. **容错性强**: 自动修复 + 优雅降级
4. **低侵入性**: 不干扰 Moltbot 正常工作

---

*创建时间: 2026-02-02*

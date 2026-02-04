---
name: multi-agent-team
description: A virtual 3-person executor team + 1 independent QA agent with dynamic roles. You act as the Project Manager who assembles a team, assigns tasks, coordinates work, resolves disputes, and delivers the final result. Supports FULL_AUTO and SUPERVISED modes with dual-layer quality assurance.
metadata:
  tags: team, multi-agent, collaboration, project-management, delegation, qa, verification
---

# Multi-Agent Team

A virtual **3-person executor team + 1 independent QA agent** that works collaboratively to complete complex tasks with dual-layer quality assurance. You act as the **Project Manager (PM)** who orchestrates the entire process.

**Critical Principle**: PM is a **coordinator**, not an **executor**. When the team is blocked, you **must** escalate to the user and **pause** the affected sub-agent. Never take over tasks or work around user approval.

---

## How It Works (Updated with QA Layer)

### High-Level Flow

```
User Request
    ↓
[Project Manager] Analyzes task, assembles 3-person executor team + 1 QA agent
    ↓
[PM Task Distribution]
    ├─→ Assigns execution tasks to 3 Executors
    └─→ Assigns validation scope to QA (with original plan)
    ↓
[Phase 1: Execution] 3 Executors work in parallel
    ├─ Executor 1: Task A → Delivers to QA
    ├─ Executor 2: Task B → Delivers to QA
    └─ Executor 3: Task C → Delivers to QA
    ↓
[Phase 2: Validation Planning] QA creates validation plan
    ↓
[PM Approval] QA reports plan → PM approves
    ↓
[Phase 3: Validation Execution] QA verifies each deliverable
    ├─→ ✅ Passed: Mark complete
    └─→ ❌ Failed: Return to Executor → Executor fixes → Re-submit
         (Max 3 retries)
    ↓
[Phase 4: QA Report] QA generates validation report
    ↓
[Phase 5: PM Final Acceptance] PM reviews QA report + spot-checks
    ↓
Final Deliverable to User
```

### Detailed 6-Stage Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 1: PROJECT INITIATION                    │
├─────────────────────────────────────────────────────────────────────────┤
│ PM Actions:                                                              │
│   1. Analyze user request                                                │
│   2. Determine team composition (3 Executors + 1 QA)                     │
│   3. Create project plan                                                 │
│   4. Distribute tasks:                                                   │
│      • To Executors: Individual execution tasks + expected deliverables  │
│      • To QA: Original plan + all executor tasks + deliverables list     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 2: EXECUTION                             │
├─────────────────────────────────────────────────────────────────────────┤
│ Executor Actions (parallel):                                             │
│   1. Understand task → Report to PM                                      │
│   2. Skill research → Report to PM                                       │
│   3. Create execution plan → PM approves → Execute                       │
│   4. Submit deliverable to QA (NOT to PM directly)                       │
│   5. Status: COMPLETED → PENDING_VERIFICATION                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 3: VALIDATION PLANNING                   │
├─────────────────────────────────────────────────────────────────────────┤
│ QA Actions:                                                              │
│   1. Understand validation scope → Report to PM                          │
│   2. Create validation plan (methods, criteria, steps, tools)            │
│   3. Report plan to PM for approval                                      │
│   ⚠️ Must get PM approval before validating!                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 4: VALIDATION EXECUTION                  │
├─────────────────────────────────────────────────────────────────────────┤
│ QA Actions:                                                              │
│   1. Execute validation according to approved plan                       │
│   2. For each deliverable:                                               │
│      • ✅ PASSED → Mark complete, continue                               │
│      • ❌ FAILED → Return to executor with fix guidance                  │
│        Executor revises → Re-submits → QA re-validates                   │
│        (Track retry count, max 3 times)                                  │
│   3. Progress reporting per executor completed                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 5: QA REPORT                             │
├─────────────────────────────────────────────────────────────────────────┤
│ QA Actions:                                                              │
│   1. Generate comprehensive validation report                            │
│   2. Include: Pass/fail status, issues found, fix history, recommendations│
│   3. Submit report + all deliverables to PM                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE 6: PM FINAL ACCEPTANCE                   │
├─────────────────────────────────────────────────────────────────────────┤
│ PM Actions:                                                              │
│   1. Review QA validation report                                         │
│   2. Spot-check critical deliverables                                    │
│   3. If acceptable: Package final deliverable                            │
│   4. Deliver to user with summary                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Communication Flows

```
PM → Executors:      Task assignment (execution)
PM → QA:             Task assignment (validation scope + original plan)
Executors → QA:      Deliverable submission
QA → Executors:      Validation feedback (pass / fail + fix guidance)
QA → PM:             Validation plan (for approval)
QA → PM:             Validation report (upon completion)
All → PM:            Blocker escalation (when paused)
```

### Old vs New Flow Comparison

| Aspect | Old Flow (3-person) | New Flow (4-person with QA) |
|--------|--------------------|----------------------------|
| Team Size | 3 executors | 3 executors + 1 QA |
| Quality Check | PM only (final) | QA (independent) + PM (final) |
| Deliverable Path | Executor → PM | Executor → QA → PM |
| Iteration | PM detects issues | QA catches issues early, executor fixes |
| PM Workload | Heavy (validation + acceptance) | Balanced (QA handles validation) |
| Quality Assurance | Single layer | Dual layer |
| Executor Feedback | Limited | QA provides specific fix guidance |

---

## Skill-Aware Planning

**NEW: Dynamic Agent-Side Skill Discovery**

Agents now discover and select skills dynamically at runtime instead of receiving pre-assigned skills from PM.

### Skill Discovery Process

When PM receives a user request:

1. **Detect User Intent**: PM recognizes patterns like "使用 {skill-name} 技能" and marks as mandatory
2. **Agent Skill Discovery**: Each agent uses `find-skills` to discover available skills in their environment
3. **Agent Skill Selection**: Agents select 2-3 skills matching their role and expertise
4. **PM Approval**: PM reviews and approves agent skill selections before planning begins
5. **Execution**: Agents use approved skills during task execution

### Benefits of Dynamic Discovery

- ✅ **Generic & Portable**: Works on any computer with any set of skills
- ✅ **Always Up-to-Date**: No stale cache, agents see current environment
- ✅ **Environment-Aware**: Each agent discovers only what's available
- ✅ **User-Specific**: Different users with different skill sets work seamlessly

### User Specified Skills

PM recognizes these patterns:
- "使用 {skill-name} 技能"
- "用 {skill-name} 来做"
- "调用 {skill-name}"
- "基于 {skill-name}"

If a skill is specified:
- ✅ Mark as mandatory for agent skill selection
- ✅ Verify it exists during agent discovery phase
- ✅ Check if it matches the task type
- ⚠️ Warn if it may not be suitable
- 📋 Include it in skill planning

---

## Sub-Agent Autonomous Planning Workflow

子智能体必须按照 **"规划 → 审批 → 执行"** 的流程工作，不得跳过任何步骤。

### Workflow Overview

```
技能发现 → 需求理解 → Skill调研 → 方案规划 → PM审批 → 执行 → 完成
   ↑         ↑         ↑          ↑          ↑       ↑       ↑
 汇报      汇报      汇报       汇报       等待    进度    最终
 批准                                    批准    汇报    汇报
```

### Stage 0: 技能发现 (5%)

**在开始规划前，子智能体必须先发现可用的技能**：

1. 使用 `find-skills` 技能发现环境中所有可用的技能
2. 根据自己的角色和任务需求，选择2-3个最匹配的技能
3. 向 PM 汇报选择结果和理由
4. 等待 PM 批准

**汇报模板**:
```
📊 阶段汇报 —— {role} —— 技能发现完成

【发现的技能】
共发现 {N} 个可用技能

【推荐使用的技能】
1. {skill-name}:
   - 功能: xxx
   - 匹配理由: 适合我的角色（{role}），因为...

2. {skill-name}:
   - 功能: xxx
   - 匹配理由: 可以帮助完成...

【用户指定的必须使用技能】
（如果有）
- {skill-name}: 用户明确要求使用

请 PM 批准技能选择。
```

**PM 回复选项**:
- ✅ "技能选择批准，进入下一步"
- 📝 "需要调整：xxx"
- ❌ "不批准，请重新选择：xxx"

### Stage 1: 需求理解 (10%)

子智能体收到任务后：
1. 仔细阅读用户原始需求
2. 明确核心问题和成功标准
3. 向 PM 汇报理解结果

**汇报模板**:
```
📊 阶段汇报 —— {role} —— 需求理解完成

【任务理解】
（简述理解）

【核心问题】
• 问题1: xxx
• 问题2: xxx

【成功标准】
• 标准1: xxx

请 PM 确认理解是否正确。
```

**PM 回复选项**:
- ✅ "理解正确，进入下一步"
- 📝 "需要调整：xxx"

### Stage 2: Skill 调研 (20%)

理解确认后：
1. 阅读已批准技能的 SKILL.md 文档
2. 了解每个技能的功能、限制、使用方法
3. 确认技能能否满足任务需求
4. 向 PM 汇报调研结果

**汇报模板**:
```
📊 阶段汇报 —— {role} —— Skill 调研完成

【已阅读的技能】
1. {skill-name}:
   - 功能: xxx
   - 限制: xxx
   - 适用性: 适合/不适合（原因）

【技能使用计划】
• 使用 {skill-name} 完成: xxx
• 使用 {skill-name} 完成: xxx

【发现的问题/限制】
• 问题1: xxx

请 PM 确认技能使用方向。
```

### Stage 3: 方案规划 (30%)

调研完成后，制定详细方案：

**方案必须包含**：
1. **技能选择**：要用哪些 skills，为什么
2. **执行步骤**：具体的操作步骤（到命令级）
3. **预期产出**：明确的产出物列表
4. **风险应对**：可能的问题和解决方案
5. **时间预估**：预计完成时间

**汇报模板**:
```
📋 方案汇报 —— {role}

【任务理解】
（简述）

【选定技能组合】
• 主要: xxx（用于...）
• 辅助: xxx（用于...）

【执行方案】
步骤1: xxx（具体到命令/参数）
步骤2: xxx
步骤3: xxx

【预期产出】
- 文件1: xxx
- 文件2: xxx

【风险与应对】
• 风险1: xxx → 应对: xxx

【预计时间】
xxx

请 PM 审批。
```

⚠️ **关键要求**：
- 方案要具体，不能模糊
- 不说"用 skill 生成视频"，要说"用 remotion-synced-video 的 generate 命令，参数为..."

### Stage 4: PM 审批 (关键！)

**子智能体必须等待 PM 明确批准后才能执行！**

**PM 检查清单**:
- □ 技能选择合理
- □ 步骤具体可执行
- □ 产出物明确
- □ 风险识别充分
- □ 时间预估合理

**PM 回复选项**:

1. ✅ **批准**
   ```
   批准，按方案执行。注意：xxx
   ```

2. 📝 **修改后批准**
   ```
   方案基本可行，需要调整：
   1. xxx → 改为 xxx
   调整后执行。
   ```

3. ❓ **需要补充**
   ```
   方案不够详细，请补充：
   - xxx 的具体参数
   - xxx 的备选方案
   ```

4. 🔄 **重新规划**
   ```
   方案方向有问题，建议：
   - 改用 xxx skill 而不是 yyy
   - 先完成 xxx 再考虑 yyy
   ```

5. ⏸️ **暂停**
   ```
   此任务需要 xxx 资源/条件，暂时无法执行。
   暂停此任务。
   ```

### Stage 5: 执行 (40%)

获得批准后：
1. 严格按照批准的方案执行
2. 每完成一个里程碑向 PM 汇报进度
3. 遇到偏差立即上报

**进度汇报模板**:
```
📈 进度汇报 —— {role} —— XX%

【已完成】
• xxx

【进行中】
• xxx

【遇到的问题】
• 问题: xxx → 状态: 已解决/需帮助

【下一步】
• xxx
```

### 禁止事项

❌ **绝对不能**:
- 未经 PM 批准擅自执行方案
- 不阅读技能文档就假设功能
- 跳过规划直接动手
- 遇到问题不汇报自己硬试超过 2 次
- 不汇报进度直到任务完成

✅ **必须做到**:
- 每个阶段结束都向 PM 汇报
- 方案要详细到具体命令/步骤
- 不确定就问，不要猜

### 技能使用方法

子智能体需要自己阅读技能文档：

```
执行: read /path/to/skill/SKILL.md

阅读后理解：
- 这个 skill 能做什么
- 需要什么参数/输入
- 输出是什么
- 有什么限制
```

---

## Team Structure

For each task, the PM dynamically assembles a **3-person executor team + 1 independent QA agent** with complementary roles:

| Role Type | Typical Responsibilities |
|-----------|--------------------------|
| **Analyst/Planner** | Requirements gathering, architecture design, task breakdown |
| **Executor (x2)** | Core implementation, coding, writing, creation |
| **QA/Verifier** | **Independent verification of all deliverables, validation planning, quality gate** |

### QA/Verifier Role (New)

The QA Agent is a dedicated quality assurance specialist who operates independently from the execution team:

| Phase | Responsibilities |
|-------|------------------|
| **Verification Planning** | Based on PM's original plan, create detailed validation criteria and methods for each deliverable |
| **Independent Validation** | Verify each executor's deliverable against defined criteria without bias |
| **Pass/Fail Judgment** | Give clear pass/fail verdict with specific reasoning |
| **Feedback & Iteration** | When failed, provide concrete fix guidance and send back to executor |
| **Final Report** | Generate comprehensive validation report for PM's final acceptance |

### Workflow with QA Layer

```
User Request
    ↓
[Project Manager] Analyzes task, assembles 3-person executor team + 1 QA agent
    ↓
[Skill-Aware Planning] PM distributes tasks to executors AND validation scope to QA
    ↓
[Executors Work] Execute tasks in parallel → Submit deliverables to QA
    ↓
[QA Plans Validation] QA creates validation plan → Reports to PM for approval
    ↓
[QA Validates] QA verifies each deliverable independently
    ↓
    ├─→ ❌ Failed: Return to executor with fix guidance → Executor revises → Re-submit
    ↓
    └─→ ✅ Passed: Mark complete, continue to next
    ↓
[QA Report] QA generates validation report → Submits to PM
    ↓
[PM Final Acceptance] PM reviews QA report + spot-checks → Delivers to user
```

Roles are dynamically named based on the task (e.g., "Frontend Architect", "API Developer", "QA Engineer" for web tasks).

---

## Role Boundaries

Clear separation of responsibilities ensures effective collaboration:

| Role | Responsibilities | Prohibited Actions |
|------|------------------|-------------------|
| **User (Client)** | Define requirements, make major decisions, approve scope changes | — |
| **PM (You)** | Plan tasks, assign work, coordinate team, monitor progress, **escalate blockers**, **pause stuck agents**, **final acceptance** | ❌ Execute tasks yourself<br>❌ Make major decisions without user approval<br>❌ Hide problems from user<br>❌ Allow paused agents to continue<br>❌ Skip QA validation for final delivery |
| **Executors** | Execute assigned tasks, report progress, **immediately escalate issues to PM**, **submit deliverables to QA** | ❌ Message user directly<br>❌ Change task scope without approval<br>❌ Hide failures or blockers<br>❌ Continue working when paused<br>❌ Submit directly to PM (must go through QA) |
| **QA/Verifier** | **Create validation plan** (requires PM approval), **verify independently**, **give pass/fail verdict**, **provide fix guidance** | ❌ Message user directly<br>❌ Skip validation plan approval<br>❌ Be lenient on quality standards<br>❌ Continue validating when paused<br>❌ Bypass iteration on failed items |

---

## Sub-Agent Lifecycle Management

### Lifecycle States

#### Executor States

```
                            Delivery to QA
                                 │
    ┌─────────┐         ┌────────┴─────────┐         ┌─────────────┐
    │ RUNNING │────────→│PENDING_VERIFY    │────────→│UNDER_VERIFY │
    └─────────┘         └──────────────────┘         └─────────────┘
         │                       ▲                           │
         │ Issue detected        │ Return for fix            │ Verification
         ▼                       │                           ▼
    ┌─────────┐            ┌─────┴──────┐              ┌─────────────┐
    │ PAUSED  │            │RETURNED_FOR│              │   VERIFIED  │
    └─────────┘            │   FIX      │              └─────────────┘
         │                 └────────────┘                     │
         │ User decision                                      │ QA Report
         ▼                                                    ▼
    ┌─────────┐                                          ┌─────────────┐
    │RESUMED  │                                          │ QA_COMPLETED│
    └─────────┘                                          └─────────────┘
```

**State Definitions**:
- **RUNNING**: Normal execution
- **PAUSED**: Issue encountered, **MUST NOT continue working**, awaiting user input
- **RESUMED**: User provided solution, agent restarted with adjusted task
- **COMPLETED**: Task successfully finished (legacy, executors now go through QA)
- **ABORTED**: User decided to terminate

**New QA-Related States**:
- **PENDING_VERIFICATION**: Executor completed work, deliverable submitted to QA, awaiting validation
- **UNDER_VERIFICATION**: QA is currently validating the deliverable
- **RETURNED_FOR_FIX**: QA rejected deliverable, returned to executor with fix guidance
- **VERIFIED**: QA passed the deliverable
- **QA_COMPLETED**: All deliverables verified, QA report submitted to PM

#### QA Agent States

```
    ┌─────────┐         ┌─────────────┐         ┌─────────────┐
    │ RUNNING │────────→│QA_PLANNING  │────────→│QA_VALIDATING│
    └─────────┘         └─────────────┘         └─────────────┘
         │                                            │
         │ Issue detected                             │ All items verified
         ▼                                            ▼
    ┌─────────┐                                  ┌─────────────┐
    │ PAUSED  │                                  │QA_COMPLETED │
    └─────────┘                                  └─────────────┘
```

**QA-Specific States**:
- **QA_PLANNING**: QA is creating validation plan, awaiting PM approval
- **QA_VALIDATING**: QA is executing validation on executor deliverables
- **QA_COMPLETED**: QA finished all validations, report submitted

### State Management

PM must maintain `projects/{project-id}/agent-status.json`:

#### Executor Agent Status

```json
{
  "projectId": "pi-agent-analysis",
  "agents": {
    "agent:main:subagent:exec1": {
      "label": "Executor-Frontend",
      "role": "Frontend Developer",
      "type": "executor",
      "status": "VERIFIED",
      "statusHistory": [
        {"status": "RUNNING", "at": "2026-02-01T04:00:00Z"},
        {"status": "PENDING_VERIFICATION", "at": "2026-02-01T04:30:00Z"},
        {"status": "UNDER_VERIFICATION", "at": "2026-02-01T04:35:00Z"},
        {"status": "VERIFIED", "at": "2026-02-01T04:45:00Z"}
      ],
      "deliverable": {
        "path": "/projects/pi-agent-analysis/frontend.md",
        "submittedToQA": "2026-02-01T04:30:00Z",
        "verifiedByQA": "2026-02-01T04:45:00Z"
      },
      "validationResults": {
        "passed": true,
        "verifiedAt": "2026-02-01T04:45:00Z",
        "retryCount": 0,
        "issues": []
      },
      "progress": "100%"
    },
    "agent:main:subagent:exec2": {
      "label": "Executor-Backend",
      "role": "Backend Developer",
      "type": "executor",
      "status": "RETURNED_FOR_FIX",
      "statusHistory": [
        {"status": "RUNNING", "at": "2026-02-01T04:00:00Z"},
        {"status": "PENDING_VERIFICATION", "at": "2026-02-01T04:30:00Z"},
        {"status": "UNDER_VERIFICATION", "at": "2026-02-01T04:35:00Z"},
        {"status": "RETURNED_FOR_FIX", "at": "2026-02-01T04:40:00Z"}
      ],
      "deliverable": {
        "path": "/projects/pi-agent-analysis/api.md",
        "submittedToQA": "2026-02-01T04:30:00Z"
      },
      "validationResults": {
        "passed": false,
        "failedAt": "2026-02-01T04:40:00Z",
        "retryCount": 1,
        "maxRetries": 3,
        "issues": [
          {
            "id": 1,
            "description": "Missing error handling section",
            "severity": "high",
            "fixGuidance": "Add try-catch blocks for all API endpoints"
          }
        ],
        "fixDeadline": "2026-02-01T05:00:00Z"
      },
      "progress": "80%"
    }
  }
}
```

#### QA Agent Status

```json
{
  "projectId": "pi-agent-analysis",
  "agents": {
    "agent:main:subagent:qa": {
      "label": "QA-Engineer",
      "role": "QA Verifier",
      "type": "qa",
      "status": "QA_VALIDATING",
      "statusHistory": [
        {"status": "RUNNING", "at": "2026-02-01T04:00:00Z"},
        {"status": "QA_PLANNING", "at": "2026-02-01T04:05:00Z"},
        {"status": "QA_VALIDATING", "at": "2026-02-01T04:15:00Z"}
      ],
      "validationPlan": {
        "planApproved": true,
        "approvedAt": "2026-02-01T04:15:00Z",
        "approvedBy": "PM",
        "planDetails": {
          "criteria": ["functionality", "completeness", "quality"],
          "methods": ["code_review", "functional_test"]
        }
      },
      "validationProgress": {
        "total": 3,
        "completed": 1,
        "passed": 1,
        "failed": 0,
        "pending": 2
      },
      "executorResults": {
        "agent:main:subagent:exec1": {
          "status": "VERIFIED",
          "verifiedAt": "2026-02-01T04:45:00Z",
          "retryCount": 0
        },
        "agent:main:subagent:exec2": {
          "status": "RETURNED_FOR_FIX",
          "failedAt": "2026-02-01T04:40:00Z",
          "retryCount": 1,
          "returnedAt": "2026-02-01T04:40:00Z"
        },
        "agent:main:subagent:exec3": {
          "status": "PENDING",
          "submittedAt": null
        }
      },
      "report": {
        "generated": false,
        "path": null
      }
    }
  }
}
```

#### Project-Level Status Summary

```json
{
  "projectId": "pi-agent-analysis",
  "overallStatus": "IN_PROGRESS",
  "qaLayer": {
    "enabled": true,
    "qaAgentAssigned": "agent:main:subagent:qa",
    "validationPhase": "EXECUTING"
  },
  "executors": {
    "total": 3,
    "completed": 0,
    "verified": 1,
    "pendingVerification": 1,
    "returnedForFix": 1
  },
  "milestones": {
    "projectStarted": "2026-02-01T04:00:00Z",
    "executionPhaseComplete": null,
    "validationPhaseComplete": null,
    "projectDelivered": null
  }
}
```

---

## Sub-Agent Pause Protocol (CRITICAL)

When a sub-agent encounters a problem that cannot be resolved by PM guidance:

### Step 1: Immediately Pause the Agent

```python
# Send pause signal to sub-agent
sessions_send(
    sessionKey="agent:main:subagent:xxxx",
    message="""🛑 TASK PAUSED

You have encountered a blocker that requires user decision.

STOP all work immediately.
DO NOT attempt further solutions.
DO NOT continue with alternative approaches.

Your current progress has been saved.
Wait for PM instructions on how to proceed.

Current status: PAUSED - AWAITING_USER_INPUT
"""
)
```

### Step 2: Collect Complete Context

Gather from the sub-agent:
- Current progress percentage
- Completed deliverables
- Specific error messages
- All attempted solutions and their outcomes
- What resource/tool is missing

### Step 3: Update Project Status

Mark the agent as PAUSED in the status file.

### Step 4: Report to User with Full Details

**MANDATORY Format**:

```
🛑 子智能体任务暂停 —— 需要您的决策

═══════════════════════════════════════════════════════════

【暂停子智能体信息】
• 名称: {agent_label}
• 角色: {agent_role}
• 任务摘要: {brief_task_description}
• 运行时长: {runtime_duration}
• 会话ID: {session_key}

【问题详细描述】
问题类型: {tool_unavailable / api_limit / permission_denied / dependency_missing / unclear_requirement / technical_limitation}

具体错误:
```
{exact_error_message}
```

发生时间: {timestamp}
触发条件: {what_triggered_the_issue}

【已尝试的解决方案】
方案1: {description}
  尝试时间: {timestamp}
  结果: {failure_reason}

方案2: {description}
  尝试时间: {timestamp}
  结果: {failure_reason}

方案3: {description}
  尝试时间: {timestamp}
  结果: {failure_reason}

【当前进度】
• 完成度: {percentage}%
• 已产出文件: {list_of_deliverables}
• 剩余工作量: {remaining_tasks}
• 阻塞点: {specific_blocker}

【影响评估】
• 对整体项目的影响: {critical/high/medium/low}
• 预计延误: {time_estimate}
• 其他子智能体是否受影响: {yes/no}
  详情: {if_yes_explain}

【可行方案】

方案 A: {clear_description}
   ✅ 优点: {pros}
   ❌ 缺点: {cons}
   📋 需要您提供: {specific_requirements}

方案 B: {clear_description}
   ✅ 优点: {pros}
   ❌ 缺点: {cons}
   📋 需要您提供: {specific_requirements}

方案 C: 暂停等待
   🕐 等待条件: {what_we_are_waiting_for}
   📅 预计可恢复时间: {estimated_time}
   ⚠️ 风险: {risks_of_waiting}

【我的建议】
推荐方案: {A/B/C}
理由: {detailed_reasoning}

═══════════════════════════════════════════════════════════

请回复以下任一选项:
1. 选择方案 (A/B/C)
2. 提供特定资源 (如: "API key: xxx")
3. 提出新方案 (请详细说明)
4. 终止该子智能体任务 (将分配给其他智能体或调整项目范围)

⚠️ 重要: 该子智能体已暂停，在收到您的明确指示前不会继续工作。
```

### Step 5: Wait for User Decision

**PM MUST NOT**:
- ❌ Allow the paused agent to continue
- ❌ Have other agents "help finish" the paused agent's task
- ❌ Proceed with an alternative approach without user approval
- ❌ Make assumptions about what the user wants

---

## User Decision Recovery Protocol

### When User Responds

**Parse user decision**:
1. Which option did they choose? (A/B/C/Custom/Abort)
2. What resources/information did they provide?
3. Are there any specific constraints or requirements?

### Update Project Status

```json
{
  "agents": {
    "agent:main:subagent:xxxx": {
      "status": "RESUMING",
      "userDecision": {
        "chosenOption": "A",
        "providedResources": ["BRAVE_API_KEY: xxx"],
        "timestamp": "2026-02-01T04:35:00Z"
      },
      "previousStatus": "PAUSED"
    }
  }
}
```

### Restart Sub-Agent with Adjusted Task

**Resume Task Template**:

```
你是一个{role}，之前因{reason}暂停的任务现在恢复。

═══════════════════════════════════════════════════════════

【历史上下文】
原任务: {original_task_description}
已运行时长: {previous_runtime}
已完成工作:
• {deliverable_1}
• {deliverable_2}
• ...

进度: {percentage}%

【之前遇到的问题】
{problem_description}

已尝试但未成功的方案:
• {attempted_solution_1}
• {attempted_solution_2}

【用户决策】
用户选择的方案: {chosen_option}
用户提供的资源:
• {provided_resource_1}
• {provided_resource_2}

【调整后的任务】
{adjusted_task_description}

【特别说明】
⚠️ 请基于之前的进度继续，不要从头开始
⚠️ 避免重复之前失败的方案
⚠️ 如果再次遇到无法解决的问题，立即汇报，不要自行尝试超过2次
⚠️ 优先完成核心功能，非必要功能可后续迭代

═══════════════════════════════════════════════════════════
```

### Launch New Session

```python
sessions_spawn(
    task=adjusted_task_with_context,
    label=f"{original_label}-resumed",
    runTimeoutSeconds=adjusted_timeout
)
```

### Monitor Resumed Agent

- Check progress every 10 minutes (instead of default 30)
- Be more proactive in asking for status updates
- Prepare to escalate faster if issues recur

---

## Mandatory Escalation Triggers

PM **MUST** pause and consult the user when:

| Trigger | PM Action | Agent State |
|---------|-----------|-------------|
| **Tool/Resource unavailable** | Detailed report, ask: wait or alternative | 🛑 PAUSED |
| **API/Service rate limited** | Report limits, ask: upgrade plan or reduce scope | 🛑 PAUSED |
| **Permission denied** | Report permission needs, wait for user action | 🛑 PAUSED |
| **Dependency missing** (user file/data) | Report what's needed, wait for provision | 🛑 PAUSED |
| **Requirement unclear** | Ask for clarification, do NOT assume | 🛑 PAUSED |
| **Technical limitation** (environment constraint) | Report limitation, propose alternatives | 🛑 PAUSED |
| **Task scope needs major change** | Present options, wait for decision | 🛑 PAUSED |
| **Team disagreement >2 rounds** | Report disagreement, request decision | 🛑 PAUSED |
| **Multiple failures/timeouts** (>2 restarts) | Report failure chain, ask: abort or adjust | 🛑 PAUSED |
| **Budget/usage concerns** | Report projected costs, ask for approval | 🛑 PAUSED |

---

## QA Agent Workflow (验证员工作流程)

QA Agent follows a 5-stage workflow similar to executors, but focused on validation:

### Stage 1: Task Understanding (10%)

After receiving the validation task from PM:
1. Read PM's original project plan thoroughly
2. Understand each executor's task and expected deliverables
3. Clarify the overall project goals and quality standards
4. Report to PM for confirmation

**Report Template**:
```
📊 QA阶段汇报 —— 需求理解完成

【验证范围理解】
（简述要验证哪些交付物）

【各执行员工任务】
• 员工1 ({role1}): {task1} → 预期交付: {deliverable1}
• 员工2 ({role2}): {task2} → 预期交付: {deliverable2}
• 员工3 ({role3}): {task3} → 预期交付: {deliverable3}

【质量标准理解】
• 标准1: xxx
• 标准2: xxx

请PM确认理解是否正确。
```

### Stage 2: Validation Planning (20%)

After confirmation, create detailed validation plan:

**Validation Plan Must Include**:
1. **Validation Method**: How to verify each deliverable (functional test, code review, content check, etc.)
2. **Acceptance Criteria**: Clear pass/fail standards
3. **Validation Steps**: Specific operational procedures
4. **Validation Tools**: Required skills or tools
5. **Timeline**: Estimated time for each validation item

**Report Template**:
```
📋 QA方案汇报 —— 验证方案制定完成

【验证方案概述】
（简述验证策略）

【逐项验证计划】
员工1 - {deliverable1}:
  • 验证方法: xxx
  • 验收标准: xxx
  • 验证步骤: xxx
  • 预计时间: xxx

员工2 - {deliverable2}:
  ...

【验证工具】
• 工具1: xxx（用于...）

【风险评估】
• 风险1: xxx → 应对: xxx

请PM审批验证方案。
```

⚠️ **Critical**: QA **MUST NOT** start validation until PM approves the plan!

### Stage 3: Execute Validation (40%)

After PM approval:
1. Execute validation according to the plan
2. Record detailed results for each item
3. Progress reporting per completed executor

**Validation Result Categories**:
- ✅ **PASSED**: Meets all acceptance criteria
- ❌ **FAILED**: Does not meet criteria → Must return to executor with specific fix guidance

**Progress Report Template**:
```
📈 QA进度汇报 —— XX%

【已完成验证】
• 员工1 ({role1}): ✅ 通过 / ❌ 不通过
  详情: xxx

【待验证】
• 员工2: ...
• 员工3: ...

【发现的问题】
• 问题1: xxx → 已反馈员工1修改

【下一步】
• 继续验证员工2
```

### Stage 4: Iteration & Fix (if needed)

When an item fails validation:
1. Return to corresponding executor with detailed fix guidance
2. Executor revises and re-submits to QA
3. QA re-validates
4. Loop until passed or max retry limit reached (suggest: 3 times)

**Return Template**:
```
🔄 验证反馈 —— {executor_name}

【验证结果】: ❌ 不通过

【交付物】: {deliverable_name}

【问题详情】:
• 问题1: {description} → 建议修改: {guidance}
• 问题2: {description} → 建议修改: {guidance}

【修复要求】:
• 必须在 {deadline} 前完成修复
• 修复后重新提交给QA验证
• 当前重试次数: {count}/3

请按以上指导进行修改。
```

### Stage 5: Final Report (10%)

After all items passed validation (or max retry reached):
1. Generate comprehensive validation report
2. Submit to PM for final acceptance

**Final Report Template**:
```
📊 验证报告 —— {project_name}

═══════════════════════════════════════════════════════════
【验证概述】
• 验证日期: {date}
• 验证员: {qa_agent_label}
• 验证对象数: {n} 个员工交付物
• 总体结果: ✅ 全部通过 / ⚠️ 部分通过 / ❌ 未通过

═══════════════════════════════════════════════════════════
【逐项验证结果】

员工1 - {role1}:
  交付物: {deliverable1}
  状态: ✅ 通过 / ❌ 不通过
  验证详情:
    • 功能性: 符合/不符合 - 说明
    • 完整性: 符合/不符合 - 说明
    • 质量: 符合/不符合 - 说明
  问题记录: {issues}
  修复情况: {fix_status}
  重试次数: {count}

员工2 - {role2}:
  ...

═══════════════════════════════════════════════════════════
【发现的问题汇总】
• 问题1: ... (已修复/未修复)
• 问题2: ...

═══════════════════════════════════════════════════════════
【结论与建议】
• 是否通过验证: 是/否
• 建议PM关注: ...
• 建议后续优化: ...

═══════════════════════════════════════════════════════════
【交付物清单】
• 文件1: {path1}
• 文件2: {path2}
```

### QA Agent Prohibited Actions

❌ **Absolutely Forbidden**:
- Skip validation plan approval and start validating directly
- Give lenient judgments to avoid conflict
- Not record specific reasons for failure
- Allow executors to bypass QA and submit directly to PM
- Continue working when paused without PM instruction
- Attempt to fix executor's deliverables yourself

✅ **Must Do**:
- Get PM approval before starting validation
- Verify independently and objectively
- Provide specific, actionable fix guidance for failures
- Track retry counts and escalate if exceeding limit
- Report to PM immediately when encountering blockers

---

## Safeguards and Limits

### General Limits

| Limit | Action When Exceeded |
|-------|---------------------|
| **Agent timeout** (>30 min) | Detect → Pause → Analyze → Report to user (max 2 restarts total) |
| **Tool failures** (>3 consecutive) | Pause agent, report tool issue to user |
| **Cost threshold exceeded** | Pause agent, report projected costs, wait for approval |
| **Dispute >2 rounds** | PM intervenes with recommendation, but still requires user approval |
| **Rework >3 times** | Task terminated, escalate to user for scope adjustment |

### QA-Specific Limits & Retry Mechanism

#### Validation Retry Policy

When an executor's deliverable fails QA validation:

| Retry Count | Action |
|-------------|--------|
| **1st failure** | QA returns to executor with fix guidance. Executor revises and re-submits. |
| **2nd failure** | QA returns with more detailed guidance. PM notified of repeated failure. |
| **3rd failure** | **STOP.** QA PAUSES, reports to PM with full context. User decision required. |

```
Executor submits ──→ QA validates ──→ ❌ Failed
                              │
                              ▼ (Retry 1)
                    Return to Executor with guidance
                              │
                              ▼
                    Executor revises ──→ Re-submits
                              │
                              ▼
                    QA re-validates ──→ ❌ Failed again
                              │
                              ▼ (Retry 2)
                    Return to Executor + Notify PM
                              │
                              ▼
                    Executor revises ──→ Re-submits
                              │
                              ▼
                    QA re-validates ──→ ❌ Failed 3rd time
                              │
                              ▼ (Retry 3 - MAX)
                    QA PAUSES ──→ Report to PM ──→ User Decision
```

#### QA Pause Triggers

QA **MUST** pause and escalate to PM when:

| Trigger | Reason | PM Action |
|---------|--------|-----------|
| **Max retries exceeded** (3 fails) | Executor cannot meet quality standards | Decide: extend retries / reduce scope / reassign / abort |
| **Validation tool unavailable** | Cannot execute validation plan | Wait for tool / alternative method / skip validation |
| **Unclear acceptance criteria** | Cannot determine pass/fail | Clarify criteria with user |
| **Deliverable format incompatible** | Cannot open/verify deliverable | Request executor to reformat |
| **Scope disagreement with executor** | Executor challenges QA judgment | PM mediates and decides |
| **Time budget exceeded** | Validation taking too long | Decide: continue / reduce validation scope |

#### QA Pause Report Template

```
🛑 QA验证暂停 —— 需要PM决策

═══════════════════════════════════════════════════════════

【暂停信息】
• QA代理: {qa_label}
• 触发原因: {reason}
• 暂停时间: {timestamp}

【验证上下文】
当前验证项目: {deliverable_name}
所属员工: {executor_name}
验证进度: {current}/{total}

【问题详情】
问题类型: {max_retries_exceeded / tool_unavailable / criteria_unclear / ...}

具体描述:
{detailed_description}

【重试历史】(如适用)
• 第1次失败: {time1} - 问题: {issue1} - 已修复
• 第2次失败: {time2} - 问题: {issue2} - 已修复
• 第3次失败: {time3} - 问题: {issue3} - 未修复

【当前交付物状态】
文件: {file_path}
质量评估: 高/中/低
主要问题: {issues}

【可选方案】

方案 A: 延长重试次数限制
   ✅ 适用: 员工有进步但尚未达标
   ❌ 风险: 可能继续延误
   📋 需要: 用户确认 + 新的deadline

方案 B: 降低验收标准
   ✅ 适用: 当前标准过高
   ❌ 风险: 降低最终质量
   📋 需要: 用户明确哪些标准可放宽

方案 C: 重新分配任务
   ✅ 适用: 该员工无法胜任
   ❌ 风险: 新交接成本
   📋 需要: 其他员工接手

方案 D: 终止此交付物
   ✅ 适用: 非核心组件
   ❌ 风险: 功能缺失
   📋 需要: 用户确认可接受

【QA建议】
推荐方案: {A/B/C/D}
理由: {reasoning}

═══════════════════════════════════════════════════════════

请回复:
1. 选择方案 (A/B/C/D)
2. 提供补充信息
3. 提出新方案
4. 终止整个QA验证流程

⚠️ QA已暂停，等待您的决策。
```

#### PM Decision Recovery for QA Issues

When user responds to QA pause:

**Step 1**: Parse user decision
**Step 2**: Update QA agent status to "RESUMING"
**Step 3**: Restart QA or Executor with adjusted task

**Resume Templates**:

```
# If continuing with same executor (more retries granted)
你正在修复 {deliverable}，之前因 {reason} 被QA打回。

用户决策: 允许继续修复（第{count}次重试）
新的deadline: {new_deadline}

请基于QA的反馈继续修复，完成后重新提交给QA。
```

```
# If reassigning to different executor
你是新的执行员工，接手 {deliverable} 的修复工作。

【历史上下文】
原执行员工: {previous_executor}
之前的交付物: {file_path}
QA反馈的问题: {issues}
用户决策: 重新分配给新执行员工

【你的任务】
基于原交付物和QA反馈，重新实现此功能。
请从理解需求开始，按正常流程执行。
```

### Timeout Recovery Process (Updated)

When a sub-agent times out:

1. **PM Detects Timeout** → Immediately identify which agent
2. **PAUSE the Agent** → Send stop signal, request partial progress summary
3. **PM Analysis** → Determine probable cause
4. **Report to User** → Do NOT auto-restart
5. **Wait for Decision** → User decides: reduce scope, adjust approach, or abort
6. **Resume if Directed** → Only restart if user explicitly approves

**Maximum Attempts**: 3 total (original + 2 restarts)
**After 3 failures**: PM MUST escalate to user — do NOT continue

---

## Communication Protocol

### QA-Specific Communication Templates

#### PM → QA: Validation Task Assignment

```
你是一个验证员/测试员(QA)，负责独立验证团队成员的工作成果。

═══════════════════════════════════════════════════════════
📋 验证任务信息
═══════════════════════════════════════════════════════════

【原始项目规划】
{pm_original_plan}

【执行员工任务清单】
员工1 ({role1}): 
  任务: {task1}
  预期交付: {deliverable1}
  文件路径: {path1}

员工2 ({role2}): 
  任务: {task2}
  预期交付: {deliverable2}
  文件路径: {path2}

员工3 ({role3}): 
  任务: {task3}
  预期交付: {deliverable3}
  文件路径: {path3}

【验证要求】
1. 阶段汇报：理解任务完成 → PM确认
2. 阶段汇报：验证方案制定完成 → PM审批 ⚠️ 必须批准后才能执行
3. 进度汇报：每完成一个员工验证 → PM
4. 迭代反馈：不通过的打回员工，附上具体修改建议
5. 最终结果：验证报告 → PM

【验证标准维度】
• 功能性：是否实现了任务要求的核心功能
• 完整性：是否包含所有必需的组件/内容
• 质量：是否符合专业标准（代码规范、文档完整性等）
• 一致性：是否与整体项目和其他交付物协调

═══════════════════════════════════════════════════════════
🛠️ 可用工具与技能
═══════════════════════════════════════════════════════════
{available_skills}

⚠️ 验证流程关键提醒：
1. 制定验证方案后必须获得PM批准才能开始验证
2. 验证要客观独立，不能因为怕冲突而降低标准
3. 不通过的必须给出具体的、可执行的修改建议
4. 记录重试次数，超过3次立即上报PM
5. 遇到问题立即暂停汇报，不要自己硬试
═══════════════════════════════════════════════════════════

请开始执行验证任务。
```

#### QA → Executors: Validation Feedback (Failed)

```
🔄 验证反馈 —— {executor_name}

【验证结果】: ❌ 不通过

【交付物】: {deliverable_name}
【文件路径】: {file_path}

═══════════════════════════════════════════════════════════
【问题详情】:

问题1: {brief_description}
  位置: {where_in_deliverable}
  具体描述: {detailed_description}
  严重程度: 高/中/低
  建议修改: {actionable_guidance}
  参考标准: {acceptance_criteria_reference}

问题2: ...

═══════════════════════════════════════════════════════════
【修复要求】:
• 请在 {deadline} 前完成修复
• 修复后重新提交给QA验证
• 当前重试次数: {count}/3
• 如超过3次仍未通过，将上报PM处理

【验收标准提醒】:
• {criterion1}: {expected}
• {criterion2}: {expected}

═══════════════════════════════════════════════════════════

如有疑问，请先与PM沟通。不要自行降低标准。
```

#### QA → Executors: Validation Feedback (Passed)

```
✅ 验证通过 —— {executor_name}

【验证结果】: 通过 ✅

【交付物】: {deliverable_name}
【文件路径】: {file_path}

═══════════════════════════════════════════════════════════
【验证详情】:

✓ 功能性: 符合 - {evidence}
✓ 完整性: 符合 - {evidence}
✓ 质量: 符合 - {evidence}
✓ 一致性: 符合 - {evidence}

═══════════════════════════════════════════════════════════
【备注】:
{optional_notes_or_minor_suggestions}

此交付物已通过验证，将进入最终汇总报告。
```

#### QA → PM: Validation Plan for Approval

```
📋 验证方案汇报 —— {project_name}

═══════════════════════════════════════════════════════════
【方案概述】
基于原始项目规划，制定以下验证策略:
{strategy_summary}

═══════════════════════════════════════════════════════════
【逐项验证计划】

员工1 - {role1}:
  交付物: {deliverable1}
  验证方法: {method} (如: 功能测试/代码审查/内容检查)
  验收标准:
    • 标准1: {criterion1} → 通过条件: {pass_condition}
    • 标准2: {criterion2} → 通过条件: {pass_condition}
  验证步骤:
    1. {step1}
    2. {step2}
    3. {step3}
  预计时间: {estimated_time}

员工2 - {role2}:
  ...

═══════════════════════════════════════════════════════════
【验证工具与资源】
• 工具1: {tool1} - 用途: {purpose}
• 工具2: {tool2} - 用途: {purpose}

═══════════════════════════════════════════════════════════
【风险评估与应对】
• 风险1: {risk} → 应对: {mitigation}

═══════════════════════════════════════════════════════════
【预计总时间】
{total_estimated_time}

═══════════════════════════════════════════════════════════

⚠️ 请PM审批此验证方案:
[ ] 批准 - 按方案执行
[ ] 修改后批准 - 调整建议: ...
[ ] 需要补充 - 缺少: ...
```

#### QA → PM: Validation Report (Final)

```
📊 验证报告 —— {project_name}

═══════════════════════════════════════════════════════════
【验证概述】
• 验证日期: {date}
• 验证员: {qa_agent_label}
• 验证对象: {n} 个员工交付物
• 总体结果: ✅ 全部通过 / ⚠️ 部分通过 / ❌ 未通过
• 平均重试次数: {avg_retry}

═══════════════════════════════════════════════════════════
【逐项验证结果】

员工1 - {role1}:
  ───────────────────────────────────────
  交付物: {deliverable1}
  文件路径: {path1}
  状态: ✅ 通过
  
  验证详情:
    ✓ 功能性: 符合 - {evidence}
    ✓ 完整性: 符合 - {evidence}
    ✓ 质量: 符合 - {evidence}
  
  问题记录: 无 / {issues}
  修复情况: 无需修复 / 已修复
  重试次数: {count}

员工2 - {role2}:
  ───────────────────────────────────────
  交付物: {deliverable2}
  文件路径: {path2}
  状态: ❌ 不通过 (已打回修复)
  
  验证详情:
    ✓ 功能性: 符合
    ✗ 完整性: 不符合 - {reason}
  
  问题记录:
    • 问题1: {description}
    • 问题2: {description}
  
  修复情况: 待修复
  重试次数: {count}/3

═══════════════════════════════════════════════════════════
【问题汇总与修复情况】

已修复问题:
• 问题1: {description} (员工X) ✓

待修复问题 ( blocker ):
• 问题2: {description} (员工Y) - 状态: 第{count}次打回

═══════════════════════════════════════════════════════════
【QA结论与建议】

整体质量评估: 高/中/低

是否建议PM接受: 是/否 (条件性接受/需延迟)

建议PM关注:
• {concern1}
• {concern2}

建议后续优化:
• {suggestion1}
• {suggestion2}

═══════════════════════════════════════════════════════════
【交付物清单】 (全部已通过验证)
• {path1} - 员工1
• {path2} - 员工2
• {path3} - 员工3

═══════════════════════════════════════════════════════════

报告生成时间: {timestamp}
验证员签名: {qa_label}
```

---

### Sub-Agent → PM Reporting

Sub-agents must report regularly:
```
Progress: X%
Completed: [list]
Blocked by: [issue or "none"]
Need support: [yes/no, details]
```

When blocked:
```
🚨 BLOCKED
Issue: [description]
Attempted: [solutions tried]
Need: [specific help required]
Suggested escalation: [yes/no, reason]
```

### PM → User Reporting

**Progress Updates** (every 30 min or at milestones):
```
📊 Project Update: {project-name}

Team Status:
• Agent A (Role): {status} - {progress}
• Agent B (Role): {status} - {progress}
• Agent C (Role): {status} - {progress}

Overall: {X}% complete
ETA: {time estimate}
Issues: {none / summary}
```

**Issue Escalation**: Use detailed format from "Sub-Agent Pause Protocol"

---

## Operating Modes

### FULL_AUTO Mode
- PM makes decisions on routine matters
- Team works autonomously on clear tasks
- **Exception**: Still PAUSES and escalates on blockers
- Best for: Well-defined tasks with clear success criteria

### SUPERVISED Mode
- PM asks for confirmation at key milestones:
  1. Understanding confirmation
  2. Team plan confirmation
  3. Draft/prototype review
  4. Any issue that would require PAUSE
  5. Final delivery acceptance
- Best for: Complex/critical tasks, when user wants control

---

## Task Assignment with Skill Awareness

When assigning tasks to sub-agents, PM must include available skill information.

### Task Assignment Template

```
你是一个{role}，负责以下任务：

{task_description}

═══════════════════════════════════════════════════════════
🛠️ 可用工具与技能
═══════════════════════════════════════════════════════════

本任务可以使用以下 skills:

【Skill: {skill-name}】
• 功能: {description}
• 位置: {location}
• 使用方法: 读取 SKILL.md 获取详细用法
  `read:0:{"path": "{location}/SKILL.md"}`

⚠️ 重要提示:
1. 在开始前，阅读可用的 SKILL.md 文件了解工具用法
2. 优先使用已分配的 skills 完成任务
3. 如果不确定如何使用 skill，立即向 PM 询问
4. 如果 skill 不能满足需求，立即汇报
═══════════════════════════════════════════════════════════

任务执行要求:
1. 定期向 PM 汇报进度
2. 遇到无法解决的问题立即上报
3. 不要自行尝试超过2次失败方案

请开始执行任务。
```

### Skill Assignment by Role

PM should assign skills based on role responsibilities:

| Role Type | Likely Skills | Example Assignment |
|-----------|---------------|-------------------|
| **Video Creator** | video-generation, audio-generation | remotion-synced-video, doubao-open-tts |
| **Image Designer** | image-generation, image-editing | nano-banana-pro, google-images-crawler |
| **Research Analyst** | web-search, research | moltresearch, hf-papers-reporter |
| **Document Writer** | document-processing, text-generation | report-generator, markdown-converter |
| **Git/Version Control** | git, github | github-commit-push, backup |

---

## Project State Management
All project progress tracked in:
```
projects/
├── {project-id}.md           # Project log with decisions
├── agent-status.json         # Real-time agent states
├── deliverables/             # All output files
└── issues/                   # Log of issues and resolutions
```

### Required Log Entries

**When agent is PAUSED**:
```markdown
## 2026-02-01 04:30 - Agent PAUSED

- Agent: PiAgent-Researcher
- Reason: web_search API unavailable
- Progress: 35%
- User notified: yes
- Awaiting: user decision on API key
```

**When agent is RESUMED**:
```markdown
## 2026-02-01 04:35 - Agent RESUMED

- Agent: PiAgent-Researcher
- User decision: Provided BRAVE_API_KEY
- Adjusted task: Use web_search with provided key
- New session: agent:main:subagent:yyyy
```

---

## PM Proactive Monitoring & Reporting (Critical)

### Why Proactive Monitoring Matters

**Problem**: Sub-agent completion notifications may be queued or delayed due to:
- PM being busy with other tasks
- Message queue batching
- System scheduling

**Result**: User sees sub-agents completed work but PM didn't proactively report, creating confusion.

### PM Monitoring Responsibilities

As PM, you MUST:

1. **Active Polling**: Check sub-agent status every 3-5 minutes during execution phase
   ```python
   sessions_list(kinds=["subagent"])
   # Check updatedAt timestamps and token usage
   ```

2. **File System Checks**: Verify deliverables in project directory
   ```bash
   ls -la projects/{project-id}/
   # Check file sizes and timestamps
   ```

3. **Key Event Triggers**: Report immediately when:
   - Any executor marks status COMPLETED
   - QA submits validation report
   - Agent encounters blocker (PAUSED status)
   - Unexpected timeout or failure

### Status Aggregation Template

When reporting to user, use:

```
📊 项目进展汇报

| 角色 | 状态 | 产出 |
|------|------|------|
| {role1} | {status1} | {deliverable1} |
| {role2} | {status2} | {deliverable2} |
...

【当前产出】
- ✅ 文件1 (大小) - 说明
- ✅ 文件2 (大小) - 说明

【下一步】...
```

### Anti-Patterns to Avoid

❌ **Don't**: Wait for user to ask "what's the status?"
❌ **Don't**: Rely solely on sub-agent push notifications
❌ **Don't**: Report raw sub-agent messages without aggregation

✅ **Do**: Proactively poll and summarize
✅ **Do**: Aggregate multiple updates into coherent progress report
✅ **Do**: Use tables and structured formatting for clarity

---

## Deliverable Aggregation

Based on task type:

| Task Type | Aggregation Method |
|-----------|-------------------|
| Code Project | Structured project folder with all files |
| Writing Task | Compiled cohesive document |
| Research | Synthesized summary report |
| Design | Packaged assets with documentation |

**Important**: If any sub-agent was PAUSED during the project, include:
- Summary of issues encountered
- How they were resolved
- Any workarounds used
- Lessons learned

---

## Quick Reference: When to PAUSE

**PAUSE immediately if**:
- [ ] Sub-agent reports "I cannot solve this"
- [ ] Tool returns "API key required" or similar
- [ ] Permission denied after checking alternatives
- [ ] Task scope unclear and sub-agent is guessing
- [ ] Environment limitation prevents execution
- [ ] Cost would exceed reasonable expectation
- [ ] Same failure occurs twice

**DO NOT**:
- [ ] Let sub-agent "try one more thing" without user approval
- [ ] Have other agents cover for a paused agent
- [ ] Proceed with reduced quality to avoid escalation
- [ ] Make scope decisions without user input

---

*This skill ensures transparent collaboration with the user as the ultimate decision-maker. When in doubt, PAUSE and escalate.*

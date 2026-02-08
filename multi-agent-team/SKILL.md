---
name: multi-agent-team
description: A virtual 3-person executor team + 1 independent QA agent with dynamic roles. A Leadership Council (三权分立) of three domain leaders assembles the team, assigns tasks, coordinates work, resolves disputes, and delivers the final result. Supports FULL_AUTO and SUPERVISED modes with dual-layer quality assurance.
metadata:
  tags: team, multi-agent, collaboration, project-management, delegation, qa, verification
---

# Multi-Agent Team

A virtual **3-person executor team + 1 independent QA agent** that works collaboratively to complete complex tasks with dual-layer quality assurance. The team is orchestrated by a **Leadership Council (三权分立)** composed of three domain leaders.

## Leadership Council (三权分立) Architecture

| Leader | Authority Domain | Responsibilities |
|--------|-----------------|------------------|
| **Planning Authority Leader** | Plan approval, team assembly, task design | Reviews and approves agent plans, assembles team composition, designs task breakdown and section assignments |
| **Execution Authority Leader** | Progress monitoring, runtime coordination | Monitors agent progress, handles timeouts, coordinates WHITEBOARD, manages agent lifecycle |
| **Quality Authority Leader** | QA oversight, validation approval, final acceptance | Approves QA validation plans, reviews QA reports, makes final acceptance decisions |

**Critical Principle**: The Leadership Council is a **coordinator**, not an **executor**. When the team is blocked, the Council **must** escalate to the user and **pause** the affected sub-agent.

---

## How It Works

### High-Level Flow

```
User Request
    ↓
[Stage 0: Requirement Clarification] Multi-round dialogue (2-3 rounds, 5 questions/round)
    ├─→ Evaluate confidence across 5 dimensions
    └─→ Stop when confidence ≥ 75/100
    ↓
[Planning Authority] Assembles 3-person executor team + 1 QA agent
    ↓
[Planning Authority] Task distribution with section assignment
    ├─→ Executors: Individual tasks + specific sections + team context
    └─→ QA: Validation scope (all sections)
    ↓
[Executors Work] Parallel execution → Submit to QA
    ↓
[QA Plans Validation] Create plan → Quality Authority approves
    ↓
[QA Validates] Verify deliverables
    ├─→ ✅ Pass: Mark complete
    └─→ ❌ Fail: Return to executor (max 3 retries)
    ↓
[Quality Authority] Final acceptance → Deliver to user
```

### Requirement Clarification Phase

**Purpose**: Ensure requirements are well-understood BEFORE creating the multi-agent team.

**Key Features**:
- Multi-round dialogue (minimum 2 rounds, soft maximum 3)
- 5 adaptive questions per round targeting confidence gaps
- Confidence-based stopping: automatically stops when confidence ≥ 75/100

**Confidence Dimensions** (weighted scoring):
- **Scope Clarity (25%)**: Goal, boundaries, deliverables
- **Technical Clarity (25%)**: Tech stack, constraints, dependencies
- **Deliverable Clarity (20%)**: Format, structure, acceptance criteria
- **Constraint Clarity (15%)**: Timeline, resources, limitations
- **Context Clarity (15%)**: Background, audience, success metrics

**Output**: Enriched request with structured clarifications + Q&A history

---

## Skill-Aware Planning

**Dynamic Agent-Side Skill Discovery**: Agents discover and select skills dynamically at runtime.

**Process**:
1. Leadership Council detects user-specified skills (patterns: "使用 {skill-name} 技能")
2. Each agent uses `find-skills` to discover available skills
3. Agents select 2-3 skills matching their role
4. Planning Authority Leader approves selections
5. Agents use approved skills during execution

**Benefits**:
- ✅ Generic & portable (works on any computer)
- ✅ Always up-to-date (no stale cache)
- ✅ Environment-aware

---

## Sub-Agent Autonomous Planning Workflow

Sub-agents MUST follow: **"Planning → Approval → Execution"**

### Workflow Overview

```
技能发现 → 需求理解 → Skill调研 → 方案规划 → Council审批 → 执行 → 完成
```

### Stage 0: 技能发现 (5%)

1. Use `find-skills` to discover available skills
2. Select 2-3 skills matching role and task
3. Report to Leadership Council
4. **Wait for Planning Authority Leader approval**

### Stage 1: 需求理解 (10%)

1. Read user requirements carefully
2. **Understand assigned section and team context** (not standalone deliverable)
3. Review teammate sections on WHITEBOARD
4. Identify dependencies and integration points
5. Report understanding to Planning Authority Leader

**Team Context Understanding**:
- Your assigned section (e.g., "Backend API", "Chapter 2")
- Overall deliverable structure
- Teammate sections and dependencies
- Integration points

### Stage 2: Skill 调研 (20%)

1. Read approved skills' SKILL.md documentation
2. Understand capabilities, limitations, usage methods
3. Confirm skills meet task requirements
4. Report findings to Leadership Council

### Stage 3: 方案规划 (30%)

Create detailed plan including:
1. **Skill selection**: Which skills, why
2. **Execution steps**: Specific operations (command-level detail)
3. **Expected output**: Clear deliverable list
4. **Risk mitigation**: Potential issues and solutions
5. **Time estimate**: Completion timeline

**Report to Planning Authority Leader and wait for approval**

### Stage 4: 执行 (40%)

After approval:
1. Execute according to approved plan
2. Report progress at milestones to Execution Authority Leader
3. Report deviations immediately
4. Submit deliverable to QA (NOT directly to Council)

### Prohibited Actions

❌ **Never**:
- Execute without Planning Authority Leader approval
- Skip reading skill documentation
- Skip planning and start directly
- Try same failed solution >2 times without reporting
- Work in isolation without progress updates

✅ **Always**:
- Report at end of each stage
- Be specific (command-level detail in plans)
- Ask when uncertain, don't guess

---

## Team Structure

### Team Composition

- **3 Executor Agents**: Dynamically assigned roles (e.g., Frontend Dev, Backend Dev, Designer)
- **1 QA Agent**: Independent verification specialist

### Team Context Awareness

**Problem Solved**: Agents understand they contribute **part of a larger whole** rather than standalone deliverables.

**Key Features**:
- **Section Assignment**: Each executor receives specific section (e.g., "Chapter 1", "Backend API")
- **Full Team Visibility**: Agents see complete team structure and dependencies
- **Real-Time Coordination**: WHITEBOARD shows live progress
- **Task-Specific Structure**: Section assignments adapt to task type

**Section Assignment Examples**:
- **Document Tasks**: "1. Introduction", "2. Main Content", "3. Conclusions"
- **Code Tasks**: "Backend API", "Frontend UI", "Database Schema"
- **Research Tasks**: "Literature Review", "Methodology", "Results & Discussion"

**QA Special Handling**:
- Assigned section: "Quality Assurance & Validation (All Sections)"
- No content ownership (validates but doesn't create)
- Full project visibility for context

---

## Role Boundaries

| Role | Responsibilities | Prohibited Actions |
|------|------------------|-------------------|
| **Leadership Council** | Plan, assign, coordinate, monitor, **escalate blockers**, **pause stuck agents**, final acceptance | ❌ Execute tasks<br>❌ Make major decisions without user approval<br>❌ Hide problems<br>❌ Allow paused agents to continue |
| **Executors** | Execute tasks, report progress, **escalate issues**, **submit to QA** | ❌ Message user directly<br>❌ Change scope without approval<br>❌ Continue when paused<br>❌ Submit directly to Council |
| **QA/Verifier** | Create validation plan (requires approval), verify independently, pass/fail verdict, fix guidance | ❌ Skip validation plan approval<br>❌ Be lenient on quality<br>❌ Continue when paused<br>❌ Bypass iteration on failures |

---

## Sub-Agent Lifecycle Management

### Executor States

```
RUNNING → PENDING_VERIFICATION → UNDER_VERIFICATION → VERIFIED → QA_COMPLETED
    ↓              ↑
  PAUSED    RETURNED_FOR_FIX (max 3 retries)
```

### QA Agent States

```
RUNNING → QA_PLANNING → QA_VALIDATING → QA_COMPLETED
    ↓
  PAUSED
```

### State Management

Status tracked in `projects/{project-id}/agent-status.json`:

**Key Fields**:
- `status`: Current lifecycle state
- `assignedSection`: Specific section assigned to agent
- `sectionOrder`: Numeric order for sequencing
- `dependencies`: Array of role names this agent depends on
- `validationResults`: Pass/fail status, retry count, issues

---

## Sub-Agent Pause Protocol (CRITICAL)

When a sub-agent encounters an unresolvable blocker:

### Step 1: Immediately Pause the Agent

Send pause signal: "🛑 TASK PAUSED - STOP all work immediately. Wait for Leadership Council instructions."

### Step 2: Collect Complete Context

- Current progress percentage
- Completed deliverables
- Specific error messages
- All attempted solutions and outcomes
- Missing resource/tool

### Step 3: Update Project Status

Mark agent as PAUSED in status file.

### Step 4: Report to User with Full Details

**MANDATORY Format**:

```
🛑 子智能体任务暂停 —— 需要您的决策

【暂停子智能体信息】
• 名称: {agent_label}
• 角色: {agent_role}
• 运行时长: {duration}

【问题详细描述】
问题类型: {tool_unavailable / api_limit / permission_denied / etc.}
具体错误: {exact_error_message}

【已尝试的解决方案】
方案1: {description} → 结果: {failure_reason}
方案2: {description} → 结果: {failure_reason}

【当前进度】
• 完成度: {percentage}%
• 阻塞点: {specific_blocker}

【影响评估】
• 对整体项目的影响: {critical/high/medium/low}

【可行方案】
方案 A: {description}
   ✅ 优点: {pros}
   ❌ 缺点: {cons}
   📋 需要您提供: {requirements}

方案 B: {description}
   ✅ 优点: {pros}
   ❌ 缺点: {cons}

方案 C: 暂停等待
   🕐 等待条件: {what_we_are_waiting_for}

【我的建议】
推荐方案: {A/B/C}
理由: {reasoning}

请回复选项 (A/B/C) 或提供特定资源
```

### Step 5: Wait for User Decision

**Leadership Council MUST NOT**:
- ❌ Allow paused agent to continue
- ❌ Have other agents "help finish" the paused agent's task
- ❌ Proceed with alternative without user approval
- ❌ Make assumptions about user wants

---

## Mandatory Escalation Triggers

Leadership Council **MUST** pause and consult user when:

| Trigger | Council Action | Agent State |
|---------|-----------|-------------|
| **Tool/Resource unavailable** | Report, ask: wait or alternative | 🛑 PAUSED |
| **API/Service rate limited** | Report limits, ask: upgrade or reduce scope | 🛑 PAUSED |
| **Permission denied** | Report needs, wait for user action | 🛑 PAUSED |
| **Dependency missing** (user file/data) | Report what's needed | 🛑 PAUSED |
| **Requirement unclear** | Ask clarification, do NOT assume | 🛑 PAUSED |
| **Technical limitation** | Report limitation, propose alternatives | 🛑 PAUSED |
| **Task scope needs major change** | Present options, wait for decision | 🛑 PAUSED |
| **Multiple failures/timeouts** (>2 restarts) | Report failure chain | 🛑 PAUSED |

---

## QA Agent Workflow

### Stage 1: Task Understanding (10%)

1. Read Council's original project plan
2. Understand each executor's expected deliverables
3. Clarify quality standards
4. Report to Quality Authority Leader for confirmation

### Stage 2: Validation Planning (20%)

Create detailed validation plan including:
1. Validation method (functional test, code review, content check)
2. Acceptance criteria (clear pass/fail standards)
3. Validation steps (specific procedures)
4. Validation tools (required skills)
5. Timeline (estimated time per item)

**Report to Quality Authority Leader and WAIT for approval**

### Stage 3: Execute Validation (40%)

After approval:
1. Execute validation according to plan
2. Record detailed results for each item
3. Report progress per completed executor

**Validation Results**:
- ✅ **PASSED**: Meets all criteria
- ❌ **FAILED**: Return to executor with specific fix guidance

### Stage 4: Iteration & Fix (if needed)

**Retry Policy**:
- **1st failure**: Return with fix guidance
- **2nd failure**: Return with detailed guidance + notify Execution Authority Leader
- **3rd failure**: **STOP** - QA PAUSES, reports to Council, user decision required

### Stage 5: Final Report (10%)

Generate comprehensive validation report including:
- Validation summary
- Per-item verification results
- Issues found and fix history
- Overall quality assessment
- Recommendations

Submit to Quality Authority Leader for final acceptance.

### QA Prohibited Actions

❌ **Never**:
- Skip validation plan approval
- Give lenient judgments
- Not record specific failure reasons
- Continue when paused
- Attempt to fix executor's deliverables yourself

✅ **Always**:
- Get Quality Authority Leader approval before validating
- Verify objectively and independently
- Provide specific, actionable fix guidance
- Track retry counts and escalate at limit

---

## Safeguards and Limits

| Limit | Action When Exceeded |
|-------|---------------------|
| **Agent timeout** (>30 min) | Detect → Pause → Analyze → Report to user (max 2 restarts) |
| **Tool failures** (>3 consecutive) | Pause agent, report tool issue |
| **QA validation failures** (>3 retries) | QA pauses, reports to Council, user decision required |
| **Dispute >2 rounds** | Council intervenes, requires user approval |

---

## Communication Protocol

### WHITEBOARD

**Shared communication board** showing:

**Project Structure**:
- Overall deliverable description
- Project outline
- Section assignments
- Dependencies

**Team Status**:
- Each agent's status (RUNNING/PAUSED/COMPLETED)
- Current phase and progress
- Assigned section
- Last update timestamp

**When to Check WHITEBOARD**:
- **Executors**: At phase start, before execution, when waiting for dependencies
- **Leadership Council**: When monitoring, when agent reports dependency issue
- **QA**: When planning validation, when validating integration

**File Location**: `projects/{project-id}/WHITEBOARD.md`

### Reporting Templates

**Executors → Council (Progress)**:
```
📈 进度汇报 —— {role} —— XX%

【已完成】
• xxx

【进行中】
• xxx

【协调情况】
• 已查看 WHITEBOARD，{teammate} 预计 {time} 完成

【下一步】
• xxx
```

**QA → Quality Authority Leader (Validation Plan)**:
```
📋 验证方案汇报

【方案概述】
{strategy_summary}

【逐项验证计划】
员工1 - {deliverable1}:
  验证方法: {method}
  验收标准: {criteria}
  验证步骤: {steps}

请Quality Authority Leader审批验证方案。
```

**QA → Executor (Failed)**:
```
🔄 验证反馈 —— {executor_name}

【验证结果】: ❌ 不通过

【问题详情】:
• 问题1: {description} → 建议修改: {guidance}

【修复要求】:
• 当前重试次数: {count}/3
• 修复后重新提交给QA验证
```

**QA → Quality Authority Leader (Final Report)**:
```
📊 验证报告

【验证概述】
• 验证对象: {n} 个员工交付物
• 总体结果: ✅ 全部通过 / ⚠️ 部分通过

【逐项验证结果】
员工1: ✅ 通过 - {details}
员工2: ❌ 不通过 - {issues}

【QA结论与建议】
是否建议接受: 是/否
建议关注: {concerns}
```

---

## Operating Modes

### FULL_AUTO Mode
- Leadership Council makes routine decisions
- Team works autonomously
- **Exception**: Still PAUSES on blockers
- Best for: Well-defined tasks

### SUPERVISED Mode
- Council asks confirmation at key milestones:
  1. Understanding confirmation
  2. Team plan confirmation
  3. Draft/prototype review
  4. Final delivery acceptance
- Best for: Complex/critical tasks

---

## Leadership Council Proactive Monitoring (Critical)

**Why**: Sub-agent completion notifications may be delayed due to message queuing.

**Execution Authority Leader MUST**:
1. **Active Polling**: Check sub-agent status every 3-5 minutes
2. **File System Checks**: Verify deliverables in project directory
3. **Key Event Triggers**: Report immediately when:
   - Any executor marks COMPLETED
   - QA submits validation report
   - Agent encounters blocker (PAUSED)
   - Unexpected timeout/failure

**Anti-Patterns**:
- ❌ Wait for user to ask "what's the status?"
- ❌ Rely solely on sub-agent push notifications

**Best Practices**:
- ✅ Proactively poll and summarize
- ✅ Aggregate multiple updates into coherent report
- ✅ Use tables and structured formatting

---

## Deliverable Aggregation

Based on task type:

| Task Type | Aggregation Method |
|-----------|-------------------|
| Code Project | Structured project folder with all files |
| Writing Task | Compiled cohesive document |
| Research | Synthesized summary report |
| Design | Packaged assets with documentation |

**Important**: If any sub-agent was PAUSED, include issue summary and resolution in final deliverable.

---

## Quick Reference: When to PAUSE

**PAUSE immediately if**:
- [ ] Sub-agent reports "I cannot solve this"
- [ ] Tool returns "API key required"
- [ ] Permission denied after checking alternatives
- [ ] Task scope unclear and sub-agent is guessing
- [ ] Environment limitation prevents execution
- [ ] Same failure occurs twice

**DO NOT**:
- [ ] Let sub-agent "try one more thing" without user approval
- [ ] Have other agents cover for paused agent
- [ ] Proceed with reduced quality to avoid escalation
- [ ] Make scope decisions without user input

---

*This skill ensures transparent collaboration with the user as the ultimate decision-maker. When in doubt, PAUSE and escalate.*

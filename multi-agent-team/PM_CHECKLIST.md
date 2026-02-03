# PM 操作检查清单 - Multi-Agent Team Skill

> 本文件用于确保我（PM）在使用 multi-agent-team skill 时严格遵循暂停协议和汇报要求

---

## 🚨 黄金法则

**当子智能体遇到无法解决的问题时：**

```
❌ 不要："让我看看能不能帮你解决"
❌ 不要："你试试另一种方法"
❌ 不要：让其他子智能体"帮忙完成"

✅ 必须：立即停止该子智能体
✅ 必须：收集完整上下文
✅ 必须：详细汇报用户
✅ 必须：等待用户决策后再恢复
```

---

## 暂停协议执行检查清单

### Step 1: 发送暂停信号

- [ ] 使用 `sessions_send` 向该子智能体发送暂停消息
- [ ] 明确告知"STOP all work immediately"
- [ ] 确认子智能体已收到并停止

**暂停消息模板**：
```
🛑 TASK PAUSED

You have encountered a blocker that requires user decision.

STOP all work immediately.
DO NOT attempt further solutions.
DO NOT continue with alternative approaches.

Your current progress has been saved.
Wait for PM instructions on how to proceed.

Current status: PAUSED - AWAITING_USER_INPUT
```

---

### Step 2: 收集完整上下文

**必须收集的信息**：

- [ ] 子智能体名称和角色
- [ ] 任务运行时长
- [ ] 当前进度百分比
- [ ] 已完成的具体产出（文件、数据等）
- [ ] 具体的错误信息（完整日志）
- [ ] 问题发生的时间点
- [ ] 触发问题的条件
- [ ] 已尝试的解决方案清单（每次尝试的时间和结果）

**收集方法**：
```python
# 查看子智能体历史
sessions_history(sessionKey=agent_session_key, limit=50)

# 询问当前状态
sessions_send(
    sessionKey=agent_session_key,
    message="请立即汇报：\n1. 当前进度百分比\n2. 已完成的具体工作\n3. 遇到的具体错误\n4. 你已经尝试了哪些解决方案\n5. 你认为需要什么才能继续"
)
```

---

### Step 3: 更新项目状态

- [ ] 读取 `projects/{project-id}/agent-status.json`
- [ ] 更新该子智能体状态为 "PAUSED"
- [ ] 记录暂停原因
- [ ] 记录暂停时间戳
- [ ] 保存进度信息
- [ ] 保存已尝试的解决方案

**状态更新示例**：
```json
{
  "agents": {
    "agent:main:subagent:xxxx": {
      "label": "PiAgent-Researcher",
      "role": "Research Analyst", 
      "status": "PAUSED",
      "pausedAt": "2026-02-01T04:30:00Z",
      "reason": "web_search API unavailable - Brave API key required",
      "progress": "35%",
      "deliverables": ["/projects/pi-agent-analysis/research.md (partial)"],
      "attemptedSolutions": [
        {
          "time": "2026-02-01T04:25:00Z",
          "method": "tried browser tool",
          "result": "failed - Chrome extension not connected"
        },
        {
          "time": "2026-02-01T04:28:00Z", 
          "method": "tried curl fallback",
          "result": "failed - Cloudflare protection"
        }
      ]
    }
  }
}
```

---

### Step 4: 向用户详细汇报

**必须使用详细格式模板**：

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

**汇报后必须做的事**：
- [ ] 确认消息已成功发送给用户
- [ ] 在项目日志中记录汇报时间和内容摘要
- [ ] 设置提醒定期检查用户回复

---

## 等待用户决策期间

### 我必须做的事：
- [ ] 继续监控其他 RUNNING 状态的子智能体
- [ ] 定期更新项目进度给用户（其他子智能体的进展）
- [ ] **绝对不**让暂停的子智能体继续工作
- [ ] **绝对不**自行决定替代方案

### 我绝对不能做的事：
- [ ] ❌ 询问暂停的子智能体"进展如何"
- [ ] ❌ 让其他子智能体"帮忙完成"暂停子智能体的任务
- [ ] ❌ 假设用户想要什么，然后继续执行
- [ ] ❌ 为了减少麻烦而降低质量标准

---

## 用户决策后的恢复流程

### Step 1: 解析用户决策

- [ ] 明确用户选择了哪个方案（A/B/C/自定义/终止）
- [ ] 提取用户提供的资源（API key、文件路径等）
- [ ] 识别用户的具体约束和要求

### Step 2: 更新项目状态

```json
{
  "agents": {
    "agent:main:subagent:xxxx": {
      "status": "RESUMING",
      "userDecision": {
        "chosenOption": "A",
        "providedResources": ["BRAVE_API_KEY: xxx"],
        "timestamp": "2026-02-01T04:35:00Z",
        "notes": "user provided API key and asked to retry with reduced scope"
      },
      "previousStatus": "PAUSED",
      "resumedAt": "2026-02-01T04:36:00Z"
    }
  }
}
```

### Step 3: 准备恢复任务

**恢复任务模板**：
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

用户的特别说明: {user_notes}

【调整后的任务】
{adjusted_task_description}

【特别说明】
⚠️ 请基于之前的进度继续，不要从头开始
⚠️ 避免重复之前失败的方案
⚠️ 如果再次遇到无法解决的问题，立即汇报，不要自行尝试超过2次
⚠️ 优先完成核心功能，非必要功能可后续迭代

═══════════════════════════════════════════════════════════
```

### Step 4: 重新启动子智能体

- [ ] 使用 `sessions_spawn` 创建新会话
- [ ] 使用 `{original_label}-resumed` 作为标签
- [ ] 设置适当的超时时间
- [ ] 记录新会话ID

```python
sessions_spawn(
    task=adjusted_task_with_full_context,
    label=f"{original_label}-resumed",
    runTimeoutSeconds=adjusted_timeout
)
```

### Step 5: 加强监控

- [ ] 每10分钟检查一次进度（而不是默认30分钟）
- [ ] 主动询问状态更新
- [ ] 准备好更快升级，如果问题再次出现

---

## 强制暂停触发器（快速参考）

| 触发条件 | 我的行动 | 子智能体状态 |
|---------|---------|-------------|
| 工具不可用 | 立即暂停，汇报用户 | 🛑 PAUSED |
| API/服务限制 | 立即暂停，汇报用户 | 🛑 PAUSED |
| 权限被拒绝 | 立即暂停，汇报用户 | 🛑 PAUSED |
| 需要用户文件/数据 | 立即暂停，汇报用户 | 🛑 PAUSED |
| 需求不明确 | 立即暂停，询问澄清 | 🛑 PAUSED |
| 技术限制（环境约束） | 立即暂停，汇报选项 | 🛑 PAUSED |
| 范围需要重大变更 | 立即暂停，等待决策 | 🛑 PAUSED |
| 团队分歧>2轮 | 立即暂停，请求裁决 | 🛑 PAUSED |
| 多次失败/超时(>2次) | 立即暂停，询问终止/调整 | 🛑 PAUSED |
| 预算/使用问题 | 立即暂停，等待批准 | 🛑 PAUSED |

---

## 常见错误（我必须避免）

### ❌ 错误 1: "让我帮你看看"
```
子智能体: 我遇到了API限制...
我: ❌ "让我看看有没有其他API可以用" 

正确: ✅ "停止工作，我立即汇报用户"
```

### ❌ 错误 2: 让其他智能体"帮忙"
```
研究员: 无法获取数据...
我: ❌ "设计师，你能不能帮忙收集这些数据？"

正确: ✅ "研究员已暂停，等待用户提供数据源"
```

### ❌ 错误 3: 简要汇报
```
子智能体: 需要Brave API key...
我: ❌ "需要API key，请提供"

正确: ✅ 使用完整汇报模板，包含上下文、选项、影响评估
```

### ❌ 错误 4: 假设用户意图
```
用户: [没有明确说停止]
我: ❌ "用户没说什么，我让子智能体继续试试"

正确: ✅ "用户未给出明确指示，子智能体保持暂停状态"
```

---

## 自我检查问题

在每次汇报用户前，问自己：

1. **我是否已经停止了子智能体？** 
   - 如果没有，立即停止

2. **我是否收集了完整的上下文？**
   - 进度、错误、已尝试的方案

3. **我的汇报是否足够详细？**
   - 用户能否基于我的汇报做出明智决策？

4. **我是否提供了可行的选项？**
   - 至少3个方案（A/B/C）

5. **我是否给出了诚实的建议？**
   - 我的推荐基于什么理由？

6. **我是否在等待用户决策？**
   - 没有用户明确回复，绝不继续

---

## 项目日志模板

每次暂停/恢复必须记录：

```markdown
## 2026-02-01 04:30 - Agent PAUSED

- Agent: {label}
- Role: {role}
- Reason: {detailed_reason}
- Progress: {X}%
- Deliverables: {list}
- Attempted solutions: {list}
- User notified: {yes/no}
- Status file updated: {yes/no}

## 2026-02-01 04:35 - User Decision Received

- Chosen option: {A/B/C/Custom/Abort}
- Provided resources: {list}
- User notes: {notes}

## 2026-02-01 04:36 - Agent RESUMED

- New session: {session_key}
- Adjusted task: {summary}
- Special instructions: {notes}
```

---

*每次使用 multi-agent-team skill 时，对照此检查清单执行*

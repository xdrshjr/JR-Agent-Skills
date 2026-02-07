/**
 * Agent Workflow - 子智能体工作流程
 * 强调自主规划、Leadership Council 审批后再执行
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成精简的子智能体任务分配
 */
function generateAutonomousAgentTask(projectInfo, agentRole, agentIndex) {
  const { projectId, skillAnalysis, projectDir, userRequest } = projectInfo;

  const { generateTeamSuggestion } = require('./council-workflow');
  const teamSuggestion = generateTeamSuggestion(skillAnalysis);
  const roleInfo = teamSuggestion[agentIndex];

  if (!roleInfo) {
    throw new Error(`未找到角色 ${agentRole} 的信息`);
  }

  // Check if user specified mandatory skills
  const mandatorySkills = skillAnalysis.userSpecified && !skillAnalysis.userSpecified.error
    ? [skillAnalysis.userSpecified]
    : [];

  let mandatorySkillsSection = '';
  if (mandatorySkills.length > 0) {
    mandatorySkillsSection = `
## 必须使用的技能（用户指定）
${mandatorySkills.map(s => `- **${s.name}**: 用户明确要求使用此技能`).join('\n')}
`;
  }

  return `你是 ${agentRole}，负责：${roleInfo.responsibility}

⚠️ **CRITICAL: Phase Transition Enforcement**

Your workflow is monitored by a **phase state machine**. You CANNOT skip phases.
Attempting to skip from "方案规划" to "执行" without leadership approval will be **BLOCKED** by the system.

## 7-Step Workflow (Strictly Enforced)

**Step 0: 技能发现 (5%)** → Report to Planning Authority Leader → Wait for confirmation
**Step 1: 需求理解 (10%)** → Report to Planning Authority Leader → Wait for confirmation
**Step 2: Skill调研 (20%)** → Report to Planning Authority Leader → Wait for confirmation
**Step 3: 方案规划 (30%)** → Report to Planning Authority Leader → **MUST WAIT FOR APPROVAL**
**Step 4: 等待审批** → **BLOCKING CHECKPOINT** → Cannot proceed without approval
**Step 5: 执行 (40%)** → **ONLY AFTER APPROVAL GRANTED** → Report progress to Execution Authority Leader
**Step 6: 完成** → Submit to QA (managed by Quality Authority Leader)

🚨 **ENFORCEMENT MECHANISM**:
- Your phase transitions are validated by the system
- Attempting to skip from "方案规划" to "执行" without approval will be BLOCKED
- You will receive an error if you try to proceed without approval
- The system tracks your approval state and will prevent execution

---

## Leadership Council (三权分立)

This project is led by a 3-member Leadership Council:

| Power Domain | Responsibility | You Report For |
|-------------|---------------|---------------|
| **Planning Authority (规划权)** | Plans, scope, requirements | Plan submissions, skill selection, scope questions |
| **Execution Authority (执行权)** | Progress, resources, blockers | Progress updates, resource requests, blockers |
| **Quality Authority (质量权)** | QA, validation, acceptance | Deliverable submissions (via QA), quality questions |

---

## 团队协作上下文

你是 **${teamSuggestion.length}人团队** 的一员。以下是完整的团队结构：

**项目最终交付物：** ${projectInfo.finalDeliverable || '多部分协作成果'}

**团队分工：**
${teamSuggestion.map((member, idx) => `
${idx + 1}. **${member.role}** ${member.role === agentRole ? '(你)' : ''}
   - 负责部分：${member.assignedSection || member.responsibility}
   - 交付物：${member.deliverable}
   ${member.dependencies && member.dependencies.length > 0 ?
     `- 依赖：${member.dependencies.join(', ')}` : ''}
`).join('\n')}

⚠️ **重要提醒：**
- 你只负责 **${roleInfo.assignedSection || roleInfo.responsibility}** 这一部分
- 不要创建完整的独立交付物
- 你的工作将与队友的贡献整合在一起
- 定期查看 WHITEBOARD.md 了解队友进度

**协作要点：**
- 在规划前阅读 WHITEBOARD 了解团队上下文
- 确保你的部分与相邻部分顺畅衔接
- 如需队友部分的信息，直接与他们沟通
- 避免与队友的工作重复

---

### Step 0: 技能发现 (5分钟超时)

- 使用 find-skills 技能发现可用技能
- 根据你的角色选择2-3个最匹配的技能
- 向Planning Authority Leader报告你的选择和理由
- **等待Planning Authority Leader批准**

**报告格式：**
"我发现了 [N] 个可用技能。基于我的角色（${agentRole}），我推荐使用：
1. [技能名]: [为什么匹配我的角色]
2. [技能名]: [为什么匹配我的角色]

等待Planning Authority Leader批准。"

**更新状态：** stage: "技能发现", progress: 5

---

### Step 1: 需求理解 (10分钟超时)

- 阅读 WHITEBOARD.md 了解团队全貌和项目结构
- 理解你负责的具体部分：${roleInfo.assignedSection || roleInfo.responsibility}
- 确认与其他部分的边界和依赖关系
- 理解核心问题，确定成功标准
- 汇报：📊 阶段汇报 — 需求理解完成（包括团队上下文）

**更新状态：** stage: "需求理解", progress: 10

---

### Step 2: Skill调研 (20分钟超时)

- 阅读已批准技能的SKILL.md，了解功能/限制
- 汇报：📊 阶段汇报 — Skill调研完成

**更新状态：** stage: "Skill调研", progress: 20

---

### Step 3: 方案规划 (30分钟超时)

- 制定详细方案：技能选择 + 具体步骤 + 产出物 + 风险 + 时间
- **明确说明你负责的部分范围**（不是完整交付物）
- 说明如何与队友的部分衔接
- 汇报：📋 方案汇报（必须详细到命令级，包括协作计划）
- 提交方案给 **Planning Authority Leader** 审批

**更新状态：** stage: "方案规划", progress: 30

---

### Step 4: 等待审批 (CRITICAL CHECKPOINT)

**How to Request Approval:**
1. Complete your plan in Step 3
2. Report to Planning Authority Leader: "方案规划完成，请求批准"
3. **Update status:** stage: "等待批准", progress: 35
4. Wait for Planning Authority Leader response: "批准执行" or "需要修改"
5. Only proceed to Step 5 after receiving explicit approval

⚠️ **BLOCKING CHECKPOINT**: The system will prevent you from proceeding to execution without approval.

---

### Step 5: 执行 (按里程碑汇报进度)

**ONLY AFTER APPROVAL GRANTED**

- 使用已批准的技能执行方案
- 按里程碑向 **Execution Authority Leader** 汇报进度
- 遇到阻塞向 **Execution Authority Leader** 报告

**更新状态：** stage: "执行", progress: 40-90

---

### Step 6: 完成 (提交成果给QA)

- 提交成果给QA验证（QA由 **Quality Authority Leader** 管理）
- **更新状态：** stage: "完成", progress: 100
${mandatorySkillsSection}

---

## QA Agent Workflow (Special Instructions)

**If you are the QA Agent**, your workflow is different:

### QA Phase 1: 验证计划创建 (QA_PLANNING)

When you enter QA_PLANNING phase:

1. **Detect Task Type**: Analyze the project to determine task type (code, design, research, document, etc.)
2. **Select Validation Template**: System will auto-select appropriate template based on task type
3. **Create Validation Plan**: Follow the template structure to create a comprehensive validation plan
   - Overview: validation objective, scope, estimated effort
   - Per-Executor Plans: validation dimensions, methods, acceptance criteria, test cases
   - Tools and Resources: what you need for validation
   - Risk Assessment: potential risks and mitigation
   - Validation Sequence: order of validation with rationale
4. **Submit Plan to Quality Authority Leader**: Report your validation plan and request approval
5. **Wait for Quality Authority Leader Approval**: Quality Authority Leader will review and approve/reject

**Status Update**: stage: "QA计划", progress: 10

### QA Phase 2: 等待审批 (QA_PLANNING)

- Wait for Quality Authority Leader to approve or reject your validation plan
- If rejected: revise plan based on feedback and resubmit
- If approved: proceed to validation execution

**Status Update**: stage: "等待批准", progress: 15

### QA Phase 3: 执行验证 (QA_VALIDATING)

**ONLY AFTER QUALITY AUTHORITY LEADER APPROVES YOUR VALIDATION PLAN**

- Execute validation following your approved plan
- Validate each executor's deliverables systematically
- Use validation methods specified in your plan
- Document findings for each validation dimension
- Track pass/fail for each acceptance criterion

**Status Update**: stage: "QA验证中", progress: 20-90

### QA Phase 4: 报告结果 (QA_COMPLETED)

- Compile validation results
- Report pass/fail for each executor
- Provide specific feedback for failed items
- Submit final QA report to **Quality Authority Leader**

**Status Update**: stage: "QA完成", progress: 100

**QA Critical Rules**:
- ❌ DO NOT start validation without Quality Authority Leader-approved plan
- ❌ DO NOT skip validation plan creation
- ✅ MUST create detailed validation plan first
- ✅ MUST wait for Quality Authority Leader approval before validating
- ✅ MUST be objective and thorough in validation
- ✅ Report results to Quality Authority Leader (who manages final acceptance)

---

## Pattern Detection

The system detects phase transitions by monitoring your stage updates:
- "技能发现" → skill_discovery phase
- "需求理解" → requirement phase
- "Skill调研" → skill_research phase
- "方案规划" → plan_design phase
- "等待批准" → awaiting_approval phase (REQUIRES APPROVAL)
- "执行" → execution phase (BLOCKED WITHOUT APPROVAL)
- "完成" → completion phase

**Critical**: When you update your status to "执行", the system will check if leadership approval was granted.
If not, your status update will be REJECTED with an error.

---

## 查看白板状态
执行: read ${projectDir}/WHITEBOARD.md

## 项目信息
- 路径: ${projectDir}
- 用户请求: ${userRequest.substring(0, 100)}...

---

## Rules

❌ **禁止**：
- 擅自执行（未经领导层批准）
- 不读文档
- 跳过规划
- 硬试>2次
- 跳过技能发现
- 从"方案规划"直接跳到"执行"

✅ **必须**：
- 每步汇报（计划→规划权Leader，进度→执行权Leader，交付→质量权Leader）
- 方案具体
- 不确定就问
- 先发现技能再规划
- 规划完成后请求批准
- 收到批准后才能执行

---

👉 **现在：开始第0步（技能发现），完成后汇报Planning Authority Leader**`;
}

/**
 * 格式化技能列表（精简版）
 */
function formatSkillsConcise(skills) {
  if (!skills || skills.length === 0) {
    return '无特定推荐，查看项目所有技能\n';
  }
  
  return skills.map(s => 
    `- ${s.name}: ${s.description.substring(0, 50)}... (文档: read ${s.location}/SKILL.md)`
  ).join('\n');
}

/**
 * 生成 Planning Authority Leader 审批检查清单
 */
function generatePMApprovalChecklist(agentRole, agentProposal) {
  return `
═══════════════════════════════════════════════════════════
📋 Planning Authority 审批检查清单 —— ${agentRole} 的方案
═══════════════════════════════════════════════════════════

【方案内容】
${agentProposal}

【Planning Authority Leader 检查项】
□ 技能选择是否合理？
□ 使用步骤是否具体可执行？
□ 预期产出是否明确？
□ 风险识别是否充分？
□ 时间预估是否合理？

【Execution Authority Leader 联审】
□ 资源分配是否可行？
□ 时间安排是否合理？

【审批选项】
1. ✅ **批准** - 按方案执行
   回复: "批准，按方案执行"

2. 📝 **修改后执行** - 需要调整
   回复: "需要调整：xxx"

3. ❓ **需要澄清** - 方案不清晰
   回复: "请澄清：xxx"

4. 🔄 **重新规划** - 方向有误
   回复: "重新规划，注意：xxx"

═══════════════════════════════════════════════════════════
`;
}

/**
 * 生成 QA 验证计划审批检查清单 (Quality Authority Leader)
 */
function generateQAValidationPlanChecklist(qaAgentRole, validationPlan) {
  return `
═══════════════════════════════════════════════════════════
📋 Quality Authority 审批检查清单 —— ${qaAgentRole} 的验证计划
═══════════════════════════════════════════════════════════

【验证计划内容】
${JSON.stringify(validationPlan, null, 2)}

【Quality Authority Leader 检查项】
□ 完整性: 是否覆盖所有执行者和交付物？
□ 适当性: 验证方法是否适合任务类型？
□ 清晰性: 验收标准是否具体可衡量？
□ 可行性: 计划是否现实可执行？
□ 资源: 所需工具和资源是否可用？

【Planning Authority Leader 联审】
□ 需求覆盖: 验证计划是否覆盖所有需求？

【审批选项】
1. ✅ **批准** - 按计划验证
   使用: approveValidationPlan(projectDir, '${qaAgentRole}', 'Quality-Leader-ID')

2. ❌ **拒绝** - 需要修改
   使用: rejectValidationPlan(projectDir, '${qaAgentRole}', '原因', 'Quality-Leader-ID')

═══════════════════════════════════════════════════════════
`;
}

/**
 * 生成子智能体阶段汇报模板
 */
function generateAgentStageReportTemplate(agentRole, stage, progress) {
  const templates = {
    understanding: `
📊 阶段汇报 —— ${agentRole} —— 需求理解完成

【我对任务的理解】
（简述理解）

【核心问题】
• 问题1: xxx
• 问题2: xxx

【成功标准】
• 标准1: xxx

【疑问/需确认】
• 疑问1: xxx

请 Planning Authority Leader 确认理解是否正确，然后进入下一步。
`,
    research: `
📊 阶段汇报 —— ${agentRole} —— Skill 调研完成

【已阅读的技能】
1. skill-name:
   - 功能: xxx
   - 适用性: 适合/不适合（原因）
   - 计划用途: xxx

2. skill-name:
   ...

【技能选择理由】
• 选择 skill A: 因为...
• 选择 skill B: 因为...

【发现的问题/限制】
• 问题1: xxx
• 限制1: xxx

请 Planning Authority Leader 确认技能选择方向，然后进入方案规划。
`,
    planning: `
📋 方案汇报 —— ${agentRole}

【任务理解】
（简述）

【选定技能组合】
• 主要: xxx（用于...）
• 辅助: xxx（用于...）

【执行方案】
步骤1: xxx
步骤2: xxx
步骤3: xxx

【预期产出】
- 文件1: xxx
- 文件2: xxx

【风险与应对】
• 风险1: xxx → 应对: xxx

【预计时间】
xxx

请 Planning Authority Leader 审批。
`,
    progress: `
📈 进度汇报 —— ${agentRole} —— ${progress}%

【已完成】
• xxx

【进行中】
• xxx

【遇到的问题】
• 问题: xxx → 状态: 已解决/需帮助

【下一步】
• xxx
`
  };
  
  return templates[stage] || templates.progress;
}

module.exports = {
  generateAutonomousAgentTask,
  formatSkillsConcise,
  generatePMApprovalChecklist,
  generateQAValidationPlanChecklist,
  generateAgentStageReportTemplate
};

// CLI 测试
if (require.main === module) {
  const { initializeProject } = require('./council-workflow');

  console.log('=== 测试自主规划任务分配 ===\n');
  
  const project = initializeProject('使用 remotion 制作一个 AI 论文视频', { mode: 'SUPERVISED' });
  
  console.log('\n--- Video Producer 任务分配 ---\n');
  const task = generateAutonomousAgentTask(project, 'Video Producer', 0);
  console.log(task.substring(0, 2000) + '...\n');
  
  console.log('=== 测试完成 ===');
}

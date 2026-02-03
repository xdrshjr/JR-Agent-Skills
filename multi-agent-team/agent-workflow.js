/**
 * Agent Workflow - 子智能体工作流程
 * 强调自主规划、PM 审批后再执行
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成精简的子智能体任务分配
 */
function generateAutonomousAgentTask(projectInfo, agentRole, agentIndex) {
  const { projectId, skillAnalysis, projectDir, userRequest } = projectInfo;
  
  const { generateTeamSuggestion } = require('./pm-workflow');
  const teamSuggestion = generateTeamSuggestion(skillAnalysis);
  const roleInfo = teamSuggestion[agentIndex];
  
  if (!roleInfo) {
    throw new Error(`未找到角色 ${agentRole} 的信息`);
  }
  
  const recommendedSkills = skillAnalysis.recommendations.slice(0, 3);
  
  return `你是 ${agentRole}，负责：${roleInfo.responsibility}

⚠️ **必须遵守：规划 → PM审批 → 执行**

## 6步工作流（每步需PM批准）

1️⃣ **需求理解**（10分钟超时）
   - 理解核心问题，确定成功标准
   - 汇报：📊 阶段汇报 — 需求理解完成

2️⃣ **Skill调研**（20分钟超时）
   - 阅读相关SKILL.md，了解功能/限制
   - 汇报：📊 阶段汇报 — Skill调研完成

3️⃣ **方案规划**（30分钟超时）
   - 制定详细方案：技能选择 + 具体步骤 + 产出物 + 风险 + 时间
   - 汇报：📋 方案汇报（必须详细到命令级）

4️⃣ **等待PM批准**（关键！）
   - 收到"批准"后才能执行

5️⃣ **执行**（按里程碑汇报进度）

6️⃣ **完成**（提交成果）

## 推荐技能（先去读文档！）
${formatSkillsConcise(recommendedSkills)}

## 查看白板状态
执行: read ${projectDir}/WHITEBOARD.md

## 项目信息
- 路径: ${projectDir}
- 用户请求: ${userRequest.substring(0, 100)}...

❌ 禁止：擅自执行、不读文档、跳过规划、硬试>2次
✅ 必须：每步汇报、方案具体、不确定就问

👉 现在：开始第1步，完成后汇报PM`;
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
 * 生成 PM 审批检查清单
 */
function generatePMApprovalChecklist(agentRole, agentProposal) {
  return `
═══════════════════════════════════════════════════════════
📋 PM 审批检查清单 —— ${agentRole} 的方案
═══════════════════════════════════════════════════════════

【方案内容】
${agentProposal}

【PM 检查项】
□ 技能选择是否合理？
□ 使用步骤是否具体可执行？
□ 预期产出是否明确？
□ 风险识别是否充分？
□ 时间预估是否合理？

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

请 PM 确认理解是否正确，然后进入下一步。
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

请 PM 确认技能选择方向，然后进入方案规划。
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

请 PM 审批。
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
  generateAgentStageReportTemplate
};

// CLI 测试
if (require.main === module) {
  const { initializeProject } = require('./pm-workflow');
  
  console.log('=== 测试自主规划任务分配 ===\n');
  
  const project = initializeProject('使用 remotion 制作一个 AI 论文视频', { mode: 'SUPERVISED' });
  
  console.log('\n--- Video Producer 任务分配 ---\n');
  const task = generateAutonomousAgentTask(project, 'Video Producer', 0);
  console.log(task.substring(0, 2000) + '...\n');
  
  console.log('=== 测试完成 ===');
}

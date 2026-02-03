/**
 * PM Coordination - PM 协调工作流
 * 处理子智能体的阶段汇报和方案审批
 */

/**
 * 初始化 PM 协调状态
 */
function initializePMCoordination(projectId) {
  return {
    projectId,
    agents: {},
    pendingApprovals: [],
    stage: 'initialization'
  };
}

/**
 * 处理子智能体汇报
 */
function handleAgentReport(coordinationState, agentId, report) {
  // 解析汇报类型
  const reportType = detectReportType(report);
  
  switch (reportType) {
    case 'understanding':
      return handleUnderstandingReport(coordinationState, agentId, report);
    case 'research':
      return handleResearchReport(coordinationState, agentId, report);
    case 'planning':
      return handlePlanningReport(coordinationState, agentId, report);
    case 'progress':
      return handleProgressReport(coordinationState, agentId, report);
    case 'blocked':
      return handleBlockedReport(coordinationState, agentId, report);
    default:
      return {
        action: 'clarify',
        message: '未能识别汇报类型，请使用标准模板汇报'
      };
  }
}

/**
 * 检测汇报类型
 */
function detectReportType(report) {
  const lower = report.toLowerCase();
  
  if (lower.includes('需求理解')) return 'understanding';
  if (lower.includes('skill 调研') || lower.includes('技能调研')) return 'research';
  if (lower.includes('方案汇报') || lower.includes('执行方案')) return 'planning';
  if (lower.includes('进度汇报') || lower.includes('progress')) return 'progress';
  if (lower.includes('blocked') || lower.includes('遇到问题') || lower.includes('无法')) return 'blocked';
  
  return 'unknown';
}

/**
 * 处理需求理解汇报
 */
function handleUnderstandingReport(state, agentId, report) {
  // PM 检查清单
  const checklist = `
【需求理解检查清单】

□ 是否准确理解了任务核心？
□ 是否明确了成功标准？
□ 是否有遗漏的关键需求？

【你的回复选项】
1. ✅ "理解正确，进入下一步（Skill 调研）"
2. 📝 "需要调整：xxx"
3. ❓ "请澄清：xxx"
`;

  return {
    type: 'understanding',
    agentId,
    checklist,
    nextStage: 'research',
    pmAction: 'review_and_reply'
  };
}

/**
 * 处理 Skill 调研汇报
 */
function handleResearchReport(state, agentId, report) {
  const checklist = `
【Skill 调研检查清单】

□ 是否充分了解了相关技能？
□ 技能选择理由是否合理？
□ 是否识别了技能限制？

【你的回复选项】
1. ✅ "调研充分，进入方案规划"
2. 🔄 "建议也了解一下：xxx skill"
3. ❓ "xxx skill 是否考虑过？为什么不用？"
`;

  return {
    type: 'research',
    agentId,
    checklist,
    nextStage: 'planning',
    pmAction: 'review_and_reply'
  };
}

/**
 * 处理方案规划汇报（关键！）
 */
function handlePlanningReport(state, agentId, report) {
  // 添加到待审批列表
  state.pendingApprovals.push({
    agentId,
    proposal: report,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  });

  const approvalTemplate = `
═══════════════════════════════════════════════════════════
📝 方案审批 —— ${agentId}
═══════════════════════════════════════════════════════════

【待审批方案】
${report}

【PM 审批检查清单】
□ 技能选择合理
□ 步骤具体可执行
□ 产出物明确
□ 风险识别充分
□ 时间预估合理

【回复模板】

✅ **批准**
"批准，按方案执行。注意：xxx"

📝 **修改后批准**
"方案基本可行，需要调整：
1. xxx → 改为 xxx
2. xxx → 改为 xxx
调整后执行。"

❓ **需要补充**
"方案不够详细，请补充：
- xxx 的具体参数
- xxx 的备选方案
- xxx 的风险应对"

🔄 **重新规划**
"方案方向有问题，建议：
- 改用 xxx skill 而不是 yyy
- 先完成 xxx 再考虑 yyy
- 简化范围，先完成核心功能"

❌ **暂停/转派**
"此任务需要 xxx 资源/条件，暂时无法执行。
暂停此任务，先处理其他任务。"

═══════════════════════════════════════════════════════════
`;

  return {
    type: 'planning',
    agentId,
    approvalTemplate,
    status: 'awaiting_approval',
    pmAction: 'must_approve_before_proceed'
  };
}

/**
 * 处理进度汇报
 */
function handleProgressReport(state, agentId, report) {
  // 提取进度百分比
  const progressMatch = report.match(/(\d+)%/);
  const progress = progressMatch ? parseInt(progressMatch[1]) : null;
  
  return {
    type: 'progress',
    agentId,
    progress,
    pmAction: 'acknowledge_or_intervene',
    template: progress < 50 
      ? `收到，继续推进。如遇到困难及时汇报。`
      : progress < 90
      ? `进展顺利，继续加油。准备收尾工作。`
      : `即将完成，准备验收。完成后提交最终成果。`
  };
}

/**
 * 处理阻塞汇报
 */
function handleBlockedReport(state, agentId, report) {
  return {
    type: 'blocked',
    agentId,
    pmAction: 'analyze_and_decide',
    options: [
      '1. 提供解决方案后继续',
      '2. 调整方案绕过问题',
      '3. 暂停任务等待资源',
      '4. 转派给其他 agent'
    ]
  };
}

/**
 * PM 审批回复模板
 */
function generatePMApprovalResponse(approvalType, comments = '') {
  const templates = {
    approved: `✅ **方案批准**

${comments}

请严格按照批准的方案执行，每完成一个里程碑汇报进度。
如有偏差立即上报。`,

    modify: `📝 **方案修改后批准**

需要调整：
${comments}

请按上述调整后执行。`,

    clarify: `❓ **需要澄清**

以下部分不够清晰：
${comments}

请补充说明后再提交。`,

    replan: `🔄 **重新规划**

方案方向需要调整：
${comments}

请重新规划后提交。`,

    pause: `⏸️ **任务暂停**

${comments}

此任务暂停，等待条件满足后再继续。`,

    reassign: `🔄 **任务转派**

${comments}

此任务转由其他 agent 处理。`
  };

  return templates[approvalType] || templates.clarify;
}

/**
 * 生成 PM 监控仪表盘
 */
function generatePMDashboard(coordinationState) {
  let dashboard = `
═══════════════════════════════════════════════════════════
📊 PM 监控仪表盘 —— ${coordinationState.projectId}
═══════════════════════════════════════════════════════════

`;

  for (const [agentId, agent] of Object.entries(coordinationState.agents)) {
    dashboard += `
【${agent.role}】${agentId}
• 状态: ${agent.status}
• 当前阶段: ${agent.stage}
• 进度: ${agent.progress || 0}%
• 最后汇报: ${agent.lastReport || '无'}
${agent.blocked ? '⚠️ 遇到问题: ' + agent.blockReason : ''}
`;
  }

  if (coordinationState.pendingApprovals.length > 0) {
    dashboard += `
📝 待审批方案: ${coordinationState.pendingApprovals.length} 个
`;
    for (const approval of coordinationState.pendingApprovals) {
      dashboard += `  - ${approval.agentId}: 提交于 ${approval.submittedAt}\n`;
    }
  }

  dashboard += `
═══════════════════════════════════════════════════════════
`;

  return dashboard;
}

module.exports = {
  initializePMCoordination,
  handleAgentReport,
  generatePMApprovalResponse,
  generatePMDashboard,
  // 导出单个处理器供测试
  handlePlanningReport
};

// CLI 示例
if (require.main === module) {
  console.log('=== PM 协调工作流示例 ===\n');
  
  const state = initializePMCoordination('proj-20260201-test');
  
  // 模拟方案汇报
  const mockProposal = `
📋 方案汇报 —— Video Producer

【任务理解】
制作一个关于 AI 论文的视频

【选定技能组合】
• 主要: remotion-synced-video（用于视频合成）
• 辅助: doubao-open-tts（用于配音）

【执行方案】
步骤1: 编写视频脚本
步骤2: 生成配音音频
步骤3: 搜索/生成配图
步骤4: 使用 remotion 合成视频

【预期产出】
- 视频文件: output.mp4

【风险与应对】
• 风险: 配音质量不佳 → 应对: 准备备选语音

【预计时间】
2小时
`;
  
  const result = handlePlanningReport(state, 'agent-001', mockProposal);
  console.log(result.approvalTemplate);
}

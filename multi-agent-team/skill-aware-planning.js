/**
 * Skill-Aware Planning Module
 * 集成到 PM 规划流程中的 skill 感知模块
 *
 * NOTE: This module now focuses on user-specified skills only.
 * Agents discover and select their own skills dynamically at runtime.
 */

/**
 * 解析用户指定的 skill（支持多个）
 * 支持中英文多种表达方式：
 * - "使用 nano-banana-pro 技能"
 * - "用 skill-a 和 skill-b 来做"
 * - "use skill-name skill"
 */
function parseUserSpecifiedSkill(userRequest) {
  const patterns = [
    /使用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)\s*(?:技能|skill)/i,
    /用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)\s*(?:来|做|执行)/i,
    /调用\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)/i,
    /基于\s*([\w-]+(?:\s*(?:和|与|,|、)\s*[\w-]+)*)/i,
    /use\s+([\w-]+(?:\s*(?:and|&,|,)\s*[\w-]+)*)\s+skill/i,
    /using\s+([\w-]+(?:\s*(?:and|&,|,)\s*[\w-]+)*)/i
  ];

  for (const pattern of patterns) {
    const match = userRequest.match(pattern);
    if (match) {
      // 分割多个skill
      const skills = match[1]
        .split(/\s*(?:和|与|,|、|and|&)\s*/i)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);
      return skills.length === 1 ? skills[0] : skills;
    }
  }

  return null;
}

/**
 * 分析用户请求，提取技能需求
 * 只检查用户明确指定的技能，不再做自动推荐
 */
function analyzeSkillRequirements(userRequest) {
  // 检查用户是否指定了特定 skill（例如："使用 nano-banana-pro 技能"）
  const userSpecifiedSkill = parseUserSpecifiedSkill(userRequest);

  // 如果用户指定了 skill，验证它是否存在
  let validatedUserSkill = null;
  if (userSpecifiedSkill) {
    // Note: Validation will be done by agents using find-skills at runtime
    // We just mark it as mandatory here
    validatedUserSkill = {
      name: userSpecifiedSkill,
      mandatory: true,
      note: 'Agent will validate availability using find-skills'
    };
  }

  return {
    userSpecified: validatedUserSkill,
    // Removed: detectedTypes, recommendations, allAvailableSkills
    // Agents will discover these themselves using find-skills
  };
}

/**
 * 生成技能使用规划文档
 * 简化版：只显示用户指定的技能，其他由agents自己发现
 */
function generateSkillPlanningDoc(skillAnalysis) {
  let doc = `## Skill 使用规划\n\n`;

  // 用户指定的 skill
  if (skillAnalysis.userSpecified) {
    doc += `### 用户指定（必须使用）\n`;
    doc += `- **Skill**: ${skillAnalysis.userSpecified.name}\n`;
    doc += `- **状态**: 必须使用（mandatory）\n`;
    doc += `- **验证**: Agents将在运行时使用 find-skills 验证可用性\n\n`;
  } else {
    doc += `### 技能发现\n`;
    doc += `- 没有用户指定的技能\n`;
    doc += `- 各 Agent 将在运行时自主发现和选择适合其角色的技能\n`;
    doc += `- 使用 find-skills 技能进行动态发现\n\n`;
  }

  return doc;
}

/**
 * DEPRECATED: 为子智能体生成技能使用指南
 *
 * This function is deprecated. Agents now discover skills dynamically
 * using find-skills at runtime instead of receiving pre-assigned skills.
 */
function generateAgentSkillGuide(agentRole, assignedSkills) {
  // Deprecated - kept for backward compatibility
  return `\n⚠️ 注意: 静态技能分配已弃用\n请使用 find-skills 技能动态发现可用技能\n\n`;
}

/**
 * DEPRECATED: 为任务分配 skills
 *
 * This function is deprecated. Agents now discover and select their own
 * skills dynamically at runtime based on their role and the task requirements.
 */
function assignSkillsToAgents(agentRoles, skillAnalysis) {
  // Deprecated - return empty assignments
  // Agents will discover skills themselves
  const assignments = {};
  for (const role of agentRoles) {
    assignments[role] = [];
  }
  return assignments;
}

/**
 * DEPRECATED: 生成增强版任务分配 prompt
 *
 * This function is deprecated. Task prompts are now generated without
 * pre-assigned skills. Agents discover skills dynamically at runtime.
 */
function generateEnhancedTaskPrompt(agentRole, taskDescription, skillAssignments) {
  // Deprecated - return basic prompt without skill assignments
  const prompt = `你是一个${agentRole}，负责以下任务：

${taskDescription}

⚠️ 技能发现：
在开始规划前，请使用 find-skills 技能发现你环境中可用的所有技能，
然后选择最适合你角色的技能，并向 PM 报告等待批准。
`;

  return prompt;
}

/**
 * 主函数：集成到 PM 初始化流程
 * 简化版：只处理用户指定的技能
 */
function initializeSkillAwarePlanning(userRequest) {
  console.log('🔍 分析任务技能需求...');

  const analysis = analyzeSkillRequirements(userRequest);

  // 生成规划文档
  const planningDoc = generateSkillPlanningDoc(analysis);

  console.log('✅ 技能分析完成');
  if (analysis.userSpecified) {
    console.log(`📌 用户指定使用: ${analysis.userSpecified.name} (mandatory)`);
    console.log(`   Agents将在运行时验证可用性`);
  } else {
    console.log(`💡 没有用户指定的技能`);
    console.log(`   Agents将自主发现和选择适合其角色的技能`);
  }

  return {
    analysis,
    planningDoc,
    assignSkillsToAgents: (agentRoles) => assignSkillsToAgents(agentRoles, analysis),
    generateTaskPrompt: (role, task) => generateEnhancedTaskPrompt(role, task, assignSkillsToAgents([role], analysis))
  };
}

module.exports = {
  analyzeSkillRequirements,
  generateSkillPlanningDoc,
  generateAgentSkillGuide,
  assignSkillsToAgents,
  generateEnhancedTaskPrompt,
  initializeSkillAwarePlanning
};

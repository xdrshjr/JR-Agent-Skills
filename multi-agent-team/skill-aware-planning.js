/**
 * Skill-Aware Planning Module
 * 集成到 PM 规划流程中的 skill 感知模块
 */

const { loadSkillIndex, matchSkillsForTask, parseUserSpecifiedSkill } = require('./skill-discovery/scan-skills');

/**
 * 分析用户请求，提取技能需求
 */
function analyzeSkillRequirements(userRequest) {
  // 1. 加载技能索引
  const skillIndex = loadSkillIndex();
  
  // 2. 检查用户是否指定了特定 skill
  const userSpecifiedSkill = parseUserSpecifiedSkill(userRequest);
  
  // 3. 基于任务类型匹配合适的 skills
  const matchResult = matchSkillsForTask(userRequest, skillIndex);
  
  // 4. 如果用户指定了 skill，验证它是否匹配
  let validatedUserSkill = null;
  if (userSpecifiedSkill) {
    const found = skillIndex.skills.find(s => 
      s.name.toLowerCase() === userSpecifiedSkill.toLowerCase()
    );
    
    if (found) {
      // 检查是否适合任务类型
      const isRecommended = matchResult.recommendations.some(r => r.name === found.name);
      validatedUserSkill = {
        ...found,
        isRecommended,
        warning: isRecommended ? null : `指定的 skill "${found.name}" 可能不完全适合当前任务类型（${matchResult.detectedTypes.join(', ')}）`
      };
    } else {
      validatedUserSkill = {
        name: userSpecifiedSkill,
        error: `Skill "${userSpecifiedSkill}" 未找到，请检查拼写或确认已安装`
      };
    }
  }
  
  return {
    detectedTypes: matchResult.detectedTypes,
    userSpecified: validatedUserSkill,
    recommendations: matchResult.recommendations,
    allAvailableSkills: skillIndex.skills.map(s => s.name)
  };
}

/**
 * 生成技能使用规划文档
 */
function generateSkillPlanningDoc(skillAnalysis) {
  let doc = `## Skill 使用规划\n\n`;
  
  // 用户指定的 skill
  if (skillAnalysis.userSpecified) {
    doc += `### 用户指定\n`;
    if (skillAnalysis.userSpecified.error) {
      doc += `- ⚠️ 错误: ${skillAnalysis.userSpecified.error}\n`;
    } else {
      doc += `- **Skill**: ${skillAnalysis.userSpecified.name}\n`;
      doc += `- **功能**: ${skillAnalysis.userSpecified.description}\n`;
      if (skillAnalysis.userSpecified.warning) {
        doc += `- ⚠️ **注意**: ${skillAnalysis.userSpecified.warning}\n`;
      }
    }
    doc += `\n`;
  }
  
  // 检测到的任务类型
  if (skillAnalysis.detectedTypes.length > 0) {
    doc += `### 任务类型\n`;
    doc += skillAnalysis.detectedTypes.map(t => `- ${t}`).join('\n');
    doc += `\n\n`;
  }
  
  // PM 推荐的 skills
  if (skillAnalysis.recommendations.length > 0) {
    doc += `### PM 推荐\n`;
    doc += `| Skill | 功能 | 匹配度 | 优先级 |\n`;
    doc += `|-------|------|--------|--------|\n`;
    
    for (const skill of skillAnalysis.recommendations) {
      const matchPercent = Math.min(100, Math.round(skill.matchScore * 3));
      doc += `| ${skill.name} | ${skill.description.substring(0, 40)}... | ${matchPercent}% | ${skill.priority} |\n`;
    }
    doc += `\n`;
  }
  
  // 备选 skills
  const otherSkills = skillAnalysis.allAvailableSkills
    .filter(name => !skillAnalysis.recommendations.some(r => r.name === name))
    .filter(name => !skillAnalysis.userSpecified || name !== skillAnalysis.userSpecified.name)
    .slice(0, 10);
  
  if (otherSkills.length > 0) {
    doc += `### 其他可用 Skills\n`;
    doc += otherSkills.map(s => `- ${s}`).join('\n');
    doc += `\n`;
  }
  
  return doc;
}

/**
 * 为子智能体生成技能使用指南
 */
function generateAgentSkillGuide(agentRole, assignedSkills) {
  let guide = `\n═══════════════════════════════════════════════════════════\n`;
  guide += `🛠️ 可用工具与技能\n`;
  guide += `═══════════════════════════════════════════════════════════\n\n`;
  
  if (!assignedSkills || assignedSkills.length === 0) {
    guide += `本任务没有预设的 skills。\n`;
    guide += `如果执行过程中需要使用特定工具，请向 PM 申请。\n\n`;
  } else {
    guide += `本任务可以使用以下 skills:\n\n`;
    
    for (const skill of assignedSkills) {
      guide += `【Skill: ${skill.name}】\n`;
      guide += `• 功能: ${skill.description}\n`;
      guide += `• 位置: ${skill.location}\n`;
      
      if (skill.capabilities && skill.capabilities.length > 0) {
        guide += `• 能力: ${skill.capabilities.join(', ')}\n`;
      }
      
      guide += `• 使用方法: 读取 SKILL.md 文件获取详细用法\n`;
      guide += `   执行: read ${skill.location}/SKILL.md\n`;
      
      guide += `\n`;
    }
    
    guide += `⚠️ 重要提示:\n`;
    guide += `1. 在执行任务前，先检查是否有可用的 skill\n`;
    guide += `2. 优先使用 skill 而不是手动实现\n`;
    guide += `3. 如果 skill 不能满足需求，立即向 PM 汇报\n`;
    guide += `4. 不确定如何使用 skill 时，先阅读 SKILL.md\n`;
  }
  
  guide += `═══════════════════════════════════════════════════════════\n`;
  
  return guide;
}

/**
 * 为任务分配 skills
 */
function assignSkillsToAgents(agentRoles, skillAnalysis) {
  const assignments = {};
  
  // 优先使用用户指定的 skill
  const mandatorySkills = skillAnalysis.userSpecified && !skillAnalysis.userSpecified.error 
    ? [skillAnalysis.userSpecified] 
    : [];
  
  // 获取推荐的 skills
  const recommendedSkills = skillAnalysis.recommendations;
  
  // 根据角色分配 skills
  for (const role of agentRoles) {
    const roleLower = role.toLowerCase();
    const assigned = [];
    
    // 检查角色与技能的匹配
    for (const skill of [...mandatorySkills, ...recommendedSkills]) {
      // 基于角色关键词匹配
      const isMatch = (
        (roleLower.includes('video') && skill.capabilities.some(c => c.includes('video'))) ||
        (roleLower.includes('image') || roleLower.includes('design')) && skill.capabilities.some(c => c.includes('image')) ||
        (roleLower.includes('audio') || roleLower.includes('voice')) && skill.capabilities.some(c => c.includes('audio') || c.includes('tts')) ||
        (roleLower.includes('research') || roleLower.includes('analyst')) && skill.capabilities.some(c => c.includes('research') || c.includes('web-search')) ||
        (roleLower.includes('document') || roleLower.includes('writer')) && skill.capabilities.some(c => c.includes('document') || c.includes('pdf'))
      );
      
      if (isMatch && !assigned.some(s => s.name === skill.name)) {
        assigned.push(skill);
      }
    }
    
    // 限制每个角色最多 3 个 skills
    assignments[role] = assigned.slice(0, 3);
  }
  
  return assignments;
}

/**
 * 生成增强版任务分配 prompt
 */
function generateEnhancedTaskPrompt(agentRole, taskDescription, skillAssignments) {
  const skills = skillAssignments[agentRole] || [];
  const skillGuide = generateAgentSkillGuide(agentRole, skills);
  
  const prompt = `你是一个${agentRole}，负责以下任务：

${taskDescription}

${skillGuide}

═══════════════════════════════════════════════════════════
任务执行要求
═══════════════════════════════════════════════════════════

1. 在开始前，阅读可用的 SKILL.md 文件了解工具用法
2. 优先使用已分配的 skills 完成任务
3. 定期向 PM 汇报进度
4. 遇到无法解决的问题立即上报，不要自行尝试超过2次

请开始执行任务。`;

  return prompt;
}

/**
 * 主函数：集成到 PM 初始化流程
 */
function initializeSkillAwarePlanning(userRequest) {
  console.log('🔍 分析任务技能需求...');
  
  const analysis = analyzeSkillRequirements(userRequest);
  
  // 生成规划文档
  const planningDoc = generateSkillPlanningDoc(analysis);
  
  console.log('✅ 技能分析完成');
  if (analysis.userSpecified) {
    if (analysis.userSpecified.error) {
      console.log(`⚠️ 用户指定的 skill 有问题: ${analysis.userSpecified.error}`);
    } else {
      console.log(`📌 用户指定使用: ${analysis.userSpecified.name}`);
      if (analysis.userSpecified.warning) {
        console.log(`⚠️ ${analysis.userSpecified.warning}`);
      }
    }
  }
  console.log(`📊 检测到任务类型: ${analysis.detectedTypes.join(', ')}`);
  console.log(`💡 推荐 skills: ${analysis.recommendations.slice(0, 3).map(r => r.name).join(', ')}`);
  
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

/**
 * PM Workflow Integration
 * 深度集成技能感知到 PM 工作流程
 */

const fs = require('fs');
const path = require('path');
const { initializeSkillAwarePlanning } = require('./skill-aware-planning');

// 使用环境变量或默认路径
const PROJECTS_DIR = process.env.CLAWD_PROJECTS_DIR || path.join(__dirname, '..', '..', 'projects');

/**
 * 检查是否存在相似项目
 */
function checkSimilarProjects(userRequest) {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }
  
  const projects = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  const similar = [];
  const requestKeywords = userRequest.toLowerCase().split(/\s+/);
  
  for (const projId of projects.slice(-10)) { // 只检查最近10个
    const docPath = path.join(PROJECTS_DIR, projId, `${projId}.md`);
    if (fs.existsSync(docPath)) {
      try {
        const content = fs.readFileSync(docPath, 'utf-8').toLowerCase();
        const matchCount = requestKeywords.filter(kw => content.includes(kw)).length;
        if (matchCount >= 3) {
          similar.push({ projectId: projId, matchScore: matchCount });
        }
      } catch (e) {
        // 忽略读取错误
      }
    }
  }
  
  return similar.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

/**
 * 初始化项目，创建完整的项目结构
 */
function initializeProject(userRequest, options = {}) {
  try {
    // 参数验证
    if (!userRequest || typeof userRequest !== 'string') {
      throw new Error('用户请求不能为空');
    }
    
    if (userRequest.length > 5000) {
      console.warn('⚠️ 用户请求过长，可能会影响处理效果');
    }
    
    // 检查相似项目
    let similarProjects = [];
    try {
      similarProjects = checkSimilarProjects(userRequest);
    } catch (e) {
      console.warn('⚠️ 检查相似项目失败:', e.message);
    }
    
    if (similarProjects.length > 0 && !options.forceCreate) {
      console.log(`⚠️ 发现 ${similarProjects.length} 个相似项目:`);
      similarProjects.forEach(p => console.log(`  - ${p.projectId}`));
      console.log(`提示: 如仍要创建新项目，设置 options.forceCreate = true`);
    }
    
    const projectId = generateProjectId();
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    console.log(`🚀 初始化项目: ${projectId}`);
    
    // 1. 技能感知分析
    let skillPlanning;
    try {
      skillPlanning = initializeSkillAwarePlanning(userRequest);
    } catch (e) {
      console.error('❌ 技能感知分析失败:', e.message);
      throw new Error(`无法分析技能需求: ${e.message}`);
    }
  
    // 2. 创建项目目录结构
    try {
      createProjectStructure(projectDir);
    } catch (e) {
      console.error('❌ 创建项目目录失败:', e.message);
      throw new Error(`无法创建项目目录: ${e.message}`);
    }
    
    // 3. 生成项目主文档
    let projectDoc;
    try {
      projectDoc = generateProjectDocument(projectId, userRequest, skillPlanning, options);
      fs.writeFileSync(path.join(projectDir, `${projectId}.md`), projectDoc);
    } catch (e) {
      console.error('❌ 生成项目文档失败:', e.message);
      throw new Error(`无法生成项目文档: ${e.message}`);
    }
    
    // 4. 初始化代理状态追踪
    try {
      initializeAgentStatus(projectDir, projectId);
    } catch (e) {
      console.error('❌ 初始化代理状态失败:', e.message);
      // 非致命错误，继续
    }
    
    // 5. 生成团队组建建议
    let teamSuggestion;
    try {
      teamSuggestion = generateTeamSuggestion(skillPlanning.analysis);
    } catch (e) {
      console.warn('⚠️ 生成团队建议失败:', e.message);
      teamSuggestion = [];
    }
    
    // 6. 初始化白板
    try {
      const { initializeWhiteboard } = require('./whiteboard');
      initializeWhiteboard(projectDir, projectId);
    } catch (e) {
      console.warn('⚠️ 初始化白板失败:', e.message);
    }
    
    console.log(`✅ 项目初始化完成: ${projectDir}`);
    
    return {
      projectId,
      projectDir,
      userRequest,
      skillAnalysis: skillPlanning.analysis,
      teamSuggestion,
      planningDoc: skillPlanning.planningDoc
    };
  } catch (error) {
    console.error('❌ 项目初始化失败:', error.message);
    throw error;
  }
}

/**
 * 生成项目ID
 */
function generateProjectId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `proj-${dateStr}-${randomStr}`;
}

/**
 * 创建项目目录结构
 */
function createProjectStructure(projectDir) {
  const dirs = ['deliverables', 'issues', 'logs', 'assets'];
  
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  
  for (const dir of dirs) {
    const dirPath = path.join(projectDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

/**
 * 初始化代理状态文件
 */
function initializeAgentStatus(projectDir, projectId) {
  const status = {
    projectId,
    createdAt: new Date().toISOString(),
    agents: {},
    status: 'initializing'
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'agent-status.json'),
    JSON.stringify(status, null, 2)
  );
}

/**
 * 生成项目文档
 */
function generateProjectDocument(projectId, userRequest, skillPlanning, options) {
  const doc = `# 项目: ${projectId}

## 基本信息

- **创建时间**: ${new Date().toISOString()}
- **用户请求**: ${userRequest}
- **项目路径**: projects/${projectId}/
- **模式**: ${options.mode || 'FULL_AUTO'}

---

## 原始需求

${userRequest}

---

${skillPlanning.planningDoc}

---

## 团队组建

### 建议角色

${generateTeamRoles(skillPlanning.analysis)}

### 技能分配

${generateSkillAssignmentTable(skillPlanning.analysis)}

---

## 执行计划

### Phase 1: 准备阶段
- [ ] 确认所有代理已启动
- [ ] 验证所需 skills 可用
- [ ] 分配初始任务

### Phase 2: 执行阶段
- [ ] 监控进度
- [ ] 协调代理间协作
- [ ] 处理问题

### Phase 3: 交付阶段
- [ ] 汇总结果
- [ ] 质量检查
- [ ] 交付最终成果

---

## 项目日志

### ${new Date().toISOString().slice(0, 10)} - 项目初始化
- 创建项目结构
- 完成技能分析
- 生成团队建议

`;

  return doc;
}

/**
 * 生成团队角色建议
 */
function generateTeamSuggestion(analysis) {
  const roles = [];
  
  // 根据检测到的任务类型推荐角色
  const detectedTypes = analysis.detectedTypes;
  
  if (detectedTypes.includes('video')) {
    roles.push({
      role: 'Video Producer',
      responsibility: '视频内容策划、脚本编写、视频生成',
      skills: analysis.recommendations.filter(s => 
        s.capabilities.some(c => c.includes('video'))
      ).map(s => s.name)
    });
  }
  
  if (detectedTypes.includes('image')) {
    roles.push({
      role: 'Visual Designer',
      responsibility: '图像生成、封面设计、视觉素材准备',
      skills: analysis.recommendations.filter(s => 
        s.capabilities.some(c => c.includes('image'))
      ).map(s => s.name)
    });
  }
  
  if (detectedTypes.includes('research') || detectedTypes.includes('document')) {
    roles.push({
      role: 'Research Analyst',
      responsibility: '信息搜集、资料整理、内容撰写',
      skills: analysis.recommendations.filter(s => 
        s.capabilities.some(c => c.includes('research') || c.includes('document'))
      ).map(s => s.name)
    });
  }
  
  if (detectedTypes.includes('audio')) {
    roles.push({
      role: 'Audio Engineer',
      responsibility: '语音合成、音频处理、音效添加',
      skills: analysis.recommendations.filter(s => 
        s.capabilities.some(c => c.includes('audio') || c.includes('tts'))
      ).map(s => s.name)
    });
  }
  
  // 总是添加 QA 角色
  roles.push({
    role: 'QA Reviewer',
    responsibility: '质量检查、最终审核、问题反馈',
    skills: []
  });
  
  // 如果角色不足3个，添加通用角色
  while (roles.length < 3) {
    roles.push({
      role: 'General Assistant',
      responsibility: '协助主要角色、处理杂项任务',
      skills: []
    });
  }
  
  return roles.slice(0, 3); // 最多3个角色
}

/**
 * 生成团队角色描述
 */
function generateTeamRoles(analysis) {
  const suggestions = generateTeamSuggestion(analysis);
  
  let roles = '';
  suggestions.forEach((s, i) => {
    roles += `${i + 1}. **${s.role}**\n   - 职责: ${s.responsibility}\n   - 推荐技能: ${s.skills.join(', ') || '无特定技能'}\n\n`;
  });
  
  return roles;
}

/**
 * 生成技能分配表
 */
function generateSkillAssignmentTable(analysis) {
  const suggestions = generateTeamSuggestion(analysis);
  
  let table = '| 角色 | 主要技能 | 备选技能 |\n';
  table += '|------|----------|----------|\n';
  
  for (const suggestion of suggestions) {
    const primary = suggestion.skills.slice(0, 2).join(', ') || '-';
    const backup = suggestion.skills.slice(2).join(', ') || '-';
    table += `| ${suggestion.role} | ${primary} | ${backup} |\n`;
  }
  
  return table;
}

/**
 * 生成子智能体任务分配
 */
function generateAgentTask(projectInfo, agentRole, agentIndex) {
  const { projectId, skillAnalysis, projectDir } = projectInfo;
  
  // 获取该角色的技能分配
  const teamSuggestion = generateTeamSuggestion(skillAnalysis);
  const roleInfo = teamSuggestion[agentIndex];
  
  if (!roleInfo) {
    throw new Error(`未找到角色 ${agentRole} 的信息`);
  }
  
  // 从推荐列表中获取技能详情
  const assignedSkills = skillAnalysis.recommendations.filter(r => 
    roleInfo.skills.includes(r.name)
  );
  
  // 生成任务描述
  let task = `你是 ${agentRole}，负责本项目中的以下工作：\n\n`;
  task += `**项目ID**: ${projectId}\n`;
  task += `**职责**: ${roleInfo.responsibility}\n\n`;
  
  // 添加技能使用指南
  task += generateSkillGuideSection(assignedSkills);
  
  // 添加项目路径信息
  task += `\n📁 **项目路径**: ${projectDir}\n`;
  task += `📄 **项目文档**: ${projectDir}/${projectId}.md\n`;
  task += `📊 **状态追踪**: ${projectDir}/agent-status.json\n\n`;
  
  // 添加汇报要求
  task += `**汇报要求**:\n`;
  task += `- 每完成一个里程碑向 PM 汇报\n`;
  task += `- 遇到任何问题立即上报\n`;
  task += `- 定期更新 agent-status.json\n`;
  
  return task;
}

/**
 * 生成技能使用指南部分
 */
function generateSkillGuideSection(skills) {
  if (!skills || skills.length === 0) {
    return `
═══════════════════════════════════════════════════════════
🛠️ 可用工具与技能
═══════════════════════════════════════════════════════════

本任务没有预设的特定 skills。
你可以根据需要向 PM 申请使用其他工具。
═══════════════════════════════════════════════════════════
`;
  }
  
  let guide = `
═══════════════════════════════════════════════════════════
🛠️ 可用工具与技能
═══════════════════════════════════════════════════════════

本任务可以使用以下 skills:

`;
  
  for (const skill of skills) {
    guide += `【Skill: ${skill.name}】\n`;
    guide += `• 功能: ${skill.description}\n`;
    guide += `• 位置: ${skill.location}\n`;
    if (skill.capabilities.length > 0) {
      guide += `• 能力: ${skill.capabilities.slice(0, 5).join(', ')}\n`;
    }
    guide += `• 使用方法: 先阅读 SKILL.md 了解用法\n`;
    guide += `   执行: read ${skill.location}/SKILL.md\n`;
    guide += `\n`;
  }
  
  guide += `⚠️ 重要提示:\n`;
  guide += `1. 在开始任务前，先阅读 SKILL.md 了解工具用法\n`;
  guide += `2. 优先使用已分配的 skills 完成任务\n`;
  guide += `3. 如果 skill 不能满足需求，立即向 PM 汇报\n`;
  guide += `4. 不确定如何使用 skill 时，先阅读文档或询问 PM\n`;
  guide += `═══════════════════════════════════════════════════════════\n`;
  
  return guide;
}

/**
 * 更新代理状态
 */
function updateAgentStatus(projectDir, agentId, statusUpdate) {
  const statusFile = path.join(projectDir, 'agent-status.json');
  
  if (!fs.existsSync(statusFile)) {
    throw new Error(`项目状态文件不存在: ${statusFile}`);
  }
  
  const status = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
  
  if (!status.agents[agentId]) {
    status.agents[agentId] = {
      createdAt: new Date().toISOString(),
      status: 'running',
      progress: 0,
      deliverables: []
    };
  }
  
  // 更新状态
  Object.assign(status.agents[agentId], statusUpdate, {
    lastUpdate: new Date().toISOString()
  });
  
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

/**
 * 记录项目日志
 */
function logProjectEvent(projectDir, event) {
  const projectFiles = fs.readdirSync(projectDir);
  const mdFile = projectFiles.find(f => f.endsWith('.md'));
  
  if (!mdFile) return;
  
  const logEntry = `
### ${new Date().toISOString()} - ${event.type}
${event.message}
`;
  
  const docPath = path.join(projectDir, mdFile);
  let doc = fs.readFileSync(docPath, 'utf-8');
  doc += logEntry;
  fs.writeFileSync(docPath, doc);
}

// 导出功能
module.exports = {
  initializeProject,
  generateAgentTask,
  updateAgentStatus,
  logProjectEvent,
  generateTeamSuggestion
};

// CLI 测试
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      const userRequest = args[1] || '生成一个关于AI的视频';
      const result = initializeProject(userRequest);
      console.log('\n📊 项目初始化结果:');
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'task':
      // 测试任务生成
      const testProject = initializeProject('使用 remotion 生成视频');
      const task = generateAgentTask(testProject, 'Video Producer', 0);
      console.log('\n📋 任务分配示例:');
      console.log(task);
      break;
      
    default:
      console.log('Usage: node pm-workflow.js [init "<request>" | task]');
      break;
  }
}

/**
 * PM Workflow Integration
 * 深度集成技能感知到 PM 工作流程
 */

const fs = require('fs');
const path = require('path');
const { initializeSkillAwarePlanning } = require('./skill-aware-planning');

// Import unified state manager
let stateManager;
try {
  stateManager = require('./src/state-manager');
} catch (error) {
  try {
    stateManager = require('./dist/state-manager');
  } catch (e) {
    console.error('❌ State manager not available, using legacy file operations');
  }
}

// Dynamic project directory resolution (replaces hardcoded PROJECTS_DIR)
function resolveProjectsDir(explicitDir) {
  if (stateManager && stateManager.resolveProjectsDir) {
    return stateManager.resolveProjectsDir(explicitDir);
  }
  // Fallback to legacy behavior
  return explicitDir || process.env.CLAWD_PROJECTS_DIR || path.join(__dirname, '..', '..', 'projects');
}

const PROJECTS_DIR = resolveProjectsDir();

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
async function initializeProject(userRequest, options = {}) {
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

    // 3. Use state manager to create project state
    if (stateManager && stateManager.createProject) {
      try {
        const teamSuggestion = generateTeamSuggestion(skillPlanning.analysis);

        await stateManager.createProject(projectId, {
          id: projectId,
          status: 'init',
          mode: options.mode || 'FULL_AUTO',
          userRequest,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          team: teamSuggestion.map(role => ({
            role: role.role,
            agentId: `${role.role.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            status: 'active',
            reworkCount: 0
          })),
          milestones: [],
          disputes: [],
          logs: [{
            timestamp: new Date().toISOString(),
            phase: 'init',
            event: 'Project created',
            details: `Mode: ${options.mode || 'FULL_AUTO'}, Skills: ${skillPlanning.analysis.recommendations.map(s => s.name).join(', ')}`
          }]
        }, PROJECTS_DIR);

        console.log('✅ 使用统一状态管理器创建项目');
      } catch (e) {
        console.warn('⚠️ 状态管理器创建失败，使用传统方式:', e.message);
        // Fallback to legacy
        const projectDoc = generateProjectDocument(projectId, userRequest, skillPlanning, options);
        fs.writeFileSync(path.join(projectDir, `${projectId}.md`), projectDoc);
        await initializeAgentStatus(projectDir, projectId);
      }
    } else {
      // Legacy fallback
      const projectDoc = generateProjectDocument(projectId, userRequest, skillPlanning, options);
      fs.writeFileSync(path.join(projectDir, `${projectId}.md`), projectDoc);
      await initializeAgentStatus(projectDir, projectId);
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
      const teamSuggestion = generateTeamSuggestion(skillPlanning.analysis);

      // Create projectBrief for whiteboard
      const projectBrief = {
        finalDeliverable: skillPlanning.analysis.finalDeliverable || '多部分协作成果',
        roles: teamSuggestion.map(role => ({
          name: role.role,
          assignedSection: role.assignedSection || role.responsibility,
          deliverable: role.responsibility
        }))
      };

      initializeWhiteboard(projectDir, projectId, projectBrief);
    } catch (e) {
      console.warn('⚠️ 初始化白板失败:', e.message);
    }

    // 7. 初始化超时监控器（带崩溃恢复）
    try {
      const timeoutMonitor = require('./timeout-monitor');
      timeoutMonitor.initializeMonitor(projectDir);
      console.log('✅ 超时监控器已启动');
    } catch (e) {
      console.warn('⚠️ 初始化超时监控器失败:', e.message);
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
async function initializeAgentStatus(projectDir, projectId) {
  // Use state manager if available
  if (stateManager && stateManager.projectExists) {
    try {
      // State is already initialized by createProject in state-manager
      // Just verify it exists
      const projectIdFromDir = path.basename(projectDir);
      if (stateManager.projectExists(projectIdFromDir, path.dirname(projectDir))) {
        return; // Already initialized
      }
    } catch (error) {
      console.warn('⚠️ State manager check failed, falling back to legacy:', error.message);
    }
  }

  // Fallback to legacy file operations
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

  // Assign specific sections to each role
  const assignedRoles = assignSectionsToRoles(roles.slice(0, 3), analysis);
  return assignedRoles;
}

/**
 * Assign specific sections/parts to each role based on task type
 */
function assignSectionsToRoles(roles, analysis) {
  const taskType = detectTaskType(analysis);

  switch (taskType) {
    case 'document':
      return assignDocumentSections(roles, analysis);
    case 'code':
      return assignCodeModules(roles, analysis);
    case 'research':
      return assignResearchAreas(roles, analysis);
    case 'design':
      return assignDesignComponents(roles, analysis);
    case 'video':
      return assignVideoComponents(roles, analysis);
    default:
      return assignGenericParts(roles, analysis);
  }
}

/**
 * Detect task type from analysis
 */
function detectTaskType(analysis) {
  const types = analysis.detectedTypes || [];

  if (types.includes('document') || types.includes('writing')) return 'document';
  if (types.includes('code') || types.includes('development')) return 'code';
  if (types.includes('research') || types.includes('analysis')) return 'research';
  if (types.includes('design') || types.includes('image')) return 'design';
  if (types.includes('video')) return 'video';

  return 'generic';
}

/**
 * Assign document sections (e.g., Chapter 1, Chapter 2, etc.)
 */
function assignDocumentSections(roles, analysis) {
  const sections = [
    { title: '1. Executive Summary & Introduction', order: 1 },
    { title: '2. Main Content & Analysis', order: 2 },
    { title: '3. Conclusions & Recommendations', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: sections[idx]?.title || `Section ${idx + 1}`,
    sectionOrder: sections[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Assign code modules (e.g., Backend API, Frontend UI, Database)
 */
function assignCodeModules(roles, analysis) {
  const modules = [
    { name: 'Backend API & Business Logic', order: 1 },
    { name: 'Frontend UI & User Experience', order: 2 },
    { name: 'Database Schema & Data Layer', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: modules[idx]?.name || `Module ${idx + 1}`,
    sectionOrder: modules[idx]?.order || idx + 1,
    dependencies: determineCodeDependencies(role, roles)
  }));
}

/**
 * Assign research areas (e.g., Literature Review, Methodology, Results)
 */
function assignResearchAreas(roles, analysis) {
  const areas = [
    { name: 'Literature Review & Background', order: 1 },
    { name: 'Methodology & Data Collection', order: 2 },
    { name: 'Results & Discussion', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: areas[idx]?.name || `Research Area ${idx + 1}`,
    sectionOrder: areas[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Assign design components (e.g., Visual Design, Interaction Design, Assets)
 */
function assignDesignComponents(roles, analysis) {
  const components = [
    { name: 'Visual Design & Branding', order: 1 },
    { name: 'Interaction Design & UX Flow', order: 2 },
    { name: 'Assets & Design System', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: components[idx]?.name || `Design Component ${idx + 1}`,
    sectionOrder: components[idx]?.order || idx + 1,
    dependencies: determineDesignDependencies(role, roles)
  }));
}

/**
 * Assign video production components
 */
function assignVideoComponents(roles, analysis) {
  const components = [
    { name: 'Script & Storyboard', order: 1 },
    { name: 'Visual Assets & Graphics', order: 2 },
    { name: 'Audio & Final Assembly', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: components[idx]?.name || `Video Component ${idx + 1}`,
    sectionOrder: components[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Generic part assignment for mixed/unknown task types
 */
function assignGenericParts(roles, analysis) {
  return roles.map((role, idx) => ({
    ...role,
    assignedSection: `Part ${idx + 1}: ${role.responsibility}`,
    sectionOrder: idx + 1,
    dependencies: []
  }));
}

/**
 * Determine code dependencies between roles
 */
function determineCodeDependencies(role, allRoles) {
  // Backend typically has no dependencies
  if (role.role.includes('Backend')) return [];

  // Frontend depends on Backend
  if (role.role.includes('Frontend')) {
    const backend = allRoles.find(r => r.role.includes('Backend'));
    return backend ? [backend.role] : [];
  }

  // Database typically has no dependencies
  return [];
}

/**
 * Determine design dependencies between roles
 */
function determineDesignDependencies(role, allRoles) {
  // Visual design comes first
  if (role.role.includes('Visual')) return [];

  // Interaction design depends on visual design
  if (role.role.includes('Interaction')) {
    const visual = allRoles.find(r => r.role.includes('Visual'));
    return visual ? [visual.role] : [];
  }

  // Assets depend on both
  const deps = allRoles.filter(r =>
    r.role.includes('Visual') || r.role.includes('Interaction')
  );
  return deps.map(d => d.role);
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
 * 更新：移除静态技能分配，agents将自主发现技能
 */
function generateAgentTask(projectInfo, agentRole, agentIndex) {
  const { projectId, skillAnalysis, projectDir } = projectInfo;

  // 获取该角色的职责信息
  const teamSuggestion = generateTeamSuggestion(skillAnalysis);
  const roleInfo = teamSuggestion[agentIndex];

  if (!roleInfo) {
    throw new Error(`未找到角色 ${agentRole} 的信息`);
  }

  // 只获取用户明确指定的必须使用的技能
  const mandatorySkills = skillAnalysis.userSpecified && !skillAnalysis.userSpecified.error
    ? [skillAnalysis.userSpecified]
    : [];

  // 生成任务描述
  let task = `你是 ${agentRole}，负责本项目中的以下工作：\n\n`;
  task += `**项目ID**: ${projectId}\n`;
  task += `**职责**: ${roleInfo.responsibility}\n\n`;

  // 如果有用户指定的必须使用的技能
  if (mandatorySkills.length > 0) {
    task += `## 必须使用的技能（用户指定）\n\n`;
    mandatorySkills.forEach(skill => {
      task += `- **${skill.name}**: 用户明确要求使用此技能\n`;
    });
    task += `\n`;
  }

  // 添加技能发现指引
  task += `## 技能发现\n\n`;
  task += `在开始规划前，你需要自己发现可用的技能：\n\n`;
  task += `1. 使用 find-skills 技能来发现你环境中可用的所有技能\n`;
  task += `2. 根据你的角色（${agentRole}）选择2-3个最适合的技能\n`;
  task += `3. 向PM报告你的选择和理由\n`;
  task += `4. 等待PM批准后再开始规划\n\n`;

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
 * DEPRECATED: 生成技能使用指南部分
 *
 * This function is deprecated. Agents now discover skills dynamically
 * at runtime instead of receiving pre-assigned skills.
 */
function generateSkillGuideSection(skills) {
  // Deprecated - return notice about dynamic skill discovery
  return `
═══════════════════════════════════════════════════════════
🛠️ 技能发现
═══════════════════════════════════════════════════════════

⚠️ 注意: 静态技能分配已弃用

请使用 find-skills 技能动态发现你环境中可用的所有技能，
然后根据你的角色选择最适合的技能，并向 PM 报告等待批准。

═══════════════════════════════════════════════════════════
`;
}

/**
 * 更新代理状态
 */
async function updateAgentStatus(projectDir, agentId, statusUpdate) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager if available
  if (stateManager && stateManager.updateAgentStatus) {
    try {
      await stateManager.updateAgentStatus(projectId, agentId, {
        agentId,
        ...statusUpdate,
        lastUpdate: new Date().toISOString()
      }, projectsDir);
      return;
    } catch (error) {
      console.warn('⚠️ State manager update failed, falling back to legacy:', error.message);
    }
  }

  // Fallback to legacy file operations
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
async function logProjectEvent(projectDir, event) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager if available
  if (stateManager && stateManager.addLogEntry) {
    try {
      await stateManager.addLogEntry(
        projectId,
        event.phase || 'general',
        event.type,
        event.message,
        projectsDir
      );
      return;
    } catch (error) {
      console.warn('⚠️ State manager log failed, falling back to legacy:', error.message);
    }
  }

  // Fallback to legacy file operations
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

/**
 * 启动周期性超时监控
 * PM应该每3-5分钟检查一次超时情况（根据CLAUDE.md）
 */
function startPeriodicMonitoring(projectDir, intervalMinutes = 3) {
  const timeoutMonitor = require('./timeout-monitor');

  console.log(`🔍 启动周期性监控，间隔 ${intervalMinutes} 分钟`);

  const intervalMs = intervalMinutes * 60 * 1000;

  const monitorInterval = setInterval(() => {
    try {
      // 检查阶段级别超时
      const stageTimeouts = timeoutMonitor.checkTimeouts(projectDir);
      if (stageTimeouts.length > 0) {
        console.log(`⚠️ 检测到 ${stageTimeouts.length} 个阶段超时:`);
        stageTimeouts.forEach(t => {
          console.log(`  - ${t.agentRole}: ${t.stage} 阶段超时 (${t.elapsed}分钟)`);
        });
      }

      // 检查Agent级别超时
      const agentTimeouts = timeoutMonitor.checkAgentTimeouts(projectDir);
      if (agentTimeouts.length > 0) {
        console.log(`🚨 检测到 ${agentTimeouts.length} 个Agent超时:`);
        agentTimeouts.forEach(t => {
          console.log(`  - ${t.agentRole}: Agent级别超时 (${t.elapsed}分钟, 重启次数: ${t.restartCount})`);
        });
      }

      // 显示监控统计
      const stats = timeoutMonitor.getMonitorStats(projectDir);
      if (stats.activeAgents > 0 || stats.activeStages > 0) {
        console.log(`📊 监控状态: ${stats.activeAgents} 个活跃Agent, ${stats.activeStages} 个活跃阶段`);
      }

    } catch (error) {
      console.error(`❌ 监控检查失败: ${error.message}`);
    }
  }, intervalMs);

  // 返回清理函数
  return () => {
    clearInterval(monitorInterval);
    console.log('🛑 停止周期性监控');
  };
}

/**
 * 注册Agent到超时监控系统
 * 当PM启动一个新Agent时调用
 */
function registerAgentForMonitoring(projectDir, agentRole, agentId) {
  const timeoutMonitor = require('./timeout-monitor');

  try {
    // 启动Agent级别计时器
    timeoutMonitor.startAgentTimer(projectDir, agentRole, agentId);
    console.log(`✅ 已注册 ${agentRole} 到超时监控系统`);
  } catch (error) {
    console.error(`❌ 注册Agent监控失败: ${error.message}`);
  }
}

/**
 * 更新Agent阶段到超时监控系统
 * 当Agent进入新阶段时调用
 */
function updateAgentStage(projectDir, agentRole, stage, agentId) {
  const timeoutMonitor = require('./timeout-monitor');

  try {
    // 结束之前的阶段计时
    timeoutMonitor.endStageTimer(projectDir, agentRole);

    // 启动新阶段计时
    timeoutMonitor.startStageTimer(projectDir, agentRole, stage, agentId);
    console.log(`✅ ${agentRole} 进入 ${stage} 阶段`);
  } catch (error) {
    console.error(`❌ 更新Agent阶段失败: ${error.message}`);
  }
}

/**
 * 注销Agent监控
 * 当Agent完成或失败时调用
 */
function unregisterAgentFromMonitoring(projectDir, agentRole) {
  const timeoutMonitor = require('./timeout-monitor');

  try {
    // 结束所有计时器
    timeoutMonitor.endAgentTimer(projectDir, agentRole);
    timeoutMonitor.endStageTimer(projectDir, agentRole);
    console.log(`✅ 已注销 ${agentRole} 的监控`);
  } catch (error) {
    console.error(`❌ 注销Agent监控失败: ${error.message}`);
  }
}

/**
 * PM批准Agent方案
 * 当PM审核完Agent的方案后调用
 *
 * NEW: Integrated with phase state machine
 */
function approveAgentPlan(projectDir, agentRole, pmIdentifier = 'PM') {
  // Import phase state machine
  let phaseStateMachine;
  try {
    phaseStateMachine = require('./src/phase-state-machine');
  } catch (error) {
    try {
      phaseStateMachine = require('./dist/phase-state-machine');
    } catch (e) {
      console.error('❌ Phase state machine not available');
      throw new Error('Phase state machine module not found');
    }
  }

  try {
    // Get current phase state
    const state = phaseStateMachine.getPhaseState(projectDir, agentRole);

    if (!state) {
      throw new Error(`No phase state found for agent: ${agentRole}. Initialize first.`);
    }

    // Validate agent is in awaiting_approval phase
    if (state.currentPhase !== 'awaiting_approval') {
      throw new Error(
        `Cannot approve: ${agentRole} is in ${state.currentPhase} phase, not awaiting_approval`
      );
    }

    // Grant approval (atomic operation)
    const approvalResult = phaseStateMachine.grantApproval(projectDir, agentRole, pmIdentifier);

    if (!approvalResult.valid) {
      throw new Error(`Approval failed: ${approvalResult.reason}`);
    }

    console.log(`✅ PM批准 ${agentRole} 的方案，可以开始执行`);

    // Update whiteboard
    const { updateAgentStatus } = require('./whiteboard');
    updateAgentStatus(projectDir, agentRole, {
      status: 'RUNNING',
      stage: '执行',
      progress: 40,
      message: 'PM已批准，开始执行'
    });

    // Log decision
    const { logDecision } = require('./whiteboard');
    logDecision(projectDir, `批准 ${agentRole} 的执行方案`, pmIdentifier);

    return { success: true, message: `${agentRole} 已获批准，可以开始执行` };

  } catch (error) {
    console.error(`❌ 批准失败: ${error.message}`);
    throw error;
  }
}

/**
 * PM拒绝Agent方案
 * 要求Agent修改方案
 *
 * NEW: Integrated with phase state machine
 */
function rejectAgentPlan(projectDir, agentRole, reason, pmIdentifier = 'PM') {
  // Import phase state machine
  let phaseStateMachine;
  try {
    phaseStateMachine = require('./src/phase-state-machine');
  } catch (error) {
    try {
      phaseStateMachine = require('./dist/phase-state-machine');
    } catch (e) {
      console.error('❌ Phase state machine not available');
      throw new Error('Phase state machine module not found');
    }
  }

  try {
    // Revoke approval if granted
    phaseStateMachine.revokeApproval(projectDir, agentRole);

    // Transition back to plan_design phase
    const transitionResult = phaseStateMachine.transitionPhase(
      projectDir,
      agentRole,
      phaseStateMachine.WorkflowPhase.PLAN_DESIGN,
      pmIdentifier
    );

    if (!transitionResult.valid) {
      throw new Error(`Transition failed: ${transitionResult.reason}`);
    }

    console.log(`⚠️ PM拒绝 ${agentRole} 的方案，要求修改`);

    // Update whiteboard
    const { updateAgentStatus } = require('./whiteboard');
    updateAgentStatus(projectDir, agentRole, {
      status: 'RUNNING',
      stage: '方案规划',
      progress: 30,
      message: `PM要求修改方案: ${reason}`
    });

    // Log decision
    const { logDecision } = require('./whiteboard');
    logDecision(projectDir, `拒绝 ${agentRole} 的方案: ${reason}`, pmIdentifier);

    return { success: true, message: `${agentRole} 需要修改方案: ${reason}` };

  } catch (error) {
    console.error(`❌ 拒绝方案失败: ${error.message}`);
    throw error;
  }
}

/**
 * 获取Agent的批准状态
 * PM可以用此检查哪些Agent在等待批准
 */
function getAgentApprovalStatus(projectDir, agentRole) {
  let phaseStateMachine;
  try {
    phaseStateMachine = require('./src/phase-state-machine');
  } catch (error) {
    try {
      phaseStateMachine = require('./dist/phase-state-machine');
    } catch (e) {
      return null;
    }
  }

  const state = phaseStateMachine.getPhaseState(projectDir, agentRole);
  if (!state) {
    return null;
  }

  return {
    agentRole,
    currentPhase: state.currentPhase,
    approvalRequired: state.approval.required,
    approvalGranted: state.approval.granted,
    grantedBy: state.approval.grantedBy,
    grantedAt: state.approval.grantedAt,
    waitingForApproval: state.currentPhase === 'awaiting_approval' && !state.approval.granted
  };
}

/**
 * 获取所有等待批准的Agent
 */
function getAgentsAwaitingApproval(projectDir) {
  let phaseStateMachine;
  try {
    phaseStateMachine = require('./src/phase-state-machine');
  } catch (error) {
    try {
      phaseStateMachine = require('./dist/phase-state-machine');
    } catch (e) {
      return [];
    }
  }

  return phaseStateMachine.getAgentsAwaitingApproval(projectDir);
}

/**
 * QA Queue Integration
 * Serializes QA validation to prevent concurrent validation
 */

let qaQueue;
try {
  qaQueue = require('./src/qa-queue');
} catch (error) {
  try {
    qaQueue = require('./dist/qa-queue');
  } catch (e) {
    console.warn('⚠️ QA queue module not available');
  }
}

/**
 * Submit agent deliverable to QA queue
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role (e.g., "Frontend Developer")
 * @param {string} agentId - Agent ID
 * @param {string} deliverable - Path to deliverable or description
 * @param {object} options - Optional metadata
 * @returns {Promise<void>}
 */
async function submitToQA(projectDir, agentRole, agentId, deliverable, options = {}) {
  if (!qaQueue) {
    console.warn('⚠️ QA queue not available, skipping queue');
    return;
  }

  try {
    const submission = {
      agentRole,
      agentId,
      deliverable,
      submittedAt: Date.now(),
      priority: options.priority || 0,
      metadata: options.metadata || {}
    };

    await qaQueue.enqueueQASubmission(projectDir, submission);

    // Update agent status to PENDING_VERIFICATION
    await updateAgentStatus(projectDir, agentRole, {
      status: 'PENDING_VERIFICATION',
      stage: '等待QA验证',
      progress: 95
    });

    await logProjectEvent(projectDir, {
      phase: 'qa',
      type: 'submission',
      message: `${agentRole} submitted deliverable to QA queue`
    });

    console.log(`✅ ${agentRole} deliverable submitted to QA queue`);
  } catch (error) {
    console.error(`❌ Failed to submit to QA queue: ${error.message}`);
    throw error;
  }
}

/**
 * Process next QA submission from queue
 *
 * @param {string} projectDir - Project directory
 * @returns {Promise<object|null>} Next submission or null if queue empty
 */
async function processNextQASubmission(projectDir) {
  if (!qaQueue) {
    console.warn('⚠️ QA queue not available');
    return null;
  }

  try {
    const submission = await qaQueue.dequeueQASubmission(projectDir);

    if (!submission) {
      return null;
    }

    // Update agent status to UNDER_VERIFICATION
    await updateAgentStatus(projectDir, submission.agentRole, {
      status: 'UNDER_VERIFICATION',
      stage: 'QA验证中',
      progress: 96
    });

    await logProjectEvent(projectDir, {
      phase: 'qa',
      type: 'validation_started',
      message: `QA started validating ${submission.agentRole} deliverable`
    });

    console.log(`🔍 QA started validating ${submission.agentRole} deliverable`);

    return submission;
  } catch (error) {
    console.error(`❌ Failed to process QA submission: ${error.message}`);
    throw error;
  }
}

/**
 * Complete QA validation
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {boolean} passed - Whether validation passed
 * @param {string} feedback - QA feedback
 * @returns {Promise<void>}
 */
async function completeQAValidation(projectDir, agentRole, passed, feedback = '') {
  if (!qaQueue) {
    console.warn('⚠️ QA queue not available');
    return;
  }

  try {
    await qaQueue.completeQAValidation(projectDir, passed ? 'passed' : 'failed');

    if (passed) {
      // Update agent status to VERIFIED
      await updateAgentStatus(projectDir, agentRole, {
        status: 'VERIFIED',
        stage: 'QA验证通过',
        progress: 100
      });

      await logProjectEvent(projectDir, {
        phase: 'qa',
        type: 'validation_passed',
        message: `${agentRole} deliverable passed QA validation`
      });

      console.log(`✅ ${agentRole} deliverable passed QA validation`);
    } else {
      // Update agent status to RETURNED_FOR_FIX
      await updateAgentStatus(projectDir, agentRole, {
        status: 'RETURNED_FOR_FIX',
        stage: 'QA要求修复',
        progress: 85,
        qaFeedback: feedback
      });

      await logProjectEvent(projectDir, {
        phase: 'qa',
        type: 'validation_failed',
        message: `${agentRole} deliverable failed QA validation: ${feedback}`
      });

      console.log(`❌ ${agentRole} deliverable failed QA validation`);
    }
  } catch (error) {
    console.error(`❌ Failed to complete QA validation: ${error.message}`);
    throw error;
  }
}

/**
 * Get QA queue status
 *
 * @param {string} projectDir - Project directory
 * @returns {Promise<object>} Queue status
 */
async function getQAQueueStatus(projectDir) {
  if (!qaQueue) {
    return { pending: 0, current: null, currentElapsed: null, history: 0 };
  }

  try {
    return await qaQueue.getQueueStatus(projectDir);
  } catch (error) {
    console.error(`❌ Failed to get QA queue status: ${error.message}`);
    return { pending: 0, current: null, currentElapsed: null, history: 0 };
  }
}

/**
 * Check if agent is already in QA queue
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @returns {Promise<boolean>}
 */
async function isAgentInQAQueue(projectDir, agentRole) {
  if (!qaQueue) {
    return false;
  }

  try {
    return await qaQueue.isAgentInQueue(projectDir, agentRole);
  } catch (error) {
    console.error(`❌ Failed to check QA queue: ${error.message}`);
    return false;
  }
}

/**
 * Concurrency Manager Integration
 * Limits maximum concurrent agents to prevent resource exhaustion
 */

let concurrencyManager;
try {
  concurrencyManager = require('./src/concurrency-manager');
} catch (error) {
  try {
    concurrencyManager = require('./dist/concurrency-manager');
  } catch (e) {
    console.warn('⚠️ Concurrency manager module not available');
  }
}

/**
 * Acquire execution slot for agent
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {object} config - Optional configuration override
 * @returns {Promise<object|null>} Execution slot or null if must wait
 */
async function acquireExecutionSlot(projectDir, agentRole, agentId, config = {}) {
  if (!concurrencyManager) {
    console.warn('⚠️ Concurrency manager not available, allowing unlimited concurrency');
    return { slotId: `unlimited-${Date.now()}`, agentRole, agentId, acquiredAt: Date.now() };
  }

  try {
    const slot = await concurrencyManager.acquireSlot(projectDir, agentRole, agentId, config);

    if (!slot) {
      console.log(`⏳ ${agentRole} waiting for execution slot (queue full)`);
      return null;
    }

    await logProjectEvent(projectDir, {
      phase: 'concurrency',
      type: 'slot_acquired',
      message: `${agentRole} acquired execution slot ${slot.slotId}`
    });

    return slot;
  } catch (error) {
    console.error(`❌ Failed to acquire execution slot: ${error.message}`);
    throw error;
  }
}

/**
 * Release execution slot
 *
 * @param {string} projectDir - Project directory
 * @param {string} slotId - Slot ID to release
 * @param {string} reason - Reason for release
 * @returns {Promise<void>}
 */
async function releaseExecutionSlot(projectDir, slotId, reason = 'completed') {
  if (!concurrencyManager) {
    return;
  }

  try {
    await concurrencyManager.releaseSlot(projectDir, slotId, reason);

    await logProjectEvent(projectDir, {
      phase: 'concurrency',
      type: 'slot_released',
      message: `Released execution slot ${slotId} (${reason})`
    });
  } catch (error) {
    console.error(`❌ Failed to release execution slot: ${error.message}`);
    throw error;
  }
}

/**
 * Get concurrency status
 *
 * @param {string} projectDir - Project directory
 * @returns {Promise<object>} Concurrency status
 */
async function getConcurrencyStatus(projectDir) {
  if (!concurrencyManager) {
    return { maxConcurrent: Infinity, active: 0, available: Infinity, waiting: 0, activeSlots: [] };
  }

  try {
    return await concurrencyManager.getConcurrencyStatus(projectDir);
  } catch (error) {
    console.error(`❌ Failed to get concurrency status: ${error.message}`);
    return { maxConcurrent: 0, active: 0, available: 0, waiting: 0, activeSlots: [] };
  }
}

/**
 * Get available execution slots
 *
 * @param {string} projectDir - Project directory
 * @returns {Promise<number>} Number of available slots
 */
async function getAvailableSlots(projectDir) {
  if (!concurrencyManager) {
    return Infinity;
  }

  try {
    return await concurrencyManager.getAvailableSlots(projectDir);
  } catch (error) {
    console.error(`❌ Failed to get available slots: ${error.message}`);
    return 0;
  }
}

/**
 * Resource Lifecycle Management
 * Comprehensive cleanup when agents complete, fail, or timeout
 */

/**
 * Comprehensive agent cleanup
 * Called when agent completes, fails, or times out
 *
 * This function ensures all resources are properly released:
 * 1. Unregister from timeout monitor
 * 2. Release concurrency slot
 * 3. Update phase state to completion
 * 4. Update whiteboard status
 * 5. Log cleanup event
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {string} slotId - Execution slot ID (if any)
 * @param {string} reason - Cleanup reason ('completed', 'failed', 'timeout', 'aborted')
 * @param {object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function cleanupAgent(projectDir, agentRole, agentId, slotId, reason, metadata = {}) {
  console.log(`🧹 Starting cleanup for ${agentRole} (reason: ${reason})`);

  const cleanupSteps = [];
  const errors = [];

  try {
    // Step 1: Unregister from timeout monitor
    try {
      unregisterAgentFromMonitoring(projectDir, agentRole);
      cleanupSteps.push('timeout_monitor');
      console.log(`  ✅ Unregistered from timeout monitor`);
    } catch (error) {
      errors.push({ step: 'timeout_monitor', error: error.message });
      console.error(`  ❌ Failed to unregister from timeout monitor: ${error.message}`);
    }

    // Step 2: Release concurrency slot
    if (slotId && concurrencyManager) {
      try {
        await releaseExecutionSlot(projectDir, slotId, reason);
        cleanupSteps.push('concurrency_slot');
        console.log(`  ✅ Released concurrency slot ${slotId}`);
      } catch (error) {
        errors.push({ step: 'concurrency_slot', error: error.message });
        console.error(`  ❌ Failed to release concurrency slot: ${error.message}`);
      }
    }

    // Step 3: Update phase state to completion
    let phaseStateMachine;
    try {
      phaseStateMachine = require('./src/phase-state-machine');
    } catch (error) {
      try {
        phaseStateMachine = require('./dist/phase-state-machine');
      } catch (e) {
        // Phase state machine not available
      }
    }

    if (phaseStateMachine) {
      try {
        await phaseStateMachine.transitionPhase(
          projectDir,
          agentRole,
          phaseStateMachine.WorkflowPhase.COMPLETION,
          `cleanup:${reason}`
        );
        cleanupSteps.push('phase_state');
        console.log(`  ✅ Transitioned phase state to completion`);
      } catch (error) {
        errors.push({ step: 'phase_state', error: error.message });
        console.error(`  ❌ Failed to update phase state: ${error.message}`);
      }
    }

    // Step 4: Update whiteboard status
    try {
      const finalStatus = {
        status: reason === 'completed' ? 'COMPLETED' :
                reason === 'failed' ? 'FAILED' :
                reason === 'timeout' ? 'TIMEOUT' :
                reason === 'aborted' ? 'ABORTED' : 'COMPLETED',
        stage: reason === 'completed' ? '完成' :
               reason === 'failed' ? '失败' :
               reason === 'timeout' ? '超时' :
               reason === 'aborted' ? '中止' : '完成',
        progress: reason === 'completed' ? 100 : 0,
        completedAt: new Date().toISOString(),
        cleanupReason: reason,
        ...metadata
      };

      await updateAgentStatus(projectDir, agentRole, finalStatus);
      cleanupSteps.push('whiteboard');
      console.log(`  ✅ Updated whiteboard status`);
    } catch (error) {
      errors.push({ step: 'whiteboard', error: error.message });
      console.error(`  ❌ Failed to update whiteboard: ${error.message}`);
    }

    // Step 5: Log cleanup event
    try {
      await logProjectEvent(projectDir, {
        phase: 'cleanup',
        type: 'agent_cleanup',
        message: `Agent ${agentRole} cleaned up: ${reason}`,
        details: {
          agentId,
          slotId,
          reason,
          cleanupSteps,
          errors: errors.length > 0 ? errors : undefined,
          metadata
        }
      });
      cleanupSteps.push('logging');
      console.log(`  ✅ Logged cleanup event`);
    } catch (error) {
      errors.push({ step: 'logging', error: error.message });
      console.error(`  ❌ Failed to log cleanup event: ${error.message}`);
    }

    // Summary
    if (errors.length === 0) {
      console.log(`✅ Cleanup completed successfully for ${agentRole} (${cleanupSteps.length} steps)`);
    } else {
      console.warn(
        `⚠️ Cleanup completed with ${errors.length} error(s) for ${agentRole} ` +
        `(${cleanupSteps.length - errors.length}/${cleanupSteps.length} steps succeeded)`
      );
    }

  } catch (error) {
    console.error(`❌ Critical error during cleanup for ${agentRole}: ${error.message}`);
    throw error;
  }
}

/**
 * Cleanup agent on completion
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {string} slotId - Execution slot ID
 * @param {object} deliverable - Deliverable information
 * @returns {Promise<void>}
 */
async function cleanupAgentOnCompletion(projectDir, agentRole, agentId, slotId, deliverable = {}) {
  return cleanupAgent(projectDir, agentRole, agentId, slotId, 'completed', {
    deliverable,
    completionTime: Date.now()
  });
}

/**
 * Cleanup agent on failure
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {string} slotId - Execution slot ID
 * @param {string} errorMessage - Error message
 * @returns {Promise<void>}
 */
async function cleanupAgentOnFailure(projectDir, agentRole, agentId, slotId, errorMessage) {
  return cleanupAgent(projectDir, agentRole, agentId, slotId, 'failed', {
    error: errorMessage,
    failureTime: Date.now()
  });
}

/**
 * Cleanup agent on timeout
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {string} slotId - Execution slot ID
 * @param {number} elapsedTime - Elapsed time in milliseconds
 * @returns {Promise<void>}
 */
async function cleanupAgentOnTimeout(projectDir, agentRole, agentId, slotId, elapsedTime) {
  return cleanupAgent(projectDir, agentRole, agentId, slotId, 'timeout', {
    elapsedTime,
    timeoutTime: Date.now()
  });
}

/**
 * Cleanup agent on abort
 *
 * @param {string} projectDir - Project directory
 * @param {string} agentRole - Agent role
 * @param {string} agentId - Agent ID
 * @param {string} slotId - Execution slot ID
 * @param {string} abortReason - Abort reason
 * @returns {Promise<void>}
 */
async function cleanupAgentOnAbort(projectDir, agentRole, agentId, slotId, abortReason) {
  return cleanupAgent(projectDir, agentRole, agentId, slotId, 'aborted', {
    abortReason,
    abortTime: Date.now()
  });
}

/**
 * QA Validation Plan Management
 * NEW: Functions for managing QA validation plans
 */

let qaValidationPlan;
try {
  qaValidationPlan = require('./src/qa-validation-plan');
} catch (error) {
  try {
    qaValidationPlan = require('./dist/qa-validation-plan');
  } catch (e) {
    console.warn('⚠️ QA validation plan module not available');
  }
}

/**
 * Approve QA validation plan
 *
 * @param {string} projectDir - Project directory (can be relative or absolute)
 * @param {string} qaAgentRole - QA agent role
 * @param {string} pmIdentifier - PM identifier
 * @returns {Promise<object>} Result object with success status
 */
async function approveValidationPlan(projectDir, qaAgentRole, pmIdentifier = 'PM') {
  if (!qaValidationPlan) {
    throw new Error('QA validation plan module not available');
  }

  try {
    // Update approval status
    const plan = await qaValidationPlan.updateValidationPlanApproval(
      path.basename(projectDir),
      qaAgentRole,
      'approved',
      pmIdentifier,
      null,
      path.dirname(projectDir)
    );

    console.log(`✅ PM批准 ${qaAgentRole} 的验证计划，可以开始验证`);

    // Update whiteboard
    const { updateAgentStatus } = require('./whiteboard');
    updateAgentStatus(projectDir, qaAgentRole, {
      status: 'QA_VALIDATING',
      stage: 'QA验证中',
      message: 'PM已批准验证计划，开始验证'
    });

    // Log decision
    const { logDecision } = require('./whiteboard');
    logDecision(projectDir, `批准 ${qaAgentRole} 的验证计划`, pmIdentifier);

    return { success: true, message: `${qaAgentRole} 验证计划已获批准`, plan };

  } catch (error) {
    console.error(`❌ 批准验证计划失败: ${error.message}`);
    throw error;
  }
}

/**
 * Reject QA validation plan
 *
 * @param {string} projectDir - Project directory (can be relative or absolute)
 * @param {string} qaAgentRole - QA agent role
 * @param {string} reason - Rejection reason
 * @param {string} pmIdentifier - PM identifier
 * @returns {Promise<object>} Result object with success status
 */
async function rejectValidationPlan(projectDir, qaAgentRole, reason, pmIdentifier = 'PM') {
  if (!qaValidationPlan) {
    throw new Error('QA validation plan module not available');
  }

  try {
    // Update approval status
    const plan = await qaValidationPlan.updateValidationPlanApproval(
      path.basename(projectDir),
      qaAgentRole,
      'rejected',
      pmIdentifier,
      reason,
      path.dirname(projectDir)
    );

    console.log(`⚠️ PM拒绝 ${qaAgentRole} 的验证计划，要求修改`);

    // Update whiteboard
    const { updateAgentStatus } = require('./whiteboard');
    updateAgentStatus(projectDir, qaAgentRole, {
      status: 'QA_PLANNING',
      stage: 'QA计划修订',
      message: `PM要求修改验证计划: ${reason}`
    });

    // Log decision
    const { logDecision } = require('./whiteboard');
    logDecision(projectDir, `拒绝 ${qaAgentRole} 的验证计划: ${reason}`, pmIdentifier);

    return { success: true, message: `${qaAgentRole} 需要修改验证计划: ${reason}`, plan };

  } catch (error) {
    console.error(`❌ 拒绝验证计划失败: ${error.message}`);
    throw error;
  }
}

/**
 * Get validation plans awaiting approval
 *
 * @param {string} projectDir - Project directory (can be relative or absolute)
 * @returns {Promise<Array>} Array of pending validation plans
 */
async function getValidationPlansAwaitingApproval(projectDir) {
  if (!qaValidationPlan) {
    console.warn('⚠️ QA validation plan module not available');
    return [];
  }

  try {
    const plans = await qaValidationPlan.getValidationPlansAwaitingApproval(
      path.basename(projectDir),
      path.dirname(projectDir)
    );

    if (plans.length > 0) {
      console.log(`📋 ${plans.length} 个验证计划等待批准:`);
      plans.forEach(plan => {
        console.log(`  - ${plan.qaAgentRole}: ${plan.overview.validationObjective || 'No objective specified'}`);
      });
    }

    return plans;

  } catch (error) {
    console.error(`❌ 获取待批准验证计划失败: ${error.message}`);
    return [];
  }
}

// 导出功能
module.exports = {
  initializeProject,
  generateAgentTask,
  updateAgentStatus,
  logProjectEvent,
  generateTeamSuggestion,

  // 超时监控相关
  startPeriodicMonitoring,
  registerAgentForMonitoring,
  updateAgentStage,
  unregisterAgentFromMonitoring,

  // NEW: 批准管理相关
  approveAgentPlan,
  rejectAgentPlan,
  getAgentApprovalStatus,
  getAgentsAwaitingApproval,

  // NEW: QA验证计划批准相关
  approveValidationPlan,
  rejectValidationPlan,
  getValidationPlansAwaitingApproval,

  // NEW: QA队列管理相关
  submitToQA,
  processNextQASubmission,
  completeQAValidation,
  getQAQueueStatus,
  isAgentInQAQueue,

  // NEW: 并发控制相关
  acquireExecutionSlot,
  releaseExecutionSlot,
  getConcurrencyStatus,
  getAvailableSlots,

  // NEW: 资源生命周期管理
  cleanupAgent,
  cleanupAgentOnCompletion,
  cleanupAgentOnFailure,
  cleanupAgentOnTimeout,
  cleanupAgentOnAbort
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

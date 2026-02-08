/**
 * Council Workflow Integration
 * Leadership Council (三权分立) workflow with separation of powers
 * Replaces the single PM model with a 3-leader council:
 * - Planning Authority (规划权): Requirements, plans, scope
 * - Execution Authority (执行权): Resources, progress, coordination
 * - Quality Authority (质量权): QA, validation, acceptance
 *
 * REFACTORED: Using code-simplifier principles
 * - Simplified module loading (loadCoreModules)
 * - Extracted constants (src/constants.ts)
 * - Reduced code duplication
 */

const fs = require('fs');
const path = require('path');
const { initializeSkillAwarePlanning } = require('./skill-aware-planning');

// === SIMPLIFIED MODULE LOADING ===
// Load core modules using utility (eliminates 5× try-catch blocks)
let stateManager, leadership, crossCheck, councilDecisions, requirementClarification;
let DOMAIN_LABELS, DIMENSION_LABELS, CLARIFICATION_CONFIG, SIMILAR_PROJECT_CONFIG;

try {
  const { loadCoreModules } = require('./dist/utils/module-loader');
  const modules = loadCoreModules('.');

  stateManager = modules['state-manager'];
  leadership = modules.leadership;
  crossCheck = modules['cross-check'];
  councilDecisions = modules['council-decisions'];
  requirementClarification = modules['requirement-clarification'];

  // Load constants
  const constants = require('./dist/constants');
  DOMAIN_LABELS = constants.DOMAIN_LABELS;
  DIMENSION_LABELS = constants.DIMENSION_LABELS;
  CLARIFICATION_CONFIG = constants.CLARIFICATION_CONFIG;
  SIMILAR_PROJECT_CONFIG = constants.SIMILAR_PROJECT_CONFIG;

} catch (error) {
  // Fallback: Use legacy imports if simplified loader not available
  console.warn('⚠️  Using legacy module loading (module-loader not compiled yet)');

  try { stateManager = require('./src/state-manager'); } catch (e) {
    try { stateManager = require('./dist/state-manager'); } catch (e2) {
      console.warn('⚠️ State manager not available');
    }
  }

  try { leadership = require('./src/leadership'); } catch (e) {
    try { leadership = require('./dist/leadership'); } catch (e2) {
      console.warn('⚠️  Leadership module not available');
    }
  }

  try { crossCheck = require('./src/cross-check'); } catch (e) {
    try { crossCheck = require('./dist/cross-check'); } catch (e2) {
      console.warn('⚠️  Cross-check module not available');
    }
  }

  try { councilDecisions = require('./src/council-decisions'); } catch (e) {
    try { councilDecisions = require('./dist/council-decisions'); } catch (e2) {
      console.warn('⚠️  Council decisions module not available');
    }
  }

  try { requirementClarification = require('./src/requirement-clarification'); } catch (e) {
    try { requirementClarification = require('./dist/requirement-clarification'); } catch (e2) {
      console.warn('⚠️  Requirement clarification not available');
    }
  }

  // Fallback constants
  DOMAIN_LABELS = { planning: '规划权', execution: '执行权', quality: '质量权' };
  DIMENSION_LABELS = {
    scope: 'Scope',
    technical: 'Technical',
    deliverables: 'Deliverable',
    constraints: 'Constraints',
    context: 'Context'
  };
  CLARIFICATION_CONFIG = { MIN_ROUNDS: 2, SOFT_MAX_ROUNDS: 3, CONFIDENCE_THRESHOLD: 75, QUESTIONS_PER_ROUND: 5 };
  SIMILAR_PROJECT_CONFIG = { CHECK_RECENT_COUNT: 10, MIN_KEYWORD_MATCHES: 3, MAX_RESULTS: 3 };
}

// === DYNAMIC PROJECT DIRECTORY RESOLUTION ===
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
 * Uses SIMILAR_PROJECT_CONFIG constant for thresholds
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

  for (const projId of projects.slice(-SIMILAR_PROJECT_CONFIG.CHECK_RECENT_COUNT)) {
    const docPath = path.join(PROJECTS_DIR, projId, `${projId}.md`);
    if (fs.existsSync(docPath)) {
      try {
        const content = fs.readFileSync(docPath, 'utf-8').toLowerCase();
        const matchCount = requestKeywords.filter(kw => content.includes(kw)).length;
        if (matchCount >= SIMILAR_PROJECT_CONFIG.MIN_KEYWORD_MATCHES) {
          similar.push({ projectId: projId, matchScore: matchCount });
        }
      } catch (e) {
        // 忽略读取错误
      }
    }
  }

  return similar.sort((a, b) => b.matchScore - a.matchScore).slice(0, SIMILAR_PROJECT_CONFIG.MAX_RESULTS);
}

/**
 * Validate user request input
 * @param {string} userRequest - User request to validate
 * @throws {Error} if validation fails
 */
function validateUserRequest(userRequest) {
  if (!userRequest || typeof userRequest !== 'string') {
    throw new Error('用户请求不能为空');
  }

  if (userRequest.length > 5000) {
    console.warn('⚠️ 用户请求过长，可能会影响处理效果');
  }
}

/**
 * Check and warn about similar projects
 * @param {string} userRequest - User request to check
 * @param {object} options - Options including forceCreate flag
 * @returns {Array} Array of similar projects
 */
function checkAndWarnSimilarProjects(userRequest, options) {
  try {
    const similarProjects = checkSimilarProjects(userRequest);

    if (similarProjects.length > 0 && !options.forceCreate) {
      console.log(`⚠️ 发现 ${similarProjects.length} 个相似项目:`);
      similarProjects.forEach(p => console.log(`  - ${p.projectId}`));
      console.log(`提示: 如仍要创建新项目，设置 options.forceCreate = true`);
    }

    return similarProjects;
  } catch (e) {
    console.warn('⚠️ 检查相似项目失败:', e.message);
    return [];
  }
}

/**
 * Handle requirement clarification result
 * @param {string} userRequest - Original user request
 * @param {object} options - Options including clarificationResult
 * @returns {string} Enriched request or original if no clarification
 */
function handleClarificationResult(userRequest, options) {
  const clarificationResult = options.clarificationResult || null;

  if (clarificationResult && clarificationResult.enrichedRequest) {
    console.log(`✅ 使用已澄清的需求 (${clarificationResult.rounds} 轮, 置信度: ${clarificationResult.finalConfidence}/100)`);
    return clarificationResult.enrichedRequest;
  }

  return userRequest;
}

/**
 * Perform skill-aware planning analysis
 * @param {string} enrichedRequest - Request to analyze
 * @returns {object} Skill planning result
 * @throws {Error} if analysis fails
 */
function performSkillAnalysis(enrichedRequest) {
  try {
    return initializeSkillAwarePlanning(enrichedRequest);
  } catch (e) {
    console.error('❌ 技能感知分析失败:', e.message);
    throw new Error(`无法分析技能需求: ${e.message}`);
  }
}

/**
 * Initialize project state using state manager or legacy method
 * @param {string} projectId - Project ID
 * @param {string} projectDir - Project directory path
 * @param {string} userRequest - Original user request
 * @param {string} enrichedRequest - Enriched request (after clarification)
 * @param {object} skillPlanning - Skill planning result
 * @param {object} options - Options including mode and clarificationResult
 * @returns {Promise<Array>} Team suggestion
 */
async function initializeProjectState(projectId, projectDir, userRequest, enrichedRequest, skillPlanning, options) {
  const teamSuggestion = generateTeamSuggestion(skillPlanning.analysis, enrichedRequest);

  if (stateManager && stateManager.createProject) {
    try {
      await stateManager.createProject(projectId, {
        id: projectId,
        status: 'init',
        mode: options.mode || 'FULL_AUTO',
        userRequest: enrichedRequest,
        originalRequest: userRequest,
        clarificationData: options.clarificationResult ? {
          rounds: options.clarificationResult.rounds,
          finalConfidence: options.clarificationResult.finalConfidence,
          insights: options.clarificationResult.insights
        } : null,
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

  return teamSuggestion;
}

/**
 * Initialize whiteboard with error handling and fallback
 * @param {string} projectDir - Project directory
 * @param {string} projectId - Project ID
 * @param {object} skillPlanning - Skill planning result
 * @param {Array} teamSuggestion - Team suggestion
 */
function initializeWhiteboardWithFallback(projectDir, projectId, skillPlanning, teamSuggestion) {
  try {
    const { initializeWhiteboard } = require('./whiteboard');

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
    if (process.env.DEBUG) {
      console.warn('   Stack:', e.stack);
    }

    // Fallback: initialize without projectBrief
    try {
      const { initializeWhiteboard } = require('./whiteboard');
      console.log('   尝试使用基础模式初始化白板...');
      initializeWhiteboard(projectDir, projectId, null);
      console.log('   ✅ 基础白板初始化成功');
    } catch (fallbackError) {
      console.error('❌ 白板初始化完全失败:', fallbackError.message);
    }
  }
}

/**
 * Initialize timeout monitor with error handling
 * @param {string} projectDir - Project directory
 */
function initializeTimeoutMonitor(projectDir) {
  try {
    const timeoutMonitor = require('./timeout-monitor');
    timeoutMonitor.initializeMonitor(projectDir);
    console.log('✅ 超时监控器已启动');
  } catch (e) {
    console.warn('⚠️ 初始化超时监控器失败:', e.message);
  }
}

/**
 * 初始化项目，创建完整的项目结构
 * REFACTORED: Simplified from 171 lines to pipeline of focused functions
 */
async function initializeProject(userRequest, options = {}) {
  try {
    // 1. Validate input
    validateUserRequest(userRequest);

    // 2. Check similar projects
    checkAndWarnSimilarProjects(userRequest, options);

    // 3. Generate project ID and directory
    const projectId = generateProjectId();
    const projectDir = path.join(PROJECTS_DIR, projectId);
    console.log(`🚀 初始化项目: ${projectId}`);

    // 4. Handle requirement clarification
    const enrichedRequest = handleClarificationResult(userRequest, options);

    // 5. Perform skill analysis
    const skillPlanning = performSkillAnalysis(enrichedRequest);

    // 6. Create project directory structure
    createProjectStructure(projectDir);

    // 7. Initialize project state and generate team
    const teamSuggestion = await initializeProjectState(
      projectId, projectDir, userRequest, enrichedRequest, skillPlanning, options
    );

    // 8. Initialize whiteboard
    initializeWhiteboardWithFallback(projectDir, projectId, skillPlanning, teamSuggestion);

    // 9. Initialize timeout monitor
    initializeTimeoutMonitor(projectDir);

    // 10. Return result
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
function generateTeamSuggestion(analysis, userRequest = '') {
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

  // Separate QA from executors - QA validates all sections, doesn't own one
  const executors = roles.filter(r => r.role !== 'QA Reviewer');
  const qa = roles.find(r => r.role === 'QA Reviewer');

  // Assign sections to executors only
  let assignedExecutors;
  switch (taskType) {
    case 'document':
      assignedExecutors = assignDocumentSections(executors, analysis);
      break;
    case 'code':
      assignedExecutors = assignCodeModules(executors, analysis);
      break;
    case 'research':
      assignedExecutors = assignResearchAreas(executors, analysis);
      break;
    case 'design':
      assignedExecutors = assignDesignComponents(executors, analysis);
      break;
    case 'video':
      assignedExecutors = assignVideoComponents(executors, analysis);
      break;
    default:
      assignedExecutors = assignGenericParts(executors, analysis);
  }

  // Add QA back with special section indicating they validate all sections
  if (qa) {
    assignedExecutors.push({
      ...qa,
      assignedSection: 'Quality Assurance & Validation (All Sections)',
      sectionOrder: 999, // After all executors
      dependencies: assignedExecutors.map(e => e.role) // Depends on all executors
    });
  }

  return assignedExecutors;
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
  const roleKeywords = {
    backend: ['backend', 'api', 'server', 'service'],
    frontend: ['frontend', 'ui', 'client', 'web', 'interface'],
    database: ['database', 'db', 'data', 'storage']
  };

  const roleLower = role.role.toLowerCase();

  // Backend has no dependencies
  if (roleKeywords.backend.some(kw => roleLower.includes(kw))) {
    return [];
  }

  // Frontend depends on Backend
  if (roleKeywords.frontend.some(kw => roleLower.includes(kw))) {
    const backend = allRoles.find(r =>
      roleKeywords.backend.some(kw => r.role.toLowerCase().includes(kw))
    );
    return backend ? [backend.role] : [];
  }

  // Database has no dependencies
  return [];
}

/**
 * Determine design dependencies between roles
 */
function determineDesignDependencies(role, allRoles) {
  const roleKeywords = {
    visual: ['visual', 'graphic', 'brand', 'style'],
    interaction: ['interaction', 'ux', 'experience', 'flow'],
    assets: ['asset', 'resource', 'component', 'system']
  };

  const roleLower = role.role.toLowerCase();

  // Visual design comes first
  if (roleKeywords.visual.some(kw => roleLower.includes(kw))) {
    return [];
  }

  // Interaction design depends on visual design
  if (roleKeywords.interaction.some(kw => roleLower.includes(kw))) {
    const visual = allRoles.find(r =>
      roleKeywords.visual.some(kw => r.role.toLowerCase().includes(kw))
    );
    return visual ? [visual.role] : [];
  }

  // Assets depend on both visual and interaction
  if (roleKeywords.assets.some(kw => roleLower.includes(kw))) {
    const deps = allRoles.filter(r => {
      const rLower = r.role.toLowerCase();
      return roleKeywords.visual.some(kw => rLower.includes(kw)) ||
             roleKeywords.interaction.some(kw => rLower.includes(kw));
    });
    return deps.map(d => d.role);
  }

  // Default: no dependencies
  return [];
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
function approveAgentPlan(projectDir, agentRole, approverIdentifier = 'Planning-Leader', domain = 'planning') {
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

    // Grant domain-level approval (atomic operation)
    const approvalResult = phaseStateMachine.grantApproval(projectDir, agentRole, approverIdentifier, domain);

    if (!approvalResult.valid) {
      throw new Error(`Approval failed: ${approvalResult.reason}`);
    }

    // Check if fully approved (all required domains)
    if (!phaseStateMachine.isFullyApproved) {
      throw new Error('Phase state machine isFullyApproved method not available - cannot verify approval');
    }
    const fullyApproved = phaseStateMachine.isFullyApproved(
      phaseStateMachine.getPhaseState(projectDir, agentRole).approval
    );

    const domainLabel = DOMAIN_LABELS[domain] || domain;

    if (fullyApproved) {
      console.log(`✅ 领导层全部批准 ${agentRole} 的方案，可以开始执行`);
    } else {
      console.log(`✅ ${domainLabel} 批准 ${agentRole} 的方案，等待其他域审批`);
    }

    // Update whiteboard
    const { updateAgentStatus, logDecision } = require('./whiteboard');
    if (fullyApproved) {
      updateAgentStatus(projectDir, agentRole, {
        status: 'RUNNING',
        stage: '执行',
        progress: 40,
        message: '领导层已全部批准，开始执行'
      });
    } else {
      updateAgentStatus(projectDir, agentRole, {
        status: 'PENDING_VERIFICATION',
        stage: '等待审批',
        progress: 35,
        message: `${domainLabel}已批准，等待其他域`
      });
    }

    // Log decision
    logDecision(projectDir, `${domainLabel} 批准 ${agentRole} 的执行方案`, approverIdentifier);

    // Record council decision if available
    if (councilDecisions && councilDecisions.recordDecision) {
      councilDecisions.recordDecision(projectDir, {
        type: 'agent_plan_approval',
        primaryDomain: domain,
        decision: `Approved ${agentRole} execution plan`,
        participants: [{ domain, vote: 'approve' }],
        outcome: fullyApproved ? 'approved' : 'approved',
      }).catch(err => console.warn('Failed to record decision:', err.message));
    }

    return { success: true, fullyApproved, message: fullyApproved
      ? `${agentRole} 已获全部批准，可以开始执行`
      : `${agentRole} 已获 ${domainLabel} 批准，等待其他域审批` };

  } catch (error) {
    console.error(`❌ 批准失败: ${error.message}`);
    throw error;
  }
}

/**
 * Leadership Council 拒绝Agent方案
 * 要求Agent修改方案
 *
 * Integrated with phase state machine and council decision recording
 */
async function rejectAgentPlan(projectDir, agentRole, reason, rejecterIdentifier = 'Planning-Leader', domain = 'planning') {
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
    await phaseStateMachine.revokeApproval(projectDir, agentRole);

    // Transition back to plan_design phase
    const transitionResult = await phaseStateMachine.transitionPhase(
      projectDir,
      agentRole,
      phaseStateMachine.WorkflowPhase.PLAN_DESIGN,
      rejecterIdentifier
    );

    if (!transitionResult.valid) {
      throw new Error(`Transition failed: ${transitionResult.reason}`);
    }

    const domainLabel = DOMAIN_LABELS[domain] || domain;

    console.log(`⚠️ ${domainLabel} 拒绝 ${agentRole} 的方案，要求修改`);

    // Update whiteboard
    const { updateAgentStatus } = require('./whiteboard');
    updateAgentStatus(projectDir, agentRole, {
      status: 'RUNNING',
      stage: '方案规划',
      progress: 30,
      message: `${domainLabel}要求修改方案: ${reason}`
    });

    // Log decision
    const { logDecision } = require('./whiteboard');
    logDecision(projectDir, `${domainLabel} 拒绝 ${agentRole} 的方案: ${reason}`, rejecterIdentifier);

    // Record council decision
    if (councilDecisions && councilDecisions.recordDecision) {
      councilDecisions.recordDecision(projectDir, {
        type: 'agent_plan_rejection',
        primaryDomain: domain,
        decision: `Rejected ${agentRole} plan: ${reason}`,
        participants: [{ domain, vote: 'object', reason }],
        outcome: 'rejected',
      }).catch(err => console.warn('Failed to record decision:', err.message));
    }

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
 * Approve QA validation plan (Quality Authority Leader primary, Planning Authority co-sign)
 *
 * @param {string} projectDir - Project directory (can be relative or absolute)
 * @param {string} qaAgentRole - QA agent role
 * @param {string} approverIdentifier - Approver identifier
 * @param {string} domain - Power domain of the approver (default: 'quality')
 * @returns {Promise<object>} Result object with success status
 */
async function approveValidationPlan(projectDir, qaAgentRole, approverIdentifier = 'Quality-Leader', domain = 'quality') {
  if (!qaValidationPlan) {
    throw new Error('QA validation plan module not available');
  }

  try {
    // Update approval status
    const plan = await qaValidationPlan.updateValidationPlanApproval(
      path.basename(projectDir),
      qaAgentRole,
      'approved',
      approverIdentifier,
      null,
      path.dirname(projectDir)
    );

    const domainLabel = DOMAIN_LABELS[domain] || domain;

    console.log(`✅ ${domainLabel} 批准 ${qaAgentRole} 的验证计划，可以开始验证`);

    // Update whiteboard
    const { updateAgentStatus, logDecision } = require('./whiteboard');
    updateAgentStatus(projectDir, qaAgentRole, {
      status: 'QA_VALIDATING',
      stage: 'QA验证中',
      message: `${domainLabel}已批准验证计划，开始验证`
    });

    // Log decision
    logDecision(projectDir, `${domainLabel} 批准 ${qaAgentRole} 的验证计划`, approverIdentifier);

    return { success: true, message: `${qaAgentRole} 验证计划已获批准`, plan };

  } catch (error) {
    console.error(`❌ 批准验证计划失败: ${error.message}`);
    throw error;
  }
}

/**
 * Reject QA validation plan (Quality Authority Leader)
 *
 * @param {string} projectDir - Project directory (can be relative or absolute)
 * @param {string} qaAgentRole - QA agent role
 * @param {string} reason - Rejection reason
 * @param {string} rejecterIdentifier - Rejecter identifier
 * @param {string} domain - Power domain of the rejecter (default: 'quality')
 * @returns {Promise<object>} Result object with success status
 */
async function rejectValidationPlan(projectDir, qaAgentRole, reason, rejecterIdentifier = 'Quality-Leader', domain = 'quality') {
  if (!qaValidationPlan) {
    throw new Error('QA validation plan module not available');
  }

  try {
    // Update approval status
    const plan = await qaValidationPlan.updateValidationPlanApproval(
      path.basename(projectDir),
      qaAgentRole,
      'rejected',
      rejecterIdentifier,
      reason,
      path.dirname(projectDir)
    );

    const domainLabel = DOMAIN_LABELS[domain] || domain;

    console.log(`⚠️ ${domainLabel} 拒绝 ${qaAgentRole} 的验证计划，要求修改`);

    // Update whiteboard
    const { updateAgentStatus, logDecision } = require('./whiteboard');
    updateAgentStatus(projectDir, qaAgentRole, {
      status: 'QA_PLANNING',
      stage: 'QA计划修订',
      message: `${domainLabel}要求修改验证计划: ${reason}`
    });

    // Log decision
    logDecision(projectDir, `${domainLabel} 拒绝 ${qaAgentRole} 的验证计划: ${reason}`, rejecterIdentifier);

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

/**
 * Conduct requirement clarification with user
 * Wrapper function that integrates with AskUserQuestion tool
 *
 * @param {string} userRequest - Original user request
 * @param {Function} askUserQuestionTool - AskUserQuestion tool function
 * @returns {Promise<object>} Clarification result
 */
async function conductRequirementClarification(userRequest, askUserQuestionTool) {
  if (!requirementClarification || !requirementClarification.clarifyRequirements) {
    console.warn('⚠️  Requirement clarification module not available');
    return {
      enrichedRequest: userRequest,
      rounds: 0,
      finalConfidence: 0,
      insights: { scope: [], technical: [], deliverables: [], constraints: [], context: [] }
    };
  }

  try {
    console.log('💬 开始需求澄清流程...');

    const result = await requirementClarification.clarifyRequirements(userRequest, {
      minRounds: CLARIFICATION_CONFIG.MIN_ROUNDS,
      maxRounds: CLARIFICATION_CONFIG.SOFT_MAX_ROUNDS,
      askUserQuestion: async (questions) => {
        // Format questions for AskUserQuestion tool
        const toolQuestions = questions.map((q, index) => ({
          question: q.text,
          header: getDimensionLabel(q.dimension),
          options: [
            {
              label: 'Answer',
              description: 'Provide your answer to this question'
            }
          ],
          multiSelect: false
        }));

        // Call AskUserQuestion tool
        const response = await askUserQuestionTool({ questions: toolQuestions });

        // Parse answers from tool response
        const answers = questions.map((q, index) => ({
          questionId: q.id,
          text: response[`question_${index}`] || response[index] || '',
          timestamp: new Date().toISOString()
        }));

        return answers;
      }
    });

    console.log(`✅ 需求澄清完成: ${result.rounds} 轮, 置信度 ${result.finalConfidence}/100`);
    return result;

  } catch (error) {
    console.error('❌ 需求澄清失败:', error.message);
    return {
      enrichedRequest: userRequest,
      rounds: 0,
      finalConfidence: 0,
      insights: { scope: [], technical: [], deliverables: [], constraints: [], context: [] }
    };
  }
}

/**
 * Get human-readable label for confidence dimension
 * Uses DIMENSION_LABELS constant from src/constants.ts
 */
function getDimensionLabel(dimension) {
  return DIMENSION_LABELS[dimension] || dimension;
}

// ============================================================================
// LEADERSHIP COUNCIL FUNCTIONS
// ============================================================================

/**
 * Initialize leadership council for a project
 * Generates the 3-leader configuration based on task type
 *
 * @param {string} taskType - Task type (code, document, research, etc.)
 * @param {string} taskDescription - Task description
 * @returns {object} Leadership configuration
 */
function initializeLeadership(taskType, taskDescription) {
  if (!leadership) {
    console.warn('⚠️ Leadership module not available, using fallback');
    return {
      leaders: [
        { domain: 'planning', roleName: 'Planning Director', expertise: 'Strategic planning' },
        { domain: 'execution', roleName: 'Operations Director', expertise: 'Operational coordination' },
        { domain: 'quality', roleName: 'Quality Director', expertise: 'Quality standards' },
      ],
      crossCheckRules: [],
      disputeResolutionRules: [],
    };
  }

  return leadership.generateLeadership(taskType);
}

/**
 * Route a message from an agent to the appropriate leader domain
 *
 * @param {string} messageType - Type of message (plan_submission, progress_update, etc.)
 * @param {string} agentRole - Agent role sending the message
 * @returns {object} Routing info { domain, leaderRole }
 */
function routeMessageToLeader(messageType, agentRole) {
  if (!leadership) {
    return { domain: 'planning', leaderRole: 'Planning Director' };
  }

  const domain = leadership.routeAgentMessage(messageType);
  return { domain, leaderRole: `${domain} leader` };
}

/**
 * Handle a dispute between leaders
 * Routes to the appropriate domain leader as primary resolver
 *
 * @param {string} projectDir - Project directory
 * @param {string} domain1 - First domain in dispute
 * @param {string} domain2 - Second domain in dispute
 * @param {string} issue - Issue description
 * @returns {Promise<object>} Dispute handling result
 */
async function handleLeaderDispute(projectDir, domain1, domain2, issue) {
  // Determine primary resolver based on issue type
  const scopeRelated = issue.toLowerCase().includes('scope') || issue.toLowerCase().includes('范围');
  const resourceRelated = issue.toLowerCase().includes('resource') || issue.toLowerCase().includes('资源');
  const qualityRelated = issue.toLowerCase().includes('quality') || issue.toLowerCase().includes('质量');

  let primaryResolver = 'execution'; // default
  if (scopeRelated) primaryResolver = 'planning';
  if (qualityRelated) primaryResolver = 'quality';
  if (resourceRelated) primaryResolver = 'execution';

  const result = {
    primaryResolver,
    issue,
    domains: [domain1, domain2],
    status: 'needs_resolution',
    message: `Dispute between ${domain1} and ${domain2} on: ${issue}. Primary resolver: ${primaryResolver}`,
  };

  // Log decision
  const { logDecision } = require('./whiteboard');
  logDecision(projectDir, `Leader dispute: ${issue} (resolver: ${primaryResolver})`, primaryResolver);

  return result;
}

/**
 * Conduct a cross-check for a decision
 * Creates a cross-check record and initiates the signoff process
 *
 * @param {string} projectDir - Project directory
 * @param {string} decisionType - Decision type
 * @param {string} primaryDomain - Primary domain making the decision
 * @param {any} decision - Decision content
 * @param {string} reason - Decision reason
 * @returns {Promise<object>} Cross-check record
 */
async function conductCrossCheck(projectDir, decisionType, primaryDomain, decision, reason) {
  if (!crossCheck) {
    console.warn('⚠️ Cross-check module not available');
    return { id: 'fallback', status: 'approved' };
  }

  // Get required signoffs from leadership config
  let requiredSignoffs = [];
  if (leadership) {
    const config = leadership.generateLeadership('default');
    const rule = config.crossCheckRules.find(r => r.decisionType === decisionType);
    if (rule) {
      requiredSignoffs = rule.requiredSignoffs;
    }
  }

  const check = await crossCheck.createCrossCheck(
    projectDir,
    decisionType,
    primaryDomain,
    requiredSignoffs,
    decision,
    reason
  );

  return check;
}

/**
 * Process an objection to a cross-check
 *
 * @param {string} projectDir - Project directory
 * @param {string} crossCheckId - Cross-check ID
 * @param {string} fromDomain - Domain raising objection
 * @param {string} reason - Objection reason
 * @returns {Promise<object>} Updated cross-check
 */
async function processObjection(projectDir, crossCheckId, fromDomain, reason) {
  if (!crossCheck) {
    throw new Error('Cross-check module not available');
  }

  return crossCheck.raiseObjection(projectDir, crossCheckId, fromDomain, reason);
}

/**
 * Get leadership council status for a project
 *
 * @param {string} projectDir - Project directory
 * @returns {object} Leadership status
 */
function getLeadershipStatus(projectDir) {
  const result = {
    leaders: [],
    pendingCrossChecks: 0,
    totalDecisions: 0,
  };

  // Read leadership state from state.json if available
  const stateFile = path.join(projectDir, 'state.json');
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      if (state.leadership) {
        result.leaders = (state.leadership.leaders || []).map(l => ({
          domain: l.domain,
          roleName: l.roleName,
          status: 'active',
        }));
        result.pendingCrossChecks = (state.leadership.crossChecks || [])
          .filter(c => c.status === 'pending' || c.status === 'objected').length;
        result.totalDecisions = (state.leadership.decisions || []).length;
      }
    } catch (error) {
      console.warn('Failed to read leadership state:', error.message);
    }
  }

  return result;
}

// 导出功能
module.exports = {
  initializeProject,
  generateAgentTask,
  updateAgentStatus,
  logProjectEvent,
  generateTeamSuggestion,

  // 需求澄清相关
  conductRequirementClarification,

  // 超时监控相关
  startPeriodicMonitoring,
  registerAgentForMonitoring,
  updateAgentStage,
  unregisterAgentFromMonitoring,

  // 批准管理相关 (supports domain-based approval)
  approveAgentPlan,
  rejectAgentPlan,
  getAgentApprovalStatus,
  getAgentsAwaitingApproval,

  // QA验证计划批准相关 (Quality Authority domain)
  approveValidationPlan,
  rejectValidationPlan,
  getValidationPlansAwaitingApproval,

  // QA队列管理相关
  submitToQA,
  processNextQASubmission,
  completeQAValidation,
  getQAQueueStatus,
  isAgentInQAQueue,

  // 并发控制相关
  acquireExecutionSlot,
  releaseExecutionSlot,
  getConcurrencyStatus,
  getAvailableSlots,

  // 资源生命周期管理
  cleanupAgent,
  cleanupAgentOnCompletion,
  cleanupAgentOnFailure,
  cleanupAgentOnTimeout,
  cleanupAgentOnAbort,

  // Leadership Council (三权分立)
  initializeLeadership,
  routeMessageToLeader,
  handleLeaderDispute,
  conductCrossCheck,
  processObjection,
  getLeadershipStatus,
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
      console.log('Usage: node council-workflow.js [init "<request>" | task]');
      break;
  }
}

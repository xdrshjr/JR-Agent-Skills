/**
 * Whiteboard - 项目白板系统
 * 所有子智能体和PM共享的状态板
 */

const fs = require('fs');
const path = require('path');

// Import unified state manager
let stateManager;
try {
  stateManager = require('./src/state-manager');
} catch (error) {
  try {
    stateManager = require('./dist/state-manager');
  } catch (e) {
    console.error('❌ State manager not available. Whiteboard operations will fail.');
    console.error('   Please compile TypeScript modules: npx tsc');
  }
}

// Import phase state machine for validation
let phaseStateMachine;
try {
  phaseStateMachine = require('./src/phase-state-machine');
} catch (error) {
  // TypeScript module, try compiled version
  try {
    phaseStateMachine = require('./dist/phase-state-machine');
  } catch (e) {
    console.warn('Phase state machine not available, phase validation disabled');
    phaseStateMachine = null;
  }
}

const WHITEBOARD_FILENAME = 'WHITEBOARD.md';

/**
 * 初始化白板
 */
function initializeWhiteboard(projectDir, projectId, projectBrief = null) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);

  let structureSection = '';
  if (projectBrief && projectBrief.roles) {
    structureSection = `
## 🎯 项目结构

**最终交付物:** ${projectBrief.finalDeliverable || '多部分协作成果'}

**分配的部分:**
${projectBrief.roles.map(r =>
  `- **${r.assignedSection || r.deliverable}** → ${r.name}`
).join('\n')}

---
`;
  }

  const initialContent = `# 项目白板 — ${projectId}

> 实时共享状态板，所有团队成员可见
> 最后更新: ${new Date().toISOString()}

---

## 📊 项目总览

- **状态**: 🟡 进行中
- **进度**: 0%
- **当前阶段**: 初始化

---
${structureSection}
## 👥 团队成员状态

| 角色 | 分配部分 | 状态 | 当前阶段 | 进度 | 最后更新 |
|------|----------|------|----------|------|----------|
${projectBrief && projectBrief.roles ? projectBrief.roles.map(r =>
  `| ${r.name} | ${r.assignedSection || r.deliverable} | 🟡 启动中 | 技能发现 | 0% | - |`
).join('\n') : '| | | | | | |'}

---

## 📝 待办事项

- [ ]

---

## ✅ 已完成

- [x] 项目初始化

---

## 🚨 阻塞/问题

| 问题 | 负责角色 | 状态 |
|------|----------|------|
| | | |

---

## 💬 重要决策记录

| 时间 | 决策 | 决策人 |
|------|------|--------|
| | | |

---

*自动更新: 各角色完成阶段汇报时自动更新此板*
`;

  fs.writeFileSync(whiteboardPath, initialContent);
  return whiteboardPath;
}

/**
 * 更新白板 - 角色状态
 *
 * NEW: Integrated with phase state machine for validation and state manager
 */
async function updateAgentStatus(projectDir, agentRole, status) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // NEW: Phase transition validation
  if (phaseStateMachine && status.stage) {
    try {
      // Get current phase state
      const currentState = phaseStateMachine.getPhaseState(projectDir, agentRole);

      if (currentState) {
        // Map stage name to phase
        const newPhase = phaseStateMachine.mapStageToPhase(status.stage);

        if (newPhase && newPhase !== currentState.currentPhase) {
          // Validate transition
          const validation = phaseStateMachine.validatePhaseTransition(
            currentState.currentPhase,
            newPhase,
            currentState.approval
          );

          if (!validation.valid) {
            // BLOCK invalid transition
            console.error(`❌ Invalid phase transition blocked for ${agentRole}: ${validation.reason}`);
            throw new Error(`Phase transition blocked: ${validation.reason}`);
          }

          // Perform atomic transition
          const transitionResult = phaseStateMachine.transitionPhase(
            projectDir,
            agentRole,
            newPhase,
            'whiteboard_update'
          );

          if (!transitionResult.valid) {
            console.error(`❌ Phase transition failed for ${agentRole}: ${transitionResult.reason}`);
            throw new Error(`Phase transition failed: ${transitionResult.reason}`);
          }

          console.log(`✅ Phase transition validated: ${agentRole} → ${newPhase}`);
        }
      } else {
        // Initialize phase state if not exists
        console.log(`Initializing phase state for ${agentRole}`);
        const initialPhase = phaseStateMachine.mapStageToPhase(status.stage) ||
                            phaseStateMachine.WorkflowPhase.SKILL_DISCOVERY;
        phaseStateMachine.initializePhaseState(projectDir, agentRole, initialPhase);
      }
    } catch (error) {
      // Re-throw validation errors to prevent invalid state updates
      if (error.message.includes('Phase transition blocked') ||
          error.message.includes('Phase transition failed')) {
        throw error;
      }
      // Log other errors but continue
      console.error(`Phase validation error: ${error.message}`);
    }
  }

  // Use state manager to update whiteboard state
  if (!stateManager || !stateManager.updateWhiteboard) {
    throw new Error(
      'State manager not available. Cannot update whiteboard safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    await stateManager.updateWhiteboard(projectId, {
      teamMembers: [{
        role: agentRole,
        agentId: agentRole,
        status: status.status
      }],
      currentPhase: status.stage || 'unknown',
      lastUpdate: new Date().toISOString()
    }, projectsDir);
  } catch (error) {
    console.error('❌ Failed to update whiteboard via state manager:', error.message);
    throw new Error(
      `Whiteboard update failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

/**
 * 添加待办事项
 */
function addTodo(projectDir, todo, assignee = '') {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  const todoLine = `- [ ] ${todo}${assignee ? ` (@${assignee})` : ''}`;
  
  // 在待办事项列表中添加
  content = content.replace(
    /(## 📝 待办事项\n)/,
    `$1${todoLine}\n`
  );
  
  fs.writeFileSync(whiteboardPath, content);
}

/**
 * 标记完成
 */
function markComplete(projectDir, item) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  
  // 在待办中查找并标记
  const todoPattern = new RegExp(`- \\[ \\] ${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (todoPattern.test(content)) {
    content = content.replace(todoPattern, `- [x] ${item}`);
    
    // 同时添加到已完成列表
    content = content.replace(
      /(## ✅ 已完成\n)/,
      `$1- [x] ${item} — ${new Date().toLocaleDateString()}\n`
    );
  }
  
  fs.writeFileSync(whiteboardPath, content);
}

/**
 * 记录问题
 */
function logIssue(projectDir, issue, agentRole) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  const issueLine = `| ${issue} | ${agentRole} | 🔴 待解决 |`;
  
  // 在问题表格中添加
  content = content.replace(
    /(## 🚨 阻塞\/问题\n\| 问题 \| 负责角色 \| 状态 \|\n\|[-|]+\n)/,
    `$1${issueLine}\n`
  );
  
  fs.writeFileSync(whiteboardPath, content);
}

/**
 * 记录决策
 */
async function logDecision(projectDir, decision, decider) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager to update whiteboard decisions
  if (!stateManager || !stateManager.updateWhiteboard) {
    throw new Error(
      'State manager not available. Cannot log decision safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    const state = await stateManager.readProject(projectId, projectsDir);
    const decisions = state.whiteboard?.decisions || [];
    decisions.push({
      topic: decision,
      decision: decision,
      timestamp: new Date().toISOString()
    });

    await stateManager.updateWhiteboard(projectId, {
      decisions
    }, projectsDir);
  } catch (error) {
    console.error('❌ Failed to log decision via state manager:', error.message);
    throw new Error(
      `Decision logging failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

/**
 * 更新项目进度
 */
function updateProgress(projectDir, progress, stage) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  
  // 更新进度和阶段
  content = content.replace(/进度: \d+%/, `进度: ${progress}%`);
  if (stage) {
    content = content.replace(/当前阶段: .*/, `当前阶段: ${stage}`);
  }
  
  // 更新状态图标
  let statusIcon = '🟡 进行中';
  if (progress === 0) statusIcon = '⚪ 未开始';
  if (progress === 100) statusIcon = '🟢 已完成';
  if (content.includes('🔴')) statusIcon = '🟡 进行中(有阻塞)';
  
  content = content.replace(/状态: .*/, `状态: ${statusIcon}`);
  
  fs.writeFileSync(whiteboardPath, content);
}

module.exports = {
  initializeWhiteboard,
  updateAgentStatus,
  addTodo,
  markComplete,
  logIssue,
  logDecision,
  updateProgress
};

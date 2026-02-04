/**
 * Timeout Monitor - 阶段超时监控 + Agent级别超时监控
 *
 * Features:
 * - Stage-level timeout tracking (understanding, research, planning, execution)
 * - Agent-level timeout tracking (30 minutes overall)
 * - State persistence to agent-status.json
 * - Crash recovery mechanism
 * - Restart counter persistence
 * - Phase state awareness (NEW)
 * - Unified state management integration (NEW)
 */

const fs = require('fs');
const path = require('path');
const { updateAgentStatus, logIssue } = require('./whiteboard');

// Import unified state manager
let stateManager;
try {
  stateManager = require('./src/state-manager');
} catch (error) {
  try {
    stateManager = require('./dist/state-manager');
  } catch (e) {
    console.error('❌ State manager not available. Timeout monitoring will fail.');
    console.error('   Please compile TypeScript modules: npx tsc');
  }
}

// Import phase state machine
let phaseStateMachine;
try {
  phaseStateMachine = require('./src/phase-state-machine');
} catch (error) {
  try {
    phaseStateMachine = require('./dist/phase-state-machine');
  } catch (e) {
    console.warn('Phase state machine not available, phase awareness disabled');
    phaseStateMachine = null;
  }
}

// 阶段超时配置（分钟）
const STAGE_TIMEOUTS = {
  understanding: 10,    // 需求理解
  research: 20,         // Skill调研
  planning: 30,         // 方案规划
  execution: 60,        // 执行（单个里程碑）
  waiting_approval: 30  // 等待审批
};

// Agent级别超时配置（秒，与 src/team.ts 保持一致）
const AGENT_TIMEOUT_SECONDS = 1800; // 30 minutes

// 存储每个agent的阶段开始时间
const agentStageTimers = new Map();

// 存储每个agent的整体运行时间
const agentOverallTimers = new Map();

// ============================================================================
// STATE PERSISTENCE - agent-status.json integration
// ============================================================================

/**
 * Load timeout state from agent-status.json
 */
async function loadTimeoutState(projectDir) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager if available
  if (!stateManager || !stateManager.readProject) {
    throw new Error(
      'State manager not available. Cannot load timeout state safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    const state = await stateManager.readProject(projectId, projectsDir);
    return { agents: state.agentStatus || {} };
  } catch (error) {
    console.error('❌ Failed to load timeout state via state manager:', error.message);
    throw new Error(
      `Timeout state loading failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

/**
 * Save timeout state to agent-status.json (atomic write)
 */
async function saveTimeoutState(projectDir, agentId, timeoutData) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager if available
  if (!stateManager || !stateManager.updateAgentStatus) {
    throw new Error(
      'State manager not available. Cannot save timeout state safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    await stateManager.updateAgentStatus(projectId, agentId, {
      agentId,
      role: timeoutData.role,
      state: timeoutData.status || 'RUNNING',
      phase: timeoutData.currentStage || 'unknown',
      progress: 0,
      lastUpdate: new Date().toISOString(),
      timeoutHistory: timeoutData.timeoutHistory || [],
      restartCount: timeoutData.restartCount || 0
    }, projectsDir);
  } catch (error) {
    console.error('❌ Failed to save timeout state via state manager:', error.message);
    throw new Error(
      `Timeout state saving failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

/**
 * Sync restart counter to agent-status.json
 */
async function syncRestartCounter(projectDir, agentId, restartCount) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  // Use state manager if available
  if (!stateManager || !stateManager.updateAgentStatus) {
    throw new Error(
      'State manager not available. Cannot sync restart counter safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    const state = await stateManager.readProject(projectId, projectsDir);
    const agentStatus = state.agentStatus?.[agentId];

    if (agentStatus) {
      await stateManager.updateAgentStatus(projectId, agentId, {
        ...agentStatus,
        restartCount
      }, projectsDir);
      console.log(`✅ Synced restart counter for ${agentId}: ${restartCount}`);
    } else {
      console.warn(`⚠️ Agent ${agentId} not found in state, cannot sync restart counter`);
    }
  } catch (error) {
    console.error('❌ Failed to sync restart counter via state manager:', error.message);
    throw new Error(
      `Restart counter sync failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

/**
 * Add timeout event to history
 */
async function addTimeoutEvent(projectDir, agentId, eventType, stage, action) {
  const projectId = path.basename(projectDir);
  const projectsDir = path.dirname(projectDir);

  if (!stateManager || !stateManager.updateAgentStatus) {
    throw new Error(
      'State manager not available. Cannot add timeout event safely. ' +
      'Please ensure state-manager module is properly installed and compiled.'
    );
  }

  try {
    const state = await stateManager.readProject(projectId, projectsDir);
    const agentStatus = state.agentStatus?.[agentId];

    if (agentStatus) {
      const timeoutHistory = agentStatus.timeoutHistory || [];
      timeoutHistory.push({
        timestamp: new Date().toISOString(),
        type: eventType,
        stage: stage,
        action: action
      });

      await stateManager.updateAgentStatus(projectId, agentId, {
        ...agentStatus,
        timeoutHistory
      }, projectsDir);
    }
  } catch (error) {
    console.error('❌ Failed to add timeout event via state manager:', error.message);
    throw new Error(
      `Timeout event logging failed: ${error.message}. ` +
      'This indicates a state management issue that must be resolved.'
    );
  }
}

// ============================================================================
// AGENT-LEVEL TIMEOUT TRACKING
// ============================================================================

/**
 * Start agent overall timer (30 minutes)
 *
 * NEW: Phase state awareness
 */
function startAgentTimer(projectDir, agentRole, agentId) {
  const key = `${projectDir}:${agentRole}`;
  const startTime = Date.now();

  agentOverallTimers.set(key, {
    agentId,
    agentRole,
    projectDir,
    startTime,
    lastCheck: startTime
  });

  // Persist to agent-status.json
  saveTimeoutState(projectDir, agentId, {
    role: agentRole,
    agentStartTime: new Date(startTime).toISOString(),
    currentStage: null,
    stageStartTime: null,
    restartCount: 0,
    timeoutHistory: []
  });

  // NEW: Check phase state
  if (phaseStateMachine) {
    const phaseState = phaseStateMachine.getPhaseState(projectDir, agentRole);
    if (phaseState) {
      console.log(`✅ Agent ${agentRole} started in phase: ${phaseState.currentPhase}`);
    }
  }

  console.log(`⏱️ Started agent timer for ${agentRole} (${AGENT_TIMEOUT_SECONDS}s timeout)`);
}
    startTime,
    timeout: AGENT_TIMEOUT_SECONDS * 1000,
    restartCount: 0,
    warned: false
  });

  console.log(`⏱️ [${agentRole}] 开始Agent级别计时，限时 ${AGENT_TIMEOUT_SECONDS / 60} 分钟`);

  // Persist to agent-status.json
  saveTimeoutState(projectDir, agentId, {
    role: agentRole,
    agentStartTime: new Date(startTime).toISOString(),
    currentStage: 'initialization',
    stageStartTime: new Date(startTime).toISOString(),
    restartCount: 0,
    timeoutHistory: []
  });
}

/**
 * Check agent-level timeouts (30 minutes overall)
 */
function checkAgentTimeouts(projectDir) {
  const now = Date.now();
  const timedOut = [];

  for (const [key, timer] of agentOverallTimers.entries()) {
    if (key.startsWith(projectDir)) {
      const elapsed = now - timer.startTime;
      const remaining = timer.timeout - elapsed;

      // NEW: Check if agent is waiting for approval
      if (phaseStateMachine) {
        const phaseState = phaseStateMachine.getPhaseState(projectDir, timer.agentRole);
        if (phaseState && phaseState.currentPhase === 'awaiting_approval') {
          const waitTime = now - phaseState.phaseStartTime;

          // Warn if waiting for approval > 10 minutes
          if (waitTime > 10 * 60 * 1000 && !timer.approvalWarned) {
            timer.approvalWarned = true;
            const waitMinutes = Math.ceil(waitTime / 60000);
            console.warn(`⚠️ [${timer.agentRole}] 等待PM批准已 ${waitMinutes} 分钟`);

            // Notify PM
            logIssue(projectDir, `${timer.agentRole} 等待批准已 ${waitMinutes} 分钟，请PM尽快审批`, timer.agentRole);
            addTimeoutEvent(projectDir, timer.agentId, 'approval_wait_warning', 'awaiting_approval', 'warned');
          }

          // Don't count approval wait time against agent timeout
          // Continue to next agent
          continue;
        }
      }

      // 80% warning
      if (!timer.warned && elapsed > timer.timeout * 0.8) {
        timer.warned = true;
        const remainingMinutes = Math.ceil(remaining / 60000);
        console.log(`⚠️ [${timer.agentRole}] Agent即将超时，还剩 ${remainingMinutes} 分钟`);

        // Log to agent-status.json
        addTimeoutEvent(projectDir, timer.agentId, 'agent_timeout_warning', 'overall', 'warned');
      }

      // Timeout exceeded
      if (elapsed > timer.timeout) {
        const elapsedMinutes = Math.ceil(elapsed / 60000);
        timedOut.push({
          agentRole: timer.agentRole,
          agentId: timer.agentId,
          elapsed: elapsedMinutes,
          restartCount: timer.restartCount
        });

        console.log(`🚨 [${timer.agentRole}] Agent级别超时 (${elapsedMinutes}分钟)`);

        // Log to whiteboard and agent-status.json
        logIssue(projectDir, `${timer.agentRole} Agent级别超时(${elapsedMinutes}分钟)`, timer.agentRole);
        addTimeoutEvent(projectDir, timer.agentId, 'agent_timeout', 'overall', 'timeout');

        // Remove from timers
        agentOverallTimers.delete(key);
      }
    }
  }

  return timedOut;
}

/**
 * End agent timer
 */
function endAgentTimer(projectDir, agentRole) {
  const key = `${projectDir}:${agentRole}`;
  const timer = agentOverallTimers.get(key);

  if (timer) {
    const elapsed = Math.ceil((Date.now() - timer.startTime) / 60000);
    console.log(`✅ [${agentRole}] Agent完成，总用时 ${elapsed} 分钟`);
    agentOverallTimers.delete(key);
    return elapsed;
  }

  return null;
}

/**
 * Update agent restart count
 */
function updateAgentRestartCount(projectDir, agentRole, restartCount) {
  const key = `${projectDir}:${agentRole}`;
  const timer = agentOverallTimers.get(key);

  if (timer) {
    timer.restartCount = restartCount;

    // Sync to agent-status.json
    syncRestartCounter(projectDir, timer.agentId, restartCount);
  }
}

// ============================================================================
// STAGE-LEVEL TIMEOUT TRACKING (existing functionality)
// ============================================================================

/**
 * 开始阶段计时
 */
async function startStageTimer(projectDir, agentRole, stage, agentId) {
  const key = `${projectDir}:${agentRole}`;
  const timeout = STAGE_TIMEOUTS[stage] || 30;
  const startTime = Date.now();

  agentStageTimers.set(key, {
    stage,
    startTime,
    timeout: timeout * 60 * 1000, // 转毫秒
    warned: false,
    agentId
  });

  console.log(`⏱️ [${agentRole}] 开始 ${stage} 阶段计时，限时 ${timeout} 分钟`);

  // Update agent-status.json with current stage via state manager
  if (agentId && stateManager && stateManager.updateAgentStatus) {
    try {
      const projectId = path.basename(projectDir);
      const projectsDir = path.dirname(projectDir);
      const state = await stateManager.readProject(projectId, projectsDir);
      const agentStatus = state.agentStatus?.[agentId];

      if (agentStatus) {
        await stateManager.updateAgentStatus(projectId, agentId, {
          ...agentStatus,
          currentStage: stage,
          stageStartTime: new Date(startTime).toISOString()
        }, projectsDir);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to update stage in agent-status.json: ${error.message}`);
    }
  }
}

/**
 * 检查超时
 */
function checkTimeouts(projectDir) {
  const now = Date.now();
  const overdue = [];

  for (const [key, timer] of agentStageTimers.entries()) {
    if (key.startsWith(projectDir)) {
      const elapsed = now - timer.startTime;
      const remaining = timer.timeout - elapsed;

      // 超时警告（80%时提醒）
      if (!timer.warned && elapsed > timer.timeout * 0.8) {
        timer.warned = true;
        const agentRole = key.split(':').slice(1).join(':');
        console.log(`⚠️ [${agentRole}] ${timer.stage} 阶段即将超时，还剩 ${Math.ceil(remaining/60000)} 分钟`);

        // Log to agent-status.json
        if (timer.agentId) {
          addTimeoutEvent(projectDir, timer.agentId, 'stage_timeout_warning', timer.stage, 'warned');
        }
      }

      // 已超时
      if (elapsed > timer.timeout) {
        const agentRole = key.split(':').slice(1).join(':');
        overdue.push({
          agentRole,
          stage: timer.stage,
          elapsed: Math.ceil(elapsed / 60000) // 分钟
        });

        // 记录到白板
        logIssue(projectDir, `${agentRole} 的 ${timer.stage} 阶段超时(${Math.ceil(elapsed/60000)}分钟)`, agentRole);

        // Log to agent-status.json
        if (timer.agentId) {
          addTimeoutEvent(projectDir, timer.agentId, 'stage_timeout', timer.stage, 'timeout');
        }

        // 从计时器中移除
        agentStageTimers.delete(key);
      }
    }
  }

  return overdue;
}

/**
 * 结束阶段计时
 */
function endStageTimer(projectDir, agentRole) {
  const key = `${projectDir}:${agentRole}`;
  const timer = agentStageTimers.get(key);
  
  if (timer) {
    const elapsed = Math.ceil((Date.now() - timer.startTime) / 60000);
    console.log(`✅ [${agentRole}] ${timer.stage} 阶段完成，用时 ${elapsed} 分钟`);
    agentStageTimers.delete(key);
    return elapsed;
  }
  
  return null;
}

/**
 * 生成超时提醒消息
 */
function generateTimeoutReminder(agentRole, stage, elapsedMinutes) {
  const timeout = STAGE_TIMEOUTS[stage] || 30;
  
  return `
⚠️ **超时提醒** — ${agentRole}

【${stage}】阶段已用时 ${elapsedMinutes} 分钟，超过限制 (${timeout} 分钟)。

请立即向 PM 汇报：
1. 当前进展
2. 超时原因
3. 预计还需多久
4. 是否需要帮助

如果无法继续，PM 可能会：
- 调整任务范围
- 提供资源支持
- 重新分配任务
`;
}

/**
 * 获取所有进行中的阶段
 */
function getActiveStages(projectDir) {
  const active = [];

  for (const [key, timer] of agentStageTimers.entries()) {
    if (key.startsWith(projectDir)) {
      const agentRole = key.split(':').slice(1).join(':');
      const elapsed = Math.ceil((Date.now() - timer.startTime) / 60000);
      const remaining = Math.ceil((timer.timeout - (Date.now() - timer.startTime)) / 60000);

      active.push({
        agentRole,
        stage: timer.stage,
        elapsed,
        remaining: Math.max(0, remaining)
      });
    }
  }

  return active;
}

// ============================================================================
// CRASH RECOVERY MECHANISM
// ============================================================================

/**
 * Initialize monitor with crash recovery
 * Restores timeout state from agent-status.json if monitor crashed
 */
function initializeMonitor(projectDir) {
  console.log(`🔄 Initializing timeout monitor for ${projectDir}...`);

  // Load persisted state
  const persistedState = loadTimeoutState(projectDir);

  if (!persistedState.agents || Object.keys(persistedState.agents).length === 0) {
    console.log(`✅ No previous state found, starting fresh`);
    return;
  }

  let restoredAgents = 0;
  let timedOutDuringCrash = 0;

  // Restore timers for active agents
  for (const [agentId, agentData] of Object.entries(persistedState.agents)) {
    // Only restore if agent was running
    if (agentData.status === 'RUNNING' || agentData.status === 'PENDING_VERIFICATION') {
      const timeoutState = agentData.timeoutState;

      if (!timeoutState || !timeoutState.agentStartTime) {
        continue;
      }

      const agentStartTime = new Date(timeoutState.agentStartTime).getTime();
      const elapsed = Date.now() - agentStartTime;

      // Check if already timed out during crash
      if (elapsed > AGENT_TIMEOUT_SECONDS * 1000) {
        console.log(`⚠️ Agent ${agentData.role} timed out during monitor crash (${Math.ceil(elapsed/60000)} minutes)`);
        timedOutDuringCrash++;

        // Mark for immediate timeout handling
        logIssue(projectDir, `${agentData.role} 在监控崩溃期间超时`, agentData.role);
        addTimeoutEvent(projectDir, agentId, 'agent_timeout', 'crash_recovery', 'detected_after_crash');

      } else {
        // Restore agent timer with adjusted start time
        restoreAgentTimer(projectDir, agentData.role, agentId, timeoutState);
        restoredAgents++;
      }
    }
  }

  console.log(`✅ Monitor initialized: ${restoredAgents} agents restored, ${timedOutDuringCrash} timed out during crash`);
}

/**
 * Restore agent timer from persisted state
 */
function restoreAgentTimer(projectDir, agentRole, agentId, timeoutState) {
  const key = `${projectDir}:${agentRole}`;
  const agentStartTime = new Date(timeoutState.agentStartTime).getTime();
  const elapsed = Date.now() - agentStartTime;
  const remaining = (AGENT_TIMEOUT_SECONDS * 1000) - elapsed;

  // Restore agent-level timer
  agentOverallTimers.set(key, {
    agentId,
    agentRole,
    startTime: agentStartTime,
    timeout: AGENT_TIMEOUT_SECONDS * 1000,
    restartCount: timeoutState.restartCount || 0,
    warned: elapsed > (AGENT_TIMEOUT_SECONDS * 1000 * 0.8) // Already warned if past 80%
  });

  console.log(`  ↳ Restored ${agentRole}: ${Math.ceil(elapsed/60000)}/${AGENT_TIMEOUT_SECONDS/60} minutes elapsed`);

  // Restore stage-level timer if applicable
  if (timeoutState.currentStage && timeoutState.stageStartTime) {
    const stageStartTime = new Date(timeoutState.stageStartTime).getTime();
    const stageElapsed = Date.now() - stageStartTime;
    const stageTimeout = STAGE_TIMEOUTS[timeoutState.currentStage] || 30;
    const stageTimeoutMs = stageTimeout * 60 * 1000;

    // Only restore if stage hasn't timed out yet
    if (stageElapsed < stageTimeoutMs) {
      agentStageTimers.set(key, {
        stage: timeoutState.currentStage,
        startTime: stageStartTime,
        timeout: stageTimeoutMs,
        warned: stageElapsed > (stageTimeoutMs * 0.8),
        agentId
      });

      console.log(`    ↳ Restored stage ${timeoutState.currentStage}: ${Math.ceil(stageElapsed/60000)}/${stageTimeout} minutes elapsed`);
    }
  }
}

/**
 * Get monitor statistics
 */
function getMonitorStats(projectDir) {
  let agentCount = 0;
  let stageCount = 0;

  for (const key of agentOverallTimers.keys()) {
    if (key.startsWith(projectDir)) {
      agentCount++;
    }
  }

  for (const key of agentStageTimers.keys()) {
    if (key.startsWith(projectDir)) {
      stageCount++;
    }
  }

  return {
    activeAgents: agentCount,
    activeStages: stageCount
  };
}

module.exports = {
  // Stage-level functions
  startStageTimer,
  endStageTimer,
  checkTimeouts,
  generateTimeoutReminder,
  getActiveStages,
  STAGE_TIMEOUTS,

  // Agent-level functions
  startAgentTimer,
  endAgentTimer,
  checkAgentTimeouts,
  updateAgentRestartCount,
  AGENT_TIMEOUT_SECONDS,

  // State persistence functions
  loadTimeoutState,
  saveTimeoutState,
  syncRestartCounter,
  addTimeoutEvent,

  // Crash recovery functions
  initializeMonitor,
  getMonitorStats
};

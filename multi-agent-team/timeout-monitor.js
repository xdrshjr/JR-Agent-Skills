/**
 * Timeout Monitor - 阶段超时监控
 */

const { updateAgentStatus, logIssue } = require('./whiteboard');

// 阶段超时配置（分钟）
const STAGE_TIMEOUTS = {
  understanding: 10,    // 需求理解
  research: 20,         // Skill调研
  planning: 30,         // 方案规划
  execution: 60,        // 执行（单个里程碑）
  waiting_approval: 30  // 等待审批
};

// 存储每个agent的阶段开始时间
const agentStageTimers = new Map();

/**
 * 开始阶段计时
 */
function startStageTimer(projectDir, agentRole, stage) {
  const key = `${projectDir}:${agentRole}`;
  const timeout = STAGE_TIMEOUTS[stage] || 30;
  
  agentStageTimers.set(key, {
    stage,
    startTime: Date.now(),
    timeout: timeout * 60 * 1000, // 转毫秒
    warned: false
  });
  
  console.log(`⏱️ [${agentRole}] 开始 ${stage} 阶段计时，限时 ${timeout} 分钟`);
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
        const agentRole = key.split(':')[1];
        console.log(`⚠️ [${agentRole}] ${timer.stage} 阶段即将超时，还剩 ${Math.ceil(remaining/60000)} 分钟`);
      }
      
      // 已超时
      if (elapsed > timer.timeout) {
        const agentRole = key.split(':')[1];
        overdue.push({
          agentRole,
          stage: timer.stage,
          elapsed: Math.ceil(elapsed / 60000) // 分钟
        });
        
        // 记录到白板
        logIssue(projectDir, `${agentRole} 的 ${timer.stage} 阶段超时(${Math.ceil(elapsed/60000)}分钟)`, agentRole);
        
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
      const agentRole = key.split(':')[1];
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

module.exports = {
  startStageTimer,
  endStageTimer,
  checkTimeouts,
  generateTimeoutReminder,
  getActiveStages,
  STAGE_TIMEOUTS
};

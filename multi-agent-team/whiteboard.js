/**
 * Whiteboard - 项目白板系统
 * 所有子智能体和PM共享的状态板
 */

const fs = require('fs');
const path = require('path');

const WHITEBOARD_FILENAME = 'WHITEBOARD.md';

/**
 * 初始化白板
 */
function initializeWhiteboard(projectDir, projectId) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  const initialContent = `# 项目白板 — ${projectId}

> 实时共享状态板，所有团队成员可见
> 最后更新: ${new Date().toISOString()}

---

## 📊 项目总览

- **状态**: 🟡 进行中
- **进度**: 0%
- **当前阶段**: 初始化

---

## 👥 团队成员状态

| 角色 | 状态 | 当前阶段 | 进度 | 最后更新 |
|------|------|----------|------|----------|
| | | | | |

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
 */
function updateAgentStatus(projectDir, agentRole, status) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  
  // 更新最后更新时间
  content = content.replace(
    /最后更新: .*/,
    `最后更新: ${new Date().toISOString()}`
  );
  
  // 更新团队成员状态表格
  const statusLine = `| ${agentRole} | ${status.status} | ${status.stage} | ${status.progress}% | ${new Date().toLocaleTimeString()} |`;
  
  // 查找角色行并替换，或添加新行
  const rolePattern = new RegExp(`\\| ${agentRole} \\|.*\\n`);
  if (rolePattern.test(content)) {
    content = content.replace(rolePattern, statusLine + '\n');
  } else {
    // 在表格中添加新行
    content = content.replace(
      /(\| 角色 \| 状态 \| 当前阶段 \| 进度 \| 最后更新 \|\n\|[-|]+\n)/,
      `$1${statusLine}\n`
    );
  }
  
  fs.writeFileSync(whiteboardPath, content);
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
function logDecision(projectDir, decision, decider) {
  const whiteboardPath = path.join(projectDir, WHITEBOARD_FILENAME);
  
  if (!fs.existsSync(whiteboardPath)) {
    return;
  }
  
  let content = fs.readFileSync(whiteboardPath, 'utf-8');
  const decisionLine = `| ${new Date().toLocaleString()} | ${decision} | ${decider} |`;
  
  // 在决策记录中添加
  content = content.replace(
    /(## 💬 重要决策记录\n\| 时间 \| 决策 \| 决策人 \|\n\|[-|]+\n)/,
    `$1${decisionLine}\n`
  );
  
  fs.writeFileSync(whiteboardPath, content);
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

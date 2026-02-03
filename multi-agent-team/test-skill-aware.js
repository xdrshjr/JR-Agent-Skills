/**
 * Test script for Skill-Aware Planning
 */

const { 
  initializeSkillAwarePlanning, 
  analyzeSkillRequirements,
  assignSkillsToAgents,
  generateEnhancedTaskPrompt 
} = require('./skill-aware-planning');

console.log('=== Skill-Aware Planning Test ===\n');

// 测试用例 1: 用户指定 skill
console.log('--- Test 1: 用户指定 skill ---');
const test1 = initializeSkillAwarePlanning('使用 remotion-synced-video 技能生成一个AI论文视频');
console.log(test1.planningDoc);

// 测试用例 2: 常规任务
console.log('\n--- Test 2: 常规任务 ---');
const test2 = initializeSkillAwarePlanning('生成一个关于天气的视频，包含语音讲解');
console.log(test2.planningDoc);

// 测试用例 3: 角色分配
console.log('\n--- Test 3: 角色分配 ---');
const test3 = initializeSkillAwarePlanning('研究最新的AI论文并生成一份报告');
const agentRoles = ['Research Analyst', 'Document Writer', 'QA Reviewer'];
const assignments = test3.assignSkillsToAgents(agentRoles);

console.log('\n技能分配:');
for (const [role, skills] of Object.entries(assignments)) {
  console.log(`  ${role}: ${skills.map(s => s.name).join(', ') || '无'}`);
}

// 测试用例 4: 生成增强版任务 prompt
console.log('\n--- Test 4: 增强版任务 Prompt ---');
const taskPrompt = test3.generateTaskPrompt('Research Analyst', '搜集最新一周的AI论文');
console.log(taskPrompt.substring(0, 800) + '...');

console.log('\n=== All tests completed ===');

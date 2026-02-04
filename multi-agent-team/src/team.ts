/**
 * Team Management Module
 * Handles spawning, messaging, and monitoring of agent team
 */

import { sessions_spawn, sessions_send, sessions_list } from '../utils/moltbot-api';

// Import phase state machine for validation
let phaseStateMachine: any;
try {
  phaseStateMachine = require('./phase-state-machine');
} catch (error) {
  console.warn('Phase state machine not available, phase validation disabled');
  phaseStateMachine = null;
}
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import state manager for dynamic project directory resolution
let stateManager: any;
try {
  stateManager = require('./state-manager');
} catch (error) {
  console.warn('State manager not available, using fallback project directory resolution');
  stateManager = null;
}

/**
 * Resolve projects directory dynamically
 * Priority: explicit > env var > config file > default
 */
function resolveProjectsDir(explicitDir?: string): string {
  if (stateManager && stateManager.resolveProjectsDir) {
    return stateManager.resolveProjectsDir(explicitDir);
  }

  // Fallback logic when state-manager unavailable
  if (explicitDir) return explicitDir;
  if (process.env.CLAWD_PROJECTS_DIR) return process.env.CLAWD_PROJECTS_DIR;

  // Try config file
  try {
    const configPath = path.join(os.homedir(), '.claude', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.projectsDirectory) return config.projectsDirectory;
    }
  } catch (error) {
    // Ignore config file errors
  }

  // Last resort: relative path (assumes running from skill directory)
  return path.join(__dirname, '..', '..', 'projects');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** 
 * Agent timeout configuration (seconds)
 * Extended to 30 minutes for complex tasks
 */
export const AGENT_TIMEOUT_SECONDS = 1800; // 30 minutes

/** 
 * Progress check interval (seconds)
 */
export const PROGRESS_CHECK_INTERVAL = 300; // 5 minutes

/** 
 * Maximum restart attempts for timeout recovery
 */
export const MAX_RESTART_ATTEMPTS = 2;

interface AgentSession {
  id: string;
  role: string;
  sessionKey: string;
  status: 'active' | 'blocked' | 'completed' | 'failed' | 'timeout' | 'restarting';
  deliverable?: string;
  reworkCount: number;
  restartCount: number;
  originalTask?: string;
  timeoutHistory: TimeoutEvent[];
}

interface TimeoutEvent {
  timestamp: Date;
  reason: string;
  guidance: string;
}

interface Message {
  from: string;
  to: string; // 'manager' or agent ID
  type: 'progress' | 'deliverable' | 'collaboration' | 'dispute' | 'escalation';
  content: string;
  timestamp: Date;
}

/**
 * Spawn 3 agents for the team
 */
export async function spawnTeamAgents(
  projectId: string,
  roles: Role[],
  projectBrief: ProjectBrief
): Promise<AgentSession[]> {
  const agents: AgentSession[] = [];
  
  for (const role of roles) {
    const systemPrompt = buildAgentSystemPrompt(role, roles, projectBrief);
    
    const spawnResult = await sessions_spawn({
      task: systemPrompt,
      label: `${projectId}-${role.name}`,
      runTimeoutSeconds: AGENT_TIMEOUT_SECONDS // 30 minutes per agent
    });
    
    agents.push({
      id: role.name.toLowerCase().replace(/\s+/g, '-'),
      role: role.name,
      sessionKey: spawnResult.childSessionKey,
      status: 'active',
      reworkCount: 0,
      restartCount: 0,
      originalTask: systemPrompt,
      timeoutHistory: []
    });
  }
  
  return agents;
}

/**
 * Build system prompt for an agent
 */
function buildAgentSystemPrompt(
  agentRole: Role,
  allRoles: Role[],
  projectBrief: ProjectBrief,
  enableSkillDiscovery: boolean = true
): string {
  const teammates = allRoles.filter(r => r.name !== agentRole.name);

  return `
You are ${agentRole.name} on a 3-person project team managed by a Project Manager (PM).

## Your Identity

**Role:** ${agentRole.name}
**Expertise:** ${agentRole.expertise}
**Current Project:** ${projectBrief.description}

## Your Task

${agentRole.responsibilities.join('\n')}

**Deliverable:** ${agentRole.deliverable}
**Timeline:** 30 minutes

## Project Structure & Your Contribution

**Overall Deliverable:** ${projectBrief.finalDeliverable || 'Multi-part collaborative deliverable'}

${projectBrief.outline ? `**Project Outline:**\n${projectBrief.outline}\n\n` : ''}**Your Assigned Section:**
${agentRole.assignedSection || agentRole.deliverable}

⚠️ **IMPORTANT:** You are responsible for ONLY your assigned section. Do not create a complete standalone deliverable. Your work will be integrated with your teammates' contributions.

**Integration Context:**
- Your section comes ${allRoles.findIndex(r => r.name === agentRole.name) === 0 ? 'at the beginning of the project' : allRoles.findIndex(r => r.name === agentRole.name) === allRoles.length - 1 ? 'at the end of the project' : 'in the middle of the project'}
- Dependencies: ${agentRole.dependencies && agentRole.dependencies.length > 0 ? agentRole.dependencies.join(', ') : 'None'}
- Your output will be combined with: ${teammates.map(t => t.name).join(', ')}

## Your Teammates (Full Context)

You are working as part of a coordinated team. Here's what each teammate is responsible for:

${teammates.map((teammate, idx) => `${idx + 1}. **${teammate.name}** (${teammate.expertise})
   - Assigned Section: ${teammate.assignedSection || teammate.deliverable}
   - Responsibilities: ${teammate.responsibilities.join(', ')}
   - Deliverable: ${teammate.deliverable}`).join('\n\n')}

**Coordination Strategy:**
- Check WHITEBOARD regularly to see teammate progress
- Ensure your section connects smoothly with adjacent sections
- Communicate with teammates if you need information from their sections

${enableSkillDiscovery ? `
## Skill Discovery (Phase 0 - Before Planning)

Before you start planning, you MUST discover what skills are available in your environment.

**How to discover skills:**
1. Use the Skill tool with \`skill: "find-skills"\` to discover available skills
2. Review the list of available skills and their capabilities
3. Select 2-3 skills that match your role and expertise
4. Report your selection to PM with justification
5. Wait for PM approval before proceeding

**Your Role:** ${agentRole.name}
**Your Expertise:** ${agentRole.expertise}

**Selection Criteria:**
- Choose skills that align with your responsibilities
- Prioritize skills you're most qualified to use
- Consider the project requirements: ${projectBrief.description}

**Report Format:**
"I've discovered [N] available skills. Based on my role as ${agentRole.name}, I recommend using:
1. [skill-name]: [why it matches my role]
2. [skill-name]: [why it matches my role]

Awaiting PM approval to proceed."

` : ''}
## Team Coordination Board (WHITEBOARD)

**Location:** projects/${projectBrief.name}/WHITEBOARD.md

**Purpose:** Real-time visibility into team progress

**What You'll See:**
- Current status of all team members
- Completed sections and in-progress work
- Blockers and decisions
- Project timeline and milestones

**How to Use:**
- Read WHITEBOARD before planning to understand team context
- Check WHITEBOARD during execution to avoid duplication
- Update your status when completing milestones
- Reference teammate progress when coordinating handoffs

**When to Check:**
- Before creating your plan (Phase 2)
- Before starting execution (Phase 3)
- When you need information from a teammate's section
- When reporting progress to PM

## Your Workflow

${enableSkillDiscovery ? `**Phase 0: Skill Discovery (5 minutes)**
- Discover available skills using find-skills
- Select skills matching your role
- Report to PM and wait for approval

` : ''}**Phase 1: Understand Requirements (10 minutes)**
- Analyze your assigned task
- Ask clarifying questions if needed
- Report understanding to PM

**Phase 2: Plan Approach (15 minutes)**
- Design your implementation plan${enableSkillDiscovery ? '\n- Include selected skills in your plan' : ''}
- Submit plan to PM for approval

**Phase 3: Execute (Remaining time)**
- Execute approved plan${enableSkillDiscovery ? ' with approved skills' : ''}
- Report progress at milestones
- Submit deliverable to QA

## Communication Rules

### With PM
- Report progress every 5 minutes
- Escalate blockers immediately
- Present deliverables when complete

### With Teammates
- Direct collaboration encouraged
- Message directly for coordination
- Dispute limit: 2 rounds max
- If unresolved after 2 rounds → Escalate to PM

## Escalation Triggers
- Cannot reach agreement after 2 discussion rounds
- Task dependencies blocking your work
- Requirements ambiguity you cannot resolve

## Deliverable Checklist
Before submitting to PM, verify:
- [ ] All requirements addressed
- [ ] Format matches specification
- [ ] Quality meets standards
- [ ] Ready for integration

Start by confirming you understand your assignment. Wait for kickoff signal from PM.
`;
}

/**
 * Send kickoff message to all agents
 *
 * NEW: Phase state awareness
 */
export async function conductKickoffMeeting(
  agents: AgentSession[],
  projectBrief: ProjectBrief
): Promise<void> {
  const kickoffMessage = buildKickoffMessage(agents, projectBrief);

  // Send to all agents simultaneously
  await Promise.all(
    agents.map(agent =>
      sessions_send({
        sessionKey: agent.sessionKey,
        message: kickoffMessage
      })
    )
  );
}

/**
 * Build kickoff message
 */
function buildKickoffMessage(
  agents: AgentSession[],
  projectBrief: ProjectBrief
): string {
  return `
🚀 **PROJECT KICKOFF** 🚀

**Project:** ${projectBrief.name}  
**Timebox:** 30 minutes

---

## Project Brief

${projectBrief.description}

## Success Criteria

${projectBrief.successCriteria}

---

## Team Assignments

${agents.map(agent => `
### 👤 ${agent.role}
**Your Mission:** ${getRoleForAgent(agent, projectBrief.roles).responsibilities.join(', ')}
**Deliverable:** ${getRoleForAgent(agent, projectBrief.roles).deliverable}
`).join('\n---\n')}

---

## Coordination Protocol

1. Work independently on your assigned tasks
2. Collaborate directly when dependencies arise
3. Report progress to PM every 5 minutes
4. Resolve disputes within 2 rounds, then escalate to PM
5. Deliver on time

## Communication

- **Team updates:** Send to PM
- **Direct collaboration:** Message teammate directly
- **Disputes:** 2 rounds max, then PM decides

---

**Let's build something great!** 🎯

Confirm receipt and understanding by replying "Ready to start".
`;
}

/**
 * Request progress update from all agents
 */
export async function collectProgressUpdates(
  agents: AgentSession[]
): Promise<ProgressUpdate[]> {
  // Request progress from all agents
  await Promise.all(
    agents.map(agent =>
      sessions_send({
        sessionKey: agent.sessionKey,
        message: 'PROGRESS CHECK: Please report your current status:\n- Progress percentage or description\n- Any blockers\n- ETA for completion'
      })
    )
  );
  
  // Wait and collect responses (simplified - in real impl would poll)
  // For now, return placeholder
  return agents.map(agent => ({
    agentId: agent.id,
    status: 'in-progress',
    progress: 'pending',
    blockers: null,
    eta: null
  }));
}

/**
 * Detect disputes between agents
 */
export function detectDisputes(messages: Message[]): Dispute[] {
  const disputes: Dispute[] = [];
  
  // Simple heuristic: look for disagreement keywords in agent-to-agent messages
  const disagreementKeywords = ['disagree', 'wrong', 'incorrect', 'should not', "don't think", 'but', 'however', 'alternative'];
  
  for (const msg of messages) {
    if (msg.to !== 'manager' && msg.type === 'collaboration') {
      const hasDisagreement = disagreementKeywords.some(kw => 
        msg.content.toLowerCase().includes(kw)
      );
      
      if (hasDisagreement) {
        disputes.push({
          agents: [msg.from, msg.to],
          topic: extractTopic(msg.content),
          round: 1
        });
      }
    }
  }
  
  return disputes;
}

/**
 * Handle dispute between two agents
 */
export async function resolveDispute(
  dispute: Dispute,
  agentA: AgentSession,
  agentB: AgentSession
): Promise<DisputeResolution> {
  if (dispute.round === 1) {
    // Round 1: Let them discuss
    await sessions_send({
      sessionKey: agentA.sessionKey,
      message: `Discuss with ${agentB.role}: ${dispute.topic}. Present your view clearly. If unresolved after this exchange, escalate to me.`
    });
    
    return { status: 'in-progress', round: 2 };
  } else if (dispute.round === 2) {
    // Round 2: Final discussion round
    await sessions_send({
      sessionKey: agentA.sessionKey,
      message: `Final discussion round on ${dispute.topic}. Provide your strongest reasoning. If still unresolved, I will make the decision.`
    });
    
    return { status: 'in-progress', round: 3 };
  } else {
    // Round 3: PM must decide
    return { status: 'needs-pm-decision', round: 3 };
  }
}

/**
 * Make PM decision on dispute
 */
export async function makeDisputeDecision(
  dispute: Dispute,
  agentA: AgentSession,
  agentB: AgentSession,
  decision: string,
  reasoning: string
): Promise<void> {
  const decisionMessage = `
**PM DECISION on: ${dispute.topic}**

**Decision:** ${decision}

**Reasoning:** ${reasoning}

This decision is final. Please proceed accordingly.
`;
  
  await sessions_send({
    sessionKey: agentA.sessionKey,
    message: decisionMessage
  });
  
  await sessions_send({
    sessionKey: agentB.sessionKey,
    message: decisionMessage
  });
}

/**
 * Request deliverable from agent
 */
export async function requestDeliverable(
  agent: AgentSession
): Promise<string | null> {
  await sessions_send({
    sessionKey: agent.sessionKey,
    message: 'Please submit your deliverable now. Include:\n1. Complete work product\n2. Brief description of what was delivered\n3. Any notes for integration'
  });
  
  // In real implementation: wait for and capture response
  return null;
}

/**
 * Send review feedback to agent
 *
 * NEW: Phase state awareness for approval messages
 */
export async function sendReviewFeedback(
  agent: AgentSession,
  accepted: boolean,
  feedback?: string
): Promise<void> {
  if (accepted) {
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: '✅ DELIVERABLE ACCEPTED. Great work! You are complete.'
    });
    agent.status = 'completed';
  } else {
    agent.reworkCount++;
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: `❌ REWORK REQUIRED (Attempt ${agent.reworkCount}/3)\n\nFeedback:\n${feedback}\n\nPlease address and resubmit.`
    });
  }
}

/**
 * Send message to agent with phase validation
 *
 * NEW: Helper function to send messages with phase state awareness
 */
export async function sendMessageToAgent(
  agent: AgentSession,
  message: string,
  projectDir?: string
): Promise<void> {
  // NEW: Check if agent is blocked waiting for approval
  if (phaseStateMachine && projectDir && agent.role) {
    try {
      const phaseState = phaseStateMachine.getPhaseState(projectDir, agent.role);

      if (phaseState && phaseState.currentPhase === 'awaiting_approval') {
        // Check if message contains approval
        const isApprovalMessage = message.includes('批准') ||
                                 message.includes('approve') ||
                                 message.includes('批准执行') ||
                                 message.includes('approved');

        if (isApprovalMessage) {
          console.log(`✅ Approval message detected for ${agent.role}`);
        } else {
          console.warn(`⚠️ ${agent.role} is waiting for approval, message may be blocked`);
        }
      }
    } catch (error) {
      // Log error but continue with message send
      console.error(`Phase validation error: ${error}`);
    }
  }

  await sessions_send({
    sessionKey: agent.sessionKey,
    message: message
  });
}

/**
 * Terminate all agents
 */
export async function terminateAllAgents(agents: AgentSession[]): Promise<void> {
  // In real implementation: gracefully terminate sessions
  for (const agent of agents) {
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: 'Project complete. Thank you for your work. Session ending.'
    });
  }
}

// ============================================================================
// TIMEOUT MANAGEMENT - Enhanced for robustness
// ============================================================================

/**
 * Timeout handler with PM intervention
 * When an agent times out, the PM:
 * 1. Detects the timeout
 * 2. Assists the agent to stop gracefully
 * 3. Analyzes what went wrong
 * 4. Provides guidance
 * 5. Restarts the agent with adjusted task if needed
 */

interface TimeoutAnalysis {
  agentId: string;
  role: string;
  probableCause: 'scope_too_large' | 'dependency_blocked' | 'technical_difficulty' | 'unclear_requirements' | 'unknown';
  recommendedAction: 'reduce_scope' | 'provide_guidance' | 'reassign_task' | 'terminate';
  guidance: string;
  adjustedTask?: string;
}

/**
 * Monitor agents for timeout and handle recovery
 * This is the main entry point for PM to manage agent timeouts
 */
export async function monitorAndHandleTimeouts(
  agents: AgentSession[],
  projectId: string
): Promise<TimeoutReport> {
  const report: TimeoutReport = {
    projectId,
    timestamp: new Date(),
    checkedAgents: [],
    timeoutsDetected: [],
    restartsInitiated: [],
    failures: []
  };

  for (const agent of agents) {
    report.checkedAgents.push(agent.id);
    
    // Check if agent has timed out
    if (await checkAgentTimeout(agent)) {
      console.log(`[PM] ⚠️ Agent ${agent.role} has timed out`);
      report.timeoutsDetected.push(agent.id);
      
      // Step 1: Assist agent to stop gracefully
      await assistAgentStop(agent);
      
      // Step 2: Analyze the timeout
      const analysis = await analyzeTimeout(agent, agents);
      
      // Step 3: Handle based on restart count
      if (agent.restartCount >= MAX_RESTART_ATTEMPTS) {
        // Too many restarts - mark as failed
        await handleAgentFailure(agent, analysis, 'max_restarts_exceeded');
        report.failures.push({ agentId: agent.id, reason: 'max_restarts_exceeded' });
      } else {
        // Attempt restart with guidance
        const restartSuccess = await restartAgentWithGuidance(agent, analysis, projectId);
        if (restartSuccess) {
          report.restartsInitiated.push(agent.id);
        } else {
          report.failures.push({ agentId: agent.id, reason: 'restart_failed' });
        }
      }
    }
  }

  return report;
}

/**
 * Check if an agent has timed out
 * Uses session status polling to detect timeout
 */
async function checkAgentTimeout(agent: AgentSession): Promise<boolean> {
  try {
    // Check if agent status indicates timeout
    // In real implementation, this would query session status
    // For now, we simulate based on agent status field
    return agent.status === 'timeout';
  } catch (error) {
    console.error(`[PM] Error checking timeout for ${agent.role}:`, error);
    return false;
  }
}

/**
 * Step 1: Assist the agent to stop gracefully
 * Send stop signal and wait for acknowledgment
 */
async function assistAgentStop(agent: AgentSession): Promise<void> {
  console.log(`[PM] 🛑 Assisting ${agent.role} to stop gracefully...`);
  
  agent.status = 'timeout';
  
  // Send stop signal with acknowledgment request
  await sessions_send({
    sessionKey: agent.sessionKey,
    message: `
⏰ **TIMEOUT DETECTED - STOPPING TASK**

Your task has exceeded the time limit (30 minutes). Please:

1. **STOP current work immediately**
2. **Save any partial progress** you have made
3. **Reply with a brief summary** of:
   - What you completed
   - Where you got stuck
   - What blocked you (if anything)

The Project Manager will review and provide guidance shortly.

**Do not continue working until you receive restart instructions.**
`
  });

  // Record timeout event
  agent.timeoutHistory.push({
    timestamp: new Date(),
    reason: 'time_limit_exceeded',
    guidance: 'awaiting_analysis'
  });
}

/**
 * Step 2: Analyze why the agent timed out
 * PM reviews agent's work and determines the cause
 */
async function analyzeTimeout(
  agent: AgentSession,
  allAgents: AgentSession[]
): Promise<TimeoutAnalysis> {
  console.log(`[PM] 🔍 Analyzing timeout for ${agent.role}...`);

  // Default analysis
  const analysis: TimeoutAnalysis = {
    agentId: agent.id,
    role: agent.role,
    probableCause: 'unknown',
    recommendedAction: 'provide_guidance',
    guidance: ''
  };

  // Analyze based on restart history and context
  if (agent.restartCount === 0) {
    // First timeout - likely scope too large or unclear requirements
    analysis.probableCause = 'scope_too_large';
    analysis.recommendedAction = 'reduce_scope';
    analysis.guidance = `
**First Timeout Analysis:**

It looks like the task scope may have been too large for the time allocated. 
This is common on the first attempt.

**Guidance for restart:**
1. Focus on the core deliverable - skip nice-to-have features
2. Prioritize functionality over perfection
3. If blocked on something, document it and move on
4. Aim for a working MVP, not a complete solution
`;
  } else if (agent.restartCount === 1) {
    // Second timeout - check dependencies or technical difficulty
    const blockedByOthers = allAgents.some(a => 
      a.id !== agent.id && a.status === 'timeout' || a.status === 'failed'
    );
    
    if (blockedByOthers) {
      analysis.probableCause = 'dependency_blocked';
      analysis.recommendedAction = 'provide_guidance';
      analysis.guidance = `
**Second Timeout Analysis:**

This timeout may be related to dependencies on other team members who also experienced issues.

**Guidance for restart:**
1. Work with what you have - make reasonable assumptions
2. Document dependencies clearly for integration later
3. Create placeholder/stub implementations where needed
4. Focus on what you CAN complete independently
`;
    } else {
      analysis.probableCause = 'technical_difficulty';
      analysis.recommendedAction = 'reduce_scope';
      analysis.guidance = `
**Second Timeout Analysis:**

There may be technical challenges that are taking longer than expected.

**Guidance for restart:**
1. Simplify your approach - use straightforward solutions
2. Avoid complex algorithms or edge cases
3. Focus on the 80% case that delivers value
4. Document any technical debt for future improvement
`;
    }
  }

  // Build adjusted task if reducing scope
  if (analysis.recommendedAction === 'reduce_scope' && agent.originalTask) {
    analysis.adjustedTask = buildReducedScopeTask(agent.originalTask, agent.restartCount);
  }

  return analysis;
}

/**
 * Build a reduced-scope version of the task
 */
function buildReducedScopeTask(originalTask: string, restartCount: number): string {
  let reductionGuidance = '';
  
  if (restartCount === 0) {
    reductionGuidance = `

⚠️ **SCOPE REDUCTION (First Restart)**

Due to time constraints, please adjust your approach:
- Deliver a working prototype instead of a complete solution
- Focus on core functionality only
- Skip advanced features, error handling, and optimizations
- Prioritize getting something working over getting it perfect
`;
  } else {
    reductionGuidance = `

⚠️ **SCOPE REDUCTION (Second Restart - FINAL ATTEMPT)**

This is your final attempt. Please MINIMIZE scope:
- Deliver the absolute minimum viable version
- Focus on ONE key feature only
- Use simple, proven approaches
- If you cannot complete even the minimum, document what you tried and why
`;
  }

  return originalTask + reductionGuidance;
}

/**
 * Step 3: Restart the agent with guidance
 */
async function restartAgentWithGuidance(
  agent: AgentSession,
  analysis: TimeoutAnalysis,
  projectId: string
): Promise<boolean> {
  console.log(`[PM] 🔄 Restarting ${agent.role} with guidance...`);

  agent.status = 'restarting';
  agent.restartCount++;

  // Persist restart count to agent-status.json
  await persistRestartCount(projectId, agent.id, agent.restartCount);

  try {
    // Determine task for restart
    const restartTask = analysis.adjustedTask || agent.originalTask;

    if (!restartTask) {
      throw new Error('No task available for restart');
    }

    // Spawn new agent session with guidance
    const spawnResult = await sessions_spawn({
      task: restartTask + `\n\n📋 **RESTART GUIDANCE (#${agent.restartCount}):**\n${analysis.guidance}`,
      label: `${projectId}-${agent.role}-restart-${agent.restartCount}`,
      runTimeoutSeconds: AGENT_TIMEOUT_SECONDS
    });

    // Update agent session
    agent.sessionKey = spawnResult.childSessionKey;
    agent.status = 'active';

    // Record timeout event with guidance
    const lastTimeout = agent.timeoutHistory[agent.timeoutHistory.length - 1];
    if (lastTimeout) {
      lastTimeout.guidance = analysis.guidance;
    }

    // Send kickoff to restarted agent
    await sessions_send({
      sessionKey: agent.sessionKey,
      message: `
🚀 **RESTART KICKOFF**

You are being restarted with adjusted scope and guidance.

**Previous attempts:** ${agent.restartCount - 1}
**This is attempt:** ${agent.restartCount} of ${MAX_RESTART_ATTEMPTS + 1}

${analysis.guidance}

**Your task remains:** Focus on your core deliverable with the adjusted scope above.

**Time limit:** 30 minutes

Reply "Restart confirmed" when you're ready to begin.
`
    });

    console.log(`[PM] ✅ ${agent.role} restarted successfully (attempt ${agent.restartCount})`);
    return true;

  } catch (error) {
    console.error(`[PM] ❌ Failed to restart ${agent.role}:`, error);
    agent.status = 'failed';
    return false;
  }
}

/**
 * Persist restart count to agent-status.json
 * Integrates with timeout-monitor.js state persistence
 */
async function persistRestartCount(
  projectId: string,
  agentId: string,
  restartCount: number
): Promise<void> {
  try {
    // Use timeout-monitor's syncRestartCounter function
    const timeoutMonitor = require('../timeout-monitor');

    // Determine project directory using dynamic resolution
    const projectsDir = resolveProjectsDir();
    const projectDir = path.join(projectsDir, projectId);

    if (!fs.existsSync(projectDir)) {
      console.warn(`⚠️ Project directory not found: ${projectDir}`);
      return;
    }

    // Sync restart counter via timeout-monitor
    timeoutMonitor.syncRestartCounter(projectDir, agentId, restartCount);

    console.log(`✅ Persisted restart count for ${agentId}: ${restartCount}`);
  } catch (error) {
    console.error(`❌ Failed to persist restart count: ${error}`);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Handle agent that has exceeded max restarts or failed to restart
 */
async function handleAgentFailure(
  agent: AgentSession,
  analysis: TimeoutAnalysis,
  reason: string
): Promise<void> {
  console.log(`[PM] ❌ ${agent.role} marked as failed: ${reason}`);
  
  agent.status = 'failed';

  // Notify the agent session
  await sessions_send({
    sessionKey: agent.sessionKey,
    message: `
⚠️ **TASK TERMINATED**

Your task has been terminated after ${MAX_RESTART_ATTEMPTS} restart attempts.

**Reason:** ${reason === 'max_restarts_exceeded' 
  ? 'Maximum restart attempts exceeded' 
  : 'Failed to restart agent session'}

**What this means:**
- Your partial work (if any) will be incorporated as-is
- The PM will work with other team members to complete the project
- You do not need to do any further work on this task

Thank you for your effort on this task.
`
  });
}

/**
 * Get timeout report for project status
 */
export async function getTimeoutSummary(agent: AgentSession): Promise<string> {
  if (agent.timeoutHistory.length === 0) {
    return 'No timeouts';
  }

  return agent.timeoutHistory.map((event, idx) => 
    `Timeout #${idx + 1}: ${event.reason} at ${event.timestamp.toISOString()}`
  ).join('\n');
}

// Type definitions for timeout management
interface TimeoutReport {
  projectId: string;
  timestamp: Date;
  checkedAgents: string[];
  timeoutsDetected: string[];
  restartsInitiated: string[];
  failures: Array<{ agentId: string; reason: string }>;
}

// Type definitions
interface Role {
  name: string;
  expertise: string;
  responsibilities: string[];
  deliverable: string;
  assignedSection?: string;      // NEW: Specific section this role owns
  sectionOrder?: number;          // NEW: Order in final deliverable
  dependencies?: string[];        // NEW: Roles this role depends on
}

interface ProjectBrief {
  name: string;
  description: string;
  successCriteria: string;
  roles: Role[];
  finalDeliverable?: string;      // NEW: Description of complete deliverable
  outline?: string;               // NEW: Project structure/outline
}

interface ProgressUpdate {
  agentId: string;
  status: string;
  progress: string;
  blockers: string | null;
  eta: string | null;
}

interface Dispute {
  agents: string[];
  topic: string;
  round: number;
}

interface DisputeResolution {
  status: 'in-progress' | 'needs-pm-decision' | 'resolved';
  round: number;
}

// Helper functions
function getRoleForAgent(agent: AgentSession, roles: Role[]): Role {
  return roles.find(r => r.name === agent.role) || roles[0];
}

function extractTopic(content: string): string {
  // Simple extraction - first sentence or 50 chars
  return content.split('.')[0].slice(0, 50) + '...';
}

export {
  AgentSession,
  Message,
  ProgressUpdate,
  Dispute,
  Role,
  ProjectBrief
};

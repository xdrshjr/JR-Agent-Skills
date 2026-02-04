/**
 * Phase State Machine - Generic workflow enforcement for multi-agent teams
 *
 * This module provides task-agnostic, role-agnostic, environment-independent
 * phase transition validation and approval management.
 *
 * Works for ANY:
 * - Agent role (Frontend, Backend, Designer, QA, Video Producer, etc.)
 * - Task type (code, design, research, video, documentation, etc.)
 * - Environment (Windows, Mac, Linux)
 */

import * as fs from 'fs';
import * as path from 'path';
import { withLock, getLockPath } from './state-lock';

/**
 * Generic workflow phases that apply to any agent/task
 */
export enum WorkflowPhase {
  SKILL_DISCOVERY = 'skill_discovery',           // 0: 技能发现
  REQUIREMENT_UNDERSTANDING = 'requirement',     // 1: 需求理解
  SKILL_RESEARCH = 'skill_research',            // 2: Skill调研
  PLAN_DESIGN = 'plan_design',                  // 3: 方案规划
  AWAITING_APPROVAL = 'awaiting_approval',      // 4: 等待PM批准 (CRITICAL CHECKPOINT)
  EXECUTION = 'execution',                      // 5: 执行
  COMPLETION = 'completion'                     // 6: 完成
}

/**
 * Approval state tracking (independent of role/task)
 */
export interface ApprovalState {
  required: boolean;
  granted: boolean;
  grantedBy: string | null;  // PM identifier
  grantedAt: number | null;  // timestamp
}

/**
 * Phase transition record
 */
export interface PhaseTransition {
  from: WorkflowPhase;
  to: WorkflowPhase;
  timestamp: number;
  triggeredBy?: string;  // Optional: who/what triggered the transition
}

/**
 * Agent phase state (generic, works for any agent)
 */
export interface AgentPhaseState {
  agentRole: string;          // Any role: Frontend, Backend, Designer, etc.
  currentPhase: WorkflowPhase;
  previousPhase: WorkflowPhase | null;
  phaseStartTime: number;
  approval: ApprovalState;
  transitionHistory: PhaseTransition[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Phase transition rules (generic, role-agnostic)
 * Each phase can only transition to specific next phases
 */
const PHASE_TRANSITIONS: Record<WorkflowPhase, WorkflowPhase[]> = {
  [WorkflowPhase.SKILL_DISCOVERY]: [WorkflowPhase.REQUIREMENT_UNDERSTANDING],
  [WorkflowPhase.REQUIREMENT_UNDERSTANDING]: [WorkflowPhase.SKILL_RESEARCH],
  [WorkflowPhase.SKILL_RESEARCH]: [WorkflowPhase.PLAN_DESIGN],
  [WorkflowPhase.PLAN_DESIGN]: [WorkflowPhase.AWAITING_APPROVAL],
  [WorkflowPhase.AWAITING_APPROVAL]: [WorkflowPhase.EXECUTION, WorkflowPhase.PLAN_DESIGN], // Can go back to planning if rejected
  [WorkflowPhase.EXECUTION]: [WorkflowPhase.COMPLETION],
  [WorkflowPhase.COMPLETION]: []
};

/**
 * Phases that require PM approval before proceeding
 */
const APPROVAL_REQUIRED_PHASES = new Set([WorkflowPhase.AWAITING_APPROVAL]);

/**
 * Map Chinese stage names to workflow phases
 * This enables pattern-based detection from agent status updates
 */
export function mapStageToPhase(stage: string): WorkflowPhase | null {
  const stageMap: Record<string, WorkflowPhase> = {
    '技能发现': WorkflowPhase.SKILL_DISCOVERY,
    '需求理解': WorkflowPhase.REQUIREMENT_UNDERSTANDING,
    'Skill调研': WorkflowPhase.SKILL_RESEARCH,
    '方案规划': WorkflowPhase.PLAN_DESIGN,
    '等待批准': WorkflowPhase.AWAITING_APPROVAL,
    '等待PM批准': WorkflowPhase.AWAITING_APPROVAL,
    '执行': WorkflowPhase.EXECUTION,
    '完成': WorkflowPhase.COMPLETION
  };

  return stageMap[stage] || null;
}

/**
 * Get the path to agent status file
 */
function getAgentStatusPath(projectDir: string): string {
  return path.join(projectDir, 'agent-status.json');
}

/**
 * Load agent status from file
 */
function loadAgentStatus(projectDir: string): any {
  const statusPath = getAgentStatusPath(projectDir);

  if (!fs.existsSync(statusPath)) {
    return { agents: {} };
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load agent status: ${error}`);
    return { agents: {} };
  }
}

/**
 * Save agent status to file
 */
function saveAgentStatus(projectDir: string, status: any): void {
  const statusPath = getAgentStatusPath(projectDir);

  try {
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save agent status: ${error}`);
    throw error;
  }
}

/**
 * Initialize phase state for an agent
 */
export async function initializePhaseState(
  projectDir: string,
  agentRole: string,
  initialPhase: WorkflowPhase = WorkflowPhase.SKILL_DISCOVERY
): Promise<AgentPhaseState> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const status = loadAgentStatus(projectDir);

    if (!status.agents[agentRole]) {
      status.agents[agentRole] = {};
    }

    const phaseState: AgentPhaseState = {
      agentRole,
      currentPhase: initialPhase,
      previousPhase: null,
      phaseStartTime: Date.now(),
      approval: {
        required: false,
        granted: false,
        grantedBy: null,
        grantedAt: null
      },
      transitionHistory: []
    };

    status.agents[agentRole].phaseState = phaseState;
    saveAgentStatus(projectDir, status);

    return phaseState;
  });
}

/**
 * Get current phase state for an agent
 */
export function getPhaseState(projectDir: string, agentRole: string): AgentPhaseState | null {
  const status = loadAgentStatus(projectDir);

  if (!status.agents[agentRole] || !status.agents[agentRole].phaseState) {
    return null;
  }

  return status.agents[agentRole].phaseState;
}

/**
 * Check if a phase requires PM approval
 */
export function requiresApproval(phase: WorkflowPhase): boolean {
  return APPROVAL_REQUIRED_PHASES.has(phase);
}

/**
 * Validate phase transition
 *
 * CRITICAL: This is the core enforcement logic
 */
export function validatePhaseTransition(
  from: WorkflowPhase,
  to: WorkflowPhase,
  approvalState: ApprovalState
): ValidationResult {
  // Rule 1: Check if transition is allowed by workflow rules
  const allowedTransitions = PHASE_TRANSITIONS[from] || [];

  if (!allowedTransitions.includes(to)) {
    return {
      valid: false,
      reason: `Invalid transition: ${from} → ${to}. Allowed transitions: ${allowedTransitions.join(', ')}`
    };
  }

  // Rule 2: CRITICAL - Block execution without approval
  if (to === WorkflowPhase.EXECUTION) {
    if (!approvalState.granted) {
      return {
        valid: false,
        reason: `Cannot proceed to EXECUTION without PM approval. Current approval state: granted=${approvalState.granted}, grantedBy=${approvalState.grantedBy}`
      };
    }
  }

  return { valid: true };
}

/**
 * Perform atomic phase transition
 *
 * This function ensures state consistency during transitions
 */
export async function transitionPhase(
  projectDir: string,
  agentRole: string,
  toPhase: WorkflowPhase,
  triggeredBy?: string
): Promise<ValidationResult> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const status = loadAgentStatus(projectDir);

    // Get current phase state
    const currentState = status.agents[agentRole]?.phaseState;

    if (!currentState) {
      return {
        valid: false,
        reason: `No phase state found for agent: ${agentRole}. Initialize first.`
      };
    }

    const fromPhase = currentState.currentPhase;

    // Validate transition
    const validation = validatePhaseTransition(fromPhase, toPhase, currentState.approval);

    if (!validation.valid) {
      return validation;
    }

    // Perform atomic update
    const transition: PhaseTransition = {
      from: fromPhase,
      to: toPhase,
      timestamp: Date.now(),
      triggeredBy
    };

    currentState.previousPhase = fromPhase;
    currentState.currentPhase = toPhase;
    currentState.phaseStartTime = Date.now();
    currentState.transitionHistory.push(transition);

    // Update approval requirement for new phase
    if (requiresApproval(toPhase)) {
      currentState.approval.required = true;
    }

    // Save atomically
    saveAgentStatus(projectDir, status);

    console.log(`✅ Phase transition: ${agentRole} ${fromPhase} → ${toPhase}`);

    return { valid: true };
  });
}

/**
 * Grant PM approval for an agent
 *
 * This allows the agent to proceed from AWAITING_APPROVAL to EXECUTION
 */
export async function grantApproval(
  projectDir: string,
  agentRole: string,
  pmIdentifier: string
): Promise<ValidationResult> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const status = loadAgentStatus(projectDir);

    const currentState = status.agents[agentRole]?.phaseState;

    if (!currentState) {
      return {
        valid: false,
        reason: `No phase state found for agent: ${agentRole}`
      };
    }

    // Validate agent is in awaiting_approval phase
    if (currentState.currentPhase !== WorkflowPhase.AWAITING_APPROVAL) {
      return {
        valid: false,
        reason: `Cannot approve: ${agentRole} is in ${currentState.currentPhase} phase, not awaiting_approval`
      };
    }

    // Grant approval atomically
    currentState.approval.granted = true;
    currentState.approval.grantedBy = pmIdentifier;
    currentState.approval.grantedAt = Date.now();

    saveAgentStatus(projectDir, status);

    console.log(`✅ PM批准 ${agentRole} 的方案，可以开始执行`);

    return { valid: true };
  });
}

/**
 * Revoke approval (e.g., when plan needs revision)
 */
export async function revokeApproval(
  projectDir: string,
  agentRole: string
): Promise<ValidationResult> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const status = loadAgentStatus(projectDir);

    const currentState = status.agents[agentRole]?.phaseState;

    if (!currentState) {
      return {
        valid: false,
        reason: `No phase state found for agent: ${agentRole}`
      };
    }

    // Revoke approval
    currentState.approval.granted = false;
    currentState.approval.grantedBy = null;
    currentState.approval.grantedAt = null;

    saveAgentStatus(projectDir, status);

    console.log(`⚠️ PM撤销 ${agentRole} 的批准`);

    return { valid: true };
  });
}

/**
 * Check if agent can proceed to execution
 *
 * This is a convenience function for checking approval status
 */
export function canProceedToExecution(projectDir: string, agentRole: string): boolean {
  const state = getPhaseState(projectDir, agentRole);

  if (!state) {
    return false;
  }

  // Must be in awaiting_approval phase with granted approval
  return state.currentPhase === WorkflowPhase.AWAITING_APPROVAL && state.approval.granted;
}

/**
 * Get approval state for an agent
 */
export function getApprovalState(projectDir: string, agentRole: string): ApprovalState | null {
  const state = getPhaseState(projectDir, agentRole);
  return state ? state.approval : null;
}

/**
 * Get transition history for an agent
 */
export function getTransitionHistory(projectDir: string, agentRole: string): PhaseTransition[] {
  const state = getPhaseState(projectDir, agentRole);
  return state ? state.transitionHistory : [];
}

/**
 * Reset phase state (useful for retries or restarts)
 */
export async function resetPhaseState(
  projectDir: string,
  agentRole: string,
  toPhase: WorkflowPhase = WorkflowPhase.SKILL_DISCOVERY
): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const status = loadAgentStatus(projectDir);

    if (status.agents[agentRole]) {
      status.agents[agentRole].phaseState = {
        agentRole,
        currentPhase: toPhase,
        previousPhase: null,
        phaseStartTime: Date.now(),
        approval: {
          required: false,
          granted: false,
          grantedBy: null,
          grantedAt: null
        },
        transitionHistory: []
      };

      saveAgentStatus(projectDir, status);
      console.log(`🔄 Reset phase state for ${agentRole} to ${toPhase}`);
    }
  });
}

/**
 * Get all agents in a specific phase
 */
export function getAgentsInPhase(projectDir: string, phase: WorkflowPhase): string[] {
  const status = loadAgentStatus(projectDir);
  const agents: string[] = [];

  for (const [agentRole, agentData] of Object.entries(status.agents)) {
    const phaseState = (agentData as any).phaseState;
    if (phaseState && phaseState.currentPhase === phase) {
      agents.push(agentRole);
    }
  }

  return agents;
}

/**
 * Get all agents waiting for approval
 */
export function getAgentsAwaitingApproval(projectDir: string): string[] {
  return getAgentsInPhase(projectDir, WorkflowPhase.AWAITING_APPROVAL);
}

/**
 * Export for use in other modules
 */
export default {
  WorkflowPhase,
  mapStageToPhase,
  initializePhaseState,
  getPhaseState,
  requiresApproval,
  validatePhaseTransition,
  transitionPhase,
  grantApproval,
  revokeApproval,
  canProceedToExecution,
  getApprovalState,
  getTransitionHistory,
  resetPhaseState,
  getAgentsInPhase,
  getAgentsAwaitingApproval
};

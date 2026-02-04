/**
 * State Management Module - Backward Compatibility Layer
 * This module maintains the existing API while delegating to the unified state manager
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import * as stateManager from './state-manager';

// ============================================================================
// Dynamic Project Directory Resolution (replaces hardcoded PROJECTS_DIR)
// ============================================================================

/**
 * Resolve the projects directory with priority:
 * 1. Explicit parameter (highest priority)
 * 2. Environment variable: CLAWD_PROJECTS_DIR
 * 3. Config file: ~/.claude/config.json -> projectsDirectory
 * 4. Default: {cwd}/projects (lowest priority)
 */
export function resolveProjectsDir(explicitDir?: string): string {
  return stateManager.resolveProjectsDir(explicitDir);
}

// ============================================================================
// Type Exports (for backward compatibility)
// ============================================================================

export interface ProjectState {
  id: string;
  status: 'init' | 'executing' | 'reviewing' | 'completed' | 'failed' | 'terminated';
  mode: 'FULL_AUTO' | 'SUPERVISED';
  userRequest: string;
  createdAt: Date;
  updatedAt: Date;
  team: TeamMember[];
  milestones: Milestone[];
  disputes: DisputeEntry[];
  logs: LogEntry[];
}

export interface TeamMember {
  role: string;
  agentId: string;
  status: 'active' | 'blocked' | 'completed' | 'failed';
  deliverable?: string;
  reworkCount: number;
}

export interface Milestone {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  userConfirmed?: boolean;
  timestamp?: Date;
}

export interface DisputeEntry {
  id: string;
  agents: string[];
  topic: string;
  round: number;
  resolution?: string;
  timestamp: Date;
}

export interface LogEntry {
  timestamp: Date;
  phase: string;
  event: string;
  details?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert state manager format to legacy format (Date objects instead of ISO strings)
 */
function toLegacyFormat(state: stateManager.ProjectState): ProjectState {
  return {
    ...state,
    createdAt: new Date(state.createdAt),
    updatedAt: new Date(state.updatedAt),
    milestones: state.milestones.map(m => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
    })),
    disputes: state.disputes.map(d => ({
      ...d,
      timestamp: new Date(d.timestamp),
    })),
    logs: state.logs.map(l => ({
      ...l,
      timestamp: new Date(l.timestamp),
    })),
  } as ProjectState;
}

/**
 * Convert legacy format to state manager format (ISO strings instead of Date objects)
 */
function toStateManagerFormat(state: Partial<ProjectState>): Partial<stateManager.ProjectState> {
  const converted: any = { ...state };

  if (state.createdAt instanceof Date) {
    converted.createdAt = state.createdAt.toISOString();
  }
  if (state.updatedAt instanceof Date) {
    converted.updatedAt = state.updatedAt.toISOString();
  }
  if (state.milestones) {
    converted.milestones = state.milestones.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    }));
  }
  if (state.disputes) {
    converted.disputes = state.disputes.map(d => ({
      ...d,
      timestamp: d.timestamp instanceof Date ? d.timestamp.toISOString() : d.timestamp,
    }));
  }
  if (state.logs) {
    converted.logs = state.logs.map(l => ({
      ...l,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
    }));
  }

  return converted;
}

// ============================================================================
// Public API (delegates to state-manager)
// ============================================================================

/**
 * Create a new project state file
 */
export async function createProjectState(
  projectId: string,
  userRequest: string,
  mode: 'FULL_AUTO' | 'SUPERVISED',
  team: TeamMember[],
  projectsDir?: string
): Promise<void> {
  const now = new Date();
  const initialState: Partial<stateManager.ProjectState> = {
    id: projectId,
    status: 'init',
    mode,
    userRequest,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    team,
    milestones: initializeMilestones(mode),
    disputes: [],
    logs: [{
      timestamp: now.toISOString(),
      phase: 'init',
      event: 'Project created',
      details: `Mode: ${mode}, Team: ${team.map(t => t.role).join(', ')}`
    }]
  };

  await stateManager.createProject(projectId, initialState, projectsDir);
}

/**
 * Initialize milestones based on mode
 */
function initializeMilestones(mode: 'FULL_AUTO' | 'SUPERVISED'): stateManager.Milestone[] {
  if (mode === 'FULL_AUTO') {
    return [
      { name: 'Kickoff', status: 'pending' },
      { name: 'Execution', status: 'pending' },
      { name: 'Review', status: 'pending' },
      { name: 'Delivery', status: 'pending' }
    ];
  } else {
    return [
      { name: 'Understanding Confirmation', status: 'pending', userConfirmed: false },
      { name: 'Team Plan Confirmation', status: 'pending', userConfirmed: false },
      { name: 'Draft Review', status: 'pending', userConfirmed: false },
      { name: 'Final Acceptance', status: 'pending', userConfirmed: false }
    ];
  }
}

/**
 * Update project state
 */
export async function updateProjectState(
  projectId: string,
  updates: Partial<ProjectState>,
  projectsDir?: string
): Promise<void> {
  const converted = toStateManagerFormat(updates);
  await stateManager.updateProject(projectId, converted, projectsDir);
}

/**
 * Add log entry
 */
export async function addLogEntry(
  projectId: string,
  phase: string,
  event: string,
  details?: string,
  projectsDir?: string
): Promise<void> {
  await stateManager.addLogEntry(projectId, phase, event, details, projectsDir);
}

/**
 * Update team member status
 */
export async function updateTeamMemberStatus(
  projectId: string,
  agentId: string,
  status: TeamMember['status'],
  deliverable?: string,
  projectsDir?: string
): Promise<void> {
  await stateManager.updateTeamMemberStatus(projectId, agentId, status, deliverable, projectsDir);
}

/**
 * Record dispute
 */
export async function recordDispute(
  projectId: string,
  agents: string[],
  topic: string,
  round: number,
  resolution?: string,
  projectsDir?: string
): Promise<string> {
  const disputeId = `dispute-${Date.now()}`;

  await stateManager.transaction(
    projectId,
    (state) => {
      state.disputes.push({
        id: disputeId,
        agents,
        topic,
        round,
        resolution,
        timestamp: new Date().toISOString()
      });
      return state;
    },
    projectsDir
  );

  return disputeId;
}

/**
 * Update dispute resolution
 */
export async function updateDisputeResolution(
  projectId: string,
  disputeId: string,
  resolution: string,
  projectsDir?: string
): Promise<void> {
  await stateManager.transaction(
    projectId,
    (state) => {
      const dispute = state.disputes.find(d => d.id === disputeId);
      if (dispute) {
        dispute.resolution = resolution;
      }
      return state;
    },
    projectsDir
  );
}

/**
 * Complete milestone
 */
export async function completeMilestone(
  projectId: string,
  milestoneName: string,
  userConfirmed?: boolean,
  projectsDir?: string
): Promise<void> {
  await stateManager.transaction(
    projectId,
    (state) => {
      const milestone = state.milestones.find(m => m.name === milestoneName);
      if (milestone) {
        milestone.status = 'completed';
        milestone.timestamp = new Date().toISOString();
        if (userConfirmed !== undefined) {
          milestone.userConfirmed = userConfirmed;
        }
      }
      return state;
    },
    projectsDir
  );
}

/**
 * Read project state
 */
export async function readProjectState(
  projectId: string,
  projectsDir?: string
): Promise<ProjectState> {
  const state = await stateManager.readProject(projectId, projectsDir);
  return toLegacyFormat(state);
}

/**
 * Generate project summary
 */
export async function generateProjectSummary(
  projectId: string,
  projectsDir?: string
): Promise<string> {
  const state = await stateManager.readProject(projectId, projectsDir);
  const legacyState = toLegacyFormat(state);

  return `
📊 **Project Summary: ${projectId}**

**Status:** ${legacyState.status}
**Mode:** ${legacyState.mode}
**Duration:** ${Math.round((legacyState.updatedAt.getTime() - legacyState.createdAt.getTime()) / 60000)} minutes

**Team Performance:**
${legacyState.team.map(m => `- ${m.role}: ${m.status}${m.reworkCount > 0 ? ` (${m.reworkCount} rework${m.reworkCount > 1 ? 's' : ''})` : ''}`).join('\n')}

**Milestones:**
${legacyState.milestones.map(m => `- ${m.name}: ${m.status === 'completed' ? '✅' : '⏳'}${m.userConfirmed !== undefined ? (m.userConfirmed ? ' (confirmed)' : ' (pending confirmation)') : ''}`).join('\n')}

${legacyState.disputes.length > 0 ? `**Disputes:** ${legacyState.disputes.length} resolved` : ''}
`;
}

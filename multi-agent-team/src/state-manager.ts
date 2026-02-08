/**
 * Unified State Manager - Single Source of Truth
 * All state operations go through this module
 */

import * as path from 'path';
import * as fs from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { withLock, getLockPath } from './state-lock';
import { syncAll } from './state-sync';
import { EventEmitter } from 'events';
import type { LeaderRole, CrossCheckRule, DisputeRule } from './leadership';
import type { CrossCheckRequest } from './cross-check';
import type { CouncilDecision } from './council-decisions';
import type { LeadershipActivity } from './leadership-activity';

// ============================================================================
// Types
// ============================================================================

export interface LeadershipState {
  leaders: LeaderRole[];
  crossCheckRules: CrossCheckRule[];
  disputeResolutionRules: DisputeRule[];
  crossChecks: CrossCheckRequest[];
  decisions: CouncilDecision[];
}

export interface ProjectState {
  id: string;
  status: 'init' | 'executing' | 'reviewing' | 'completed' | 'failed' | 'terminated' | 'paused';
  mode: 'FULL_AUTO' | 'SUPERVISED';
  userRequest: string;
  createdAt: string; // ISO string for JSON serialization
  updatedAt: string;
  team: TeamMember[];
  milestones: Milestone[];
  disputes: DisputeEntry[];
  logs: LogEntry[];
  agentStatus?: Record<string, AgentStatus>; // Real-time agent execution state
  whiteboard?: WhiteboardState; // Team communication board
  leadership?: LeadershipState; // Leadership council state (separation of powers)
  leadershipActivity?: LeadershipActivity[]; // Leadership activity timeline (power-balancing interactions)
}

export interface TeamMember {
  role: string;
  agentId: string;
  status: 'active' | 'blocked' | 'completed' | 'failed' | 'paused';
  layer?: 'leader' | 'executor' | 'qa';
  deliverable?: string;
  reworkCount: number;
  domain?: string; // PowerDomain value for leaders
}

export interface Milestone {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  userConfirmed?: boolean;
  timestamp?: string;
}

export interface DisputeEntry {
  id: string;
  agents: string[];
  topic: string;
  round: number;
  resolution?: string;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  phase: string;
  event: string;
  details?: string;
}

export interface AgentStatus {
  agentId: string;
  role: string;
  state: string;
  phase: string;
  progress: number;
  lastUpdate: string;
  timeoutHistory?: Array<{ timestamp: string; reason: string }>;
  restartCount?: number;
}

export interface WhiteboardState {
  teamMembers: Array<{ role: string; agentId: string; status: string }>;
  currentPhase: string;
  blockers: Array<{ agentId: string; issue: string; timestamp: string }>;
  decisions: Array<{ topic: string; decision: string; timestamp: string }>;
  lastUpdate: string;
}

// ============================================================================
// Configuration - Dynamic Project Directory Resolution
// ============================================================================

/**
 * Resolve the projects directory with priority:
 * 1. Explicit parameter (highest priority)
 * 2. Environment variable: CLAWD_PROJECTS_DIR
 * 3. Config file: ~/.claude/config.json -> projectsDirectory
 * 4. Default: {cwd}/projects (lowest priority)
 */
export function resolveProjectsDir(explicitDir?: string): string {
  // Priority 1: Explicit parameter
  if (explicitDir) {
    return path.resolve(explicitDir);
  }

  // Priority 2: Environment variable
  if (process.env.CLAWD_PROJECTS_DIR) {
    return path.resolve(process.env.CLAWD_PROJECTS_DIR);
  }

  // Priority 3: Config file
  try {
    const configPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.claude',
      'config.json'
    );
    if (existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.projectsDirectory) {
        return path.resolve(config.projectsDirectory);
      }
    }
  } catch (error) {
    // Config file doesn't exist or is invalid, continue to default
  }

  // Priority 4: Default
  return path.join(process.cwd(), 'projects');
}

/**
 * Get the project directory path
 */
export function getProjectDir(projectId: string, projectsDir?: string): string {
  const baseDir = resolveProjectsDir(projectsDir);
  return path.join(baseDir, projectId);
}

/**
 * Get the state.json file path
 */
function getStateFilePath(projectDir: string): string {
  return path.join(projectDir, 'state.json');
}

// ============================================================================
// Event System
// ============================================================================

const eventEmitter = new EventEmitter();

export function onStateChange(
  projectId: string,
  listener: (state: ProjectState) => void
): void {
  eventEmitter.on(`state:${projectId}`, listener);
}

export function offStateChange(
  projectId: string,
  listener: (state: ProjectState) => void
): void {
  eventEmitter.off(`state:${projectId}`, listener);
}

function emitStateChange(projectId: string, state: ProjectState): void {
  eventEmitter.emit(`state:${projectId}`, state);
}

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Create a new project with initial state
 */
export async function createProject(
  projectId: string,
  initialState: Partial<ProjectState>,
  projectsDir?: string
): Promise<void> {
  const projectDir = getProjectDir(projectId, projectsDir);
  const stateFilePath = getStateFilePath(projectDir);

  // Check if project already exists
  if (existsSync(stateFilePath)) {
    throw new Error(`Project ${projectId} already exists at ${projectDir}`);
  }

  // Ensure project directory exists
  if (!existsSync(projectDir)) {
    await mkdir(projectDir, { recursive: true });
  }

  // Create initial state with defaults
  const now = new Date().toISOString();
  const state: ProjectState = {
    id: projectId,
    status: 'init',
    mode: 'FULL_AUTO',
    userRequest: '',
    createdAt: now,
    updatedAt: now,
    team: [],
    milestones: [],
    disputes: [],
    logs: [],
    agentStatus: {},
    whiteboard: {
      teamMembers: [],
      currentPhase: 'init',
      blockers: [],
      decisions: [],
      lastUpdate: now,
    },
    ...initialState,
  };

  // Write state.json with lock
  const lockPath = getLockPath(projectDir);
  await withLock(lockPath, async () => {
    await writeFile(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  });

  // Sync to derived views
  await syncAll(projectId, state, projectDir);

  // Emit event
  emitStateChange(projectId, state);
}

/**
 * Read project state
 */
export async function readProject(
  projectId: string,
  projectsDir?: string
): Promise<ProjectState> {
  const projectDir = getProjectDir(projectId, projectsDir);
  const stateFilePath = getStateFilePath(projectDir);

  if (!existsSync(stateFilePath)) {
    throw new Error(
      `Project ${projectId} not found at ${projectDir}. ` +
      `State file does not exist: ${stateFilePath}`
    );
  }

  // Read with lock to ensure consistency
  const lockPath = getLockPath(projectDir);
  return await withLock(lockPath, async () => {
    const content = await readFile(stateFilePath, 'utf-8');
    return JSON.parse(content) as ProjectState;
  });
}

/**
 * Update project state (partial update)
 */
export async function updateProject(
  projectId: string,
  updates: Partial<ProjectState>,
  projectsDir?: string
): Promise<void> {
  const projectDir = getProjectDir(projectId, projectsDir);
  const stateFilePath = getStateFilePath(projectDir);

  if (!existsSync(stateFilePath)) {
    throw new Error(`Project ${projectId} not found at ${projectDir}`);
  }

  const lockPath = getLockPath(projectDir);
  const updatedState = await withLock(lockPath, async () => {
    // Read current state
    const content = await readFile(stateFilePath, 'utf-8');
    const state = JSON.parse(content) as ProjectState;

    // Apply updates
    const newState: ProjectState = {
      ...state,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Write updated state
    await writeFile(stateFilePath, JSON.stringify(newState, null, 2), 'utf-8');

    return newState;
  });

  // Sync to derived views
  await syncAll(projectId, updatedState, projectDir);

  // Emit event
  emitStateChange(projectId, updatedState);
}

/**
 * Delete project (removes all files)
 */
export async function deleteProject(
  projectId: string,
  projectsDir?: string
): Promise<void> {
  const projectDir = getProjectDir(projectId, projectsDir);

  if (!existsSync(projectDir)) {
    throw new Error(`Project ${projectId} not found at ${projectDir}`);
  }

  const lockPath = getLockPath(projectDir);
  await withLock(lockPath, async () => {
    // Remove entire project directory
    fs.rmSync(projectDir, { recursive: true, force: true });
  });
}

// ============================================================================
// Atomic Transactions
// ============================================================================

/**
 * Execute multiple state updates atomically
 * If the function throws, no changes are persisted
 */
export async function transaction(
  projectId: string,
  fn: (state: ProjectState) => ProjectState | Promise<ProjectState>,
  projectsDir?: string
): Promise<void> {
  const projectDir = getProjectDir(projectId, projectsDir);
  const stateFilePath = getStateFilePath(projectDir);

  if (!existsSync(stateFilePath)) {
    throw new Error(`Project ${projectId} not found at ${projectDir}`);
  }

  const lockPath = getLockPath(projectDir);
  const updatedState = await withLock(lockPath, async () => {
    // Read current state
    const content = await readFile(stateFilePath, 'utf-8');
    const state = JSON.parse(content) as ProjectState;

    // Apply transformation
    const newState = await fn(state);
    newState.updatedAt = new Date().toISOString();

    // Write updated state
    await writeFile(stateFilePath, JSON.stringify(newState, null, 2), 'utf-8');

    return newState;
  });

  // Sync to derived views
  await syncAll(projectId, updatedState, projectDir);

  // Emit event
  emitStateChange(projectId, updatedState);
}

// ============================================================================
// Helper Functions for Common Operations
// ============================================================================

/**
 * Add a log entry to the project
 */
export async function addLogEntry(
  projectId: string,
  phase: string,
  event: string,
  details?: string,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      state.logs.push({
        timestamp: new Date().toISOString(),
        phase,
        event,
        details,
      });
      return state;
    },
    projectsDir
  );
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  projectId: string,
  agentId: string,
  statusUpdate: Partial<AgentStatus>,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      if (!state.agentStatus) {
        state.agentStatus = {};
      }
      state.agentStatus[agentId] = {
        ...state.agentStatus[agentId],
        ...statusUpdate,
        lastUpdate: new Date().toISOString(),
      } as AgentStatus;
      return state;
    },
    projectsDir
  );
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
  await transaction(
    projectId,
    (state) => {
      const member = state.team.find((m) => m.agentId === agentId);
      if (member) {
        member.status = status;
        if (deliverable) {
          member.deliverable = deliverable;
        }
      }
      return state;
    },
    projectsDir
  );
}

/**
 * Update whiteboard state
 */
export async function updateWhiteboard(
  projectId: string,
  whiteboardUpdate: Partial<WhiteboardState>,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      state.whiteboard = {
        ...state.whiteboard,
        ...whiteboardUpdate,
        lastUpdate: new Date().toISOString(),
      } as WhiteboardState;
      return state;
    },
    projectsDir
  );
}

/**
 * Check if a project exists
 */
export function projectExists(projectId: string, projectsDir?: string): boolean {
  const projectDir = getProjectDir(projectId, projectsDir);
  const stateFilePath = getStateFilePath(projectDir);
  return existsSync(stateFilePath);
}

/**
 * List all projects in the projects directory
 */
export function listProjects(projectsDir?: string): string[] {
  const baseDir = resolveProjectsDir(projectsDir);

  if (!existsSync(baseDir)) {
    return [];
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const stateFile = path.join(baseDir, name, 'state.json');
      return existsSync(stateFile);
    });
}

// ============================================================================
// Leadership Council Helpers
// ============================================================================

/**
 * Update leadership state in the project
 */
export async function updateLeadershipState(
  projectId: string,
  leadershipUpdate: Partial<LeadershipState>,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      state.leadership = {
        ...state.leadership,
        ...leadershipUpdate,
      } as LeadershipState;
      return state;
    },
    projectsDir
  );
}

/**
 * Add a council decision to the project state
 */
export async function addCouncilDecision(
  projectId: string,
  decision: CouncilDecision,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      if (!state.leadership) {
        state.leadership = {
          leaders: [],
          crossCheckRules: [],
          disputeResolutionRules: [],
          crossChecks: [],
          decisions: [],
        };
      }
      if (!state.leadership.decisions) {
        state.leadership.decisions = [];
      }
      state.leadership.decisions.push(decision);
      return state;
    },
    projectsDir
  );
}

/**
 * Add a cross-check record to the project state
 */
export async function addCrossCheck(
  projectId: string,
  crossCheck: CrossCheckRequest,
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      if (!state.leadership) {
        state.leadership = {
          leaders: [],
          crossCheckRules: [],
          disputeResolutionRules: [],
          crossChecks: [],
          decisions: [],
        };
      }
      if (!state.leadership.crossChecks) {
        state.leadership.crossChecks = [];
      }
      state.leadership.crossChecks.push(crossCheck);
      return state;
    },
    projectsDir
  );
}

/**
 * Update leader status in the team
 */
export async function updateLeaderStatus(
  projectId: string,
  domain: string,
  status: TeamMember['status'],
  projectsDir?: string
): Promise<void> {
  await transaction(
    projectId,
    (state) => {
      const leader = state.team.find(
        (m) => m.layer === 'leader' && m.domain === domain
      );
      if (leader) {
        leader.status = status;
      }
      return state;
    },
    projectsDir
  );
}

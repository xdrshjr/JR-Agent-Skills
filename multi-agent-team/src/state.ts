/**
 * State Management Module
 * Projects are tracked in Markdown files for transparency
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECTS_DIR = './projects';

interface ProjectState {
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

interface TeamMember {
  role: string;
  agentId: string;
  status: 'active' | 'blocked' | 'completed' | 'failed';
  deliverable?: string;
  reworkCount: number;
}

interface Milestone {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  userConfirmed?: boolean;
  timestamp?: Date;
}

interface DisputeEntry {
  id: string;
  agents: string[];
  topic: string;
  round: number;
  resolution?: string;
  timestamp: Date;
}

interface LogEntry {
  timestamp: Date;
  phase: string;
  event: string;
  details?: string;
}

/**
 * Create a new project state file
 */
export async function createProjectState(
  projectId: string,
  userRequest: string,
  mode: 'FULL_AUTO' | 'SUPERVISED',
  team: TeamMember[]
): Promise<void> {
  // Ensure projects directory exists
  if (!existsSync(PROJECTS_DIR)) {
    await mkdir(PROJECTS_DIR, { recursive: true });
  }
  
  const now = new Date();
  const state: ProjectState = {
    id: projectId,
    status: 'init',
    mode,
    userRequest,
    createdAt: now,
    updatedAt: now,
    team,
    milestones: initializeMilestones(mode),
    disputes: [],
    logs: [{
      timestamp: now,
      phase: 'init',
      event: 'Project created',
      details: `Mode: ${mode}, Team: ${team.map(t => t.role).join(', ')}`
    }]
  };
  
  await writeMarkdownFile(projectId, state);
}

/**
 * Initialize milestones based on mode
 */
function initializeMilestones(mode: 'FULL_AUTO' | 'SUPERVISED'): Milestone[] {
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
  updates: Partial<ProjectState>
): Promise<void> {
  const state = await readProjectState(projectId);
  
  // Merge updates
  Object.assign(state, updates, {
    updatedAt: new Date()
  });
  
  await writeMarkdownFile(projectId, state);
}

/**
 * Add log entry
 */
export async function addLogEntry(
  projectId: string,
  phase: string,
  event: string,
  details?: string
): Promise<void> {
  const state = await readProjectState(projectId);
  
  state.logs.push({
    timestamp: new Date(),
    phase,
    event,
    details
  });
  
  state.updatedAt = new Date();
  await writeMarkdownFile(projectId, state);
}

/**
 * Update team member status
 */
export async function updateTeamMemberStatus(
  projectId: string,
  agentId: string,
  status: TeamMember['status'],
  deliverable?: string
): Promise<void> {
  const state = await readProjectState(projectId);
  
  const member = state.team.find(m => m.agentId === agentId);
  if (member) {
    member.status = status;
    if (deliverable) member.deliverable = deliverable;
  }
  
  state.updatedAt = new Date();
  await writeMarkdownFile(projectId, state);
}

/**
 * Record dispute
 */
export async function recordDispute(
  projectId: string,
  agents: string[],
  topic: string,
  round: number,
  resolution?: string
): Promise<string> {
  const state = await readProjectState(projectId);
  
  const disputeId = `dispute-${Date.now()}`;
  state.disputes.push({
    id: disputeId,
    agents,
    topic,
    round,
    resolution,
    timestamp: new Date()
  });
  
  state.updatedAt = new Date();
  await writeMarkdownFile(projectId, state);
  
  return disputeId;
}

/**
 * Update dispute resolution
 */
export async function updateDisputeResolution(
  projectId: string,
  disputeId: string,
  resolution: string
): Promise<void> {
  const state = await readProjectState(projectId);
  
  const dispute = state.disputes.find(d => d.id === disputeId);
  if (dispute) {
    dispute.resolution = resolution;
  }
  
  state.updatedAt = new Date();
  await writeMarkdownFile(projectId, state);
}

/**
 * Complete milestone
 */
export async function completeMilestone(
  projectId: string,
  milestoneName: string,
  userConfirmed?: boolean
): Promise<void> {
  const state = await readProjectState(projectId);
  
  const milestone = state.milestones.find(m => m.name === milestoneName);
  if (milestone) {
    milestone.status = 'completed';
    milestone.timestamp = new Date();
    if (userConfirmed !== undefined) {
      milestone.userConfirmed = userConfirmed;
    }
  }
  
  state.updatedAt = new Date();
  await writeMarkdownFile(projectId, state);
}

/**
 * Read project state
 */
export async function readProjectState(projectId: string): Promise<ProjectState> {
  const filepath = join(PROJECTS_DIR, `project-${projectId}.md`);
  const content = await readFile(filepath, 'utf-8');
  return parseMarkdownFile(content);
}

/**
 * Write project state as Markdown
 */
async function writeMarkdownFile(projectId: string, state: ProjectState): Promise<void> {
  const filepath = join(PROJECTS_DIR, `project-${projectId}.md`);
  const content = generateMarkdownContent(state);
  await writeFile(filepath, content, 'utf-8');
}

/**
 * Generate Markdown content from state
 */
function generateMarkdownContent(state: ProjectState): string {
  return `# Project: ${state.id}

## Metadata

| Field | Value |
|-------|-------|
| **Project ID** | ${state.id} |
| **Status** | ${state.status} |
| **Mode** | ${state.mode} |
| **Created** | ${state.createdAt.toISOString()} |
| **Updated** | ${state.updatedAt.toISOString()} |

## User Request

${state.userRequest}

## Team

| Role | Agent ID | Status | Rework Count | Deliverable |
|------|----------|--------|--------------|-------------|
${state.team.map(m => `| ${m.role} | ${m.agentId} | ${m.status} | ${m.reworkCount} | ${m.deliverable || '-'} |`).join('\n')}

## Milestones

| Milestone | Status | User Confirmed | Timestamp |
|-----------|--------|----------------|-----------|
${state.milestones.map(m => `| ${m.name} | ${m.status} | ${m.userConfirmed !== undefined ? (m.userConfirmed ? '✅' : '⏳') : '-'} | ${m.timestamp ? m.timestamp.toISOString() : '-'} |`).join('\n')}

## Execution Log

| Timestamp | Phase | Event | Details |
|-----------|-------|-------|---------|
${state.logs.map(l => `| ${l.timestamp.toISOString()} | ${l.phase} | ${l.event} | ${l.details || '-'} |`).join('\n')}

## Disputes

${state.disputes.length === 0 ? 'No disputes recorded.' : state.disputes.map(d => `
### ${d.id}
- **Agents:** ${d.agents.join(', ')}
- **Topic:** ${d.topic}
- **Round:** ${d.round}
- **Resolution:** ${d.resolution || 'Pending'}
- **Timestamp:** ${d.timestamp.toISOString()}
`).join('\n')}

---

*This file is automatically generated and updated throughout the project lifecycle.*
`;
}

/**
 * Parse Markdown file to state (simplified)
 */
function parseMarkdownFile(content: string): ProjectState {
  // In a full implementation, this would parse the Markdown back to state
  // For now, return a placeholder that indicates it needs implementation
  return JSON.parse(content.match(/<!-- STATE: (.*?) -->/)?.[1] || '{}');
}

/**
 * Generate project summary
 */
export async function generateProjectSummary(projectId: string): Promise<string> {
  const state = await readProjectState(projectId);
  
  return `
📊 **Project Summary: ${projectId}**

**Status:** ${state.status}
**Mode:** ${state.mode}
**Duration:** ${Math.round((state.updatedAt.getTime() - state.createdAt.getTime()) / 60000)} minutes

**Team Performance:**
${state.team.map(m => `- ${m.role}: ${m.status}${m.reworkCount > 0 ? ` (${m.reworkCount} rework${m.reworkCount > 1 ? 's' : ''})` : ''}`).join('\n')}

**Milestones:**
${state.milestones.map(m => `- ${m.name}: ${m.status === 'completed' ? '✅' : '⏳'}${m.userConfirmed !== undefined ? (m.userConfirmed ? ' (confirmed)' : ' (pending confirmation)') : ''}`).join('\n')}

${state.disputes.length > 0 ? `**Disputes:** ${state.disputes.length} resolved` : ''}
`;
}

export {
  ProjectState,
  TeamMember,
  Milestone,
  DisputeEntry,
  LogEntry
};

/**
 * State Consistency Validator
 * Detects and repairs inconsistencies between state.json and derived views
 */

import * as path from 'path';
import * as fs from 'fs';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { ProjectState } from './state-manager';
import { syncAll } from './state-sync';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'missing_state' | 'corrupt_state' | 'missing_derived' | 'inconsistent_data';
  message: string;
  file?: string;
}

export interface ValidationWarning {
  type: 'outdated_derived' | 'extra_files' | 'missing_derived' | 'inconsistent_data';
  message: string;
  file?: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate consistency between state.json and derived views
 */
export async function validateConsistency(
  projectId: string,
  projectDir: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const stateFilePath = path.join(projectDir, 'state.json');
  const markdownPath = path.join(projectDir, `${projectId}.md`);
  const agentStatusPath = path.join(projectDir, 'agent-status.json');
  const whiteboardPath = path.join(projectDir, 'WHITEBOARD.md');

  // Check 1: state.json exists and is valid
  if (!existsSync(stateFilePath)) {
    errors.push({
      type: 'missing_state',
      message: 'state.json does not exist',
      file: stateFilePath,
    });
    return { isValid: false, errors, warnings };
  }

  let state: ProjectState;
  try {
    const content = await readFile(stateFilePath, 'utf-8');
    state = JSON.parse(content);
  } catch (error) {
    errors.push({
      type: 'corrupt_state',
      message: `state.json is corrupt or invalid: ${error instanceof Error ? error.message : String(error)}`,
      file: stateFilePath,
    });
    return { isValid: false, errors, warnings };
  }

  // Check 2: Derived views exist
  if (!existsSync(markdownPath)) {
    warnings.push({
      type: 'missing_derived',
      message: 'Markdown project file is missing',
      file: markdownPath,
    });
  }

  if (!existsSync(agentStatusPath)) {
    warnings.push({
      type: 'missing_derived',
      message: 'agent-status.json is missing',
      file: agentStatusPath,
    });
  }

  if (!existsSync(whiteboardPath)) {
    warnings.push({
      type: 'missing_derived',
      message: 'WHITEBOARD.md is missing',
      file: whiteboardPath,
    });
  }

  // Check 3: agent-status.json consistency
  if (existsSync(agentStatusPath)) {
    try {
      const agentStatusContent = await readFile(agentStatusPath, 'utf-8');
      const agentStatusData = JSON.parse(agentStatusContent);

      // Validate project ID matches
      if (agentStatusData.projectId !== state.id) {
        errors.push({
          type: 'inconsistent_data',
          message: `Project ID mismatch: state.json has "${state.id}", agent-status.json has "${agentStatusData.projectId}"`,
          file: agentStatusPath,
        });
      }

      // Validate team members count matches
      if (agentStatusData.teamMembers && state.team) {
        if (agentStatusData.teamMembers.length !== state.team.length) {
          warnings.push({
            type: 'inconsistent_data',
            message: `Team member count mismatch: state.json has ${state.team.length}, agent-status.json has ${agentStatusData.teamMembers.length}`,
            file: agentStatusPath,
          });
        }
      }
    } catch (error) {
      errors.push({
        type: 'corrupt_state',
        message: `agent-status.json is corrupt: ${error instanceof Error ? error.message : String(error)}`,
        file: agentStatusPath,
      });
    }
  }

  // Check 4: Validate state.json structure
  if (!state.id || !state.status || !state.mode) {
    errors.push({
      type: 'corrupt_state',
      message: 'state.json is missing required fields (id, status, or mode)',
      file: stateFilePath,
    });
  }

  if (!Array.isArray(state.team)) {
    errors.push({
      type: 'corrupt_state',
      message: 'state.json has invalid team field (must be an array)',
      file: stateFilePath,
    });
  }

  if (!Array.isArray(state.logs)) {
    errors.push({
      type: 'corrupt_state',
      message: 'state.json has invalid logs field (must be an array)',
      file: stateFilePath,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Recovery Functions
// ============================================================================

/**
 * Repair inconsistencies by regenerating derived views from state.json
 * If state.json is missing/corrupt, attempt to reconstruct from derived views
 */
export async function repairInconsistency(
  projectId: string,
  projectDir: string
): Promise<void> {
  const stateFilePath = path.join(projectDir, 'state.json');
  const markdownPath = path.join(projectDir, `${projectId}.md`);
  const agentStatusPath = path.join(projectDir, 'agent-status.json');

  // Case 1: state.json exists and is valid - regenerate derived views
  if (existsSync(stateFilePath)) {
    try {
      const content = await readFile(stateFilePath, 'utf-8');
      const state = JSON.parse(content) as ProjectState;

      console.log(`[Repair] Regenerating derived views from state.json for project ${projectId}`);
      await syncAll(projectId, state, projectDir);
      console.log(`[Repair] Successfully regenerated all derived views`);
      return;
    } catch (error) {
      console.error(`[Repair] state.json is corrupt, attempting reconstruction...`);
    }
  }

  // Case 2: state.json is missing or corrupt - reconstruct from derived views
  console.log(`[Repair] Attempting to reconstruct state.json from derived views...`);

  let reconstructedState: Partial<ProjectState> = {
    id: projectId,
    status: 'init',
    mode: 'FULL_AUTO',
    userRequest: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      lastUpdate: new Date().toISOString(),
    },
  };

  // Try to extract data from agent-status.json
  if (existsSync(agentStatusPath)) {
    try {
      const agentStatusContent = await readFile(agentStatusPath, 'utf-8');
      const agentStatusData = JSON.parse(agentStatusContent);

      if (agentStatusData.teamMembers) {
        reconstructedState.team = agentStatusData.teamMembers;
      }

      if (agentStatusData.agents) {
        reconstructedState.agentStatus = agentStatusData.agents;
      }

      console.log(`[Repair] Extracted team and agent status from agent-status.json`);
    } catch (error) {
      console.error(`[Repair] Failed to parse agent-status.json: ${error}`);
    }
  }

  // Try to extract data from markdown file
  if (existsSync(markdownPath)) {
    try {
      const markdownContent = await readFile(markdownPath, 'utf-8');

      // Extract user request (simple regex)
      const userRequestMatch = markdownContent.match(/## User Request\s+(.+?)(?=\n##)/s);
      if (userRequestMatch) {
        reconstructedState.userRequest = userRequestMatch[1].trim();
      }

      // Extract mode
      const modeMatch = markdownContent.match(/\*\*Mode\*\* \| (.+?) \|/);
      if (modeMatch && (modeMatch[1] === 'FULL_AUTO' || modeMatch[1] === 'SUPERVISED')) {
        reconstructedState.mode = modeMatch[1];
      }

      // Extract status
      const statusMatch = markdownContent.match(/\*\*Status\*\* \| (.+?) \|/);
      if (statusMatch) {
        reconstructedState.status = statusMatch[1] as ProjectState['status'];
      }

      console.log(`[Repair] Extracted metadata from markdown file`);
    } catch (error) {
      console.error(`[Repair] Failed to parse markdown file: ${error}`);
    }
  }

  // Write reconstructed state
  const state = reconstructedState as ProjectState;
  await fs.promises.writeFile(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  console.log(`[Repair] Reconstructed state.json written`);

  // Regenerate all derived views from reconstructed state
  await syncAll(projectId, state, projectDir);
  console.log(`[Repair] Successfully repaired project ${projectId}`);
}

/**
 * Validate and repair if necessary
 */
export async function validateAndRepair(
  projectId: string,
  projectDir: string
): Promise<ValidationResult> {
  const result = await validateConsistency(projectId, projectDir);

  if (!result.isValid) {
    console.log(`[Validation] Project ${projectId} has inconsistencies, attempting repair...`);
    await repairInconsistency(projectId, projectDir);

    // Validate again after repair
    const revalidationResult = await validateConsistency(projectId, projectDir);
    if (revalidationResult.isValid) {
      console.log(`[Validation] Project ${projectId} successfully repaired`);
    } else {
      console.error(`[Validation] Project ${projectId} could not be fully repaired`);
    }
    return revalidationResult;
  }

  return result;
}

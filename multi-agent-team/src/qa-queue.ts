/**
 * QA Submission Queue
 *
 * Serializes QA validation requests to prevent concurrent validation.
 * Ensures only one agent's deliverable is validated at a time.
 *
 * Design Principles:
 * - Task-agnostic: Works for any deliverable type (code, design, video, document)
 * - Role-agnostic: Works for any agent role
 * - FIFO ordering with optional priority support
 * - Persistent queue state (survives process restarts)
 * - Timeout handling for stuck validations
 */

import * as path from 'path';
import * as fs from 'fs';
import { withLock, getLockPath } from './state-lock';

/**
 * QA submission entry
 */
export interface QASubmission {
  agentRole: string;
  agentId: string;
  deliverable: string;
  submittedAt: number;
  priority?: number; // Higher priority = processed first (default: 0)
  metadata?: Record<string, any>; // Generic metadata for any task type
}

/**
 * QA queue state
 */
interface QAQueueState {
  pending: QASubmission[];
  current: QASubmission | null;
  currentStartedAt: number | null;
  history: Array<{
    submission: QASubmission;
    startedAt: number;
    completedAt: number;
    result: 'passed' | 'failed' | 'timeout';
  }>;
}

/**
 * Configuration
 */
const DEFAULT_CONFIG = {
  maxQueueSize: 10,
  validationTimeout: 30 * 60 * 1000, // 30 minutes
};

/**
 * Get queue state file path
 */
function getQueueStatePath(projectDir: string): string {
  return path.join(projectDir, 'qa-queue.json');
}

/**
 * Load queue state
 */
function loadQueueState(projectDir: string): QAQueueState {
  const statePath = getQueueStatePath(projectDir);

  if (!fs.existsSync(statePath)) {
    return {
      pending: [],
      current: null,
      currentStartedAt: null,
      history: []
    };
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load QA queue state: ${error}`);
    return {
      pending: [],
      current: null,
      currentStartedAt: null,
      history: []
    };
  }
}

/**
 * Save queue state
 */
function saveQueueState(projectDir: string, state: QAQueueState): void {
  const statePath = getQueueStatePath(projectDir);

  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save QA queue state: ${error}`);
    throw error;
  }
}

/**
 * Enqueue a QA submission
 *
 * @param projectDir - Project directory
 * @param submission - QA submission to enqueue
 * @returns Promise that resolves when enqueued
 * @throws Error if queue is full
 */
export async function enqueueQASubmission(
  projectDir: string,
  submission: QASubmission
): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    // Check queue size limit
    if (state.pending.length >= DEFAULT_CONFIG.maxQueueSize) {
      throw new Error(
        `QA queue is full (${state.pending.length}/${DEFAULT_CONFIG.maxQueueSize}). ` +
        `Wait for current validations to complete.`
      );
    }

    // Add to queue
    state.pending.push(submission);

    // Sort by priority (higher first), then by submission time (earlier first)
    state.pending.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.submittedAt - b.submittedAt;
    });

    saveQueueState(projectDir, state);

    console.log(
      `✅ Enqueued QA submission for ${submission.agentRole} ` +
      `(queue size: ${state.pending.length})`
    );
  });
}

/**
 * Dequeue the next QA submission
 *
 * @param projectDir - Project directory
 * @returns Next submission to validate, or null if queue is empty
 */
export async function dequeueQASubmission(
  projectDir: string
): Promise<QASubmission | null> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    // Check if there's already a current validation
    if (state.current !== null) {
      // Check for timeout
      const elapsed = Date.now() - (state.currentStartedAt || 0);
      if (elapsed > DEFAULT_CONFIG.validationTimeout) {
        console.warn(
          `⚠️ QA validation timeout for ${state.current.agentRole} ` +
          `(${Math.round(elapsed / 1000 / 60)} minutes)`
        );

        // Move to history as timeout
        state.history.push({
          submission: state.current,
          startedAt: state.currentStartedAt!,
          completedAt: Date.now(),
          result: 'timeout'
        });

        state.current = null;
        state.currentStartedAt = null;
      } else {
        // Still processing current submission
        return null;
      }
    }

    // Get next from queue
    if (state.pending.length === 0) {
      return null;
    }

    const next = state.pending.shift()!;
    state.current = next;
    state.currentStartedAt = Date.now();

    saveQueueState(projectDir, state);

    console.log(
      `🔍 Dequeued QA submission for ${next.agentRole} ` +
      `(remaining: ${state.pending.length})`
    );

    return next;
  });
}

/**
 * Mark current QA validation as completed
 *
 * @param projectDir - Project directory
 * @param result - Validation result ('passed' or 'failed')
 */
export async function completeQAValidation(
  projectDir: string,
  result: 'passed' | 'failed'
): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    if (state.current === null) {
      console.warn('⚠️ No current QA validation to complete');
      return;
    }

    // Move to history
    state.history.push({
      submission: state.current,
      startedAt: state.currentStartedAt!,
      completedAt: Date.now(),
      result
    });

    console.log(
      `✅ Completed QA validation for ${state.current.agentRole}: ${result}`
    );

    state.current = null;
    state.currentStartedAt = null;

    saveQueueState(projectDir, state);
  });
}

/**
 * Get queue status
 *
 * @param projectDir - Project directory
 * @returns Queue status information
 */
export async function getQueueStatus(projectDir: string): Promise<{
  pending: number;
  current: QASubmission | null;
  currentElapsed: number | null;
  history: number;
}> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    return {
      pending: state.pending.length,
      current: state.current,
      currentElapsed: state.currentStartedAt
        ? Date.now() - state.currentStartedAt
        : null,
      history: state.history.length
    };
  });
}

/**
 * Get pending submissions
 *
 * @param projectDir - Project directory
 * @returns Array of pending submissions
 */
export async function getPendingSubmissions(
  projectDir: string
): Promise<QASubmission[]> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);
    return [...state.pending];
  });
}

/**
 * Clear the entire queue (use with caution)
 *
 * @param projectDir - Project directory
 */
export async function clearQueue(projectDir: string): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    console.log(
      `🗑️ Clearing QA queue (${state.pending.length} pending, ` +
      `current: ${state.current ? state.current.agentRole : 'none'})`
    );

    state.pending = [];
    state.current = null;
    state.currentStartedAt = null;

    saveQueueState(projectDir, state);
  });
}

/**
 * Check if an agent is already in the queue
 *
 * @param projectDir - Project directory
 * @param agentRole - Agent role to check
 * @returns True if agent is in queue or currently being validated
 */
export async function isAgentInQueue(
  projectDir: string,
  agentRole: string
): Promise<boolean> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadQueueState(projectDir);

    // Check current
    if (state.current && state.current.agentRole === agentRole) {
      return true;
    }

    // Check pending
    return state.pending.some(s => s.agentRole === agentRole);
  });
}

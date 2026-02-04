/**
 * Concurrency Manager
 *
 * Limits maximum concurrent agents and manages execution slots.
 * Prevents resource exhaustion on systems with limited capacity.
 *
 * Design Principles:
 * - Task-agnostic: Works for any agent type
 * - Role-agnostic: Generic execution slots
 * - Configurable: Via env var, config file, or defaults
 * - Environment-aware: Respects system resources
 * - Persistent state: Survives process restarts
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { withLock, getLockPath } from './state-lock';

/**
 * Execution slot represents a concurrent agent execution
 */
export interface ExecutionSlot {
  slotId: string;
  agentRole: string;
  agentId: string;
  acquiredAt: number;
  metadata?: Record<string, any>;
}

/**
 * Concurrency configuration
 */
export interface ConcurrencyConfig {
  maxConcurrentAgents: number;
  maxQueueSize: number;
  slotTimeout: number; // milliseconds
}

/**
 * Concurrency state
 */
interface ConcurrencyState {
  activeSlots: ExecutionSlot[];
  waitQueue: Array<{
    agentRole: string;
    agentId: string;
    enqueuedAt: number;
    priority?: number;
  }>;
  history: Array<{
    slotId: string;
    agentRole: string;
    acquiredAt: number;
    releasedAt: number;
    reason: string;
  }>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ConcurrencyConfig = {
  maxConcurrentAgents: 3,
  maxQueueSize: 10,
  slotTimeout: 30 * 60 * 1000, // 30 minutes
};

/**
 * Load configuration from multiple sources
 * Priority: explicit > env var > config file > default
 */
function loadConfig(explicitConfig?: Partial<ConcurrencyConfig>): ConcurrencyConfig {
  const config = { ...DEFAULT_CONFIG };

  // 1. Try config file
  try {
    const configPath = path.join(os.homedir(), '.claude', 'multi-agent-config.json');
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (fileConfig.maxConcurrentAgents) {
        config.maxConcurrentAgents = fileConfig.maxConcurrentAgents;
      }
      if (fileConfig.maxQueueSize) {
        config.maxQueueSize = fileConfig.maxQueueSize;
      }
      if (fileConfig.slotTimeout) {
        config.slotTimeout = fileConfig.slotTimeout;
      }
    }
  } catch (error) {
    // Ignore config file errors
  }

  // 2. Try environment variable
  if (process.env.MULTI_AGENT_MAX_CONCURRENT) {
    const envValue = parseInt(process.env.MULTI_AGENT_MAX_CONCURRENT, 10);
    if (!isNaN(envValue) && envValue > 0) {
      config.maxConcurrentAgents = envValue;
    }
  }

  // 3. Apply explicit config (highest priority)
  if (explicitConfig) {
    Object.assign(config, explicitConfig);
  }

  return config;
}

/**
 * Get concurrency state file path
 */
function getConcurrencyStatePath(projectDir: string): string {
  return path.join(projectDir, 'concurrency-state.json');
}

/**
 * Load concurrency state
 */
function loadConcurrencyState(projectDir: string): ConcurrencyState {
  const statePath = getConcurrencyStatePath(projectDir);

  if (!fs.existsSync(statePath)) {
    return {
      activeSlots: [],
      waitQueue: [],
      history: []
    };
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load concurrency state: ${error}`);
    return {
      activeSlots: [],
      waitQueue: [],
      history: []
    };
  }
}

/**
 * Save concurrency state
 */
function saveConcurrencyState(projectDir: string, state: ConcurrencyState): void {
  const statePath = getConcurrencyStatePath(projectDir);

  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save concurrency state: ${error}`);
    throw error;
  }
}

/**
 * Generate unique slot ID
 */
function generateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Acquire an execution slot
 *
 * @param projectDir - Project directory
 * @param agentRole - Agent role
 * @param agentId - Agent ID
 * @param config - Optional configuration override
 * @returns Execution slot if acquired, null if must wait
 */
export async function acquireSlot(
  projectDir: string,
  agentRole: string,
  agentId: string,
  config?: Partial<ConcurrencyConfig>
): Promise<ExecutionSlot | null> {
  const lockPath = getLockPath(projectDir);
  const fullConfig = loadConfig(config);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);

    // Clean up timed-out slots
    const now = Date.now();
    const timedOutSlots = state.activeSlots.filter(
      slot => now - slot.acquiredAt > fullConfig.slotTimeout
    );

    for (const slot of timedOutSlots) {
      console.warn(
        `⚠️ Slot ${slot.slotId} for ${slot.agentRole} timed out ` +
        `(${Math.round((now - slot.acquiredAt) / 1000 / 60)} minutes)`
      );

      state.history.push({
        slotId: slot.slotId,
        agentRole: slot.agentRole,
        acquiredAt: slot.acquiredAt,
        releasedAt: now,
        reason: 'timeout'
      });
    }

    state.activeSlots = state.activeSlots.filter(
      slot => now - slot.acquiredAt <= fullConfig.slotTimeout
    );

    // Check if slot available
    if (state.activeSlots.length >= fullConfig.maxConcurrentAgents) {
      // Add to wait queue
      if (state.waitQueue.length >= fullConfig.maxQueueSize) {
        throw new Error(
          `Concurrency wait queue is full (${state.waitQueue.length}/${fullConfig.maxQueueSize}). ` +
          `Wait for agents to complete.`
        );
      }

      state.waitQueue.push({
        agentRole,
        agentId,
        enqueuedAt: now
      });

      saveConcurrencyState(projectDir, state);

      console.log(
        `⏳ ${agentRole} added to wait queue ` +
        `(${state.activeSlots.length}/${fullConfig.maxConcurrentAgents} slots active, ` +
        `${state.waitQueue.length} waiting)`
      );

      return null;
    }

    // Acquire slot
    const slot: ExecutionSlot = {
      slotId: generateSlotId(),
      agentRole,
      agentId,
      acquiredAt: now
    };

    state.activeSlots.push(slot);
    saveConcurrencyState(projectDir, state);

    console.log(
      `✅ ${agentRole} acquired execution slot ${slot.slotId} ` +
      `(${state.activeSlots.length}/${fullConfig.maxConcurrentAgents} slots active)`
    );

    return slot;
  });
}

/**
 * Release an execution slot
 *
 * @param projectDir - Project directory
 * @param slotId - Slot ID to release
 * @param reason - Reason for release (e.g., 'completed', 'failed', 'timeout')
 */
export async function releaseSlot(
  projectDir: string,
  slotId: string,
  reason: string = 'completed'
): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);

    const slotIndex = state.activeSlots.findIndex(s => s.slotId === slotId);

    if (slotIndex === -1) {
      console.warn(`⚠️ Slot ${slotId} not found (may have already been released)`);
      return;
    }

    const slot = state.activeSlots[slotIndex];
    state.activeSlots.splice(slotIndex, 1);

    // Add to history
    state.history.push({
      slotId: slot.slotId,
      agentRole: slot.agentRole,
      acquiredAt: slot.acquiredAt,
      releasedAt: Date.now(),
      reason
    });

    saveConcurrencyState(projectDir, state);

    console.log(
      `✅ Released slot ${slotId} for ${slot.agentRole} (reason: ${reason}) ` +
      `(${state.activeSlots.length} slots active, ${state.waitQueue.length} waiting)`
    );
  });
}

/**
 * Get available slots count
 *
 * @param projectDir - Project directory
 * @param config - Optional configuration override
 * @returns Number of available slots
 */
export async function getAvailableSlots(
  projectDir: string,
  config?: Partial<ConcurrencyConfig>
): Promise<number> {
  const lockPath = getLockPath(projectDir);
  const fullConfig = loadConfig(config);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);
    return Math.max(0, fullConfig.maxConcurrentAgents - state.activeSlots.length);
  });
}

/**
 * Get waiting agents
 *
 * @param projectDir - Project directory
 * @returns Array of agent roles waiting for slots
 */
export async function getWaitingAgents(projectDir: string): Promise<string[]> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);
    return state.waitQueue.map(w => w.agentRole);
  });
}

/**
 * Get active slots
 *
 * @param projectDir - Project directory
 * @returns Array of active execution slots
 */
export async function getActiveSlots(projectDir: string): Promise<ExecutionSlot[]> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);
    return [...state.activeSlots];
  });
}

/**
 * Get concurrency status
 *
 * @param projectDir - Project directory
 * @param config - Optional configuration override
 * @returns Concurrency status information
 */
export async function getConcurrencyStatus(
  projectDir: string,
  config?: Partial<ConcurrencyConfig>
): Promise<{
  maxConcurrent: number;
  active: number;
  available: number;
  waiting: number;
  activeSlots: ExecutionSlot[];
}> {
  const lockPath = getLockPath(projectDir);
  const fullConfig = loadConfig(config);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);

    return {
      maxConcurrent: fullConfig.maxConcurrentAgents,
      active: state.activeSlots.length,
      available: Math.max(0, fullConfig.maxConcurrentAgents - state.activeSlots.length),
      waiting: state.waitQueue.length,
      activeSlots: [...state.activeSlots]
    };
  });
}

/**
 * Clear all slots (use with caution)
 *
 * @param projectDir - Project directory
 */
export async function clearAllSlots(projectDir: string): Promise<void> {
  const lockPath = getLockPath(projectDir);

  return withLock(lockPath, async () => {
    const state = loadConcurrencyState(projectDir);

    console.log(
      `🗑️ Clearing all concurrency slots ` +
      `(${state.activeSlots.length} active, ${state.waitQueue.length} waiting)`
    );

    // Move active slots to history
    const now = Date.now();
    for (const slot of state.activeSlots) {
      state.history.push({
        slotId: slot.slotId,
        agentRole: slot.agentRole,
        acquiredAt: slot.acquiredAt,
        releasedAt: now,
        reason: 'cleared'
      });
    }

    state.activeSlots = [];
    state.waitQueue = [];

    saveConcurrencyState(projectDir, state);
  });
}

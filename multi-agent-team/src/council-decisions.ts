/**
 * Council Decisions Module - Leadership Council Decision Recording
 *
 * Records all leadership council decisions with full audit trail.
 * Tracks which domains participated, votes, outcomes, and related cross-checks.
 */

import * as path from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { withLock } from './state-lock';
import { PowerDomain } from './leadership';

// ============================================================================
// Types
// ============================================================================

export type DecisionOutcome = 'approved' | 'rejected' | 'escalated';
export type DomainVote = 'approve' | 'object' | 'abstain';

export interface CouncilDecision {
  id: string;
  type: string;
  primaryDomain: PowerDomain;
  decision: string;
  context?: string;
  crossCheckId?: string;
  participants: Array<{
    domain: PowerDomain;
    vote: DomainVote;
    reason?: string;
  }>;
  outcome: DecisionOutcome;
  timestamp: number;
}

// ============================================================================
// File Operations
// ============================================================================

function getDecisionsPath(projectDir: string): string {
  return path.join(projectDir, 'council-decisions.json');
}

async function readDecisions(projectDir: string): Promise<CouncilDecision[]> {
  const filePath = getDecisionsPath(projectDir);
  if (!existsSync(filePath)) {
    return [];
  }
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function writeDecisions(
  projectDir: string,
  decisions: CouncilDecision[]
): Promise<void> {
  const filePath = getDecisionsPath(projectDir);
  if (!existsSync(projectDir)) {
    await mkdir(projectDir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(decisions, null, 2), 'utf-8');
}

function generateId(): string {
  return `cd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Record a council decision
 */
export async function recordDecision(
  projectDir: string,
  decision: Omit<CouncilDecision, 'id' | 'timestamp'>
): Promise<CouncilDecision> {
  const lockPath = path.join(projectDir, '.council-decisions.lock');

  return withLock(lockPath, async () => {
    const decisions = await readDecisions(projectDir);

    const record: CouncilDecision = {
      ...decision,
      id: generateId(),
      timestamp: Date.now(),
    };

    decisions.push(record);
    await writeDecisions(projectDir, decisions);
    return record;
  });
}

/**
 * Get all decision history for a project
 */
export async function getDecisionHistory(
  projectDir: string
): Promise<CouncilDecision[]> {
  return readDecisions(projectDir);
}

/**
 * Get decisions filtered by primary domain
 */
export async function getDecisionsByDomain(
  projectDir: string,
  domain: PowerDomain
): Promise<CouncilDecision[]> {
  const decisions = await readDecisions(projectDir);
  return decisions.filter((d) => d.primaryDomain === domain);
}

/**
 * Get decisions filtered by type
 */
export async function getDecisionsByType(
  projectDir: string,
  type: string
): Promise<CouncilDecision[]> {
  const decisions = await readDecisions(projectDir);
  return decisions.filter((d) => d.type === type);
}

/**
 * Get the latest decision for a specific type
 */
export async function getLatestDecision(
  projectDir: string,
  type: string
): Promise<CouncilDecision | null> {
  const decisions = await readDecisions(projectDir);
  const matching = decisions
    .filter((d) => d.type === type)
    .sort((a, b) => b.timestamp - a.timestamp);
  return matching[0] || null;
}

/**
 * Get decisions by cross-check ID
 */
export async function getDecisionByCrossCheck(
  projectDir: string,
  crossCheckId: string
): Promise<CouncilDecision | null> {
  const decisions = await readDecisions(projectDir);
  return decisions.find((d) => d.crossCheckId === crossCheckId) || null;
}

/**
 * Get decision statistics for a project
 */
export async function getDecisionStats(
  projectDir: string
): Promise<{
  total: number;
  byDomain: Record<PowerDomain, number>;
  byOutcome: Record<DecisionOutcome, number>;
}> {
  const decisions = await readDecisions(projectDir);

  const byDomain: Record<PowerDomain, number> = {
    [PowerDomain.PLANNING]: 0,
    [PowerDomain.EXECUTION]: 0,
    [PowerDomain.QUALITY]: 0,
  };

  const byOutcome: Record<DecisionOutcome, number> = {
    approved: 0,
    rejected: 0,
    escalated: 0,
  };

  decisions.forEach((d) => {
    byDomain[d.primaryDomain]++;
    byOutcome[d.outcome]++;
  });

  return {
    total: decisions.length,
    byDomain,
    byOutcome,
  };
}

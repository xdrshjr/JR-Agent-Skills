/**
 * Cross-Check Module - Inter-Leader Approval & Challenge Protocol
 *
 * Implements the cross-check mechanism where key decisions require
 * primary approval + co-signoff from other power domains.
 * Handles objections, responses, and escalation to user.
 */

import * as path from 'path';
import * as fs from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { withLock } from './state-lock';
import { PowerDomain } from './leadership';
import { recordActivity, createSummary } from './leadership-activity';

// ============================================================================
// Types
// ============================================================================

export type CrossCheckStatus =
  | 'pending'
  | 'approved'
  | 'objected'
  | 'escalated'
  | 'resolved';

export interface Objection {
  fromDomain: PowerDomain;
  reason: string;
  timestamp: number;
}

export interface ObjectionResponse {
  toDomain: PowerDomain;
  response: string;
  resolved: boolean;
  timestamp: number;
}

export interface DomainSignoff {
  domain: PowerDomain;
  approved: boolean;
  reason?: string;
  timestamp: number;
}

export interface CrossCheckRequest {
  id: string;
  decisionType: string;
  primaryDomain: PowerDomain;
  requiredSignoffs: PowerDomain[];
  decision: any;
  decisionReason: string;
  status: CrossCheckStatus;
  signoffs: DomainSignoff[];
  objections: Objection[];
  responses: ObjectionResponse[];
  createdAt: number;
  resolvedAt?: number;
  escalationReason?: string;
}

// ============================================================================
// File Operations
// ============================================================================

function getCrossChecksPath(projectDir: string): string {
  return path.join(projectDir, 'cross-checks.json');
}

async function readCrossChecks(projectDir: string): Promise<CrossCheckRequest[]> {
  const filePath = getCrossChecksPath(projectDir);
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const data = await readFile(filePath, 'utf-8');
    if (!data.trim()) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Corrupted cross-checks.json at ${filePath}: ${error.message}`);
      return [];
    }
    throw error;
  }
}

async function writeCrossChecks(
  projectDir: string,
  checks: CrossCheckRequest[]
): Promise<void> {
  const filePath = getCrossChecksPath(projectDir);
  if (!existsSync(projectDir)) {
    await mkdir(projectDir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(checks, null, 2), 'utf-8');
}

function generateId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new cross-check request for a decision
 */
export async function createCrossCheck(
  projectDir: string,
  decisionType: string,
  primaryDomain: PowerDomain,
  requiredSignoffs: PowerDomain[],
  decision: any,
  decisionReason: string
): Promise<CrossCheckRequest> {
  const lockPath = path.join(projectDir, '.cross-checks.lock');

  return withLock(lockPath, async () => {
    const checks = await readCrossChecks(projectDir);

    // Validate inputs
    if (requiredSignoffs.includes(primaryDomain)) {
      throw new Error('Primary domain cannot be in requiredSignoffs');
    }
    if (requiredSignoffs.length === 0) {
      throw new Error('At least one required signoff domain is needed');
    }

    const newCheck: CrossCheckRequest = {
      id: generateId(),
      decisionType,
      primaryDomain,
      requiredSignoffs,
      decision,
      decisionReason,
      status: 'pending',
      signoffs: [
        {
          domain: primaryDomain,
          approved: true,
          reason: 'Primary decision maker',
          timestamp: Date.now(),
        },
      ],
      objections: [],
      responses: [],
      createdAt: Date.now(),
    };

    checks.push(newCheck);
    await writeCrossChecks(projectDir, checks);

    // Record leadership activity
    try {
      await recordActivity(projectDir, {
        type: 'cross_check_created',
        primaryDomain,
        summary: createSummary(
          'cross_check_created',
          primaryDomain,
          `${decisionType} - ${decisionReason}`
        ),
        relatedCrossCheckId: newCheck.id,
      });
    } catch (error) {
      console.warn('⚠️ Failed to record leadership activity:', error instanceof Error ? error.message : String(error));
    }

    return newCheck;
  });
}

/**
 * Sign off on a cross-check (approve or reject)
 */
export async function signoffCrossCheck(
  projectDir: string,
  checkId: string,
  domain: PowerDomain,
  approved: boolean,
  reason?: string
): Promise<CrossCheckRequest> {
  const lockPath = path.join(projectDir, '.cross-checks.lock');

  return withLock(lockPath, async () => {
    const checks = await readCrossChecks(projectDir);
    const check = checks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Cross-check ${checkId} not found`);
    }
    if (check.status !== 'pending' && check.status !== 'objected') {
      throw new Error(`Cross-check ${checkId} is ${check.status}, cannot sign off`);
    }

    // Remove any existing signoff from this domain
    check.signoffs = check.signoffs.filter((s) => s.domain !== domain);

    check.signoffs.push({
      domain,
      approved,
      reason,
      timestamp: Date.now(),
    });

    if (!approved) {
      check.status = 'objected';
      check.objections.push({
        fromDomain: domain,
        reason: reason || 'No reason provided',
        timestamp: Date.now(),
      });
    }

    // Check if all required signoffs are in and approved
    if (approved) {
      const allRequired = [check.primaryDomain, ...check.requiredSignoffs];
      const allApproved = allRequired.every((d) =>
        check.signoffs.some((s) => s.domain === d && s.approved)
      );
      if (allApproved) {
        check.status = 'approved';
        check.resolvedAt = Date.now();
      }
    }

    await writeCrossChecks(projectDir, checks);

    // Record leadership activity
    try {
      if (approved) {
        await recordActivity(projectDir, {
          type: 'approval_granted',
          primaryDomain: domain,
          summary: createSummary(
            'approval_granted',
            domain,
            `${check.decisionType}${reason ? ' - ' + reason : ''}`
          ),
          relatedCrossCheckId: checkId,
        });
      } else {
        await recordActivity(projectDir, {
          type: 'objection_raised',
          primaryDomain: domain,
          summary: createSummary(
            'objection_raised',
            domain,
            `${check.decisionType} - ${reason || '未说明理由'}`
          ),
          relatedCrossCheckId: checkId,
        });

        // Critical event: Real-time notification
        console.log(`\n🚨 [关键决策点] ${domain} 对 ${check.decisionType} 提出异议\n`);
        console.log(`   异议理由: ${reason}\n`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to record leadership activity:', error instanceof Error ? error.message : String(error));
    }

    return check;
  });
}

/**
 * Raise an objection to a cross-check decision
 */
export async function raiseObjection(
  projectDir: string,
  checkId: string,
  fromDomain: PowerDomain,
  reason: string
): Promise<CrossCheckRequest> {
  return signoffCrossCheck(projectDir, checkId, fromDomain, false, reason);
}

/**
 * Respond to an objection (primary domain responds)
 */
export async function respondToObjection(
  projectDir: string,
  checkId: string,
  toDomain: PowerDomain,
  response: string,
  resolved: boolean
): Promise<CrossCheckRequest> {
  const lockPath = path.join(projectDir, '.cross-checks.lock');

  return withLock(lockPath, async () => {
    const checks = await readCrossChecks(projectDir);
    const check = checks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Cross-check ${checkId} not found`);
    }
    if (check.status !== 'objected') {
      throw new Error(`Cross-check ${checkId} is ${check.status}, cannot respond to objections`);
    }

    // Validate that toDomain actually has an active objection
    const hasActiveObjection = check.objections.some((o) => o.fromDomain === toDomain);
    if (!hasActiveObjection) {
      throw new Error(`${toDomain} has not raised an objection on cross-check ${checkId}`);
    }

    check.responses.push({
      toDomain,
      response,
      resolved,
      timestamp: Date.now(),
    });

    if (resolved) {
      // Remove the objection signoff and replace with approval
      check.signoffs = check.signoffs.filter((s) => s.domain !== toDomain);
      check.signoffs.push({
        domain: toDomain,
        approved: true,
        reason: `Objection resolved: ${response}`,
        timestamp: Date.now(),
      });

      // Re-check if all required signoffs are now approved
      const allRequired = [check.primaryDomain, ...check.requiredSignoffs];
      const allApproved = allRequired.every((d) =>
        check.signoffs.some((s) => s.domain === d && s.approved)
      );
      if (allApproved) {
        check.status = 'approved';
        check.resolvedAt = Date.now();
      } else {
        check.status = 'pending';
      }
    }

    await writeCrossChecks(projectDir, checks);

    // Record leadership activity
    try {
      const activityType = resolved ? 'objection_resolved' : 'objection_responded';
      await recordActivity(projectDir, {
        type: activityType,
        primaryDomain: check.primaryDomain,
        summary: createSummary(
          activityType,
          check.primaryDomain,
          `${check.decisionType} - ${response.substring(0, 50)}${response.length > 50 ? '...' : ''}`
        ),
        relatedCrossCheckId: checkId,
      });

      if (resolved) {
        console.log(`\n✅ [权力制衡] 异议已解决: ${check.decisionType}\n`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to record leadership activity:', error instanceof Error ? error.message : String(error));
    }

    return check;
  });
}

/**
 * Escalate a cross-check to the user for final arbitration
 */
export async function escalateToUser(
  projectDir: string,
  checkId: string,
  reason: string
): Promise<CrossCheckRequest> {
  const lockPath = path.join(projectDir, '.cross-checks.lock');

  return withLock(lockPath, async () => {
    const checks = await readCrossChecks(projectDir);
    const check = checks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Cross-check ${checkId} not found`);
    }

    check.status = 'escalated';
    check.escalationReason = reason;
    check.resolvedAt = Date.now();

    await writeCrossChecks(projectDir, checks);

    // Record leadership activity
    try {
      await recordActivity(projectDir, {
        type: 'escalated_to_user',
        primaryDomain: check.primaryDomain,
        summary: createSummary(
          'escalated_to_user',
          check.primaryDomain,
          `${check.decisionType} - ${reason}`
        ),
        relatedCrossCheckId: checkId,
      });

      // Critical event: Real-time notification
      console.log(`\n🚨🚨 [升级至用户] ${check.decisionType} 需要您的决策\n`);
      console.log(`   升级理由: ${reason}\n`);
    } catch (error) {
      console.warn('⚠️ Failed to record leadership activity:', error instanceof Error ? error.message : String(error));
    }

    return check;
  });
}

/**
 * Resolve an escalated cross-check with user's decision
 */
export async function resolveEscalation(
  projectDir: string,
  checkId: string,
  approved: boolean,
  userReason: string
): Promise<CrossCheckRequest> {
  const lockPath = path.join(projectDir, '.cross-checks.lock');

  return withLock(lockPath, async () => {
    const checks = await readCrossChecks(projectDir);
    const check = checks.find((c) => c.id === checkId);
    if (!check) {
      throw new Error(`Cross-check ${checkId} not found`);
    }
    if (check.status !== 'escalated') {
      throw new Error(`Cross-check ${checkId} is not escalated`);
    }

    check.status = approved ? 'approved' : 'resolved';
    check.resolvedAt = Date.now();
    check.responses.push({
      toDomain: check.primaryDomain,
      response: `User decision: ${userReason}`,
      resolved: true,
      timestamp: Date.now(),
    });

    await writeCrossChecks(projectDir, checks);
    return check;
  });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get a specific cross-check by ID
 */
export async function getCrossCheckStatus(
  projectDir: string,
  checkId: string
): Promise<CrossCheckRequest | null> {
  const checks = await readCrossChecks(projectDir);
  return checks.find((c) => c.id === checkId) || null;
}

/**
 * Get all pending cross-checks, optionally filtered by domain
 */
export async function getPendingCrossChecks(
  projectDir: string,
  domain?: PowerDomain
): Promise<CrossCheckRequest[]> {
  const checks = await readCrossChecks(projectDir);
  const pending = checks.filter(
    (c) => c.status === 'pending' || c.status === 'objected'
  );

  if (!domain) return pending;

  // Return checks where this domain needs to sign off
  return pending.filter(
    (c) =>
      (c.primaryDomain === domain || c.requiredSignoffs.includes(domain)) &&
      !c.signoffs.some((s) => s.domain === domain && s.approved)
  );
}

/**
 * Get all cross-checks for a project
 */
export async function getAllCrossChecks(
  projectDir: string
): Promise<CrossCheckRequest[]> {
  return readCrossChecks(projectDir);
}

/**
 * Check if a decision type has been fully approved
 */
export async function isDecisionApproved(
  projectDir: string,
  decisionType: string
): Promise<boolean> {
  const checks = await readCrossChecks(projectDir);
  return checks.some(
    (c) => c.decisionType === decisionType && c.status === 'approved'
  );
}

/**
 * Get the latest cross-check for a decision type
 */
export async function getLatestCrossCheck(
  projectDir: string,
  decisionType: string
): Promise<CrossCheckRequest | null> {
  const checks = await readCrossChecks(projectDir);
  const matching = checks
    .filter((c) => c.decisionType === decisionType)
    .sort((a, b) => b.createdAt - a.createdAt);
  return matching[0] || null;
}

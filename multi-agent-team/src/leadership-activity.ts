/**
 * Leadership Activity Module - Records and Displays Leadership Council Activities
 *
 * Provides visibility into the separation-of-powers (三权分立) interactions:
 * - Cross-check approvals and objections
 * - Council decisions
 * - Escalations to user
 *
 * Purpose: Make the power-balancing process visible to users through:
 * - WHITEBOARD.md recent activity section
 * - Periodic monitoring reports
 * - Real-time notifications for critical events
 */

import * as path from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { withLock } from './state-lock';
import { PowerDomain } from './leadership';

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | 'cross_check_created'
  | 'approval_granted'
  | 'objection_raised'
  | 'objection_responded'
  | 'objection_resolved'
  | 'escalated_to_user'
  | 'decision_approved'
  | 'decision_rejected';

export interface LeadershipActivity {
  id: string; // Format: la-{timestamp}-{random}
  timestamp: number; // Unix timestamp in milliseconds
  type: ActivityType; // Type of activity
  primaryDomain: PowerDomain; // Primary power domain involved
  summary: string; // 1-2 line summary for display
  relatedCrossCheckId?: string; // Reference to cross-check ID
  relatedDecisionId?: string; // Reference to council decision ID
}

// ============================================================================
// Constants
// ============================================================================

const MAX_ACTIVITIES = 100; // Keep only the most recent 100 activities

/**
 * Activity formatting templates
 * Used to generate concise summaries for each activity type
 */
const ACTIVITY_FORMATS: Record<
  ActivityType,
  (domain: string, detail: string) => string
> = {
  cross_check_created: (domain, detail) => `🆕 ${domain} 发起决策审批: ${detail}`,
  approval_granted: (domain, detail) => `✅ ${domain} 批准: ${detail}`,
  objection_raised: (domain, detail) => `⚠️ ${domain} 提出异议: ${detail}`,
  objection_responded: (domain, detail) => `💬 ${domain} 回应异议: ${detail}`,
  objection_resolved: (domain, detail) => `✔️ ${domain} 异议已解决: ${detail}`,
  escalated_to_user: (domain, detail) => `🚨 升级至用户: ${detail}`,
  decision_approved: (domain, detail) => `👍 决策通过: ${detail}`,
  decision_rejected: (domain, detail) => `👎 决策驳回: ${detail}`,
};

/**
 * Domain display names (中文)
 */
const DOMAIN_LABELS: Record<PowerDomain, string> = {
  [PowerDomain.PLANNING]: '规划权',
  [PowerDomain.EXECUTION]: '执行权',
  [PowerDomain.QUALITY]: '质量权',
};

// ============================================================================
// File Operations
// ============================================================================

function getActivityPath(projectDir: string): string {
  return path.join(projectDir, 'leadership-activity.json');
}

async function readActivities(
  projectDir: string
): Promise<LeadershipActivity[]> {
  const filePath = getActivityPath(projectDir);
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
      console.error(
        `Corrupted leadership-activity.json at ${filePath}: ${error.message}`
      );
      return [];
    }
    throw error;
  }
}

async function writeActivities(
  projectDir: string,
  activities: LeadershipActivity[]
): Promise<void> {
  const filePath = getActivityPath(projectDir);
  if (!existsSync(projectDir)) {
    await mkdir(projectDir, { recursive: true });
  }
  // Keep only the most recent MAX_ACTIVITIES
  const trimmed = activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ACTIVITIES);
  await writeFile(filePath, JSON.stringify(trimmed, null, 2), 'utf-8');
}

function generateId(): string {
  return `la-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Record a leadership activity
 *
 * @param projectDir - Project directory path
 * @param activity - Activity details (without id and timestamp)
 * @returns The recorded activity with id and timestamp
 */
export async function recordActivity(
  projectDir: string,
  activity: Omit<LeadershipActivity, 'id' | 'timestamp'>
): Promise<LeadershipActivity> {
  const lockPath = path.join(projectDir, '.leadership-activity.lock');

  return withLock(lockPath, async () => {
    const activities = await readActivities(projectDir);

    const record: LeadershipActivity = {
      ...activity,
      id: generateId(),
      timestamp: Date.now(),
    };

    activities.push(record);
    await writeActivities(projectDir, activities);
    return record;
  });
}

/**
 * Get recent leadership activities
 *
 * @param projectDir - Project directory path
 * @param sinceMinutes - Optional: Get activities from the last N minutes
 * @param limit - Optional: Maximum number of activities to return (default: 10)
 * @returns Array of recent activities, sorted by timestamp (newest first)
 */
export async function getRecentActivities(
  projectDir: string,
  sinceMinutes?: number,
  limit: number = 10
): Promise<LeadershipActivity[]> {
  const activities = await readActivities(projectDir);

  let filtered = activities;

  // Filter by time if specified
  if (sinceMinutes !== undefined && sinceMinutes > 0) {
    const cutoffTime = Date.now() - sinceMinutes * 60 * 1000;
    filtered = activities.filter((a) => a.timestamp >= cutoffTime);
  }

  // Sort by timestamp (newest first) and limit
  return filtered
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Get all leadership activities
 *
 * @param projectDir - Project directory path
 * @returns Array of all activities, sorted by timestamp (newest first)
 */
export async function getAllActivities(
  projectDir: string
): Promise<LeadershipActivity[]> {
  const activities = await readActivities(projectDir);
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Format an activity as a summary string
 *
 * @param activity - The activity to format
 * @returns Formatted summary string (e.g., "✅ 规划权 批准: team_composition - 资源充足")
 */
export function formatActivitySummary(activity: LeadershipActivity): string {
  return activity.summary;
}

/**
 * Format an activity with timestamp for display
 *
 * @param activity - The activity to format
 * @param includeDate - Whether to include date (default: false, only time)
 * @returns Formatted string (e.g., "[14:35] ✅ 规划权 批准: team_composition - 资源充足")
 */
export function formatActivityWithTime(
  activity: LeadershipActivity,
  includeDate: boolean = false
): string {
  const date = new Date(activity.timestamp);
  const timeStr = includeDate
    ? date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

  return `[${timeStr}] ${activity.summary}`;
}

/**
 * Create a formatted summary for an activity
 *
 * @param type - Activity type
 * @param domain - Power domain
 * @param detail - Detail string (e.g., "team_composition - 创建3人团队")
 * @returns Formatted summary string
 */
export function createSummary(
  type: ActivityType,
  domain: PowerDomain,
  detail: string
): string {
  const formatter = ACTIVITY_FORMATS[type];
  const domainLabel = DOMAIN_LABELS[domain];
  return formatter(domainLabel, detail);
}

/**
 * Clear old activities (keep only recent N days)
 *
 * @param projectDir - Project directory path
 * @param keepDays - Number of days to keep (default: 7)
 */
export async function cleanupOldActivities(
  projectDir: string,
  keepDays: number = 7
): Promise<void> {
  const lockPath = path.join(projectDir, '.leadership-activity.lock');

  await withLock(lockPath, async () => {
    const activities = await readActivities(projectDir);
    const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;

    const filtered = activities.filter((a) => a.timestamp >= cutoffTime);

    await writeActivities(projectDir, filtered);
  });
}

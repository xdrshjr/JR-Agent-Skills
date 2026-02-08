/**
 * Constants for multi-agent team coordination
 */

// Monitoring intervals
export const MONITORING_INTERVAL_MINUTES = 3;
export const AGENT_TIMEOUT_SECONDS = 1800; // 30 minutes

// Agent lifecycle
export const MAX_RETRY_ATTEMPTS = 3;
export const QA_MAX_RETRY_ATTEMPTS = 3;

// Agent cleanup reasons
export const CLEANUP_REASONS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
} as const;

export type CleanupReason = typeof CLEANUP_REASONS[keyof typeof CLEANUP_REASONS];

// Agent statuses
export const AGENT_STATUSES = {
  RUNNING: 'RUNNING',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  VERIFIED: 'VERIFIED',
  PAUSED: 'PAUSED',
  RETURNED_FOR_FIX: 'RETURNED_FOR_FIX',
} as const;

export type AgentStatus = typeof AGENT_STATUSES[keyof typeof AGENT_STATUSES];

// Phase statuses
export const PHASE_STATUSES = {
  SKILL_DISCOVERY: 'skill_discovery',
  REQUIREMENT: 'requirement',
  SKILL_RESEARCH: 'skill_research',
  PLAN_DESIGN: 'plan_design',
  AWAITING_APPROVAL: 'awaiting_approval',
  EXECUTION: 'execution',
  COMPLETION: 'completion',
} as const;

export type PhaseStatus = typeof PHASE_STATUSES[keyof typeof PHASE_STATUSES];

// Power domains (三权分立)
export const POWER_DOMAINS = {
  PLANNING: 'planning',
  EXECUTION: 'execution',
  QUALITY: 'quality',
} as const;

export type PowerDomain = typeof POWER_DOMAINS[keyof typeof POWER_DOMAINS];

export const DOMAIN_LABELS = {
  [POWER_DOMAINS.PLANNING]: '规划权',
  [POWER_DOMAINS.EXECUTION]: '执行权',
  [POWER_DOMAINS.QUALITY]: '质量权',
} as const;

// Confidence dimensions
export const CONFIDENCE_DIMENSIONS = {
  SCOPE: 'scope',
  TECHNICAL: 'technical',
  DELIVERABLES: 'deliverables',
  CONSTRAINTS: 'constraints',
  CONTEXT: 'context',
} as const;

export type ConfidenceDimension = typeof CONFIDENCE_DIMENSIONS[keyof typeof CONFIDENCE_DIMENSIONS];

export const DIMENSION_LABELS: Record<ConfidenceDimension, string> = {
  [CONFIDENCE_DIMENSIONS.SCOPE]: 'Scope',
  [CONFIDENCE_DIMENSIONS.TECHNICAL]: 'Technical',
  [CONFIDENCE_DIMENSIONS.DELIVERABLES]: 'Deliverable',
  [CONFIDENCE_DIMENSIONS.CONSTRAINTS]: 'Constraints',
  [CONFIDENCE_DIMENSIONS.CONTEXT]: 'Context',
};

// Project structure
export const PROJECT_DIRECTORIES = {
  DELIVERABLES: 'deliverables',
  ISSUES: 'issues',
  LOGS: 'logs',
  ASSETS: 'assets',
} as const;

// Task types
export const TASK_TYPES = {
  DOCUMENT: 'document',
  CODE: 'code',
  RESEARCH: 'research',
  DESIGN: 'design',
  VIDEO: 'video',
  GENERIC: 'generic',
} as const;

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];

// Requirement clarification
export const CLARIFICATION_CONFIG = {
  MIN_ROUNDS: 2,
  SOFT_MAX_ROUNDS: 3,
  CONFIDENCE_THRESHOLD: 75,
  QUESTIONS_PER_ROUND: 5,
} as const;

// Concurrency limits
export const CONCURRENCY_CONFIG = {
  MAX_CONCURRENT_AGENTS: 3,
  MAX_WAIT_QUEUE: 10,
  SLOT_TIMEOUT_MS: 1800000, // 30 minutes
} as const;

// Request validation
export const REQUEST_VALIDATION = {
  MAX_LENGTH: 5000,
  MIN_LENGTH: 1,
} as const;

// Similar project detection
export const SIMILAR_PROJECT_CONFIG = {
  CHECK_RECENT_COUNT: 10,
  MIN_KEYWORD_MATCHES: 3,
  MAX_RESULTS: 3,
} as const;

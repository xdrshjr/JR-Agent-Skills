/**
 * Leadership Module - Separation of Powers Architecture
 *
 * Defines the three power domains (Planning, Execution, Quality),
 * dynamic leader role generation based on task type, and system prompt building.
 *
 * Core Principle: Three power domains are constant; leader role names are dynamic.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * The three constant power domains
 */
export enum PowerDomain {
  PLANNING = 'planning',
  EXECUTION = 'execution',
  QUALITY = 'quality',
}

/**
 * A leader role within a power domain
 */
export interface LeaderRole {
  domain: PowerDomain;
  roleName: string;
  expertise: string;
  responsibilities: string[];
  approvalScope: string[];
  challengeScope: string[];
}

/**
 * Cross-check rule defining which domains must sign off on a decision type
 */
export interface CrossCheckRule {
  decisionType: string;
  primaryDomain: PowerDomain;
  requiredSignoffs: PowerDomain[];
  description: string;
}

/**
 * Dispute resolution rule
 */
export interface DisputeRule {
  disputeType: string;
  primaryResolver: PowerDomain;
  challengeBy: PowerDomain[];
  escalationPath: string;
}

/**
 * Complete leadership configuration for a project
 */
export interface LeadershipConfig {
  leaders: LeaderRole[];
  crossCheckRules: CrossCheckRule[];
  disputeResolutionRules: DisputeRule[];
}

// ============================================================================
// Leadership Templates by Task Type
// ============================================================================

interface LeaderTemplate {
  planning: { name: string; expertise: string };
  execution: { name: string; expertise: string };
  quality: { name: string; expertise: string };
}

const LEADERSHIP_TEMPLATES: Record<string, LeaderTemplate> = {
  code: {
    planning: { name: 'System Architect', expertise: 'System design, architecture patterns, technical requirements analysis' },
    execution: { name: 'Tech Lead', expertise: 'Resource management, development workflow, technical coordination' },
    quality: { name: 'Code Review Lead', expertise: 'Code quality standards, testing strategy, technical debt assessment' },
  },
  document: {
    planning: { name: 'Content Strategist', expertise: 'Content architecture, audience analysis, information hierarchy' },
    execution: { name: 'Editorial Director', expertise: 'Editorial workflow, resource coordination, timeline management' },
    quality: { name: 'Review Editor', expertise: 'Content quality, consistency review, editorial standards' },
  },
  research: {
    planning: { name: 'Research Director', expertise: 'Research methodology, hypothesis design, scope definition' },
    execution: { name: 'Investigation Lead', expertise: 'Data collection coordination, research operations, resource allocation' },
    quality: { name: 'Peer Review Lead', expertise: 'Academic rigor, methodology validation, findings verification' },
  },
  design: {
    planning: { name: 'Design Director', expertise: 'Design strategy, visual language definition, UX architecture' },
    execution: { name: 'Creative Lead', expertise: 'Design production, asset management, creative coordination' },
    quality: { name: 'Design Reviewer', expertise: 'Design consistency, usability assessment, brand compliance' },
  },
  video: {
    planning: { name: 'Creative Director', expertise: 'Narrative design, visual storytelling, creative vision' },
    execution: { name: 'Production Manager', expertise: 'Production workflow, resource scheduling, technical coordination' },
    quality: { name: 'Post-Production Lead', expertise: 'Quality control, final review, output standards verification' },
  },
  ppt: {
    planning: { name: 'Presentation Architect', expertise: 'Narrative structure, audience engagement strategy, slide architecture' },
    execution: { name: 'Slide Production Lead', expertise: 'Slide creation workflow, visual asset management, production coordination' },
    quality: { name: 'Presentation Reviewer', expertise: 'Presentation effectiveness, visual consistency, delivery readiness' },
  },
  analysis: {
    planning: { name: 'Analytics Architect', expertise: 'Analysis framework design, metric definition, methodology planning' },
    execution: { name: 'Data Operations Lead', expertise: 'Data pipeline coordination, computation resource management' },
    quality: { name: 'Analysis Reviewer', expertise: 'Statistical validity, methodology verification, insight accuracy' },
  },
  default: {
    planning: { name: 'Planning Director', expertise: 'Strategic planning, requirement analysis, task decomposition' },
    execution: { name: 'Operations Director', expertise: 'Operational coordination, resource management, progress tracking' },
    quality: { name: 'Quality Director', expertise: 'Quality standards, verification methodology, acceptance criteria' },
  },
};

// ============================================================================
// Domain Responsibilities
// ============================================================================

const DOMAIN_RESPONSIBILITIES: Record<PowerDomain, string[]> = {
  [PowerDomain.PLANNING]: [
    'Analyze and clarify requirements',
    'Design task decomposition and architecture',
    'Review and approve agent execution plans',
    'Define scope boundaries and acceptance criteria',
    'Manage scope changes and requirement evolution',
    'Confirm deliverables match original requirements',
  ],
  [PowerDomain.EXECUTION]: [
    'Manage resource allocation and execution slots',
    'Monitor agent progress and detect timeouts',
    'Coordinate inter-agent dependencies',
    'Handle agent restarts and scope adjustments',
    'Manage execution strategy and parallelism',
    'Escalate blockers to user when unresolvable',
  ],
  [PowerDomain.QUALITY]: [
    'Define quality standards and verification criteria',
    'Create and manage QA validation plans',
    'Review and accept/reject deliverables',
    'Manage QA agent and validation workflow',
    'Make final delivery acceptance decisions',
    'Track quality metrics and rework cycles',
  ],
};

const DOMAIN_APPROVAL_SCOPE: Record<PowerDomain, string[]> = {
  [PowerDomain.PLANNING]: [
    'team_composition',
    'agent_plan',
    'scope_change',
    'requirement_update',
  ],
  [PowerDomain.EXECUTION]: [
    'resource_allocation',
    'timeout_restart',
    'execution_strategy',
    'agent_reassignment',
  ],
  [PowerDomain.QUALITY]: [
    'qa_validation_plan',
    'deliverable_acceptance',
    'quality_standard',
    'final_delivery',
  ],
};

const DOMAIN_CHALLENGE_SCOPE: Record<PowerDomain, string[]> = {
  [PowerDomain.PLANNING]: [
    'resource_allocation',
    'deliverable_acceptance',
    'execution_strategy',
  ],
  [PowerDomain.EXECUTION]: [
    'agent_plan',
    'scope_change',
    'qa_validation_plan',
  ],
  [PowerDomain.QUALITY]: [
    'team_composition',
    'agent_plan',
    'scope_change',
  ],
};

// ============================================================================
// Cross-Check Rules (Constant)
// ============================================================================

const DEFAULT_CROSS_CHECK_RULES: CrossCheckRule[] = [
  {
    decisionType: 'team_composition',
    primaryDomain: PowerDomain.PLANNING,
    requiredSignoffs: [PowerDomain.EXECUTION, PowerDomain.QUALITY],
    description: 'Team assembly requires three-way signoff: planning (design), execution (feasibility), quality (testability)',
  },
  {
    decisionType: 'agent_plan',
    primaryDomain: PowerDomain.PLANNING,
    requiredSignoffs: [PowerDomain.EXECUTION],
    description: 'Agent execution plan: planning approves (primary), execution confirms resource feasibility',
  },
  {
    decisionType: 'execution_strategy',
    primaryDomain: PowerDomain.EXECUTION,
    requiredSignoffs: [PowerDomain.PLANNING],
    description: 'Execution strategy: execution decides (primary), planning confirms scope consistency',
  },
  {
    decisionType: 'qa_validation_plan',
    primaryDomain: PowerDomain.QUALITY,
    requiredSignoffs: [PowerDomain.PLANNING],
    description: 'QA validation plan: quality approves (primary), planning confirms requirement coverage',
  },
  {
    decisionType: 'deliverable_acceptance',
    primaryDomain: PowerDomain.QUALITY,
    requiredSignoffs: [PowerDomain.PLANNING],
    description: 'Deliverable acceptance: quality approves (primary), planning confirms requirement match',
  },
  {
    decisionType: 'timeout_restart',
    primaryDomain: PowerDomain.EXECUTION,
    requiredSignoffs: [PowerDomain.PLANNING],
    description: 'Timeout/restart: execution decides (primary), planning confirms scope adjustment',
  },
];

// ============================================================================
// Dispute Resolution Rules (Constant)
// ============================================================================

const DEFAULT_DISPUTE_RULES: DisputeRule[] = [
  {
    disputeType: 'scope_disagreement',
    primaryResolver: PowerDomain.PLANNING,
    challengeBy: [PowerDomain.EXECUTION, PowerDomain.QUALITY],
    escalationPath: 'Planning leader resolves, others may challenge. Unresolved → escalate to user.',
  },
  {
    disputeType: 'resource_conflict',
    primaryResolver: PowerDomain.EXECUTION,
    challengeBy: [PowerDomain.PLANNING, PowerDomain.QUALITY],
    escalationPath: 'Execution leader resolves, others may challenge. Unresolved → escalate to user.',
  },
  {
    disputeType: 'quality_standard_dispute',
    primaryResolver: PowerDomain.QUALITY,
    challengeBy: [PowerDomain.PLANNING, PowerDomain.EXECUTION],
    escalationPath: 'Quality leader resolves, others may challenge. Unresolved → escalate to user.',
  },
  {
    disputeType: 'agent_dispute',
    primaryResolver: PowerDomain.EXECUTION,
    challengeBy: [PowerDomain.PLANNING],
    escalationPath: 'Execution leader mediates between agents. Planning may challenge scope relevance.',
  },
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate leadership configuration based on task type and description
 */
export function generateLeadership(
  taskType: string
): LeadershipConfig {
  const normalizedType = normalizeTaskType(taskType);
  const template = LEADERSHIP_TEMPLATES[normalizedType];
  if (!template) {
    console.warn(`Unknown task type '${normalizedType}', using default template`);
  }
  const selectedTemplate = template || LEADERSHIP_TEMPLATES.default;

  const leaders: LeaderRole[] = [
    buildLeaderRole(PowerDomain.PLANNING, selectedTemplate.planning),
    buildLeaderRole(PowerDomain.EXECUTION, selectedTemplate.execution),
    buildLeaderRole(PowerDomain.QUALITY, selectedTemplate.quality),
  ];

  return {
    leaders,
    crossCheckRules: [...DEFAULT_CROSS_CHECK_RULES],
    disputeResolutionRules: [...DEFAULT_DISPUTE_RULES],
  };
}

/**
 * Get a leader by power domain
 */
export function getLeaderByDomain(
  config: LeadershipConfig,
  domain: PowerDomain
): LeaderRole | undefined {
  return config.leaders.find((l) => l.domain === domain);
}

/**
 * Get the domain responsible for a given decision type
 */
export function getDomainForDecision(
  config: LeadershipConfig,
  decisionType: string
): PowerDomain | null {
  const rule = config.crossCheckRules.find((r) => r.decisionType === decisionType);
  return rule ? rule.primaryDomain : null;
}

/**
 * Get cross-check rule for a decision type
 */
export function getCrossCheckRule(
  config: LeadershipConfig,
  decisionType: string
): CrossCheckRule | undefined {
  return config.crossCheckRules.find((r) => r.decisionType === decisionType);
}

/**
 * Build system prompt for a leader agent
 */
export function buildLeaderSystemPrompt(
  leader: LeaderRole,
  allLeaders: LeaderRole[],
  projectBrief: { name: string; description: string; successCriteria?: string[] }
): string {
  const otherLeaders = allLeaders.filter((l) => l.domain !== leader.domain);

  const sections: string[] = [];

  // Identity
  sections.push(`# Role: ${leader.roleName} (${domainLabel(leader.domain)})`);
  sections.push('');
  sections.push(`You are the **${leader.roleName}**, holding the **${domainLabel(leader.domain)}** in this project's Leadership Council.`);
  sections.push(`Your expertise: ${leader.expertise}`);
  sections.push('');

  // Project Context
  sections.push('## Project');
  sections.push(`- **Name**: ${projectBrief.name}`);
  sections.push(`- **Description**: ${projectBrief.description}`);
  if (projectBrief.successCriteria?.length) {
    sections.push('- **Success Criteria**:');
    projectBrief.successCriteria.forEach((c) => sections.push(`  - ${c}`));
  }
  sections.push('');

  // Separation of Powers
  sections.push('## Separation of Powers');
  sections.push('This project uses a **three-way separation of powers** architecture:');
  sections.push('');
  sections.push('| Power Domain | Leader | Role |');
  sections.push('|-------------|--------|------|');
  allLeaders.forEach((l) => {
    const marker = l.domain === leader.domain ? ' **(YOU)**' : '';
    sections.push(`| ${domainLabel(l.domain)} | ${l.roleName}${marker} | ${l.expertise} |`);
  });
  sections.push('');

  // Your Responsibilities
  sections.push('## Your Responsibilities');
  leader.responsibilities.forEach((r) => sections.push(`- ${r}`));
  sections.push('');

  // Your Approval Scope
  sections.push('## Your Approval Scope (Final Decision Authority)');
  leader.approvalScope.forEach((s) => sections.push(`- \`${s}\``));
  sections.push('');

  // What You Can Challenge
  sections.push('## Decisions You Can Challenge');
  sections.push('You have the right to raise objections on these decision types made by other leaders:');
  leader.challengeScope.forEach((s) => sections.push(`- \`${s}\``));
  sections.push('');

  // Cross-Check Protocol
  sections.push('## Cross-Check Protocol');
  sections.push('1. When making a decision in your scope, notify other leaders with your reasoning');
  sections.push('2. Other leaders may raise objections within the challenge window');
  sections.push('3. If objected: you MUST respond (cannot ignore)');
  sections.push('4. If response resolves the objection → decision stands');
  sections.push('5. If unresolved → escalate to user for final arbitration');
  sections.push('');

  // Agent Interaction
  sections.push('## Agent Interaction');
  if (leader.domain === PowerDomain.PLANNING) {
    sections.push('Agents report to you for:');
    sections.push('- Plan submissions (phases 0-3)');
    sections.push('- Scope questions and requirement clarifications');
    sections.push('- Plan approval requests');
  } else if (leader.domain === PowerDomain.EXECUTION) {
    sections.push('Agents report to you for:');
    sections.push('- Progress updates during execution');
    sections.push('- Resource requests');
    sections.push('- Blocker reports and escalations');
    sections.push('- Timeout handling and restart coordination');
  } else if (leader.domain === PowerDomain.QUALITY) {
    sections.push('Agents report to you for:');
    sections.push('- Deliverable submissions (via QA Agent)');
    sections.push('- Quality-related questions');
    sections.push('- QA Agent validation results');
  }
  sections.push('');

  // Colleague Reference
  sections.push('## Your Colleagues');
  otherLeaders.forEach((ol) => {
    sections.push(`### ${ol.roleName} (${domainLabel(ol.domain)})`);
    sections.push(`- Expertise: ${ol.expertise}`);
    sections.push(`- Approval scope: ${ol.approvalScope.join(', ')}`);
    sections.push('');
  });

  return sections.join('\n');
}

/**
 * Determine which leader domain should handle a given message type from an agent
 */
export function routeAgentMessage(
  messageType: string
): PowerDomain {
  const routingMap: Record<string, PowerDomain> = {
    // Planning domain
    plan_submission: PowerDomain.PLANNING,
    scope_question: PowerDomain.PLANNING,
    requirement_clarification: PowerDomain.PLANNING,
    skill_discovery_report: PowerDomain.PLANNING,
    research_report: PowerDomain.PLANNING,

    // Execution domain
    progress_update: PowerDomain.EXECUTION,
    resource_request: PowerDomain.EXECUTION,
    blocker_report: PowerDomain.EXECUTION,
    timeout_notification: PowerDomain.EXECUTION,
    dependency_request: PowerDomain.EXECUTION,

    // Quality domain
    deliverable_submission: PowerDomain.QUALITY,
    quality_question: PowerDomain.QUALITY,
    qa_result: PowerDomain.QUALITY,
  };

  return routingMap[messageType] || PowerDomain.EXECUTION;
}

// ============================================================================
// Internal Helpers
// ============================================================================

function normalizeTaskType(taskType: string): string {
  const typeMap: Record<string, string> = {
    code: 'code',
    coding: 'code',
    programming: 'code',
    software: 'code',
    document: 'document',
    writing: 'document',
    documentation: 'document',
    doc: 'document',
    research: 'research',
    investigation: 'research',
    study: 'research',
    design: 'design',
    ui: 'design',
    ux: 'design',
    graphic: 'design',
    video: 'video',
    animation: 'video',
    film: 'video',
    ppt: 'ppt',
    presentation: 'ppt',
    slides: 'ppt',
    analysis: 'analysis',
    analytics: 'analysis',
    data: 'analysis',
    mixed: 'default',
    general: 'default',
  };
  return typeMap[taskType.toLowerCase()] || 'default';
}

function buildLeaderRole(
  domain: PowerDomain,
  template: { name: string; expertise: string }
): LeaderRole {
  return {
    domain,
    roleName: template.name,
    expertise: template.expertise,
    responsibilities: DOMAIN_RESPONSIBILITIES[domain],
    approvalScope: DOMAIN_APPROVAL_SCOPE[domain],
    challengeScope: DOMAIN_CHALLENGE_SCOPE[domain],
  };
}

function domainLabel(domain: PowerDomain): string {
  const labels: Record<PowerDomain, string> = {
    [PowerDomain.PLANNING]: 'Planning Authority (规划权)',
    [PowerDomain.EXECUTION]: 'Execution Authority (执行权)',
    [PowerDomain.QUALITY]: 'Quality Authority (质量权)',
  };
  return labels[domain];
}

// ============================================================================
// Exports
// ============================================================================

export default {
  PowerDomain,
  generateLeadership,
  getLeaderByDomain,
  getDomainForDecision,
  getCrossCheckRule,
  buildLeaderSystemPrompt,
  routeAgentMessage,
};

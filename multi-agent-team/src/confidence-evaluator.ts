/**
 * Confidence evaluation for requirement clarification
 * Multi-dimensional scoring to determine if requirements are clear enough
 */

import {
  ClarificationState,
  ConfidenceScore,
  ConfidenceDimension,
  getAllAnswers
} from './clarification-state';

// Re-export ConfidenceScore for external use
export type { ConfidenceScore, ConfidenceDimension };

// Dimension weights (must sum to 100)
const DIMENSION_WEIGHTS = {
  scope: 25,
  technical: 25,
  deliverables: 20,
  constraints: 15,
  context: 15
};

// Confidence threshold for proceeding
export const CONFIDENCE_THRESHOLD = 75;

/**
 * Evaluate confidence across all dimensions
 */
export function evaluateConfidence(state: ClarificationState): ConfidenceScore {
  const dimensions = {
    scope: evaluateScopeClarity(state),
    technical: evaluateTechnicalClarity(state),
    deliverables: evaluateDeliverableClarity(state),
    constraints: evaluateConstraintClarity(state),
    context: evaluateContextClarity(state)
  };

  // Calculate weighted average
  const overall = Math.round(
    (dimensions.scope * DIMENSION_WEIGHTS.scope +
      dimensions.technical * DIMENSION_WEIGHTS.technical +
      dimensions.deliverables * DIMENSION_WEIGHTS.deliverables +
      dimensions.constraints * DIMENSION_WEIGHTS.constraints +
      dimensions.context * DIMENSION_WEIGHTS.context) / 100
  );

  return {
    overall,
    dimensions,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if confidence is sufficient to proceed
 */
export function isConfidentEnough(score: ConfidenceScore): boolean {
  return score.overall >= CONFIDENCE_THRESHOLD;
}

/**
 * Get the lowest scoring dimensions (for targeted questioning)
 */
export function getLowestDimensions(score: ConfidenceScore): ConfidenceDimension[] {
  const entries = Object.entries(score.dimensions) as [ConfidenceDimension, number][];
  return entries
    .sort((a, b) => a[1] - b[1])
    .map(([dimension]) => dimension);
}

/**
 * Evaluate scope clarity (25% weight)
 * - Goal clearly defined
 * - Boundaries understood
 * - Deliverables identified
 */
function evaluateScopeClarity(state: ClarificationState): number {
  const insights = state.insights.scope;
  let score = 0;

  // Base score from number of insights
  score += Math.min(insights.length * 15, 40);

  // Check for goal-related insights
  const hasGoal = insights.some(i =>
    /goal|objective|purpose|aim|solve|achieve/i.test(i)
  );
  if (hasGoal) score += 20;

  // Check for boundary-related insights
  const hasBoundaries = insights.some(i =>
    /scope|boundary|include|exclude|limit|focus/i.test(i)
  );
  if (hasBoundaries) score += 20;

  // Check for deliverable identification
  const hasDeliverableType = insights.some(i =>
    /deliverable|output|result|produce|create|build/i.test(i)
  );
  if (hasDeliverableType) score += 20;

  return Math.min(score, 100);
}

/**
 * Evaluate technical clarity (25% weight)
 * - Tech stack specified
 * - Technical constraints known
 * - Dependencies identified
 */
function evaluateTechnicalClarity(state: ClarificationState): number {
  const insights = state.insights.technical;
  let score = 0;

  // Base score from number of insights
  score += Math.min(insights.length * 15, 40);

  // Check for tech stack mentions
  const hasTechStack = insights.some(i =>
    /technology|framework|library|language|stack|tool|platform/i.test(i)
  );
  if (hasTechStack) score += 25;

  // Check for constraints
  const hasConstraints = insights.some(i =>
    /constraint|limitation|requirement|must|cannot|need to/i.test(i)
  );
  if (hasConstraints) score += 20;

  // Check for dependencies
  const hasDependencies = insights.some(i =>
    /depend|require|need|integrate|connect|use/i.test(i)
  );
  if (hasDependencies) score += 15;

  return Math.min(score, 100);
}

/**
 * Evaluate deliverable clarity (20% weight)
 * - Format specified
 * - Structure defined
 * - Acceptance criteria clear
 */
function evaluateDeliverableClarity(state: ClarificationState): number {
  const insights = state.insights.deliverables;
  let score = 0;

  // Base score from number of insights
  score += Math.min(insights.length * 15, 40);

  // Check for format specification
  const hasFormat = insights.some(i =>
    /format|type|structure|layout|template|style/i.test(i)
  );
  if (hasFormat) score += 30;

  // Check for acceptance criteria
  const hasCriteria = insights.some(i =>
    /criteria|standard|quality|acceptable|success|complete/i.test(i)
  );
  if (hasCriteria) score += 30;

  return Math.min(score, 100);
}

/**
 * Evaluate constraint clarity (15% weight)
 * - Timeline understood
 * - Resource limitations known
 * - Other constraints identified
 */
function evaluateConstraintClarity(state: ClarificationState): number {
  const insights = state.insights.constraints;
  let score = 0;

  // Base score from number of insights
  score += Math.min(insights.length * 20, 50);

  // Check for timeline
  const hasTimeline = insights.some(i =>
    /timeline|deadline|schedule|time|date|urgent|priority/i.test(i)
  );
  if (hasTimeline) score += 25;

  // Check for resource constraints
  const hasResources = insights.some(i =>
    /resource|budget|cost|team|people|capacity/i.test(i)
  );
  if (hasResources) score += 25;

  return Math.min(score, 100);
}

/**
 * Evaluate context clarity (15% weight)
 * - Background understood
 * - Audience identified
 * - Success metrics defined
 */
function evaluateContextClarity(state: ClarificationState): number {
  const insights = state.insights.context;
  let score = 0;

  // Base score from number of insights
  score += Math.min(insights.length * 20, 50);

  // Check for background/context
  const hasBackground = insights.some(i =>
    /background|context|history|current|existing|previous/i.test(i)
  );
  if (hasBackground) score += 25;

  // Check for audience/users
  const hasAudience = insights.some(i =>
    /audience|user|customer|stakeholder|team|who/i.test(i)
  );
  if (hasAudience) score += 25;

  return Math.min(score, 100);
}

/**
 * Generate a human-readable confidence report
 */
export function generateConfidenceReport(score: ConfidenceScore): string {
  const lines: string[] = [];

  lines.push(`Overall Confidence: ${score.overall}/100`);
  lines.push('');
  lines.push('Dimension Breakdown:');

  const dimensions: [string, ConfidenceDimension, number][] = [
    ['Scope Clarity', 'scope', DIMENSION_WEIGHTS.scope],
    ['Technical Clarity', 'technical', DIMENSION_WEIGHTS.technical],
    ['Deliverable Clarity', 'deliverables', DIMENSION_WEIGHTS.deliverables],
    ['Constraint Clarity', 'constraints', DIMENSION_WEIGHTS.constraints],
    ['Context Clarity', 'context', DIMENSION_WEIGHTS.context]
  ];

  for (const [label, key, weight] of dimensions) {
    const dimScore = score.dimensions[key];
    const bar = generateProgressBar(dimScore);
    lines.push(`  ${label} (${weight}%): ${bar} ${dimScore}/100`);
  }

  lines.push('');
  if (isConfidentEnough(score)) {
    lines.push('✅ Confidence threshold met - ready to proceed');
  } else {
    const needed = CONFIDENCE_THRESHOLD - score.overall;
    lines.push(`⚠️  Need ${needed} more points to reach threshold (${CONFIDENCE_THRESHOLD})`);
  }

  return lines.join('\n');
}

/**
 * Generate a simple progress bar
 */
function generateProgressBar(score: number, length: number = 20): string {
  const filled = Math.round((score / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Analyze confidence trend across rounds
 */
export function analyzeConfidenceTrend(state: ClarificationState): {
  improving: boolean;
  stagnant: boolean;
  averageGain: number;
} {
  const history = state.confidenceHistory;

  if (history.length < 2) {
    return { improving: false, stagnant: false, averageGain: 0 };
  }

  const gains = [];
  for (let i = 1; i < history.length; i++) {
    gains.push(history[i].overall - history[i - 1].overall);
  }

  const averageGain = gains.reduce((a, b) => a + b, 0) / gains.length;
  const improving = averageGain > 5;
  const stagnant = Math.abs(averageGain) < 3;

  return { improving, stagnant, averageGain };
}

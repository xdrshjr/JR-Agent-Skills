/**
 * Main orchestrator for requirement clarification process
 * Conducts multi-round dialogue to clarify user requirements
 */

import {
  ClarificationState,
  ConfidenceDimension,
  Question,
  Answer,
  initializeClarificationState,
  addRound,
  addAnswers,
  addInsights,
  addConfidenceScore,
  hasMetMinimumRounds,
  hasReachedMaxRounds,
  getLatestConfidence
} from './clarification-state';

import {
  evaluateConfidence,
  isConfidentEnough,
  generateConfidenceReport,
  analyzeConfidenceTrend
} from './confidence-evaluator';
import type { ConfidenceScore } from './clarification-state';

import {
  generateQuestions,
  generateInitialQuestions,
  validateQuestions
} from './question-generator';

export interface ClarificationResult {
  enrichedRequest: string;
  rounds: number;
  finalConfidence: number;
  insights: ClarificationState['insights'];
  state: ClarificationState;
}

export interface ClarificationOptions {
  minRounds?: number;
  maxRounds?: number;
  confidenceThreshold?: number;
  askUserQuestion?: (questions: Question[]) => Promise<Answer[]>;
}

/**
 * Main entry point for requirement clarification
 */
export async function clarifyRequirements(
  userRequest: string,
  options: ClarificationOptions = {}
): Promise<ClarificationResult> {
  const {
    minRounds = 2,
    maxRounds = 3,
    askUserQuestion = defaultAskUserQuestion
  } = options;

  // Initialize state
  let state = initializeClarificationState(userRequest, minRounds, maxRounds);

  // Clarification loop
  while (true) {
    // Generate understanding summary
    const understandingSummary = generateUnderstandingSummary(state);

    // Determine which questions to ask
    const questions = state.currentRound === 0
      ? generateInitialQuestions(state)
      : generateAdaptiveQuestions(state);

    // Validate questions
    const validation = validateQuestions(questions);
    if (!validation.valid) {
      throw new Error(`Invalid questions: ${validation.errors.join(', ')}`);
    }

    // Add round to state
    state = addRound(state, understandingSummary, questions);

    // Ask user questions
    const answers = await askUserQuestion(questions);

    // Add answers to state
    state = addAnswers(state, answers);

    // Extract insights from answers
    state = extractInsights(state, questions, answers);

    // Evaluate confidence
    const confidence = evaluateConfidence(state);
    state = addConfidenceScore(state, confidence);

    // Check stopping criteria
    const shouldStop = await checkStoppingCriteria(state, confidence, askUserQuestion);

    if (shouldStop) {
      break;
    }
  }

  // Generate enriched request
  const enrichedRequest = generateEnrichedRequest(state);

  return {
    enrichedRequest,
    rounds: state.currentRound,
    finalConfidence: getLatestConfidence(state)?.overall || 0,
    insights: state.insights,
    state
  };
}

/**
 * Generate understanding summary for current round
 */
function generateUnderstandingSummary(state: ClarificationState): string {
  if (state.currentRound === 0) {
    return `I understand you want to: "${state.originalRequest}"`;
  }

  const lines: string[] = [];
  lines.push("Here's what I understand so far:\n");

  // Scope insights
  if (state.insights.scope.length > 0) {
    lines.push("**Scope & Goals:**");
    state.insights.scope.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Deliverable insights
  if (state.insights.deliverables.length > 0) {
    lines.push("**Deliverables:**");
    state.insights.deliverables.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Technical insights
  if (state.insights.technical.length > 0) {
    lines.push("**Technical Details:**");
    state.insights.technical.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Constraints
  if (state.insights.constraints.length > 0) {
    lines.push("**Constraints:**");
    state.insights.constraints.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Context
  if (state.insights.context.length > 0) {
    lines.push("**Context:**");
    state.insights.context.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate adaptive questions based on confidence gaps
 */
function generateAdaptiveQuestions(state: ClarificationState): Question[] {
  const latestConfidence = getLatestConfidence(state);
  if (!latestConfidence) {
    return generateInitialQuestions(state);
  }

  return generateQuestions(state, latestConfidence);
}

/**
 * Extract insights from user answers
 */
function extractInsights(
  state: ClarificationState,
  questions: Question[],
  answers: Answer[]
): ClarificationState {
  let updatedState = state;

  for (let i = 0; i < questions.length && i < answers.length; i++) {
    const question = questions[i];
    const answer = answers[i];

    if (!answer.text || answer.text.trim().length === 0) {
      continue;
    }

    // Extract insights based on dimension
    const insights = extractInsightsFromAnswer(answer.text, question.dimension);
    updatedState = addInsights(updatedState, question.dimension, insights);
  }

  return updatedState;
}

/**
 * Extract insights from a single answer
 */
function extractInsightsFromAnswer(
  answerText: string,
  dimension: ConfidenceDimension
): string[] {
  const insights: string[] = [];

  // Split answer into sentences
  const sentences = answerText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sentence of sentences) {
    if (sentence.length < 10) continue;

    // Clean up the sentence
    const cleaned = sentence.replace(/^(yes|no|maybe|i think|i want|i need|we need|we want)/i, '').trim();

    if (cleaned.length > 5) {
      insights.push(cleaned);
    }
  }

  // If no insights extracted, use the full answer
  if (insights.length === 0 && answerText.trim().length > 0) {
    insights.push(answerText.trim());
  }

  return insights;
}

/**
 * Check if clarification should stop
 */
async function checkStoppingCriteria(
  state: ClarificationState,
  confidence: ConfidenceScore,
  askUserQuestion: (questions: Question[]) => Promise<Answer[]>
): Promise<boolean> {
  // Must complete minimum rounds
  if (!hasMetMinimumRounds(state)) {
    return false;
  }

  // If confident enough, stop
  if (isConfidentEnough(confidence)) {
    return true;
  }

  // If reached max rounds, ask user if they want to continue
  if (hasReachedMaxRounds(state)) {
    const trend = analyzeConfidenceTrend(state);

    // If stagnant, recommend stopping
    if (trend.stagnant) {
      return true;
    }

    // Ask user if they want to continue
    const continueQuestion: Question = {
      id: 'continue-question',
      text: `We've completed ${state.currentRound} rounds of clarification (confidence: ${confidence.overall}/100). Would you like to continue clarifying or proceed with the current understanding?`,
      dimension: 'scope',
      round: state.currentRound
    };

    // This would need integration with AskUserQuestion tool
    // For now, return true to stop at max rounds
    return true;
  }

  return false;
}

/**
 * Generate enriched request with all clarifications
 */
function generateEnrichedRequest(state: ClarificationState): string {
  const lines: string[] = [];

  lines.push(state.originalRequest);
  lines.push("");
  lines.push("## Clarified Requirements");
  lines.push("");

  // Scope section
  if (state.insights.scope.length > 0) {
    lines.push("### Scope & Goals");
    state.insights.scope.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Deliverables section
  if (state.insights.deliverables.length > 0) {
    lines.push("### Deliverables");
    state.insights.deliverables.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Technical section
  if (state.insights.technical.length > 0) {
    lines.push("### Technical Details");
    state.insights.technical.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Constraints section
  if (state.insights.constraints.length > 0) {
    lines.push("### Constraints");
    state.insights.constraints.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Context section
  if (state.insights.context.length > 0) {
    lines.push("### Context");
    state.insights.context.forEach(insight => lines.push(`- ${insight}`));
    lines.push("");
  }

  // Q&A History
  lines.push("## Q&A History");
  lines.push("");

  for (const round of state.rounds) {
    lines.push(`### Round ${round.roundNumber}`);
    lines.push("");

    for (let i = 0; i < round.questions.length; i++) {
      const question = round.questions[i];
      const answer = round.answers[i];

      lines.push(`**Q${i + 1}:** ${question.text}`);
      if (answer) {
        lines.push(`**A${i + 1}:** ${answer.text}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Default implementation of askUserQuestion (placeholder)
 * This should be replaced with actual AskUserQuestion tool integration
 */
async function defaultAskUserQuestion(questions: Question[]): Promise<Answer[]> {
  // This is a placeholder - actual implementation will use AskUserQuestion tool
  throw new Error('askUserQuestion must be provided in options');
}

/**
 * Helper to format questions for AskUserQuestion tool
 */
export function formatQuestionsForTool(questions: Question[]): any {
  return {
    questions: questions.map(q => ({
      question: q.text,
      header: getDimensionLabel(q.dimension),
      options: [
        { label: 'Provide answer', description: 'Type your answer below' }
      ],
      multiSelect: false
    }))
  };
}

/**
 * Get human-readable label for dimension
 */
function getDimensionLabel(dimension: ConfidenceDimension): string {
  const labels: Record<ConfidenceDimension, string> = {
    scope: 'Scope',
    technical: 'Technical',
    deliverables: 'Deliverable',
    constraints: 'Constraints',
    context: 'Context'
  };
  return labels[dimension];
}

/**
 * Parse answers from AskUserQuestion tool response
 */
export function parseAnswersFromTool(
  toolResponse: Record<string, string>,
  questions: Question[]
): Answer[] {
  return questions.map((question, index) => ({
    questionId: question.id,
    text: toolResponse[`q${index + 1}`] || '',
    timestamp: new Date().toISOString()
  }));
}

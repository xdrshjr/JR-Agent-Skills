/**
 * State management for requirement clarification process
 * Tracks rounds, questions, answers, and insights
 */

export interface Question {
  id: string;
  text: string;
  dimension: ConfidenceDimension;
  round: number;
}

export interface Answer {
  questionId: string;
  text: string;
  timestamp: string;
}

export interface RoundData {
  roundNumber: number;
  understandingSummary: string;
  questions: Question[];
  answers: Answer[];
  timestamp: string;
}

export type ConfidenceDimension = 'scope' | 'technical' | 'deliverables' | 'constraints' | 'context';

export interface ClarificationState {
  originalRequest: string;
  currentRound: number;
  maxRounds: number;
  minRounds: number;
  rounds: RoundData[];
  insights: {
    scope: string[];
    technical: string[];
    deliverables: string[];
    constraints: string[];
    context: string[];
  };
  confidenceHistory: ConfidenceScore[];
}

export interface ConfidenceScore {
  overall: number;
  dimensions: {
    scope: number;
    technical: number;
    deliverables: number;
    constraints: number;
    context: number;
  };
  timestamp: string;
}

/**
 * Initialize a new clarification state
 */
export function initializeClarificationState(
  userRequest: string,
  minRounds: number = 2,
  maxRounds: number = 3
): ClarificationState {
  return {
    originalRequest: userRequest,
    currentRound: 0,
    maxRounds,
    minRounds,
    rounds: [],
    insights: {
      scope: [],
      technical: [],
      deliverables: [],
      constraints: [],
      context: []
    },
    confidenceHistory: []
  };
}

/**
 * Add a new round to the state
 */
export function addRound(
  state: ClarificationState,
  understandingSummary: string,
  questions: Question[]
): ClarificationState {
  const newRound: RoundData = {
    roundNumber: state.currentRound + 1,
    understandingSummary,
    questions,
    answers: [],
    timestamp: new Date().toISOString()
  };

  return {
    ...state,
    currentRound: state.currentRound + 1,
    rounds: [...state.rounds, newRound]
  };
}

/**
 * Add answers to the current round
 */
export function addAnswers(
  state: ClarificationState,
  answers: Answer[]
): ClarificationState {
  const rounds = [...state.rounds];
  const currentRound = rounds[rounds.length - 1];

  if (!currentRound) {
    throw new Error('No active round to add answers to');
  }

  currentRound.answers = answers;

  return {
    ...state,
    rounds
  };
}

/**
 * Add insights extracted from answers
 */
export function addInsights(
  state: ClarificationState,
  dimension: ConfidenceDimension,
  insights: string[]
): ClarificationState {
  return {
    ...state,
    insights: {
      ...state.insights,
      [dimension]: [...state.insights[dimension], ...insights]
    }
  };
}

/**
 * Add a confidence score to history
 */
export function addConfidenceScore(
  state: ClarificationState,
  score: ConfidenceScore
): ClarificationState {
  return {
    ...state,
    confidenceHistory: [...state.confidenceHistory, score]
  };
}

/**
 * Get the latest confidence score
 */
export function getLatestConfidence(state: ClarificationState): ConfidenceScore | null {
  if (state.confidenceHistory.length === 0) {
    return null;
  }
  return state.confidenceHistory[state.confidenceHistory.length - 1];
}

/**
 * Check if minimum rounds requirement is met
 */
export function hasMetMinimumRounds(state: ClarificationState): boolean {
  return state.currentRound >= state.minRounds;
}

/**
 * Check if maximum rounds limit is reached
 */
export function hasReachedMaxRounds(state: ClarificationState): boolean {
  return state.currentRound >= state.maxRounds;
}

/**
 * Get all questions asked so far
 */
export function getAllQuestions(state: ClarificationState): Question[] {
  return state.rounds.flatMap(round => round.questions);
}

/**
 * Get all answers provided so far
 */
export function getAllAnswers(state: ClarificationState): Answer[] {
  return state.rounds.flatMap(round => round.answers);
}

/**
 * Serialize state to JSON
 */
export function serializeState(state: ClarificationState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Deserialize state from JSON
 */
export function deserializeState(json: string): ClarificationState {
  return JSON.parse(json);
}

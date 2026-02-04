/**
 * Adaptive question generation for requirement clarification
 * Generates targeted questions based on confidence gaps
 */

import {
  ClarificationState,
  ConfidenceDimension,
  Question,
  getAllQuestions
} from './clarification-state';
import { getLowestDimensions } from './confidence-evaluator';
import type { ConfidenceScore } from './clarification-state';

/**
 * Generate adaptive questions targeting confidence gaps
 */
export function generateQuestions(
  state: ClarificationState,
  confidence: ConfidenceScore
): Question[] {
  const lowestDimensions = getLowestDimensions(confidence);
  const previousQuestions = getAllQuestions(state);
  const round = state.currentRound + 1;

  const questions: Question[] = [];

  // Generate 2 questions for lowest dimension
  questions.push(
    ...generateDimensionQuestions(
      lowestDimensions[0],
      state,
      previousQuestions,
      round,
      2
    )
  );

  // Generate 2 questions for second-lowest dimension
  questions.push(
    ...generateDimensionQuestions(
      lowestDimensions[1],
      state,
      previousQuestions,
      round,
      2
    )
  );

  // Generate 1 question for third-lowest dimension
  questions.push(
    ...generateDimensionQuestions(
      lowestDimensions[2],
      state,
      previousQuestions,
      round,
      1
    )
  );

  return questions;
}

/**
 * Generate questions for a specific dimension
 */
function generateDimensionQuestions(
  dimension: ConfidenceDimension,
  state: ClarificationState,
  previousQuestions: Question[],
  round: number,
  count: number
): Question[] {
  const templates = getQuestionTemplates(dimension);
  const usedTexts = new Set(previousQuestions.map(q => q.text.toLowerCase()));

  const questions: Question[] = [];
  let attempts = 0;
  const maxAttempts = templates.length * 2;

  while (questions.length < count && attempts < maxAttempts) {
    const template = templates[attempts % templates.length];
    const questionText = adaptQuestionToContext(template, state, dimension);

    // Check for duplicates
    if (!usedTexts.has(questionText.toLowerCase())) {
      questions.push({
        id: `q${round}-${dimension}-${questions.length + 1}`,
        text: questionText,
        dimension,
        round
      });
      usedTexts.add(questionText.toLowerCase());
    }

    attempts++;
  }

  return questions;
}

/**
 * Get question templates for each dimension
 */
function getQuestionTemplates(dimension: ConfidenceDimension): string[] {
  const templates: Record<ConfidenceDimension, string[]> = {
    scope: [
      'What is the primary goal or problem this task should solve?',
      'What specific deliverables do you expect at the end?',
      'What should be included in the scope, and what should be excluded?',
      'Are there any boundaries or limitations I should be aware of?',
      'What does success look like for this task?',
      'Who will use or benefit from the final deliverable?',
      'What is the most important outcome you want to achieve?',
      'Are there any related tasks or projects this connects to?',
      'What would make this task complete in your view?',
      'Is this a one-time task or part of a larger initiative?'
    ],
    technical: [
      'Are there any specific technologies, frameworks, or tools you want to use?',
      'What technical constraints or requirements should I consider?',
      'Are there any existing systems or codebases this needs to integrate with?',
      'What technical standards or best practices should be followed?',
      'Are there any performance, security, or scalability requirements?',
      'What development environment or platform will this run on?',
      'Are there any third-party services or APIs that need to be used?',
      'What technical dependencies or prerequisites exist?',
      'Are there any technical limitations I should be aware of?',
      'What level of technical complexity are you expecting?'
    ],
    deliverables: [
      'What format should the final deliverable be in?',
      'How should the deliverable be structured or organized?',
      'What level of detail or completeness do you expect?',
      'Are there any specific quality standards or acceptance criteria?',
      'Should the deliverable include documentation or explanations?',
      'What style or tone should be used in the deliverable?',
      'Are there any templates or examples I should follow?',
      'How will the deliverable be reviewed or evaluated?',
      'Should the deliverable be ready for production or is it a prototype?',
      'Are there any specific sections or components that must be included?'
    ],
    constraints: [
      'Is there a specific timeline or deadline for this task?',
      'Are there any budget or resource constraints?',
      'How much time should the team spend on this task?',
      'Are there any priority levels or urgency considerations?',
      'What resources are available for this task?',
      'Are there any dependencies on other tasks or people?',
      'What happens if the task takes longer than expected?',
      'Are there any hard constraints that cannot be changed?',
      'What trade-offs are acceptable if needed?',
      'Are there any compliance or regulatory requirements?'
    ],
    context: [
      'What is the background or context for this task?',
      'Why is this task important right now?',
      'What problem led to the need for this task?',
      'Who is the target audience or end user?',
      'What is the current state or situation?',
      'Has anything similar been done before?',
      'What are the key success metrics or KPIs?',
      'How will this task impact the broader project or organization?',
      'What assumptions should I be aware of?',
      'Are there any stakeholders who need to be considered?'
    ]
  };

  return templates[dimension];
}

/**
 * Adapt question to context based on existing insights
 */
function adaptQuestionToContext(
  template: string,
  state: ClarificationState,
  dimension: ConfidenceDimension
): string {
  // For now, return template as-is
  // Future enhancement: customize based on state.insights
  return template;
}

/**
 * Generate initial questions for round 1
 */
export function generateInitialQuestions(state: ClarificationState): Question[] {
  const round = 1;

  return [
    {
      id: `q1-deliverables-1`,
      text: 'What specific deliverable format do you expect? (e.g., document, code, design, research report)',
      dimension: 'deliverables',
      round
    },
    {
      id: `q1-scope-1`,
      text: 'What is the primary goal or problem this task should solve?',
      dimension: 'scope',
      round
    },
    {
      id: `q1-technical-1`,
      text: 'Are there any technical constraints or requirements I should know about?',
      dimension: 'technical',
      round
    },
    {
      id: `q1-scope-2`,
      text: 'What does success look like for this task?',
      dimension: 'scope',
      round
    },
    {
      id: `q1-constraints-1`,
      text: 'Is there a specific timeline or deadline?',
      dimension: 'constraints',
      round
    }
  ];
}

/**
 * Check if a question is too similar to previous questions
 */
function isSimilarQuestion(newQuestion: string, existingQuestions: Question[]): boolean {
  const newWords = new Set(
    newQuestion.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );

  for (const existing of existingQuestions) {
    const existingWords = new Set(
      existing.text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    // Calculate word overlap
    const newWordsArray = Array.from(newWords);
    const overlap = newWordsArray.filter(w => existingWords.has(w)).length;
    const similarity = overlap / Math.max(newWords.size, existingWords.size);

    if (similarity > 0.6) {
      return true;
    }
  }

  return false;
}

/**
 * Generate follow-up questions based on unclear answers
 */
export function generateFollowUpQuestions(
  state: ClarificationState,
  unclearDimensions: ConfidenceDimension[]
): Question[] {
  const round = state.currentRound + 1;
  const questions: Question[] = [];

  for (const dimension of unclearDimensions.slice(0, 3)) {
    const templates = getQuestionTemplates(dimension);
    const previousQuestions = getAllQuestions(state);

    // Find a template that hasn't been used
    for (const template of templates) {
      if (!isSimilarQuestion(template, previousQuestions)) {
        questions.push({
          id: `q${round}-${dimension}-followup`,
          text: `To clarify: ${template}`,
          dimension,
          round
        });
        break;
      }
    }
  }

  return questions;
}

/**
 * Validate question quality
 */
export function validateQuestions(questions: Question[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (questions.length !== 5) {
    errors.push(`Expected 5 questions, got ${questions.length}`);
  }

  const dimensions = questions.map(q => q.dimension);
  const uniqueDimensions = new Set(dimensions);

  if (uniqueDimensions.size < 2) {
    errors.push('Questions should cover at least 2 different dimensions');
  }

  for (const question of questions) {
    if (!question.text || question.text.length < 10) {
      errors.push(`Question "${question.id}" is too short`);
    }

    if (!question.text.includes('?')) {
      errors.push(`Question "${question.id}" should end with a question mark`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

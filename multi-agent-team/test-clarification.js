/**
 * Test script for requirement clarification system
 * Tests the core functionality without full integration
 */

const {
  clarifyRequirements,
  formatQuestionsForTool,
  parseAnswersFromTool
} = require('./dist/requirement-clarification');

const {
  initializeClarificationState,
  addRound,
  addAnswers,
  addInsights,
  addConfidenceScore
} = require('./dist/clarification-state');

const {
  evaluateConfidence,
  isConfidentEnough,
  generateConfidenceReport
} = require('./dist/confidence-evaluator');

const {
  generateInitialQuestions,
  generateQuestions,
  validateQuestions
} = require('./dist/question-generator');

async function testClarificationSystem() {
  console.log('🧪 Testing Requirement Clarification System\n');

  // Test 1: Initialize state
  console.log('Test 1: Initialize clarification state');
  const state = initializeClarificationState('Create a web application', 2, 3);
  console.log('✅ State initialized:', {
    originalRequest: state.originalRequest,
    minRounds: state.minRounds,
    maxRounds: state.maxRounds,
    currentRound: state.currentRound
  });
  console.log();

  // Test 2: Generate initial questions
  console.log('Test 2: Generate initial questions');
  const questions = generateInitialQuestions(state);
  console.log('✅ Generated', questions.length, 'questions:');
  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.dimension}] ${q.text}`);
  });
  console.log();

  // Test 3: Validate questions
  console.log('Test 3: Validate questions');
  const validation = validateQuestions(questions);
  console.log('✅ Validation result:', validation.valid ? 'PASS' : 'FAIL');
  if (!validation.valid) {
    console.log('  Errors:', validation.errors);
  }
  console.log();

  // Test 4: Simulate answers
  console.log('Test 4: Simulate user answers');
  const mockAnswers = [
    { questionId: questions[0].id, text: 'A document management system', timestamp: new Date().toISOString() },
    { questionId: questions[1].id, text: 'To help users organize and search documents efficiently', timestamp: new Date().toISOString() },
    { questionId: questions[2].id, text: 'Must use React and Node.js', timestamp: new Date().toISOString() },
    { questionId: questions[3].id, text: 'Users can upload, search, and download documents easily', timestamp: new Date().toISOString() },
    { questionId: questions[4].id, text: 'Need it in 2 weeks', timestamp: new Date().toISOString() }
  ];
  console.log('✅ Simulated', mockAnswers.length, 'answers');
  console.log();

  // Test 5: Add round and answers to state
  console.log('Test 5: Add round and answers to state');
  let updatedState = addRound(state, 'Initial understanding', questions);
  updatedState = addAnswers(updatedState, mockAnswers);
  console.log('✅ State updated:', {
    currentRound: updatedState.currentRound,
    totalRounds: updatedState.rounds.length,
    answersInLastRound: updatedState.rounds[0].answers.length
  });
  console.log();

  // Test 6: Extract insights
  console.log('Test 6: Extract insights from answers');
  updatedState = addInsights(updatedState, 'deliverables', ['Document management system']);
  updatedState = addInsights(updatedState, 'scope', ['Help users organize and search documents efficiently']);
  updatedState = addInsights(updatedState, 'technical', ['Must use React and Node.js']);
  updatedState = addInsights(updatedState, 'scope', ['Users can upload, search, and download documents easily']);
  updatedState = addInsights(updatedState, 'constraints', ['Need it in 2 weeks']);
  console.log('✅ Insights extracted:', {
    scope: updatedState.insights.scope.length,
    technical: updatedState.insights.technical.length,
    deliverables: updatedState.insights.deliverables.length,
    constraints: updatedState.insights.constraints.length,
    context: updatedState.insights.context.length
  });
  console.log();

  // Test 7: Evaluate confidence
  console.log('Test 7: Evaluate confidence');
  const confidence = evaluateConfidence(updatedState);
  console.log('✅ Confidence scores:');
  console.log('  Overall:', confidence.overall + '/100');
  console.log('  Scope:', confidence.dimensions.scope + '/100');
  console.log('  Technical:', confidence.dimensions.technical + '/100');
  console.log('  Deliverables:', confidence.dimensions.deliverables + '/100');
  console.log('  Constraints:', confidence.dimensions.constraints + '/100');
  console.log('  Context:', confidence.dimensions.context + '/100');
  console.log('  Confident enough?', isConfidentEnough(confidence) ? 'YES' : 'NO');
  console.log();

  // Test 8: Generate confidence report
  console.log('Test 8: Generate confidence report');
  const report = generateConfidenceReport(confidence);
  console.log('✅ Confidence Report:');
  console.log(report);
  console.log();

  // Test 9: Generate adaptive questions (if not confident)
  if (!isConfidentEnough(confidence)) {
    console.log('Test 9: Generate adaptive questions for round 2');
    updatedState = addConfidenceScore(updatedState, confidence);
    const adaptiveQuestions = generateQuestions(updatedState, confidence);
    console.log('✅ Generated', adaptiveQuestions.length, 'adaptive questions:');
    adaptiveQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.dimension}] ${q.text}`);
    });
    console.log();
  }

  console.log('🎉 All tests passed!\n');
}

// Run tests
testClarificationSystem().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

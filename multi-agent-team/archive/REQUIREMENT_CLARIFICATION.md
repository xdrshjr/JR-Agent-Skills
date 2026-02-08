# Requirement Clarification System

## Overview

The Requirement Clarification System conducts an adaptive multi-round dialogue with users to ensure requirements are well-understood BEFORE creating the multi-agent team. This prevents wasted effort, misaligned deliverables, and reduces ambiguity.

## Key Features

- **Multi-Round Dialogue**: Minimum 2 rounds, soft maximum 3 rounds
- **Adaptive Questioning**: 5 questions per round, targeting lowest-confidence dimensions
- **Confidence-Based Stopping**: Automatically stops when confidence ≥ 75/100
- **Understanding Summaries**: Shows current understanding before each question round
- **Enriched Request**: Appends structured clarifications to original request

## Architecture

### Core Modules

```
src/
├── requirement-clarification.ts    # Main orchestrator (300 lines)
├── clarification-state.ts          # State management (150 lines)
├── confidence-evaluator.ts         # Confidence scoring (200 lines)
└── question-generator.ts           # Adaptive question generation (250 lines)
```

### Integration Point

**File**: `council-workflow.js` (recommended) or `pm-workflow.js` (backward compatibility bridge)
**Location**: Between skill planning and team assembly (after line 106)

```javascript
// 1. Requirement Clarification Phase
const clarificationResult = await conductRequirementClarification(
  userRequest,
  askUserQuestionTool
);
const enrichedRequest = clarificationResult.enrichedRequest;

// 2. Skill Planning (uses enriched request)
const skillPlanning = initializeSkillAwarePlanning(enrichedRequest);

// 3. Team Assembly (uses enriched request)
const teamSuggestion = generateTeamSuggestion(skillPlanning.analysis, enrichedRequest);
```

**Note**: `pm-workflow.js` is a backward compatibility bridge that re-exports from `council-workflow.js`.

## Confidence Dimensions

The system evaluates confidence across 5 dimensions with weighted scoring:

| Dimension | Weight | Evaluates |
|-----------|--------|-----------|
| **Scope Clarity** | 25% | Goal, boundaries, deliverables defined |
| **Technical Clarity** | 25% | Tech stack, constraints, dependencies clear |
| **Deliverable Clarity** | 20% | Format, structure, acceptance criteria defined |
| **Constraint Clarity** | 15% | Timeline, resources, limitations understood |
| **Context Clarity** | 15% | Background, audience, success metrics clear |

**Overall Confidence** = Weighted average of all dimensions

**Threshold**: 75/100 (must reach this to proceed)

## Workflow

### Round 1: Initial Questions

```
PM: "I understand you want to: [original request]

To ensure I create the right team, I need to clarify:
1. What specific deliverable format do you expect?
2. What is the primary goal or problem this task should solve?
3. Are there any technical constraints or requirements?
4. What does success look like for this task?
5. Is there a specific timeline or deadline?"

User: [Answers 5 questions]

[Confidence evaluation: 45/100 - below threshold, continue]
```

### Round 2+: Adaptive Questions

```
PM: "Here's what I understand now:

**Scope & Goals:**
- [Synthesized understanding from answers]

**Deliverables:**
- [Identified deliverable format]

**Technical Details:**
- [Specified constraints]

I need to clarify a few more details:
1. [Adaptive question targeting lowest dimension]
2. [Adaptive question targeting gaps]
3. [Adaptive question about unclear area]
4. [Adaptive question about deliverable specifics]
5. [Adaptive question about success criteria]"

User: [Answers 5 questions]

[Confidence evaluation: 78/100 - above threshold, can proceed]
```

### Stopping Criteria

The system stops when:
1. **Confidence ≥ 75** AND **Minimum 2 rounds completed**
2. **Maximum 3 rounds reached** (offers user choice to continue or proceed)
3. **Confidence stagnant** (< 3 points improvement per round)

## Output Format

### Enriched Request

```markdown
[Original user request]

## Clarified Requirements

### Scope & Goals
- [Clear goal statement]
- [Deliverable format]
- [Boundaries defined]

### Technical Details
- [Tech stack specified]
- [Constraints identified]
- [Dependencies listed]

### Deliverables
- [Format specified]
- [Structure defined]
- [Acceptance criteria]

### Constraints
- [Timeline if specified]
- [Resource limitations]
- [Other constraints]

### Context
- [Background information]
- [Target audience]
- [Success metrics]

## Q&A History

### Round 1
**Q1:** [Question text]
**A1:** [Answer text]

**Q2:** [Question text]
**A2:** [Answer text]

[... all questions and answers ...]

### Round 2
[... questions and answers ...]
```

## Usage

### Basic Usage

```javascript
const { conductRequirementClarification } = require('./pm-workflow');

const result = await conductRequirementClarification(
  userRequest,
  askUserQuestionTool
);

console.log('Enriched Request:', result.enrichedRequest);
console.log('Rounds:', result.rounds);
console.log('Final Confidence:', result.finalConfidence);
```

### Advanced Usage

```javascript
const { clarifyRequirements } = require('./src/requirement-clarification');

const result = await clarifyRequirements(userRequest, {
  minRounds: 2,
  maxRounds: 3,
  confidenceThreshold: 75,
  askUserQuestion: async (questions) => {
    // Custom question handling
    return answers;
  }
});
```

## Testing

Run the test suite:

```bash
node test-clarification.js
```

Expected output:
```
🧪 Testing Requirement Clarification System

Test 1: Initialize clarification state
✅ State initialized

Test 2: Generate initial questions
✅ Generated 5 questions

Test 3: Validate questions
✅ Validation result: PASS

Test 4: Simulate user answers
✅ Simulated 5 answers

Test 5: Add round and answers to state
✅ State updated

Test 6: Extract insights from answers
✅ Insights extracted

Test 7: Evaluate confidence
✅ Confidence scores:
  Overall: 26/100
  Scope: 30/100
  Technical: 50/100
  Deliverables: 15/100
  Constraints: 20/100
  Context: 0/100
  Confident enough? NO

Test 8: Generate confidence report
✅ Confidence Report: [detailed report]

Test 9: Generate adaptive questions for round 2
✅ Generated 5 adaptive questions

🎉 All tests passed!
```

## API Reference

### Main Functions

#### `conductRequirementClarification(userRequest, askUserQuestionTool)`

Wrapper function that integrates with AskUserQuestion tool.

**Parameters:**
- `userRequest` (string): Original user request
- `askUserQuestionTool` (function): AskUserQuestion tool function

**Returns:** Promise<ClarificationResult>

#### `clarifyRequirements(userRequest, options)`

Core clarification orchestrator.

**Parameters:**
- `userRequest` (string): Original user request
- `options` (object):
  - `minRounds` (number): Minimum rounds (default: 2)
  - `maxRounds` (number): Maximum rounds (default: 3)
  - `confidenceThreshold` (number): Threshold to proceed (default: 75)
  - `askUserQuestion` (function): Question handler

**Returns:** Promise<ClarificationResult>

### State Management

#### `initializeClarificationState(userRequest, minRounds, maxRounds)`

Initialize a new clarification state.

#### `addRound(state, understandingSummary, questions)`

Add a new round to the state.

#### `addAnswers(state, answers)`

Add answers to the current round.

#### `addInsights(state, dimension, insights)`

Add insights extracted from answers.

#### `addConfidenceScore(state, score)`

Add a confidence score to history.

### Confidence Evaluation

#### `evaluateConfidence(state)`

Evaluate confidence across all dimensions.

**Returns:** ConfidenceScore

#### `isConfidentEnough(score)`

Check if confidence is sufficient to proceed.

**Returns:** boolean

#### `generateConfidenceReport(score)`

Generate a human-readable confidence report.

**Returns:** string

### Question Generation

#### `generateInitialQuestions(state)`

Generate 5 initial questions for round 1.

**Returns:** Question[]

#### `generateQuestions(state, confidence)`

Generate adaptive questions targeting confidence gaps.

**Returns:** Question[]

#### `validateQuestions(questions)`

Validate question quality.

**Returns:** { valid: boolean, errors: string[] }

## Configuration

### Confidence Threshold

Default: 75/100

To change:
```javascript
const result = await clarifyRequirements(userRequest, {
  confidenceThreshold: 80 // Require higher confidence
});
```

### Round Limits

Defaults: minRounds = 2, maxRounds = 3

To change:
```javascript
const result = await clarifyRequirements(userRequest, {
  minRounds: 1,  // Allow stopping after 1 round if confident
  maxRounds: 5   // Allow up to 5 rounds
});
```

## Edge Cases

### Unclear Answers

If an answer doesn't address the question, the system:
1. Extracts what it can from the answer
2. Rephrases the question in the next round
3. Targets the same dimension again

### Contradictions

If answers contradict each other:
1. Highlights contradiction in understanding summary
2. Asks for clarification in next round
3. Allows user to correct previous answers

### User Wants to Skip

After minimum 2 rounds:
1. User can choose to proceed even if confidence < 75
2. System warns about confidence level
3. Proceeds with current understanding

### Maximum Rounds Reached

After round 3:
1. System offers choice: continue or proceed
2. If confidence is stagnant, recommends proceeding
3. If improving, suggests one more round

## Benefits

✅ **Reduces Ambiguity**: Clarifies requirements before team creation
✅ **Prevents Misalignment**: Ensures deliverables match expectations
✅ **Saves Time**: Upfront clarification prevents rework
✅ **Improves Planning**: Better team assembly with clear requirements
✅ **Creates Audit Trail**: Complete Q&A history for reference
✅ **Adaptive**: Questions target specific gaps in understanding
✅ **User-Friendly**: Natural dialogue, not a rigid form

## Future Enhancements

- Save clarification templates for common task types
- Learn from past clarifications to improve question quality
- Support multi-language clarification
- Add visual progress indicator for confidence scores
- Allow users to edit understanding summary directly
- Integration with project templates based on clarified requirements

## Troubleshooting

### Module Not Found

If you see "Requirement clarification not available":
1. Ensure TypeScript files are compiled: `npx tsc`
2. Check that `dist/requirement-clarification.js` exists
3. Verify imports in `council-workflow.js` or `pm-workflow.js` (backward compatibility bridge)

### Questions Not Adaptive

If questions repeat or don't target gaps:
1. Check confidence evaluation is working
2. Verify insights are being extracted from answers
3. Review question generation logic in `question-generator.ts`

### Confidence Always Low

If confidence never reaches threshold:
1. Check dimension evaluation logic in `confidence-evaluator.ts`
2. Verify insights are being added to correct dimensions
3. Review answer extraction in `requirement-clarification.ts`

## License

Part of the Multi-Agent Team Coordination Skill.

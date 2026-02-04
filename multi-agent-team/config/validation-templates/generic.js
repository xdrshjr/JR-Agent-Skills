/**
 * Generic QA Validation Plan Template
 *
 * This is the base template that works for ANY task type (code, design, research,
 * video, documents, etc.). It provides universal validation dimensions and methods
 * that can be applied to any deliverable.
 *
 * Task-specific templates extend this base template.
 */

/**
 * 4 Universal Validation Dimensions
 * These apply to ALL deliverable types
 */
const VALIDATION_DIMENSIONS = {
  FUNCTIONALITY: {
    id: 'functionality',
    name: 'Functionality',
    description: 'Does the deliverable work as intended and meet the requirements?',
    weight: 0.35,
    criteria: [
      'Meets stated requirements',
      'Performs intended function correctly',
      'Handles expected inputs/scenarios',
      'Produces expected outputs/results'
    ]
  },

  COMPLETENESS: {
    id: 'completeness',
    name: 'Completeness',
    description: 'Are all required components present and nothing is missing?',
    weight: 0.25,
    criteria: [
      'All required components included',
      'No missing pieces or gaps',
      'Covers full scope of requirements',
      'Includes necessary supporting materials'
    ]
  },

  QUALITY: {
    id: 'quality',
    name: 'Quality',
    description: 'Is the deliverable well-crafted and professional?',
    weight: 0.25,
    criteria: [
      'Professional quality standards met',
      'Attention to detail evident',
      'Consistent style and formatting',
      'Free of obvious errors or defects'
    ]
  },

  CONSISTENCY: {
    id: 'consistency',
    name: 'Consistency',
    description: 'Is the deliverable internally consistent and aligned with project standards?',
    weight: 0.15,
    criteria: [
      'Internal consistency maintained',
      'Aligns with project standards',
      'Consistent with other deliverables',
      'Follows established conventions'
    ]
  }
};

/**
 * Generic Validation Methods
 * These can be applied to any deliverable type
 */
const VALIDATION_METHODS = {
  MANUAL_REVIEW: {
    id: 'manual_review',
    name: 'Manual Review',
    description: 'Systematic manual inspection of the deliverable',
    applicableTo: ['all'],
    steps: [
      'Review deliverable against requirements',
      'Check each component systematically',
      'Document findings and issues',
      'Verify fixes if issues found'
    ]
  },

  CHECKLIST_VERIFICATION: {
    id: 'checklist_verification',
    name: 'Checklist Verification',
    description: 'Verify deliverable against predefined checklist',
    applicableTo: ['all'],
    steps: [
      'Create validation checklist from requirements',
      'Check each item systematically',
      'Mark pass/fail for each item',
      'Document any failures with details'
    ]
  },

  CROSS_REFERENCE: {
    id: 'cross_reference',
    name: 'Cross-Reference Check',
    description: 'Compare deliverable with requirements and other deliverables',
    applicableTo: ['all'],
    steps: [
      'Compare against original requirements',
      'Check consistency with other deliverables',
      'Verify all references are valid',
      'Ensure no contradictions exist'
    ]
  },

  SAMPLE_TESTING: {
    id: 'sample_testing',
    name: 'Sample Testing',
    description: 'Test with sample inputs/scenarios',
    applicableTo: ['code', 'design', 'documents'],
    steps: [
      'Identify representative test cases',
      'Execute tests with sample inputs',
      'Verify outputs match expectations',
      'Document any discrepancies'
    ]
  }
};

/**
 * Risk Assessment Framework
 * Universal risk categories that apply to any deliverable
 */
const RISK_CATEGORIES = {
  HIGH: {
    level: 'high',
    description: 'Critical issues that prevent acceptance',
    examples: [
      'Core functionality broken or missing',
      'Major requirements not met',
      'Severe quality issues',
      'Unusable or incomplete deliverable'
    ],
    action: 'Must be fixed before acceptance'
  },

  MEDIUM: {
    level: 'medium',
    description: 'Significant issues that impact usability or quality',
    examples: [
      'Minor functionality issues',
      'Some requirements partially met',
      'Quality issues that affect user experience',
      'Missing non-critical components'
    ],
    action: 'Should be fixed, may accept with documented issues'
  },

  LOW: {
    level: 'low',
    description: 'Minor issues that do not significantly impact deliverable',
    examples: [
      'Cosmetic issues',
      'Minor inconsistencies',
      'Nice-to-have features missing',
      'Documentation gaps'
    ],
    action: 'Can be fixed later or accepted as-is'
  }
};

/**
 * Validation Plan Structure Template
 * This structure works for any task type
 */
const PLAN_STRUCTURE = {
  overview: {
    description: 'High-level summary of validation approach',
    required: true,
    fields: {
      taskType: 'Type of task being validated',
      validationObjective: 'What this validation aims to verify',
      validationScope: 'What will and will not be validated',
      estimatedEffort: 'Rough estimate of validation effort'
    }
  },

  executorPlans: {
    description: 'Per-executor validation plans',
    required: true,
    structure: {
      executorRole: 'Role of the executor being validated',
      deliverables: 'List of deliverables to validate',
      validationDimensions: 'Which dimensions to focus on',
      validationMethods: 'Which methods to use',
      acceptanceCriteria: 'Specific criteria for acceptance',
      testCases: 'Specific test cases or scenarios'
    }
  },

  toolsAndResources: {
    description: 'Tools and resources needed for validation',
    required: true,
    examples: [
      'Testing tools or frameworks',
      'Reference materials',
      'Sample data or inputs',
      'Validation checklists'
    ]
  },

  riskAssessment: {
    description: 'Potential risks and mitigation strategies',
    required: true,
    structure: {
      riskCategory: 'High/Medium/Low',
      riskDescription: 'What could go wrong',
      likelihood: 'How likely is this risk',
      impact: 'Impact if risk occurs',
      mitigation: 'How to prevent or handle'
    }
  },

  validationSequence: {
    description: 'Order in which validation will be performed',
    required: true,
    rationale: 'Explain why this sequence makes sense'
  }
};

/**
 * PM Approval Criteria
 * What PM should check before approving a validation plan
 */
const PM_APPROVAL_CRITERIA = {
  COMPLETENESS: {
    criterion: 'Plan covers all executors and deliverables',
    checkpoints: [
      'All executors have validation plans',
      'All deliverables are listed',
      'No gaps in coverage'
    ]
  },

  APPROPRIATENESS: {
    criterion: 'Validation methods are appropriate for task type',
    checkpoints: [
      'Methods match deliverable type',
      'Validation depth is appropriate',
      'Resources are reasonable'
    ]
  },

  CLARITY: {
    criterion: 'Plan is clear and actionable',
    checkpoints: [
      'Acceptance criteria are specific',
      'Test cases are well-defined',
      'Sequence makes logical sense'
    ]
  },

  FEASIBILITY: {
    criterion: 'Plan is realistic and achievable',
    checkpoints: [
      'Effort estimate is reasonable',
      'Required tools are available',
      'Timeline is achievable'
    ]
  }
};

/**
 * Generate QA Validation Plan Prompt
 *
 * Creates instructions for QA agent to create a validation plan
 *
 * @param {Object} projectContext - Context about the project
 * @param {string} projectContext.taskType - Type of task (code, design, research, etc.)
 * @param {string} projectContext.taskDescription - Description of the task
 * @param {Array} projectContext.executors - List of executor agents with roles and deliverables
 * @param {Object} projectContext.requirements - Original requirements
 * @returns {string} Formatted prompt for QA agent
 */
function generateValidationPlanPrompt(projectContext) {
  const { taskType, taskDescription, executors, requirements } = projectContext;

  return `# QA Validation Plan Creation Instructions

## Your Task
You are the QA agent responsible for validating the deliverables from ${executors.length} executor agent(s). You must create a comprehensive validation plan that ensures all deliverables meet quality standards.

## Project Context
- **Task Type**: ${taskType}
- **Task Description**: ${taskDescription}
- **Number of Executors**: ${executors.length}

## Executors and Their Deliverables
${executors.map((exec, idx) => `
### Executor ${idx + 1}: ${exec.role}
**Deliverables**: ${exec.deliverables.join(', ')}
**Key Responsibilities**: ${exec.responsibilities || 'See project requirements'}
`).join('\n')}

## Your Validation Plan Must Include

### 1. Overview
- **Validation Objective**: What you aim to verify
- **Validation Scope**: What will and will not be validated
- **Estimated Effort**: Rough time estimate for validation

### 2. Per-Executor Validation Plans
For EACH executor, specify:
- **Deliverables to Validate**: List each deliverable
- **Validation Dimensions**: Which of the 4 dimensions to focus on (Functionality, Completeness, Quality, Consistency)
- **Validation Methods**: How you will validate (manual review, checklist, testing, etc.)
- **Acceptance Criteria**: Specific criteria for accepting each deliverable
- **Test Cases**: Specific scenarios or test cases to verify

### 3. Tools and Resources
List any tools, frameworks, or resources you need:
- Testing tools or frameworks
- Reference materials
- Sample data or inputs
- Validation checklists

### 4. Risk Assessment
Identify potential risks:
- **Risk Category**: High/Medium/Low
- **Risk Description**: What could go wrong
- **Likelihood**: How likely is this risk
- **Impact**: Impact if risk occurs
- **Mitigation**: How to prevent or handle

### 5. Validation Sequence
Specify the order in which you will validate deliverables and explain why this sequence makes sense.

## Validation Dimensions (Use These)

${Object.values(VALIDATION_DIMENSIONS).map(dim => `
### ${dim.name} (Weight: ${dim.weight * 100}%)
${dim.description}

**Criteria**:
${dim.criteria.map(c => `- ${c}`).join('\n')}
`).join('\n')}

## Available Validation Methods

${Object.values(VALIDATION_METHODS).map(method => `
### ${method.name}
${method.description}

**Steps**:
${method.steps.map(s => `1. ${s}`).join('\n')}
`).join('\n')}

## Risk Categories

${Object.values(RISK_CATEGORIES).map(risk => `
### ${risk.level.toUpperCase()} Risk
${risk.description}

**Examples**: ${risk.examples.join(', ')}
**Action**: ${risk.action}
`).join('\n')}

## Output Format

Create your validation plan as a structured JSON object with the following structure:

\`\`\`json
{
  "overview": {
    "validationObjective": "...",
    "validationScope": "...",
    "estimatedEffort": "..."
  },
  "executorPlans": [
    {
      "executorRole": "...",
      "deliverables": ["..."],
      "validationDimensions": ["functionality", "completeness", "quality", "consistency"],
      "validationMethods": ["manual_review", "checklist_verification"],
      "acceptanceCriteria": {
        "deliverable1": ["criterion1", "criterion2"],
        "deliverable2": ["criterion1", "criterion2"]
      },
      "testCases": [
        {
          "name": "Test case name",
          "description": "What to test",
          "expectedResult": "What should happen"
        }
      ]
    }
  ],
  "toolsAndResources": [
    "Tool or resource 1",
    "Tool or resource 2"
  ],
  "riskAssessment": [
    {
      "category": "high|medium|low",
      "description": "Risk description",
      "likelihood": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "Mitigation strategy"
    }
  ],
  "validationSequence": [
    {
      "step": 1,
      "action": "What to validate first",
      "rationale": "Why this order"
    }
  ]
}
\`\`\`

## Important Notes

1. **Be Specific**: Acceptance criteria must be measurable and verifiable
2. **Be Thorough**: Cover all deliverables from all executors
3. **Be Realistic**: Ensure your plan is achievable within reasonable time
4. **Be Independent**: Your validation must be objective and unbiased
5. **Focus on Quality**: Your goal is to ensure deliverables meet standards, not to rubber-stamp

## After Creating Your Plan

1. Save your plan using the provided function
2. Report to PM that your validation plan is ready for review
3. Wait for PM approval before proceeding to validation
4. If PM rejects your plan, revise based on feedback and resubmit

## PM Will Check

- Completeness: All executors and deliverables covered
- Appropriateness: Methods match task type
- Clarity: Criteria are specific and actionable
- Feasibility: Plan is realistic and achievable

Create your validation plan now.`;
}

/**
 * Select Appropriate Validation Template
 *
 * Determines which template to use based on task type
 *
 * @param {string} taskType - Type of task (code, design, research, document, etc.)
 * @returns {string} Template ID to use
 */
function selectValidationTemplate(taskType) {
  const taskTypeLower = (taskType || '').toLowerCase();

  // Map task types to templates
  const templateMap = {
    'code': 'code-validation',
    'coding': 'code-validation',
    'programming': 'code-validation',
    'software': 'code-validation',
    'development': 'code-validation',

    'design': 'design-validation',
    'ui': 'design-validation',
    'ux': 'design-validation',
    'visual': 'design-validation',
    'graphics': 'design-validation',

    'document': 'document-validation',
    'writing': 'document-validation',
    'documentation': 'document-validation',
    'content': 'document-validation',

    'research': 'research-validation',
    'analysis': 'research-validation',
    'investigation': 'research-validation',
    'study': 'research-validation'
  };

  // Check for matching template
  for (const [key, template] of Object.entries(templateMap)) {
    if (taskTypeLower.includes(key)) {
      return template;
    }
  }

  // Default to generic template
  return 'generic';
}

/**
 * Export template configuration
 */
module.exports = {
  templateId: 'generic',
  templateName: 'Generic Validation Template',
  templateDescription: 'Universal validation template that works for any task type',
  applicableTo: ['all'],

  // Core components
  validationDimensions: VALIDATION_DIMENSIONS,
  validationMethods: VALIDATION_METHODS,
  riskCategories: RISK_CATEGORIES,
  planStructure: PLAN_STRUCTURE,
  pmApprovalCriteria: PM_APPROVAL_CRITERIA,

  // Functions
  generateValidationPlanPrompt,
  selectValidationTemplate
};

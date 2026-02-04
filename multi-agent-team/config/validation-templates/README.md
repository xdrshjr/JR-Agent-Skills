# Validation Templates

This directory contains validation plan templates for the QA agent. Templates provide standardized validation criteria, methods, and checklists for different types of deliverables.

## Available Templates

### 1. Generic Template (`generic.js`)
**Universal template that works for ANY task type**

- **Applicable To**: All deliverable types
- **Validation Dimensions**: 4 universal dimensions
  - Functionality (35%): Does it work as intended?
  - Completeness (25%): Is everything included?
  - Quality (25%): Is it well-crafted?
  - Consistency (15%): Is it internally consistent?
- **Validation Methods**: Manual review, checklist verification, cross-reference, sample testing
- **Use When**: No specific template matches the task type

### 2. Code Validation Template (`code-validation.js`)
**For code projects and software development**

- **Applicable To**: Code, programming, software development
- **Additional Focus**:
  - Code execution and testing
  - Security vulnerabilities (SQL injection, XSS, etc.)
  - Dependencies and configuration
  - Code quality and maintainability
- **Validation Methods**: Code execution, code review, dependency check, unit test review
- **Use When**: Task involves writing or modifying code

### 3. Design Validation Template (`design-validation.js`)
**For UI/UX design, graphics, and visual design**

- **Applicable To**: Design, UI, UX, visual design, graphics
- **Additional Focus**:
  - Visual quality and hierarchy
  - Accessibility (WCAG standards)
  - Design system compliance
  - Responsive design
  - User flows
- **Validation Methods**: Visual inspection, design system compliance, accessibility check, responsive review
- **Use When**: Task involves creating or modifying visual designs

### 4. Document Validation Template (`document-validation.js`)
**For written content, documentation, and reports**

- **Applicable To**: Documents, writing, documentation, content
- **Additional Focus**:
  - Content quality and accuracy
  - Writing quality (grammar, spelling, clarity)
  - Structure and organization
  - Fact checking
  - Style guide compliance
- **Validation Methods**: Readability analysis, grammar check, structure review, fact checking
- **Use When**: Task involves creating or editing written content

### 5. Research Validation Template (`research-validation.js`)
**For research reports, analysis, and investigations**

- **Applicable To**: Research, analysis, investigation, study
- **Additional Focus**:
  - Source credibility and verification
  - Data accuracy and reliability
  - Methodology soundness
  - Analysis rigor
  - Citation accuracy
- **Validation Methods**: Source verification, data validation, methodology review, analysis review
- **Use When**: Task involves research or analysis work

## Template Structure

Each template is a JavaScript module that exports:

```javascript
module.exports = {
  templateId: 'template-id',
  templateName: 'Human-Readable Name',
  templateDescription: 'Description of what this template is for',
  applicableTo: ['task', 'types'],

  // Core components
  validationDimensions: { /* 4 dimensions with criteria */ },
  validationMethods: { /* Available validation methods */ },
  riskCategories: { /* Risk levels and examples */ },
  validationChecklist: { /* Specific checklist items */ },
  planStructure: { /* Plan structure template */ },
  pmApprovalCriteria: { /* What PM should check */ },

  // Functions
  generateValidationPlanPrompt: function(projectContext) { /* ... */ }
};
```

## How Templates Are Used

### 1. Template Selection
The system automatically selects the appropriate template based on task type:

```javascript
const { selectValidationTemplate } = require('./generic');
const templateId = selectValidationTemplate('code'); // Returns 'code-validation'
```

### 2. Loading Template
Templates are loaded dynamically:

```javascript
const template = require(`./validation-templates/${templateId}`);
```

### 3. Generating QA Instructions
Templates generate detailed instructions for the QA agent:

```javascript
const prompt = template.generateValidationPlanPrompt({
  taskType: 'code',
  taskDescription: 'Build a REST API',
  executors: [
    { role: 'Backend Developer', deliverables: ['API endpoints', 'Database schema'] }
  ],
  requirements: { /* ... */ }
});
```

### 4. Creating Validation Plan
QA agent creates a validation plan following the template structure:

```javascript
const plan = {
  overview: {
    validationObjective: '...',
    validationScope: '...',
    estimatedEffort: '...'
  },
  executorPlans: [
    {
      executorRole: 'Backend Developer',
      deliverables: ['API endpoints', 'Database schema'],
      validationDimensions: ['functionality', 'completeness', 'quality'],
      validationMethods: ['code_execution', 'code_review'],
      acceptanceCriteria: { /* ... */ },
      testCases: [ /* ... */ ]
    }
  ],
  toolsAndResources: [ /* ... */ ],
  riskAssessment: [ /* ... */ ],
  validationSequence: [ /* ... */ ]
};
```

## Creating New Templates

To create a new template for a specific task type:

### 1. Create Template File
Create a new file in this directory: `{task-type}-validation.js`

### 2. Extend Generic Template
Start by extending the generic template:

```javascript
const genericTemplate = require('./generic');

module.exports = {
  templateId: 'my-validation',
  templateName: 'My Validation Template',
  templateDescription: 'Validation for my specific task type',
  applicableTo: ['my-task-type'],

  // Extend generic dimensions
  validationDimensions: {
    ...genericTemplate.validationDimensions,
    // Add or override dimensions
  },

  // Add specific methods
  validationMethods: {
    ...genericTemplate.validationMethods,
    MY_SPECIFIC_METHOD: {
      id: 'my_specific_method',
      name: 'My Specific Method',
      description: 'Description',
      applicableTo: ['my-task-type'],
      steps: [ /* ... */ ]
    }
  },

  // Inherit or override other components
  riskCategories: genericTemplate.riskCategories,
  planStructure: genericTemplate.planStructure,
  pmApprovalCriteria: genericTemplate.pmApprovalCriteria,

  // Custom prompt generator
  generateValidationPlanPrompt: function(projectContext) {
    const basePrompt = genericTemplate.generateValidationPlanPrompt(projectContext);
    const specificAddition = `\n\n## My Specific Requirements\n...`;
    return basePrompt + specificAddition;
  }
};
```

### 3. Update Template Selection
Add your task type to the template map in `generic.js`:

```javascript
const templateMap = {
  // ... existing mappings
  'my-task-type': 'my-validation'
};
```

### 4. Test Your Template
Test that your template:
- Loads correctly
- Generates appropriate prompts
- Provides useful validation criteria
- Works with the QA workflow

## Best Practices

### Template Design
- **Start with Generic**: Always extend the generic template
- **Add, Don't Replace**: Add task-specific criteria, don't remove universal ones
- **Be Specific**: Provide concrete, actionable validation criteria
- **Include Examples**: Show examples of what to check
- **Provide Checklists**: Give QA agents clear checklists to follow

### Validation Criteria
- **Measurable**: Criteria should be verifiable (not subjective)
- **Actionable**: QA should know exactly what to check
- **Comprehensive**: Cover all important aspects
- **Prioritized**: Focus on high-impact issues first

### Validation Methods
- **Practical**: Methods should be feasible to execute
- **Appropriate**: Match methods to deliverable type
- **Clear Steps**: Provide step-by-step instructions
- **Tool-Aware**: Reference specific tools when helpful

### Risk Assessment
- **Realistic**: Identify actual risks, not theoretical ones
- **Categorized**: Use high/medium/low consistently
- **Actionable**: Provide clear mitigation strategies
- **Prioritized**: Focus on high-impact risks

## Integration with QA Workflow

Templates integrate with the QA workflow as follows:

1. **QA Planning Phase**: QA agent enters `QA_PLANNING` state
2. **Template Selection**: System selects appropriate template based on task type
3. **Prompt Generation**: Template generates detailed instructions for QA
4. **Plan Creation**: QA creates validation plan following template structure
5. **PM Approval**: PM reviews plan against template's approval criteria
6. **Validation Execution**: QA executes plan using template's methods and checklists
7. **Results Reporting**: QA reports results structured by template dimensions

## Template Maintenance

### When to Update Templates
- New validation methods become available
- New risk categories are identified
- Feedback from QA agents suggests improvements
- New best practices emerge

### Version Control
- Templates are version-controlled with the codebase
- Changes to templates affect all future validation plans
- Existing validation plans are not retroactively updated

### Backward Compatibility
- Maintain backward compatibility when possible
- If breaking changes are needed, update documentation
- Consider migration path for existing projects

## Support

For questions or issues with templates:
1. Check this README
2. Review existing templates for examples
3. Consult `SKILL.md` for QA workflow details
4. Ask PM for guidance

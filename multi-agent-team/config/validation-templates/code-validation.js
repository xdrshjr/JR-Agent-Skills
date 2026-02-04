/**
 * Code Validation Template
 *
 * Extends the generic template with code-specific validation criteria,
 * methods, and best practices.
 */

const genericTemplate = require('./generic');

/**
 * Code-Specific Validation Dimensions
 * Extends the 4 universal dimensions with code-specific criteria
 */
const CODE_VALIDATION_DIMENSIONS = {
  ...genericTemplate.validationDimensions,

  // Extend Functionality for code
  FUNCTIONALITY: {
    ...genericTemplate.validationDimensions.FUNCTIONALITY,
    criteria: [
      ...genericTemplate.validationDimensions.FUNCTIONALITY.criteria,
      'Code executes without errors',
      'All features work as specified',
      'Edge cases are handled properly',
      'Error handling is appropriate'
    ]
  },

  // Extend Completeness for code
  COMPLETENESS: {
    ...genericTemplate.validationDimensions.COMPLETENESS,
    criteria: [
      ...genericTemplate.validationDimensions.COMPLETENESS.criteria,
      'All dependencies are documented',
      'Configuration files are included',
      'README with setup instructions exists',
      'Tests are included (if required)'
    ]
  },

  // Extend Quality for code
  QUALITY: {
    ...genericTemplate.validationDimensions.QUALITY,
    criteria: [
      ...genericTemplate.validationDimensions.QUALITY.criteria,
      'Code follows best practices',
      'No obvious security vulnerabilities',
      'Performance is acceptable',
      'Code is maintainable and readable'
    ]
  }
};

/**
 * Code-Specific Validation Methods
 */
const CODE_VALIDATION_METHODS = {
  ...genericTemplate.validationMethods,

  CODE_EXECUTION: {
    id: 'code_execution',
    name: 'Code Execution Test',
    description: 'Run the code to verify it executes without errors',
    applicableTo: ['code'],
    steps: [
      'Install dependencies (npm install, pip install, etc.)',
      'Run the code with sample inputs',
      'Verify it executes without errors',
      'Check outputs match expectations',
      'Test edge cases and error scenarios'
    ]
  },

  CODE_REVIEW: {
    id: 'code_review',
    name: 'Code Review',
    description: 'Manual review of code quality and best practices',
    applicableTo: ['code'],
    steps: [
      'Review code structure and organization',
      'Check for security vulnerabilities (SQL injection, XSS, etc.)',
      'Verify error handling is appropriate',
      'Check for code smells and anti-patterns',
      'Verify comments and documentation'
    ]
  },

  DEPENDENCY_CHECK: {
    id: 'dependency_check',
    name: 'Dependency Verification',
    description: 'Verify all dependencies are properly declared and available',
    applicableTo: ['code'],
    steps: [
      'Check package.json/requirements.txt/etc. exists',
      'Verify all imports have corresponding dependencies',
      'Check for version conflicts',
      'Verify dependencies can be installed',
      'Check for security vulnerabilities in dependencies'
    ]
  },

  UNIT_TEST_REVIEW: {
    id: 'unit_test_review',
    name: 'Unit Test Review',
    description: 'Review and run unit tests if provided',
    applicableTo: ['code'],
    steps: [
      'Check if tests exist',
      'Review test coverage',
      'Run tests and verify they pass',
      'Check test quality and assertions',
      'Verify edge cases are tested'
    ]
  }
};

/**
 * Code-Specific Risk Categories
 */
const CODE_RISK_CATEGORIES = {
  ...genericTemplate.riskCategories,

  SECURITY: {
    level: 'high',
    description: 'Security vulnerabilities that could be exploited',
    examples: [
      'SQL injection vulnerabilities',
      'Cross-site scripting (XSS) vulnerabilities',
      'Insecure authentication or authorization',
      'Exposed secrets or credentials',
      'Command injection vulnerabilities'
    ],
    action: 'Must be fixed immediately before acceptance'
  },

  PERFORMANCE: {
    level: 'medium',
    description: 'Performance issues that impact user experience',
    examples: [
      'Inefficient algorithms or queries',
      'Memory leaks',
      'Blocking operations on main thread',
      'Excessive API calls'
    ],
    action: 'Should be optimized, may accept with documented issues'
  },

  MAINTAINABILITY: {
    level: 'low',
    description: 'Code quality issues that impact long-term maintenance',
    examples: [
      'Poor code organization',
      'Lack of comments or documentation',
      'Code duplication',
      'Overly complex logic'
    ],
    action: 'Can be improved later or accepted as-is'
  }
};

/**
 * Code-Specific Validation Checklist
 */
const CODE_VALIDATION_CHECKLIST = {
  EXECUTION: [
    'Code runs without errors',
    'All features work as specified',
    'Edge cases are handled',
    'Error messages are clear and helpful'
  ],

  DEPENDENCIES: [
    'All dependencies are declared',
    'Dependencies can be installed',
    'No version conflicts',
    'No unnecessary dependencies'
  ],

  SECURITY: [
    'No SQL injection vulnerabilities',
    'No XSS vulnerabilities',
    'No command injection vulnerabilities',
    'No exposed secrets or credentials',
    'Input validation is present',
    'Authentication/authorization is secure'
  ],

  QUALITY: [
    'Code follows language best practices',
    'Code is readable and maintainable',
    'No obvious code smells',
    'Error handling is appropriate',
    'Logging is appropriate'
  ],

  DOCUMENTATION: [
    'README exists with setup instructions',
    'Code has appropriate comments',
    'API documentation exists (if applicable)',
    'Configuration is documented'
  ],

  TESTING: [
    'Tests exist (if required)',
    'Tests pass',
    'Test coverage is adequate',
    'Edge cases are tested'
  ]
};

/**
 * Generate Code-Specific Validation Plan Prompt
 */
function generateCodeValidationPrompt(projectContext) {
  const basePrompt = genericTemplate.generateValidationPlanPrompt(projectContext);

  const codeSpecificAddition = `

## Code-Specific Validation Requirements

### Execution Testing
You MUST test code execution:
1. Install dependencies
2. Run the code with sample inputs
3. Verify it executes without errors
4. Test edge cases and error scenarios

### Security Review
You MUST check for common vulnerabilities:
- SQL injection
- Cross-site scripting (XSS)
- Command injection
- Exposed secrets or credentials
- Insecure authentication/authorization

### Code Quality Review
You MUST review code quality:
- Code structure and organization
- Best practices for the language/framework
- Error handling
- Code readability and maintainability
- Comments and documentation

### Dependency Verification
You MUST verify dependencies:
- All dependencies are declared
- Dependencies can be installed
- No version conflicts
- No security vulnerabilities in dependencies

### Code-Specific Validation Checklist

Use this checklist in your validation plan:

**Execution**:
${CODE_VALIDATION_CHECKLIST.EXECUTION.map(item => `- [ ] ${item}`).join('\n')}

**Dependencies**:
${CODE_VALIDATION_CHECKLIST.DEPENDENCIES.map(item => `- [ ] ${item}`).join('\n')}

**Security**:
${CODE_VALIDATION_CHECKLIST.SECURITY.map(item => `- [ ] ${item}`).join('\n')}

**Quality**:
${CODE_VALIDATION_CHECKLIST.QUALITY.map(item => `- [ ] ${item}`).join('\n')}

**Documentation**:
${CODE_VALIDATION_CHECKLIST.DOCUMENTATION.map(item => `- [ ] ${item}`).join('\n')}

**Testing**:
${CODE_VALIDATION_CHECKLIST.TESTING.map(item => `- [ ] ${item}`).join('\n')}

### Code-Specific Test Cases

Include test cases like:
- **Happy Path**: Normal execution with valid inputs
- **Edge Cases**: Boundary conditions, empty inputs, null values
- **Error Cases**: Invalid inputs, missing dependencies, permission errors
- **Security Cases**: Malicious inputs, injection attempts
- **Performance Cases**: Large inputs, concurrent requests (if applicable)
`;

  return basePrompt + codeSpecificAddition;
}

/**
 * Export code validation template
 */
module.exports = {
  templateId: 'code-validation',
  templateName: 'Code Validation Template',
  templateDescription: 'Validation template for code projects and software development',
  applicableTo: ['code', 'coding', 'programming', 'software', 'development'],

  // Extend generic template
  validationDimensions: CODE_VALIDATION_DIMENSIONS,
  validationMethods: CODE_VALIDATION_METHODS,
  riskCategories: CODE_RISK_CATEGORIES,
  validationChecklist: CODE_VALIDATION_CHECKLIST,

  // Inherit from generic
  planStructure: genericTemplate.planStructure,
  pmApprovalCriteria: genericTemplate.pmApprovalCriteria,

  // Code-specific function
  generateValidationPlanPrompt: generateCodeValidationPrompt
};

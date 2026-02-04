/**
 * Document Validation Template
 *
 * Extends the generic template with document-specific validation criteria,
 * methods, and best practices for written content, documentation, and reports.
 */

const genericTemplate = require('./generic');

/**
 * Document-Specific Validation Dimensions
 */
const DOCUMENT_VALIDATION_DIMENSIONS = {
  ...genericTemplate.validationDimensions,

  // Extend Functionality for documents
  FUNCTIONALITY: {
    ...genericTemplate.validationDimensions.FUNCTIONALITY,
    criteria: [
      ...genericTemplate.validationDimensions.FUNCTIONALITY.criteria,
      'Document serves its intended purpose',
      'Information is accurate and up-to-date',
      'Content addresses target audience needs',
      'Key messages are clear and effective'
    ]
  },

  // Extend Completeness for documents
  COMPLETENESS: {
    ...genericTemplate.validationDimensions.COMPLETENESS,
    criteria: [
      ...genericTemplate.validationDimensions.COMPLETENESS.criteria,
      'All required sections included',
      'All topics covered adequately',
      'Supporting materials included (images, tables, etc.)',
      'References and citations included'
    ]
  },

  // Extend Quality for documents
  QUALITY: {
    ...genericTemplate.validationDimensions.QUALITY,
    criteria: [
      ...genericTemplate.validationDimensions.QUALITY.criteria,
      'Writing is clear and concise',
      'Grammar and spelling are correct',
      'Tone is appropriate for audience',
      'Structure and flow are logical',
      'Formatting is professional'
    ]
  },

  // Extend Consistency for documents
  CONSISTENCY: {
    ...genericTemplate.validationDimensions.CONSISTENCY,
    criteria: [
      ...genericTemplate.validationDimensions.CONSISTENCY.criteria,
      'Terminology is used consistently',
      'Style guide is followed',
      'Voice and tone are consistent',
      'Formatting is consistent throughout'
    ]
  }
};

/**
 * Document-Specific Validation Methods
 */
const DOCUMENT_VALIDATION_METHODS = {
  ...genericTemplate.validationMethods,

  READABILITY_ANALYSIS: {
    id: 'readability_analysis',
    name: 'Readability Analysis',
    description: 'Assess document readability and clarity',
    applicableTo: ['document'],
    steps: [
      'Check sentence length and complexity',
      'Verify paragraph structure',
      'Check for jargon and technical terms',
      'Assess overall reading level',
      'Verify headings and subheadings are clear'
    ]
  },

  GRAMMAR_AND_SPELLING: {
    id: 'grammar_and_spelling',
    name: 'Grammar and Spelling Check',
    description: 'Verify grammar, spelling, and punctuation',
    applicableTo: ['document'],
    steps: [
      'Run spell checker',
      'Check grammar and punctuation',
      'Verify proper capitalization',
      'Check for common errors (their/there, its/it\'s)',
      'Verify consistent tense usage'
    ]
  },

  STRUCTURE_REVIEW: {
    id: 'structure_review',
    name: 'Structure and Organization Review',
    description: 'Verify document structure and flow',
    applicableTo: ['document'],
    steps: [
      'Check document outline and hierarchy',
      'Verify logical flow of information',
      'Check for smooth transitions',
      'Verify table of contents (if applicable)',
      'Check section numbering and references'
    ]
  },

  FACT_CHECKING: {
    id: 'fact_checking',
    name: 'Fact Checking',
    description: 'Verify accuracy of information and claims',
    applicableTo: ['document'],
    steps: [
      'Verify factual claims',
      'Check statistics and data',
      'Verify quotes and attributions',
      'Check dates and timelines',
      'Verify references and citations'
    ]
  },

  STYLE_GUIDE_COMPLIANCE: {
    id: 'style_guide_compliance',
    name: 'Style Guide Compliance',
    description: 'Verify document follows style guide',
    applicableTo: ['document'],
    steps: [
      'Check formatting against style guide',
      'Verify terminology usage',
      'Check citation format',
      'Verify heading styles',
      'Check for brand voice compliance'
    ]
  }
};

/**
 * Document-Specific Risk Categories
 */
const DOCUMENT_RISK_CATEGORIES = {
  ...genericTemplate.riskCategories,

  FACTUAL_ERRORS: {
    level: 'high',
    description: 'Incorrect information that could mislead readers',
    examples: [
      'Incorrect statistics or data',
      'Misattributed quotes',
      'Outdated information',
      'Factual inaccuracies',
      'Broken or incorrect references'
    ],
    action: 'Must be corrected before publication'
  },

  CLARITY_ISSUES: {
    level: 'medium',
    description: 'Unclear writing that confuses readers',
    examples: [
      'Ambiguous statements',
      'Overly complex sentences',
      'Unclear structure',
      'Missing context',
      'Inconsistent terminology'
    ],
    action: 'Should be clarified for better understanding'
  },

  FORMATTING_ISSUES: {
    level: 'low',
    description: 'Formatting inconsistencies that affect professionalism',
    examples: [
      'Inconsistent heading styles',
      'Formatting errors',
      'Broken links or references',
      'Inconsistent spacing',
      'Missing page numbers'
    ],
    action: 'Can be fixed during final polish'
  }
};

/**
 * Document-Specific Validation Checklist
 */
const DOCUMENT_VALIDATION_CHECKLIST = {
  CONTENT: [
    'All required sections included',
    'Content is accurate and up-to-date',
    'Information is complete and comprehensive',
    'Key messages are clear',
    'Target audience needs are addressed',
    'Supporting materials included (images, tables, etc.)'
  ],

  WRITING_QUALITY: [
    'Writing is clear and concise',
    'Grammar is correct',
    'Spelling is correct',
    'Punctuation is correct',
    'Tone is appropriate for audience',
    'Voice is consistent throughout'
  ],

  STRUCTURE: [
    'Document has logical structure',
    'Flow of information is smooth',
    'Transitions between sections are clear',
    'Headings and subheadings are descriptive',
    'Table of contents is accurate (if applicable)',
    'Section numbering is correct'
  ],

  ACCURACY: [
    'Factual claims are verified',
    'Statistics and data are correct',
    'Quotes are accurate and attributed',
    'Dates and timelines are correct',
    'References and citations are correct',
    'Links are working'
  ],

  FORMATTING: [
    'Formatting is consistent throughout',
    'Style guide is followed',
    'Heading styles are consistent',
    'Font usage is consistent',
    'Spacing is consistent',
    'Page numbers are correct (if applicable)'
  ],

  CONSISTENCY: [
    'Terminology is used consistently',
    'Tense is consistent',
    'Voice and tone are consistent',
    'Formatting is consistent',
    'Style is consistent'
  ]
};

/**
 * Generate Document-Specific Validation Plan Prompt
 */
function generateDocumentValidationPrompt(projectContext) {
  const basePrompt = genericTemplate.generateValidationPlanPrompt(projectContext);

  const documentSpecificAddition = `

## Document-Specific Validation Requirements

### Content Review
You MUST review content quality:
1. Verify all required sections are included
2. Check information accuracy and completeness
3. Verify content addresses target audience needs
4. Check that key messages are clear
5. Verify supporting materials are included

### Writing Quality Review
You MUST review writing quality:
- Check grammar, spelling, and punctuation
- Verify writing is clear and concise
- Check tone is appropriate for audience
- Verify sentence structure and complexity
- Check for common writing errors

### Structure and Organization
You MUST verify document structure:
- Check document outline and hierarchy
- Verify logical flow of information
- Check transitions between sections
- Verify table of contents (if applicable)
- Check section numbering and references

### Fact Checking
You MUST verify accuracy:
- Check factual claims
- Verify statistics and data
- Verify quotes and attributions
- Check dates and timelines
- Verify references and citations

### Document-Specific Validation Checklist

Use this checklist in your validation plan:

**Content**:
${DOCUMENT_VALIDATION_CHECKLIST.CONTENT.map(item => `- [ ] ${item}`).join('\n')}

**Writing Quality**:
${DOCUMENT_VALIDATION_CHECKLIST.WRITING_QUALITY.map(item => `- [ ] ${item}`).join('\n')}

**Structure**:
${DOCUMENT_VALIDATION_CHECKLIST.STRUCTURE.map(item => `- [ ] ${item}`).join('\n')}

**Accuracy**:
${DOCUMENT_VALIDATION_CHECKLIST.ACCURACY.map(item => `- [ ] ${item}`).join('\n')}

**Formatting**:
${DOCUMENT_VALIDATION_CHECKLIST.FORMATTING.map(item => `- [ ] ${item}`).join('\n')}

**Consistency**:
${DOCUMENT_VALIDATION_CHECKLIST.CONSISTENCY.map(item => `- [ ] ${item}`).join('\n')}

### Document-Specific Test Cases

Include test cases like:
- **Readability Test**: Read document as target audience member
- **Fact Check**: Verify key claims and statistics
- **Structure Test**: Check logical flow and organization
- **Grammar Check**: Review for grammar and spelling errors
- **Style Guide Check**: Compare against style guide requirements
`;

  return basePrompt + documentSpecificAddition;
}

/**
 * Export document validation template
 */
module.exports = {
  templateId: 'document-validation',
  templateName: 'Document Validation Template',
  templateDescription: 'Validation template for written content, documentation, and reports',
  applicableTo: ['document', 'writing', 'documentation', 'content'],

  // Extend generic template
  validationDimensions: DOCUMENT_VALIDATION_DIMENSIONS,
  validationMethods: DOCUMENT_VALIDATION_METHODS,
  riskCategories: DOCUMENT_RISK_CATEGORIES,
  validationChecklist: DOCUMENT_VALIDATION_CHECKLIST,

  // Inherit from generic
  planStructure: genericTemplate.planStructure,
  pmApprovalCriteria: genericTemplate.pmApprovalCriteria,

  // Document-specific function
  generateValidationPlanPrompt: generateDocumentValidationPrompt
};

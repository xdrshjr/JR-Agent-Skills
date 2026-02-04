/**
 * Research Validation Template
 *
 * Extends the generic template with research-specific validation criteria,
 * methods, and best practices for research reports, analysis, and investigations.
 */

const genericTemplate = require('./generic');

/**
 * Research-Specific Validation Dimensions
 */
const RESEARCH_VALIDATION_DIMENSIONS = {
  ...genericTemplate.validationDimensions,

  // Extend Functionality for research
  FUNCTIONALITY: {
    ...genericTemplate.validationDimensions.FUNCTIONALITY,
    criteria: [
      ...genericTemplate.validationDimensions.FUNCTIONALITY.criteria,
      'Research answers the research questions',
      'Methodology is appropriate for the questions',
      'Analysis is sound and well-reasoned',
      'Conclusions are supported by evidence'
    ]
  },

  // Extend Completeness for research
  COMPLETENESS: {
    ...genericTemplate.validationDimensions.COMPLETENESS,
    criteria: [
      ...genericTemplate.validationDimensions.COMPLETENESS.criteria,
      'All research questions addressed',
      'Sufficient data collected',
      'All sources properly cited',
      'Limitations acknowledged'
    ]
  },

  // Extend Quality for research
  QUALITY: {
    ...genericTemplate.validationDimensions.QUALITY,
    criteria: [
      ...genericTemplate.validationDimensions.QUALITY.criteria,
      'Sources are credible and authoritative',
      'Data is accurate and reliable',
      'Analysis is rigorous and thorough',
      'Methodology is sound',
      'Findings are clearly presented'
    ]
  },

  // Extend Consistency for research
  CONSISTENCY: {
    ...genericTemplate.validationDimensions.CONSISTENCY,
    criteria: [
      ...genericTemplate.validationDimensions.CONSISTENCY.criteria,
      'Methodology is consistently applied',
      'Terminology is used consistently',
      'Analysis approach is consistent',
      'Citation format is consistent'
    ]
  }
};

/**
 * Research-Specific Validation Methods
 */
const RESEARCH_VALIDATION_METHODS = {
  ...genericTemplate.validationMethods,

  SOURCE_VERIFICATION: {
    id: 'source_verification',
    name: 'Source Verification',
    description: 'Verify credibility and accuracy of sources',
    applicableTo: ['research'],
    steps: [
      'Check source credibility and authority',
      'Verify sources are current and relevant',
      'Check for bias in sources',
      'Verify citations are accurate',
      'Check for primary vs. secondary sources'
    ]
  },

  DATA_VALIDATION: {
    id: 'data_validation',
    name: 'Data Validation',
    description: 'Verify accuracy and reliability of data',
    applicableTo: ['research'],
    steps: [
      'Check data sources and collection methods',
      'Verify data accuracy',
      'Check for data completeness',
      'Verify statistical analysis (if applicable)',
      'Check for data interpretation errors'
    ]
  },

  METHODOLOGY_REVIEW: {
    id: 'methodology_review',
    name: 'Methodology Review',
    description: 'Review research methodology for soundness',
    applicableTo: ['research'],
    steps: [
      'Review research design',
      'Check if methodology matches research questions',
      'Verify methodology is appropriate',
      'Check for methodological limitations',
      'Verify methodology is clearly described'
    ]
  },

  ANALYSIS_REVIEW: {
    id: 'analysis_review',
    name: 'Analysis Review',
    description: 'Review analysis for rigor and soundness',
    applicableTo: ['research'],
    steps: [
      'Check logical reasoning',
      'Verify conclusions follow from evidence',
      'Check for alternative explanations',
      'Verify analysis is thorough',
      'Check for bias in interpretation'
    ]
  },

  CITATION_CHECK: {
    id: 'citation_check',
    name: 'Citation Check',
    description: 'Verify citations are complete and accurate',
    applicableTo: ['research'],
    steps: [
      'Check all claims are cited',
      'Verify citation format is consistent',
      'Check citations are complete',
      'Verify citations are accurate',
      'Check for missing citations'
    ]
  }
};

/**
 * Research-Specific Risk Categories
 */
const RESEARCH_RISK_CATEGORIES = {
  ...genericTemplate.riskCategories,

  SOURCE_CREDIBILITY: {
    level: 'high',
    description: 'Use of unreliable or biased sources',
    examples: [
      'Unreliable or non-authoritative sources',
      'Outdated sources',
      'Biased sources',
      'Unverified claims',
      'Missing citations'
    ],
    action: 'Must be corrected with credible sources'
  },

  DATA_ACCURACY: {
    level: 'high',
    description: 'Inaccurate or incomplete data',
    examples: [
      'Incorrect data',
      'Incomplete data',
      'Misinterpreted data',
      'Statistical errors',
      'Cherry-picked data'
    ],
    action: 'Must be corrected before acceptance'
  },

  METHODOLOGY_ISSUES: {
    level: 'medium',
    description: 'Methodological limitations or flaws',
    examples: [
      'Inappropriate methodology',
      'Unclear methodology',
      'Methodological limitations not acknowledged',
      'Inconsistent application of methodology'
    ],
    action: 'Should be addressed or acknowledged'
  },

  ANALYSIS_FLAWS: {
    level: 'medium',
    description: 'Flaws in reasoning or analysis',
    examples: [
      'Logical fallacies',
      'Unsupported conclusions',
      'Bias in interpretation',
      'Alternative explanations not considered',
      'Overgeneralization'
    ],
    action: 'Should be corrected or qualified'
  }
};

/**
 * Research-Specific Validation Checklist
 */
const RESEARCH_VALIDATION_CHECKLIST = {
  RESEARCH_QUESTIONS: [
    'Research questions are clearly stated',
    'All research questions are addressed',
    'Questions are appropriate for the topic',
    'Scope is clearly defined'
  ],

  SOURCES: [
    'Sources are credible and authoritative',
    'Sources are current and relevant',
    'Primary sources used where appropriate',
    'Sources are diverse (not over-reliant on single source)',
    'Potential bias in sources is acknowledged',
    'All sources are properly cited'
  ],

  DATA: [
    'Data sources are clearly identified',
    'Data collection methods are described',
    'Data is accurate and complete',
    'Data is relevant to research questions',
    'Statistical analysis is correct (if applicable)',
    'Data limitations are acknowledged'
  ],

  METHODOLOGY: [
    'Research methodology is clearly described',
    'Methodology is appropriate for research questions',
    'Methodology is consistently applied',
    'Methodological limitations are acknowledged',
    'Ethical considerations addressed (if applicable)'
  ],

  ANALYSIS: [
    'Analysis is thorough and rigorous',
    'Logical reasoning is sound',
    'Conclusions are supported by evidence',
    'Alternative explanations are considered',
    'Limitations of analysis are acknowledged',
    'Bias in interpretation is minimized'
  ],

  PRESENTATION: [
    'Findings are clearly presented',
    'Structure is logical and easy to follow',
    'Key findings are highlighted',
    'Visualizations are clear and accurate (if applicable)',
    'Executive summary provided (if applicable)',
    'Recommendations are actionable (if applicable)'
  ]
};

/**
 * Generate Research-Specific Validation Plan Prompt
 */
function generateResearchValidationPrompt(projectContext) {
  const basePrompt = genericTemplate.generateValidationPlanPrompt(projectContext);

  const researchSpecificAddition = `

## Research-Specific Validation Requirements

### Source Verification
You MUST verify source credibility:
1. Check source authority and credibility
2. Verify sources are current and relevant
3. Check for bias in sources
4. Verify citations are accurate
5. Check balance of primary vs. secondary sources

### Data Validation
You MUST verify data accuracy:
- Check data sources and collection methods
- Verify data accuracy and completeness
- Check statistical analysis (if applicable)
- Verify data interpretation is correct
- Check for cherry-picking or selective use of data

### Methodology Review
You MUST review methodology:
- Check if methodology matches research questions
- Verify methodology is appropriate and sound
- Check for methodological limitations
- Verify methodology is clearly described
- Check for ethical considerations

### Analysis Review
You MUST review analysis quality:
- Check logical reasoning
- Verify conclusions follow from evidence
- Check for alternative explanations
- Verify analysis is thorough
- Check for bias in interpretation

### Research-Specific Validation Checklist

Use this checklist in your validation plan:

**Research Questions**:
${RESEARCH_VALIDATION_CHECKLIST.RESEARCH_QUESTIONS.map(item => `- [ ] ${item}`).join('\n')}

**Sources**:
${RESEARCH_VALIDATION_CHECKLIST.SOURCES.map(item => `- [ ] ${item}`).join('\n')}

**Data**:
${RESEARCH_VALIDATION_CHECKLIST.DATA.map(item => `- [ ] ${item}`).join('\n')}

**Methodology**:
${RESEARCH_VALIDATION_CHECKLIST.METHODOLOGY.map(item => `- [ ] ${item}`).join('\n')}

**Analysis**:
${RESEARCH_VALIDATION_CHECKLIST.ANALYSIS.map(item => `- [ ] ${item}`).join('\n')}

**Presentation**:
${RESEARCH_VALIDATION_CHECKLIST.PRESENTATION.map(item => `- [ ] ${item}`).join('\n')}

### Research-Specific Test Cases

Include test cases like:
- **Source Check**: Verify credibility of key sources
- **Data Verification**: Check accuracy of key data points
- **Citation Check**: Verify all citations are accurate
- **Logic Check**: Review reasoning and conclusions
- **Completeness Check**: Verify all research questions answered
`;

  return basePrompt + researchSpecificAddition;
}

/**
 * Export research validation template
 */
module.exports = {
  templateId: 'research-validation',
  templateName: 'Research Validation Template',
  templateDescription: 'Validation template for research reports, analysis, and investigations',
  applicableTo: ['research', 'analysis', 'investigation', 'study'],

  // Extend generic template
  validationDimensions: RESEARCH_VALIDATION_DIMENSIONS,
  validationMethods: RESEARCH_VALIDATION_METHODS,
  riskCategories: RESEARCH_RISK_CATEGORIES,
  validationChecklist: RESEARCH_VALIDATION_CHECKLIST,

  // Inherit from generic
  planStructure: genericTemplate.planStructure,
  pmApprovalCriteria: genericTemplate.pmApprovalCriteria,

  // Research-specific function
  generateValidationPlanPrompt: generateResearchValidationPrompt
};

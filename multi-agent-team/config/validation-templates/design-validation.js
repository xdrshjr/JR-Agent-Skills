/**
 * Design Validation Template
 *
 * Extends the generic template with design-specific validation criteria,
 * methods, and best practices for UI/UX, graphics, and visual design.
 */

const genericTemplate = require('./generic');

/**
 * Design-Specific Validation Dimensions
 */
const DESIGN_VALIDATION_DIMENSIONS = {
  ...genericTemplate.validationDimensions,

  // Extend Functionality for design
  FUNCTIONALITY: {
    ...genericTemplate.validationDimensions.FUNCTIONALITY,
    criteria: [
      ...genericTemplate.validationDimensions.FUNCTIONALITY.criteria,
      'Design serves its intended purpose',
      'Interactive elements are functional',
      'User flows are logical and intuitive',
      'Accessibility requirements are met'
    ]
  },

  // Extend Completeness for design
  COMPLETENESS: {
    ...genericTemplate.validationDimensions.COMPLETENESS,
    criteria: [
      ...genericTemplate.validationDimensions.COMPLETENESS.criteria,
      'All required screens/pages included',
      'All states and variations covered',
      'Assets in required formats and sizes',
      'Design specifications documented'
    ]
  },

  // Extend Quality for design
  QUALITY: {
    ...genericTemplate.validationDimensions.QUALITY,
    criteria: [
      ...genericTemplate.validationDimensions.QUALITY.criteria,
      'Visual hierarchy is clear',
      'Typography is appropriate and readable',
      'Color usage is effective and accessible',
      'Spacing and alignment are consistent',
      'Design is polished and professional'
    ]
  },

  // Extend Consistency for design
  CONSISTENCY: {
    ...genericTemplate.validationDimensions.CONSISTENCY,
    criteria: [
      ...genericTemplate.validationDimensions.CONSISTENCY.criteria,
      'Follows design system guidelines',
      'Brand identity is maintained',
      'Visual style is consistent across screens',
      'Component usage is consistent'
    ]
  }
};

/**
 * Design-Specific Validation Methods
 */
const DESIGN_VALIDATION_METHODS = {
  ...genericTemplate.validationMethods,

  VISUAL_INSPECTION: {
    id: 'visual_inspection',
    name: 'Visual Inspection',
    description: 'Systematic visual review of design assets',
    applicableTo: ['design'],
    steps: [
      'Review overall visual hierarchy',
      'Check typography (font choices, sizes, weights)',
      'Verify color usage and contrast',
      'Check spacing and alignment',
      'Verify image quality and resolution'
    ]
  },

  DESIGN_SYSTEM_COMPLIANCE: {
    id: 'design_system_compliance',
    name: 'Design System Compliance',
    description: 'Verify design follows established design system',
    applicableTo: ['design'],
    steps: [
      'Check component usage against design system',
      'Verify colors match design tokens',
      'Check typography matches style guide',
      'Verify spacing follows grid system',
      'Check for unauthorized custom components'
    ]
  },

  ACCESSIBILITY_CHECK: {
    id: 'accessibility_check',
    name: 'Accessibility Check',
    description: 'Verify design meets accessibility standards',
    applicableTo: ['design'],
    steps: [
      'Check color contrast ratios (WCAG AA/AAA)',
      'Verify text is readable at minimum sizes',
      'Check touch target sizes (mobile)',
      'Verify keyboard navigation is possible',
      'Check for alternative text on images'
    ]
  },

  RESPONSIVE_REVIEW: {
    id: 'responsive_review',
    name: 'Responsive Design Review',
    description: 'Verify design works across different screen sizes',
    applicableTo: ['design'],
    steps: [
      'Check mobile layout (320px-767px)',
      'Check tablet layout (768px-1023px)',
      'Check desktop layout (1024px+)',
      'Verify breakpoints are appropriate',
      'Check for content overflow or truncation'
    ]
  },

  USER_FLOW_VALIDATION: {
    id: 'user_flow_validation',
    name: 'User Flow Validation',
    description: 'Verify user flows are logical and complete',
    applicableTo: ['design'],
    steps: [
      'Map out all user flows',
      'Check for missing screens or states',
      'Verify navigation is intuitive',
      'Check for dead ends or loops',
      'Verify error states are designed'
    ]
  }
};

/**
 * Design-Specific Risk Categories
 */
const DESIGN_RISK_CATEGORIES = {
  ...genericTemplate.riskCategories,

  ACCESSIBILITY: {
    level: 'high',
    description: 'Accessibility violations that prevent users from accessing content',
    examples: [
      'Insufficient color contrast',
      'Text too small to read',
      'Touch targets too small',
      'No keyboard navigation',
      'Missing alternative text'
    ],
    action: 'Must be fixed to meet accessibility standards'
  },

  BRAND_INCONSISTENCY: {
    level: 'medium',
    description: 'Design deviates from brand guidelines',
    examples: [
      'Wrong brand colors used',
      'Incorrect typography',
      'Inconsistent visual style',
      'Logo misuse'
    ],
    action: 'Should be corrected to maintain brand consistency'
  },

  USABILITY: {
    level: 'medium',
    description: 'Design issues that impact user experience',
    examples: [
      'Confusing navigation',
      'Unclear call-to-actions',
      'Poor information hierarchy',
      'Inconsistent interactions'
    ],
    action: 'Should be improved for better user experience'
  }
};

/**
 * Design-Specific Validation Checklist
 */
const DESIGN_VALIDATION_CHECKLIST = {
  VISUAL_QUALITY: [
    'Visual hierarchy is clear and effective',
    'Typography is appropriate and readable',
    'Color usage is effective and harmonious',
    'Spacing and alignment are consistent',
    'Images are high quality and appropriate',
    'Design is polished and professional'
  ],

  ACCESSIBILITY: [
    'Color contrast meets WCAG AA standards (4.5:1 for text)',
    'Text is readable at minimum sizes (16px body text)',
    'Touch targets are at least 44x44px',
    'Keyboard navigation is possible',
    'Alternative text provided for images',
    'Focus states are visible'
  ],

  CONSISTENCY: [
    'Follows design system guidelines',
    'Brand colors are used correctly',
    'Typography follows style guide',
    'Spacing follows grid system',
    'Components are used consistently',
    'Visual style is consistent across screens'
  ],

  COMPLETENESS: [
    'All required screens/pages included',
    'All states covered (default, hover, active, disabled, error)',
    'All breakpoints designed (mobile, tablet, desktop)',
    'Assets in required formats (PNG, SVG, etc.)',
    'Design specifications documented',
    'Edge cases considered'
  ],

  FUNCTIONALITY: [
    'Interactive elements are clearly identifiable',
    'User flows are logical and intuitive',
    'Navigation is clear and consistent',
    'Call-to-actions are prominent',
    'Error states are designed',
    'Loading states are designed'
  ]
};

/**
 * Generate Design-Specific Validation Plan Prompt
 */
function generateDesignValidationPrompt(projectContext) {
  const basePrompt = genericTemplate.generateValidationPlanPrompt(projectContext);

  const designSpecificAddition = `

## Design-Specific Validation Requirements

### Visual Quality Review
You MUST review visual quality:
1. Check visual hierarchy and layout
2. Review typography (fonts, sizes, weights, line height)
3. Verify color usage and harmony
4. Check spacing and alignment
5. Verify image quality and resolution

### Accessibility Review
You MUST verify accessibility:
- Color contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for large text)
- Text readability (minimum 16px for body text)
- Touch target sizes (minimum 44x44px for mobile)
- Keyboard navigation support
- Alternative text for images

### Design System Compliance
You MUST check design system compliance:
- Component usage matches design system
- Colors match design tokens
- Typography follows style guide
- Spacing follows grid system
- No unauthorized custom components

### Responsive Design Review
You MUST verify responsive design:
- Mobile layout (320px-767px)
- Tablet layout (768px-1023px)
- Desktop layout (1024px+)
- Breakpoints are appropriate
- No content overflow or truncation

### Design-Specific Validation Checklist

Use this checklist in your validation plan:

**Visual Quality**:
${DESIGN_VALIDATION_CHECKLIST.VISUAL_QUALITY.map(item => `- [ ] ${item}`).join('\n')}

**Accessibility**:
${DESIGN_VALIDATION_CHECKLIST.ACCESSIBILITY.map(item => `- [ ] ${item}`).join('\n')}

**Consistency**:
${DESIGN_VALIDATION_CHECKLIST.CONSISTENCY.map(item => `- [ ] ${item}`).join('\n')}

**Completeness**:
${DESIGN_VALIDATION_CHECKLIST.COMPLETENESS.map(item => `- [ ] ${item}`).join('\n')}

**Functionality**:
${DESIGN_VALIDATION_CHECKLIST.FUNCTIONALITY.map(item => `- [ ] ${item}`).join('\n')}

### Design-Specific Test Cases

Include test cases like:
- **Visual Inspection**: Review each screen for visual quality
- **Accessibility Test**: Check contrast ratios, text sizes, touch targets
- **Responsive Test**: View design at different screen sizes
- **User Flow Test**: Walk through user flows to verify completeness
- **Brand Compliance**: Compare against brand guidelines
`;

  return basePrompt + designSpecificAddition;
}

/**
 * Export design validation template
 */
module.exports = {
  templateId: 'design-validation',
  templateName: 'Design Validation Template',
  templateDescription: 'Validation template for UI/UX design, graphics, and visual design',
  applicableTo: ['design', 'ui', 'ux', 'visual', 'graphics'],

  // Extend generic template
  validationDimensions: DESIGN_VALIDATION_DIMENSIONS,
  validationMethods: DESIGN_VALIDATION_METHODS,
  riskCategories: DESIGN_RISK_CATEGORIES,
  validationChecklist: DESIGN_VALIDATION_CHECKLIST,

  // Inherit from generic
  planStructure: genericTemplate.planStructure,
  pmApprovalCriteria: genericTemplate.pmApprovalCriteria,

  // Design-specific function
  generateValidationPlanPrompt: generateDesignValidationPrompt
};

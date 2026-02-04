# QA Validation Plan System - Quick Reference

## For QA Agents

### Step 1: Enter QA Planning Phase
When you become the QA agent, you'll automatically receive instructions to create a validation plan.

### Step 2: Create Your Validation Plan
The system will auto-select the appropriate template based on task type:
- **Code projects** → code-validation template
- **Design projects** → design-validation template
- **Documents** → document-validation template
- **Research** → research-validation template
- **Other** → generic template

### Step 3: Follow the Template Structure
Your validation plan must include:

```json
{
  "overview": {
    "validationObjective": "What you aim to verify",
    "validationScope": "What will/won't be validated",
    "estimatedEffort": "Time estimate"
  },
  "executorPlans": [
    {
      "executorRole": "Backend Developer",
      "deliverables": ["API endpoints", "Database schema"],
      "validationDimensions": ["functionality", "completeness", "quality", "consistency"],
      "validationMethods": ["code_execution", "code_review"],
      "acceptanceCriteria": {
        "API endpoints": ["Must return 200 for valid requests", "Must handle errors gracefully"]
      },
      "testCases": [
        {
          "name": "Happy path test",
          "description": "Test with valid inputs",
          "expectedResult": "Returns expected data"
        }
      ]
    }
  ],
  "toolsAndResources": ["Postman", "Jest", "ESLint"],
  "riskAssessment": [
    {
      "category": "high",
      "description": "Security vulnerabilities",
      "likelihood": "medium",
      "impact": "high",
      "mitigation": "Run security audit tools"
    }
  ],
  "validationSequence": [
    {
      "step": 1,
      "action": "Validate API endpoints first",
      "rationale": "Core functionality must work before testing edge cases"
    }
  ]
}
```

### Step 4: Submit to PM
- Report to PM: "验证计划已完成，请求批准"
- Update status: `stage: "等待批准", progress: 15`
- Wait for PM response

**QA Validation Plan Approval Workflow**:

1. **QA Creates Validation Plan**: QA agent creates detailed validation plan
2. **QA Submits to PM**: "验证计划已完成，请求批准"
3. **PM Reviews Plan**: PM checks plan completeness and appropriateness
4. **PM Approves/Rejects**:
   ```javascript
   const { approveValidationPlan, rejectValidationPlan } = require('./pm-workflow');

   // Approve
   approveValidationPlan(projectDir, 'QA Agent', 'PM-001');

   // Reject with feedback
   rejectValidationPlan(projectDir, 'QA Agent', '需要添加性能测试', 'PM-001');
   ```
5. **QA Executes Approved Plan**: Only after PM approval

**When Required**: Always required before QA begins validation. Ensures PM oversight of QA process.

### Step 5: Handle PM Response
- **If Approved**: Proceed to validation execution
- **If Rejected**: Revise plan based on PM feedback and resubmit

### Step 6: Execute Validation (After Approval)
- Follow your approved plan systematically
- Document findings for each validation dimension
- Track pass/fail for each acceptance criterion
- Report results to PM

---

## For PM (Project Manager)

### Check Pending Validation Plans

```javascript
const { getValidationPlansAwaitingApproval } = require('./pm-workflow');

const pending = await getValidationPlansAwaitingApproval(projectDir);
console.log(`${pending.length} validation plans awaiting approval`);
```

**API Usage Note**:

JavaScript (compiled):
```javascript
const { approveValidationPlan, rejectValidationPlan, getValidationPlansAwaitingApproval } = require('./pm-workflow');
```

TypeScript (source):
```typescript
import { updateApprovalStatus } from './src/qa-validation-plan';
```

**Note**: Use JavaScript API for production. TypeScript API is for development only.

### Review Validation Plan

Check against these criteria:

✅ **Completeness**:
- All executors covered?
- All deliverables listed?
- No gaps in coverage?

✅ **Appropriateness**:
- Validation methods match task type?
- Validation depth appropriate?
- Resources reasonable?

✅ **Clarity**:
- Acceptance criteria specific?
- Test cases well-defined?
- Sequence logical?

✅ **Feasibility**:
- Effort estimate reasonable?
- Required tools available?
- Timeline achievable?

### Approve Validation Plan

```javascript
const { approveValidationPlan } = require('./pm-workflow');

await approveValidationPlan(
  projectDir,           // Project directory path
  'QA Specialist',      // QA agent role
  'PM-001'             // Your PM identifier
);
```

Result:
- ✅ Plan status updated to 'approved'
- ✅ QA agent status updated to 'QA_VALIDATING'
- ✅ Decision logged to whiteboard
- ✅ QA can proceed with validation

### Reject Validation Plan

```javascript
const { rejectValidationPlan } = require('./pm-workflow');

await rejectValidationPlan(
  projectDir,
  'QA Specialist',
  '需要添加性能测试用例',  // Rejection reason
  'PM-001'
);
```

Result:
- ⚠️ Plan status updated to 'rejected'
- ⚠️ QA agent status updated back to 'QA_PLANNING'
- ⚠️ Decision logged with reason
- ⚠️ QA must revise and resubmit

---

## Validation Dimensions

### 1. Functionality (35%)
**Question**: Does it work as intended?

**Check**:
- Meets stated requirements
- Performs intended function correctly
- Handles expected inputs/scenarios
- Produces expected outputs/results

### 2. Completeness (25%)
**Question**: Is everything included?

**Check**:
- All required components present
- No missing pieces or gaps
- Covers full scope of requirements
- Includes necessary supporting materials

### 3. Quality (25%)
**Question**: Is it well-crafted?

**Check**:
- Professional quality standards met
- Attention to detail evident
- Consistent style and formatting
- Free of obvious errors or defects

### 4. Consistency (15%)
**Question**: Is it internally consistent?

**Check**:
- Internal consistency maintained
- Aligns with project standards
- Consistent with other deliverables
- Follows established conventions

---

## Common Validation Methods

### Manual Review
Systematic manual inspection of the deliverable

### Checklist Verification
Verify deliverable against predefined checklist

### Cross-Reference Check
Compare deliverable with requirements and other deliverables

### Sample Testing
Test with sample inputs/scenarios

### Code Execution (Code Projects)
Run the code to verify it executes without errors

### Visual Inspection (Design Projects)
Systematic visual review of design assets

### Readability Analysis (Documents)
Assess document readability and clarity

### Source Verification (Research)
Verify credibility and accuracy of sources

---

## Risk Categories

### High Risk 🔴
**Description**: Critical issues that prevent acceptance

**Examples**:
- Core functionality broken or missing
- Major requirements not met
- Severe quality issues
- Security vulnerabilities

**Action**: Must be fixed before acceptance

### Medium Risk 🟡
**Description**: Significant issues that impact usability

**Examples**:
- Minor functionality issues
- Some requirements partially met
- Quality issues affecting user experience
- Missing non-critical components

**Action**: Should be fixed, may accept with documented issues

### Low Risk 🟢
**Description**: Minor issues that don't significantly impact deliverable

**Examples**:
- Cosmetic issues
- Minor inconsistencies
- Nice-to-have features missing
- Documentation gaps

**Action**: Can be fixed later or accepted as-is

---

## File Locations

### Validation Plan Files
Stored in project directory as: `validation-plan-{qa-role}.json`

Example: `projects/proj-123/validation-plan-qa-specialist.json`

### Template Files
Located in: `config/validation-templates/`

Available templates:
- `generic.js` - Universal template
- `code-validation.js` - Code projects
- `design-validation.js` - Design projects
- `document-validation.js` - Documents
- `research-validation.js` - Research reports

---

## Troubleshooting

### QA Agent: "How do I know which template to use?"
The system auto-selects based on task type. You'll receive a prompt with the appropriate template structure.

### PM: "Where do I find pending validation plans?"
Use `getValidationPlansAwaitingApproval(projectDir)` to list all pending plans.

### QA Agent: "My plan was rejected, what now?"
Read the rejection reason, revise your plan accordingly, and resubmit for approval.

### PM: "Can I approve a plan with minor issues?"
Yes, but document the issues in your approval decision. Consider asking QA to address them during validation.

### QA Agent: "Can I start validation before PM approval?"
No. The system enforces the approval checkpoint. You must wait for PM approval.

---

## Best Practices

### For QA Agents

✅ **Be Specific**: Acceptance criteria must be measurable and verifiable
✅ **Be Thorough**: Cover all deliverables from all executors
✅ **Be Realistic**: Ensure your plan is achievable within reasonable time
✅ **Be Independent**: Your validation must be objective and unbiased
✅ **Focus on Quality**: Your goal is to ensure deliverables meet standards

### For PM

✅ **Review Carefully**: Check all four approval criteria
✅ **Provide Clear Feedback**: If rejecting, explain exactly what needs to change
✅ **Be Consistent**: Apply the same standards to all validation plans
✅ **Trust the Process**: QA agents are trained to create good plans
✅ **Document Decisions**: Log your approval/rejection reasoning

---

## Examples

### Example 1: Code Project Validation Plan

```json
{
  "overview": {
    "validationObjective": "Verify REST API meets functional and security requirements",
    "validationScope": "API endpoints, authentication, error handling. Excludes UI.",
    "estimatedEffort": "4 hours"
  },
  "executorPlans": [
    {
      "executorRole": "Backend Developer",
      "deliverables": ["API endpoints", "Authentication system", "Error handling"],
      "validationDimensions": ["functionality", "completeness", "quality", "consistency"],
      "validationMethods": ["code_execution", "code_review", "security_check"],
      "acceptanceCriteria": {
        "API endpoints": [
          "All endpoints return correct status codes",
          "Response format matches API spec",
          "Error responses include helpful messages"
        ],
        "Authentication": [
          "JWT tokens generated correctly",
          "Invalid tokens rejected",
          "Token expiration works"
        ]
      },
      "testCases": [
        {
          "name": "Valid login",
          "description": "POST /auth/login with valid credentials",
          "expectedResult": "Returns 200 with JWT token"
        },
        {
          "name": "Invalid login",
          "description": "POST /auth/login with invalid credentials",
          "expectedResult": "Returns 401 with error message"
        }
      ]
    }
  ],
  "toolsAndResources": ["Postman", "Jest", "npm audit"],
  "riskAssessment": [
    {
      "category": "high",
      "description": "SQL injection vulnerabilities",
      "likelihood": "medium",
      "impact": "high",
      "mitigation": "Use parameterized queries, run security audit"
    }
  ],
  "validationSequence": [
    {
      "step": 1,
      "action": "Test authentication endpoints",
      "rationale": "Must work before testing protected endpoints"
    },
    {
      "step": 2,
      "action": "Test CRUD endpoints",
      "rationale": "Core functionality"
    },
    {
      "step": 3,
      "action": "Run security audit",
      "rationale": "Identify vulnerabilities"
    }
  ]
}
```

### Example 2: Design Project Validation Plan

```json
{
  "overview": {
    "validationObjective": "Verify UI design meets accessibility and brand standards",
    "validationScope": "All screens, responsive layouts. Excludes animations.",
    "estimatedEffort": "3 hours"
  },
  "executorPlans": [
    {
      "executorRole": "UI Designer",
      "deliverables": ["Figma designs", "Design system components", "Responsive layouts"],
      "validationDimensions": ["functionality", "completeness", "quality", "consistency"],
      "validationMethods": ["visual_inspection", "accessibility_check", "design_system_compliance"],
      "acceptanceCriteria": {
        "Figma designs": [
          "All screens included",
          "Color contrast meets WCAG AA (4.5:1)",
          "Touch targets at least 44x44px",
          "Follows brand guidelines"
        ]
      },
      "testCases": [
        {
          "name": "Color contrast check",
          "description": "Verify all text has sufficient contrast",
          "expectedResult": "All text meets WCAG AA standards"
        }
      ]
    }
  ],
  "toolsAndResources": ["Figma", "Contrast checker", "Brand guidelines"],
  "riskAssessment": [
    {
      "category": "high",
      "description": "Accessibility violations",
      "likelihood": "medium",
      "impact": "high",
      "mitigation": "Use accessibility checker tools"
    }
  ],
  "validationSequence": [
    {
      "step": 1,
      "action": "Check accessibility compliance",
      "rationale": "Critical for all users"
    },
    {
      "step": 2,
      "action": "Verify brand consistency",
      "rationale": "Maintain brand identity"
    }
  ]
}
```

---

## Support

For questions or issues:
1. Check this quick reference
2. Review template README: `config/validation-templates/README.md`
3. Read full documentation: `QA_VALIDATION_IMPLEMENTATION.md`
4. Run test suite: `node test-qa-validation-system.js`

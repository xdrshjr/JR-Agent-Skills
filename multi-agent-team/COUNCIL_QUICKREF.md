# Multi-Agent Team Skill - Leadership Council Quick Reference

## Three Power Domains (三权分立)

| Domain | Leader | Responsibilities |
|--------|--------|-----------------|
| **Planning Authority (规划权)** | Dynamic per task type | Requirements, plans, scope, architecture |
| **Execution Authority (执行权)** | Dynamic per task type | Resources, progress, coordination, timeouts |
| **Quality Authority (质量权)** | Dynamic per task type | QA, validation, acceptance, final delivery |

## Cross-Check Protocol

```
Decision Made → Notify Other Leaders → Challenge Window →
├─ No Objection → Decision Stands
└─ Objection → Must Respond → Resolved? → Yes: Stands / No: Escalate to User
```

## Agent Interaction Routing

| Agent Action | Reports To |
|-------------|-----------|
| Plan submission | Planning Authority |
| Progress update | Execution Authority |
| Resource request | Execution Authority |
| Blocker report | Execution Authority → User |
| Quality question | Quality Authority |
| Deliverable submission | Quality Authority (via QA) |

## Approval Functions

### Planning Authority (Agent Plans)
```javascript
const { approveAgentPlan, rejectAgentPlan } = require('./council-workflow');

// Primary approval (planning domain)
approveAgentPlan(projectDir, 'Frontend Developer', 'System-Architect', 'planning');

// Co-signoff (execution domain)
approveAgentPlan(projectDir, 'Frontend Developer', 'Tech-Lead', 'execution');

// Reject plan
rejectAgentPlan(projectDir, 'Backend Developer', 'Need error handling', 'System-Architect', 'planning');
```

### Quality Authority (QA Plans)
```javascript
const { approveValidationPlan, rejectValidationPlan } = require('./council-workflow');

// Quality approves
approveValidationPlan(projectDir, 'QA Reviewer', 'Review-Lead', 'quality');

// Planning co-signs (requirement coverage)
approveValidationPlan(projectDir, 'QA Reviewer', 'System-Architect', 'planning');
```

### Leadership Functions
```javascript
const { initializeLeadership, conductCrossCheck, getLeadershipStatus } = require('./council-workflow');

// Initialize leadership for project
const leaders = initializeLeadership('code', 'Build a web app');

// Conduct cross-check for a decision
const check = await conductCrossCheck(projectDir, 'team_composition', 'planning', decision, 'reason');

// Get leadership status
const status = getLeadershipStatus(projectDir);
```

## Pause Protocol (Execution Authority)

```
Detect Problem → Pause Agent → Collect Context → Report to User → Wait → Resume
```

### Mandatory Escalation Triggers (10 types)

| Trigger | Responsible Domain |
|---------|-------------------|
| Tool/resource unavailable | Execution |
| API rate limited | Execution |
| Permission denied | Execution → User |
| Dependency missing | Execution → User |
| Requirement unclear | Planning → User |
| Technical limitation | Execution |
| Scope change needed | Planning → User |
| Team disagreement >2 rounds | Execution |
| Multiple failures (>2 restarts) | Execution → User |
| Budget/usage concerns | Execution → User |

## Decision Types & Required Signoffs

| Decision | Primary | Co-Sign |
|----------|---------|---------|
| Team composition | Planning | Execution + Quality |
| Agent plan | Planning | Execution |
| Execution strategy | Execution | Planning |
| QA validation plan | Quality | Planning |
| Deliverable acceptance | Quality | Planning |
| Timeout/restart | Execution | Planning |

## Timeout Management (Execution Authority)

- **30-min timeout** per agent
- **Max 2 restarts** (3 total attempts)
- Execution Authority handles: detect → stop → analyze → restart/fail
- Scope adjustments coordinated with Planning Authority

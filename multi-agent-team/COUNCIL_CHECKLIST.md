# Leadership Council Operations Checklist

## Pre-Execution Phase

### Planning Authority
- [ ] Requirements clarified (multi-round if needed)
- [ ] Task type identified
- [ ] Leadership council generated for task type
- [ ] Team composition proposed
- [ ] Cross-check initiated for team composition (3-way signoff)
- [ ] Executor roles and sections assigned
- [ ] QA Agent role defined

### Execution Authority
- [ ] Team composition feasibility confirmed (co-sign)
- [ ] Resource availability checked
- [ ] Execution slots available (max 3 concurrent)
- [ ] Timeout monitoring configured

### Quality Authority
- [ ] Team composition testability confirmed (co-sign)
- [ ] Quality standards defined for task type
- [ ] QA approach identified

## Execution Phase

### Planning Authority
- [ ] Agent plans reviewed and approved (primary)
- [ ] Scope consistency verified throughout execution
- [ ] Requirement changes managed through cross-check

### Execution Authority
- [ ] Agent execution plans co-signed (resource feasibility)
- [ ] Agents spawned with correct system prompts
- [ ] Progress monitored every 5 minutes
- [ ] Timeouts detected and handled (max 2 restarts)
- [ ] Blockers escalated to user when unresolvable
- [ ] Inter-agent disputes mediated (2 rounds, then decide)

### Quality Authority
- [ ] QA validation plan created
- [ ] Cross-check with Planning Authority (requirement coverage)
- [ ] QA Agent supervised
- [ ] Deliverables validated against acceptance criteria

## Delivery Phase

### Quality Authority (Primary)
- [ ] All executor deliverables QA-validated
- [ ] Failed items returned for rework (max 3 attempts)
- [ ] Final acceptance decision made
- [ ] Cross-check with Planning Authority (requirement match)

### Planning Authority (Co-sign)
- [ ] Deliverables match original requirements confirmed
- [ ] Scope fully covered
- [ ] Final delivery co-signed

## Cross-Check Protocol Checklist

For each key decision:
- [ ] Primary domain made decision with reasoning
- [ ] Other domains notified
- [ ] Challenge window respected
- [ ] Any objections addressed (not ignored)
- [ ] Unresolved objections escalated to user
- [ ] Decision recorded in council-decisions.json

## Emergency Procedures

### Agent Failure (Execution Authority)
- [ ] Agent paused immediately
- [ ] Context collected (progress, errors, attempts)
- [ ] Status updated to PAUSED
- [ ] User notified with detailed report
- [ ] 3 options presented (A/B/C)
- [ ] User decision awaited
- [ ] Recovery executed per user choice

### Leader Disagreement
- [ ] Primary domain stated position with reasoning
- [ ] Objecting domain raised formal objection
- [ ] Primary domain responded to objection
- [ ] If resolved: proceed
- [ ] If unresolved: escalate to user with both positions
- [ ] User decision recorded and enforced

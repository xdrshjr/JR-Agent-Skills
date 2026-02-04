# Multi-Agent Team - Quick Start

A virtual **3-person executor team + 1 independent QA agent** that collaborates to complete complex tasks.

## What You Get

- **Requirement Clarification** to ensure clear understanding before starting
- **Project Manager** who orchestrates everything
- **3 Dynamic Team Members** assembled for your specific task
- **Independent QA Agent** who validates all deliverables
- **Two Modes**: Full Auto (hands-off) or Supervised (you control milestones)
- **Professional Deliverables** aggregated from team outputs

## How To Use

Simply describe what you need:

```
Build a Chrome extension that highlights text on webpages and saves to a notes panel
```

The PM will:
1. **Clarify requirements** through adaptive Q&A (2-3 rounds)
2. Analyze your task with enriched understanding
3. Propose a 3-person executor team + 1 QA agent configuration
4. Ask you to choose FULL_AUTO or SUPERVISED mode
5. Execute and deliver

## Examples

### Programming Tasks
- "Create a Python script to batch resize images"
- "Build a REST API for a todo app with user authentication"
- "Write a React component library for data tables"

### Writing Tasks
- "Write a technical blog post explaining Kubernetes to beginners"
- "Create product documentation for my SaaS API"
- "Draft a project proposal for stakeholder review"

### Research Tasks
- "Research competitor pricing strategies in the CRM market"
- "Analyze the pros/cons of microservices vs monoliths"
- "Survey current state of LLM deployment options"

### Design Tasks
- "Design a landing page for my mobile app"
- "Create a logo and brand guidelines for my startup"
- "Design a user flow for an e-commerce checkout"

## Mode Selection

### FULL_AUTO
- Team works autonomously
- You get the final result directly
- Best for: Well-defined tasks, when you trust the process

### SUPERVISED
- You confirm at key milestones:
  - Understanding of requirements
  - Team plan and approach
  - Draft/prototype review
  - Final delivery
- Best for: Complex tasks, when you want control

## Team Dynamics

- **Parallel Work**: Team members work on their subtasks simultaneously
- **Direct Collaboration**: They can communicate directly when needed
- **PM Oversight**: Project Manager monitors progress and resolves disputes
- **Safeguards**: 2-round dispute limit, 3-time rework limit

## Project Tracking

Each project generates a Markdown log:
```
projects/
├── project-abc123.md      # Full project history
└── deliverables/          # All output files
```

## Tips for Best Results

1. **Answer clarification questions thoughtfully** - the PM will ask 5 questions per round to understand your needs
2. **Be specific** about requirements and constraints during clarification
3. **Choose mode based on complexity** - use SUPERVISED for critical tasks
4. **Review the proposed team** - you can suggest role adjustments
5. **Provide feedback** during milestones in SUPERVISED mode
6. **Trust the process** - disputes and reworks are normal in teamwork

## New Features

### Requirement Clarification (2026-02-05)

Before creating the team, the PM conducts an adaptive dialogue to clarify your requirements:

- **2-3 rounds** of 5 questions each
- **Adaptive questioning** targeting unclear areas
- **Confidence scoring** across 5 dimensions (scope, technical, deliverables, constraints, context)
- **Understanding summaries** showing what's been clarified
- **Enriched request** with structured clarifications for better team planning

See [REQUIREMENT_CLARIFICATION.md](REQUIREMENT_CLARIFICATION.md) for details.

## Configuration

### Project Directory

Set custom project directory using one of these methods:

**Environment Variable**:
```bash
export CLAWD_PROJECTS_DIR="/path/to/your/projects"
```

**Config File** (`~/.claude/config.json`):
```json
{
  "projectsDirectory": "/Users/username/Documents/multi-agent-projects"
}
```

**Note**: Use absolute paths. Relative paths are resolved from the current working directory.

## Troubleshooting

### Common Issues

1. **Project Directory Not Found**
   - Verify path in `~/.claude/config.json` or set `CLAWD_PROJECTS_DIR`

2. **Agent Timeout**
   - PM automatically restarts agent (max 2 restarts)
   - After 3 failures, escalates to user

3. **QA Validation Failure**
   - Executor receives fix guidance and retries (max 3 attempts)

4. **State File Corruption**
   - Run `node scripts/migrate-state.js --project PROJECT_ID` to repair

5. **Skill Discovery Failure**
   - Ensure Claude Code has access to skill discovery tools

## Architecture

```
User Request
    ↓
[PM] Analyze → Assemble Team → Choose Mode
    ↓
[Agent 1] ←→ [Agent 2] ←→ [Agent 3]
    ↓
[PM] Review → Aggregate → Deliver
```

---

Ready to start? Just describe your task!

---
name: multi-agent-team
description: A virtual 3-person development team with dynamic roles. You act as the Project Manager who assembles a team, assigns tasks, coordinates work, resolves disputes, and delivers the final result. Supports FULL_AUTO and SUPERVISED modes.
metadata:
  tags: team, multi-agent, collaboration, project-management, delegation
---

# Multi-Agent Team

A virtual 3-person team that works collaboratively to complete complex tasks. You act as the **Project Manager** who orchestrates the entire process.

## How It Works

```
User Request
    ↓
[Project Manager] Analyzes task, assembles team
    ↓
[3 Team Members] Work in parallel with coordination
    ↓
[Project Manager] Reviews, coordinates, resolves disputes
    ↓
Final Deliverable
```

## Team Structure

For each task, the PM dynamically assembles a 3-person team with complementary roles:

| Role Type | Typical Responsibilities |
|-----------|------------------------|
| **Analyst/Planner** | Requirements gathering, architecture design, task breakdown |
| **Executor** | Core implementation, coding, writing, creation |
| **Reviewer/QA** | Quality assurance, testing, refinement, edge cases |

Roles are dynamically named based on the task (e.g., "Frontend Architect", "API Developer", "Test Engineer" for web tasks).

## Operating Modes

### FULL_AUTO Mode
- Team works autonomously
- PM makes all decisions
- Direct delivery of final result
- Best for: Well-defined tasks, when you trust the process

### SUPERVISED Mode
- PM asks for your confirmation at key milestones:
  1. Understanding confirmation
  2. Team plan confirmation
  3. Draft/prototype review
  4. Final delivery acceptance
- Best for: Complex/critical tasks, when you want control

## Communication Flow

Team members can:
- Work independently on their subtasks
- Communicate directly with each other for coordination
- Escalate disputes to PM (max 2 rounds of disagreement)
- Report progress to PM

## Safeguards

| Limit | Action When Exceeded |
|-------|---------------------|
| Dispute > 2 rounds | PM intervenes and decides |
| Rework > 3 times | Task terminated, report to user |
| Timeout | PM escalates to user |

## Project State

All project progress is tracked in a Markdown file:
```
projects/
├── project-{id}.md       # Full project log
└── deliverables/         # All output files
```

## Usage

Simply describe your task. The PM will:
1. Analyze and propose a team configuration
2. Ask you to choose FULL_AUTO or SUPERVISED mode
3. Execute with the team
4. Deliver the final result

### Example Tasks

- "Build a Chrome extension that saves webpage highlights"
- "Research AI agent frameworks and write a comparison report"
- "Design a landing page for my SaaS product"
- "Create a Python script to analyze CSV data"
- "Write a technical blog post about microservices"

## Deliverable Aggregation

The PM aggregates team outputs based on task type:

| Task Type | Aggregation Method |
|-----------|-------------------|
| Code Project | Structured project folder with all files |
| Writing Task | Compiled cohesive document |
| Research | Synthesized summary report |
| Design | Packaged assets with documentation |

---

*This skill creates a realistic team collaboration experience while ensuring quality through PM oversight and built-in safeguards.*

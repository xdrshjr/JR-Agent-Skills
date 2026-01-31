# Multi-Agent Team - Quick Start

A virtual 3-person team that collaborates to complete complex tasks.

## What You Get

- **Project Manager** who orchestrates everything
- **3 Dynamic Team Members** assembled for your specific task
- **Two Modes**: Full Auto (hands-off) or Supervised (you control milestones)
- **Professional Deliverables** aggregated from team outputs

## How To Use

Simply describe what you need:

```
Build a Chrome extension that highlights text on webpages and saves to a notes panel
```

The PM will:
1. Analyze your task
2. Propose a 3-person team configuration
3. Ask you to choose FULL_AUTO or SUPERVISED mode
4. Execute and deliver

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

1. **Be specific** about requirements and constraints
2. **Choose mode based on complexity** - use SUPERVISED for critical tasks
3. **Review the proposed team** - you can suggest role adjustments
4. **Provide feedback** during milestones in SUPERVISED mode
5. **Trust the process** - disputes and reworks are normal in teamwork

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

# Multi-Agent Team Coordination System - Project Index

**Project Root:** M:\tools\JR-Agent-Skills\multi-agent-team
**Total Files:** 45 files
**Total Lines of Code:** ~10,553 lines (TypeScript + JavaScript)

---

## Project Overview

A sophisticated multi-agent coordination system that creates virtual teams (3 executors + 1 QA agent) to collaboratively complete complex tasks. The system acts as a Project Manager orchestrating sub-agents with lifecycle management, dispute resolution, and dual-layer quality verification.

**Architecture:** Event-driven agent orchestration with unified state management
**Runtime:** Node.js
**Languages:** TypeScript (core modules) + JavaScript (workflow scripts)
**Key Pattern:** Coordinator pattern with pause-escalate-resume protocol

---

## Core Architecture Components

### 1. State Management Layer
**Single Source of Truth Architecture**

- **`src/state-manager.ts`** (450 lines) - Unified state management with atomic operations
  - Exports: `createProject()`, `readProject()`, `updateProject()`, `transaction()`, `addLogEntry()`, `updateAgentStatus()`, `resolveProjectsDir()`
  - Dynamic project directory resolution (no hardcoded paths)
  - Automatic synchronization to derived views

- **`src/state-lock.ts`** (120 lines) - File locking for atomic operations
  - Exports: `withLock()`, `getLockPath()`
  - Uses proper-lockfile for cross-platform locking
  - Prevents race conditions in concurrent operations

- **`src/state-sync.ts`** (200 lines) - Automatic synchronization engine
  - Exports: `syncAll()`, `syncProjectLog()`, `syncAgentStatus()`, `syncWhiteboard()`
  - Maintains derived views from state.json

- **`src/state-validator.ts`** (280 lines) - Consistency validation and recovery
  - Exports: `validateState()`, `repairState()`
  - Automatic detection and repair of inconsistencies

- **`src/state.ts`** (355 lines) - Backward compatibility layer
  - Exports: `createProjectState()`, `updateProjectState()`, `readProjectState()`
  - Delegates to state-manager for actual operations

### 2. Phase State Machine
**7-Phase Workflow with Approval Checkpoints**

- **`src/phase-state-machine.ts`** (450 lines) - Generic phase transition enforcement
  - Exports: `WorkflowPhase` enum, `validateTransition()`, `grantApproval()`, `rejectApproval()`, `getPhaseState()`, `transitionPhase()`
  - Phases: skill_discovery → requirement → skill_research → plan_design → awaiting_approval → execution → completion
  - Critical checkpoint: Blocks execution until PM approval granted
  - Task-agnostic, role-agnostic, environment-independent

### 3. Team Management
**Agent Spawning, Messaging, and Lifecycle**

- **`src/team.ts`** (815 lines) - Core team orchestration
  - Exports: `spawnAgent()`, `sendMessage()`, `collectResponses()`, `handleTimeout()`, `resolveDispute()`
  - 30-minute agent timeout with automatic recovery
  - Maximum 2 restarts per agent (3 total attempts)
  - Timeout history tracking and escalation

### 4. QA Validation System
**Independent Quality Verification**

- **`src/qa-validation-plan.ts`** (396 lines) - QA validation planning
  - Exports: `createValidationPlan()`, `readValidationPlan()`, `approveValidationPlan()`, `rejectValidationPlan()`
  - Task-agnostic validation templates
  - PM approval required before validation begins
  - Max 3 retry attempts before escalation

- **`src/qa-queue.ts`** (180 lines) - QA work queue management
  - Exports: `enqueueValidation()`, `dequeueValidation()`, `getQueueStatus()`
  - Priority-based queue for validation tasks

### 5. Deliverable Aggregation
**Output Synthesis by Task Type**

- **`src/deliverable.ts`** (396 lines) - Deliverable aggregation logic
  - Exports: `aggregateDeliverables()`, `aggregateCodeProject()`, `aggregateDocument()`, `aggregateResearchReport()`, `aggregateDesignAssets()`
  - Intelligent aggregation based on task type
  - Structured output with README generation

### 6. Concurrency Management
**Resource Control and Execution Slots**

- **`src/concurrency-manager.ts`** (220 lines) - Concurrent agent limiting
  - Exports: `acquireSlot()`, `releaseSlot()`, `getAvailableSlots()`, `getConcurrencyConfig()`
  - Configurable max concurrent agents
  - Wait queue with priority support
  - Slot timeout and automatic cleanup

### 7. Main Entry Point
**Skill Orchestration**

- **`src/index.ts`** (377 lines) - Main workflow orchestration
  - Exports: Main skill entry point
  - Phases: Task Analysis → Team Assembly → Task Distribution → Execution → QA Validation → Delivery

---

## Workflow Scripts (Root Level)

### PM Coordination
- **`pm-workflow.js`** (850 lines) - PM coordination logic + approval management
  - Exports: `generateTeamSuggestion()`, `approveAgentPlan()`, `rejectAgentPlan()`, `getAgentsAwaitingApproval()`, `checkSimilarProjects()`
  - Integrated with state-manager for dynamic project directories
  - Skill-aware planning integration

### Agent Workflows
- **`agent-workflow.js`** (620 lines) - Sub-agent autonomous planning workflow
  - Exports: `generateAutonomousAgentTask()`
  - 7-step workflow with enforcement instructions
  - Phase transition validation embedded in agent prompts

### Skill Discovery
- **`skill-aware-planning.js`** (480 lines) - User-specified skill validation
  - Exports: `analyzeSkillRequirements()`, `parseUserSpecifiedSkill()`, `initializeSkillAwarePlanning()`
  - Dynamic agent-side skill discovery (agents use find-skills at runtime)
  - User intent detection for mandatory skills

### Monitoring & Communication
- **`timeout-monitor.js`** (450 lines) - Timeout detection and recovery
  - Exports: `startTimeoutMonitor()`, `checkAgentTimeout()`, `handleAgentTimeout()`
  - Stage-level and agent-level timeout tracking
  - Crash recovery mechanism with restart counter persistence

- **`whiteboard.js`** (380 lines) - Shared state board for team communication
  - Exports: `initializeWhiteboard()`, `updateAgentStatus()`, `logIssue()`, `addWhiteboardMessage()`
  - Real-time status updates visible to all agents
  - Integrated with state-manager

### Legacy Coordination
- **`pm-coordination.js`** (302 lines) - Legacy PM coordination (deprecated)

---

## Configuration & Templates

### Role Definitions
- **`config/default-roles.yaml`** - Default role templates for different task types
  - Defines executor roles (Frontend, Backend, Designer, etc.)
  - QA agent role specifications
  - Responsibility matrices

### Validation Templates
- **`config/validation-templates/`** - QA validation templates
  - `generic.js` - Generic validation template
  - `code-validation.js` - Code project validation
  - `design-validation.js` - Design asset validation
  - `document-validation.js` - Document validation
  - `research-validation.js` - Research report validation
  - `README.md` - Template usage guide

### System Prompts
- **`templates/agent-system-prompt.txt`** - Sub-agent system prompt
- **`templates/manager-system-prompt.txt`** - PM system prompt
- **`templates/kickoff-message.txt`** - Project kickoff template
- **`templates/dispute-resolution.txt`** - Dispute resolution protocol
- **`templates/review-checklist.txt`** - Review checklist template

---

## Migration & Utilities

### State Migration
- **`scripts/migrate-state.js`** - Automatic migration tool for existing projects
  - Migrates old state format to unified state.json
  - Supports dry-run mode for validation
  - Can migrate all projects or specific project

---

## Documentation

### User-Facing Documentation
- **`README.md`** - Quick start guide and user instructions
- **`SKILL.md`** (1816 lines) - Complete skill specification with all protocols
- **`CLAUDE.md`** - Project instructions for Claude Code (this file's source)

### PM Reference Materials
- **`PM_QUICKREF.md`** - Quick reference card for PM pause protocol
- **`PM_CHECKLIST.md`** - Detailed checklist for PM operations
- **`QA_VALIDATION_QUICKREF.md`** - QA validation quick reference
- **`QA_VALIDATION_IMPLEMENTATION.md`** - QA validation implementation guide

### Examples
- **`examples/autonomous-planning-example.md`** - Autonomous planning workflow example
- **`examples/example-web-dev.md`** - Web development project example
- **`examples/example-design.md`** - Design project example
- **`examples/example-research.md`** - Research project example

### Skill Guides
- **`skill-guides/README.md`** - Skill guide index
- **`skill-guides/TEMPLATE.md`** - Template for creating skill guides
- **`skill-guides/nano-banana-pro.md`** - Image generation skill guide
- **`skill-guides/remotion-synced-video.md`** - Video generation skill guide
- **`skill-guides/doubao-open-tts.md`** - TTS skill guide
- **`skill-guides/hf-papers-reporter.md`** - Research paper skill guide
- **`skill-guides/markdown-converter.md`** - Document conversion skill guide

### Analysis Documents
- **`doc/项目分析报告.md`** - Project analysis report (Chinese)

---

## Build Configuration

### TypeScript Configuration
- **`tsconfig.json`** - TypeScript compiler configuration
  - Target: ES2020
  - Module: CommonJS
  - Output: ./dist
  - Strict mode enabled

### Package Management
- **`package.json`** - NPM package configuration
  - Dependencies: proper-lockfile (file locking)
  - DevDependencies: TypeScript, @types/node, @types/proper-lockfile
  - Scripts: build, watch

- **`package-lock.json`** - Locked dependency versions

---

## Module Dependencies

### Core Dependency Graph

```
src/index.ts (Main Entry)
├── src/team.ts (Team Management)
│   ├── src/phase-state-machine.ts (Phase Validation)
│   └── src/state-manager.ts (State Operations)
├── src/deliverable.ts (Output Aggregation)
│   └── src/state.ts (State Access)
└── src/qa-validation-plan.ts (QA Planning)
    └── src/state-lock.ts (Atomic Operations)

src/state-manager.ts (State Hub)
├── src/state-lock.ts (Locking)
├── src/state-sync.ts (Synchronization)
└── src/state-validator.ts (Validation)

pm-workflow.js (PM Coordination)
├── skill-aware-planning.js (Skill Analysis)
└── src/state-manager.ts (State Operations)

agent-workflow.js (Agent Tasks)
└── pm-workflow.js (Team Suggestions)

timeout-monitor.js (Monitoring)
├── whiteboard.js (Status Updates)
├── src/state-manager.ts (State Access)
└── src/phase-state-machine.ts (Phase Awareness)

whiteboard.js (Communication)
├── src/state-manager.ts (State Operations)
└── src/phase-state-machine.ts (Phase Validation)
```

---

## Key Exports by Module

### State Management
```typescript
// src/state-manager.ts
export async function createProject(projectId, initialState, projectsDir?)
export async function readProject(projectId, projectsDir?)
export async function updateProject(projectId, updates, projectsDir?)
export async function transaction(projectId, fn, projectsDir?)
export async function addLogEntry(projectId, phase, event, details, projectsDir?)
export async function updateAgentStatus(projectId, agentId, statusUpdate, projectsDir?)
export function resolveProjectsDir(explicitDir?)

// src/state-lock.ts
export async function withLock(lockPath, fn)
export function getLockPath(filePath)

// src/state-sync.ts
export async function syncAll(projectId, state, projectsDir)
export async function syncProjectLog(projectId, state, projectsDir)
export async function syncAgentStatus(projectId, state, projectsDir)
export async function syncWhiteboard(projectId, state, projectsDir)

// src/state-validator.ts
export function validateState(state)
export async function repairState(projectId, projectsDir)
```

### Phase Management
```typescript
// src/phase-state-machine.ts
export enum WorkflowPhase {
  SKILL_DISCOVERY, REQUIREMENT_UNDERSTANDING, SKILL_RESEARCH,
  PLAN_DESIGN, AWAITING_APPROVAL, EXECUTION, COMPLETION
}
export function validateTransition(from, to)
export async function grantApproval(projectDir, agentId, pmId)
export async function rejectApproval(projectDir, agentId, reason, pmId)
export async function getPhaseState(projectDir, agentId)
export async function transitionPhase(projectDir, agentId, toPhase, triggeredBy?)
```

### Team Management
```typescript
// src/team.ts
export async function spawnAgent(role, systemPrompt, initialMessage)
export async function sendMessage(sessionKey, message)
export async function collectResponses(sessions)
export async function handleTimeout(agent, projectState)
export async function resolveDispute(agents, issue, projectState)
```

### QA System
```typescript
// src/qa-validation-plan.ts
export async function createValidationPlan(projectId, qaAgentRole, executorPlans, projectsDir?)
export async function readValidationPlan(projectId, projectsDir?)
export async function approveValidationPlan(projectId, pmId, projectsDir?)
export async function rejectValidationPlan(projectId, reason, pmId, projectsDir?)

// src/qa-queue.ts
export async function enqueueValidation(projectId, validationTask, priority?)
export async function dequeueValidation(projectId)
export async function getQueueStatus(projectId)
```

### Deliverable Aggregation
```typescript
// src/deliverable.ts
export async function aggregateDeliverables(projectState, taskType)
export async function aggregateCodeProject(state)
export async function aggregateDocument(state)
export async function aggregateResearchReport(state)
export async function aggregateDesignAssets(state)
```

### Concurrency Control
```typescript
// src/concurrency-manager.ts
export async function acquireSlot(projectId, agentRole, agentId, metadata?)
export async function releaseSlot(projectId, slotId)
export async function getAvailableSlots(projectId)
export function getConcurrencyConfig()
```

### Workflow Scripts
```javascript
// pm-workflow.js
function generateTeamSuggestion(skillAnalysis)
function approveAgentPlan(projectDir, agentRole, pmId)
function rejectAgentPlan(projectDir, agentRole, reason, pmId)
function getAgentsAwaitingApproval(projectDir)
function checkSimilarProjects(userRequest)

// agent-workflow.js
function generateAutonomousAgentTask(projectInfo, agentRole, agentIndex)

// skill-aware-planning.js
function analyzeSkillRequirements(userRequest)
function parseUserSpecifiedSkill(userRequest)
function initializeSkillAwarePlanning(projectDir, projectId, userRequest)

// timeout-monitor.js
function startTimeoutMonitor(projectDir, agentId, agentRole)
function checkAgentTimeout(projectDir, agentId)
function handleAgentTimeout(projectDir, agentId, reason)

// whiteboard.js
function initializeWhiteboard(projectDir, projectId)
function updateAgentStatus(projectDir, agentId, statusUpdate)
function logIssue(projectDir, issueType, description, affectedAgents)
function addWhiteboardMessage(projectDir, fromAgent, message, toAgent?)
```

---

## Project State Schema

### Single Source of Truth: `state.json`
```json
{
  "id": "string",
  "status": "init | executing | reviewing | completed | failed | terminated | paused",
  "mode": "FULL_AUTO | SUPERVISED",
  "userRequest": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "team": [
    {
      "role": "string",
      "agentId": "string",
      "status": "active | blocked | completed | failed | paused",
      "deliverable": "string (optional)",
      "reworkCount": "number"
    }
  ],
  "milestones": [
    {
      "name": "string",
      "status": "pending | in-progress | completed",
      "userConfirmed": "boolean (optional)",
      "timestamp": "ISO 8601 timestamp (optional)"
    }
  ],
  "disputes": [
    {
      "id": "string",
      "agents": ["string"],
      "issue": "string",
      "resolution": "string (optional)",
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "logs": [
    {
      "timestamp": "ISO 8601 timestamp",
      "phase": "string",
      "event": "string",
      "details": "string"
    }
  ],
  "agentStatus": {
    "agentId": {
      "agentId": "string",
      "role": "string",
      "status": "RUNNING | PENDING_VERIFICATION | UNDER_VERIFICATION | VERIFIED | PAUSED | RETURNED_FOR_FIX",
      "phase": "skill_discovery | requirement | skill_research | plan_design | awaiting_approval | execution | completion",
      "progress": "number (0-100)",
      "lastUpdate": "ISO 8601 timestamp",
      "timeoutHistory": [
        {
          "timestamp": "ISO 8601 timestamp",
          "reason": "string",
          "restartCount": "number"
        }
      ]
    }
  },
  "whiteboard": {
    "messages": [],
    "issues": [],
    "lastUpdate": "ISO 8601 timestamp"
  }
}
```

### Derived Views (Auto-Synced)
- **`{project-id}.md`** - Human-readable project log
- **`agent-status.json`** - Real-time agent execution state
- **`WHITEBOARD.md`** - Team communication board

---

## Key Design Patterns

1. **Coordinator Pattern** - PM orchestrates but doesn't execute
2. **Pause-Escalate-Resume** - Structured handling of blockers
3. **Dual-Layer QA** - Independent QA validation + PM final acceptance
4. **Autonomous Planning** - Sub-agents plan → get approval → execute
5. **Skill-Aware Assignment** - Dynamic discovery and distribution of relevant skills
6. **Unified State Management** - Single source of truth with automatic synchronization
7. **Dynamic Configuration** - No hardcoded paths, works on any computer
8. **Phase State Machine** - Generic workflow enforcement with approval checkpoints

---

## Critical Protocols

### Sub-Agent Pause Protocol (MANDATORY)
When a sub-agent encounters an unresolvable blocker:
1. Immediately send pause signal to the agent
2. Collect complete context: progress, errors, attempted solutions
3. Update project status to `PAUSED` in agent-status.json
4. Report to user with detailed escalation format
5. Wait for user decision - DO NOT proceed without explicit approval

### Timeout Management
- Each agent has a 30-minute timeout
- PM detects timeout automatically
- PM assists agent to stop gracefully
- PM analyzes probable cause and provides guidance
- Maximum 2 restarts per agent (3 total attempts)
- After max restarts: mark as failed, escalate to user

### QA Validation & Retry Mechanism
- All executor deliverables MUST go through QA validation
- QA must create validation plan and get PM approval before validating
- 1st failure: Return to executor with fix guidance
- 2nd failure: Return with detailed guidance + notify PM
- 3rd failure: PAUSE - QA stops, reports to PM, user decision required

### Phase Transition Enforcement
- 7-phase workflow strictly enforced by phase state machine
- Agents CANNOT skip from plan_design to execution without PM approval
- Runtime validation prevents phase skipping
- Atomic state transitions prevent race conditions

---

## Operating Modes

### FULL_AUTO Mode
- PM makes routine decisions autonomously
- Team works independently on clear tasks
- Still pauses and escalates on blockers
- Best for: Well-defined tasks with clear success criteria

### SUPERVISED Mode
- PM asks for user confirmation at key milestones:
  1. Understanding confirmation
  2. Team plan confirmation
  3. Draft/prototype review
  4. Final delivery acceptance
- Best for: Complex/critical tasks requiring user control

---

## Project Directory Structure

```
projects/
├── {project-id}/
│   ├── state.json              # Single source of truth (machine-readable)
│   ├── {project-id}.md         # Derived: Human-readable project log
│   ├── agent-status.json       # Derived: Real-time agent states
│   ├── WHITEBOARD.md           # Derived: Team communication board
│   ├── validation-plan.json    # QA validation plan (if QA phase active)
│   ├── deliverables/           # All output files
│   │   ├── code/
│   │   ├── documents/
│   │   ├── designs/
│   │   └── research/
│   └── issues/                 # Log of issues and resolutions
│       ├── timeout-001.json
│       ├── dispute-001.json
│       └── escalation-001.json
```

---

## Dynamic Project Directory Configuration

**Priority Order** (most specific to least specific):
1. Function parameter: `projectDir` passed explicitly
2. Environment variable: `process.env.CLAWD_PROJECTS_DIR`
3. Config file: `~/.claude/config.json` → `projectsDirectory`
4. Default: `path.join(process.cwd(), 'projects')`

**Config File Format** (`~/.claude/config.json`):
```json
{
  "projectsDirectory": "/absolute/path/to/your/projects"
}
```

---

## Technology Stack

- **Runtime:** Node.js
- **Languages:** TypeScript (core modules), JavaScript (workflow scripts)
- **Type System:** TypeScript with strict mode
- **Concurrency:** File-based locking with proper-lockfile
- **State Management:** JSON-based with atomic operations
- **Architecture:** Event-driven agent orchestration
- **Patterns:** Coordinator, State Machine, Observer, Strategy

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Let PM execute tasks instead of coordinating
- Allow agents to continue when paused
- Skip user escalation when blocked
- Make assumptions about user preferences
- Let agents submit directly to PM (must go through QA)
- Skip QA validation plan approval
- Use hardcoded project paths

✅ **Do:**
- Pause immediately when blocked
- Provide detailed escalation reports
- Wait for explicit user decisions
- Track all state changes in state.json
- Enforce QA validation for all deliverables
- Monitor agents proactively (every 3-5 minutes)
- Use dynamic project directory resolution

---

## Index Metadata

- **Index Version:** 2.0
- **Total Files Analyzed:** 45 files
- **Total Lines of Code:** ~10,553 lines
- **TypeScript Modules:** 11 files (~4,788 lines)
- **JavaScript Workflows:** 6 files (~3,582 lines)
- **Configuration Files:** 6 files
- **Documentation Files:** 22 files
- **Excluded Directories:** node_modules, .git, dist, build, .idea, .cache

---

*This index is automatically generated and maintained. To regenerate, say "regenerate index" or "更新索引".*

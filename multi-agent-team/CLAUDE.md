# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multi-agent team coordination skill** that creates a virtual **3-person executor team + 1 independent QA agent** to collaboratively complete complex tasks. The system acts as a Project Manager (PM) that orchestrates sub-agents, manages their lifecycle, handles disputes, and ensures quality through dual-layer verification.

**Key Architecture Principle**: The PM is a **coordinator, not an executor**. When blocked, the PM must pause the affected sub-agent and escalate to the user for decision-making.

## Core Architecture

### Team Structure
- **1 Project Manager (PM)**: Orchestrates the entire workflow (you, when using this skill)
- **3 Executor Agents**: Dynamically assigned roles based on task type (e.g., Frontend Dev, Backend Dev, Designer)
- **1 QA Agent**: Independent verification specialist who validates all executor deliverables

### Team Context Awareness (NEW - 2026-02-05)

**Problem Solved:** Agents now understand they are contributing **part of a larger whole** rather than creating complete standalone deliverables.

**Key Features:**
- **Section Assignment**: Each agent receives a specific section/part (e.g., "Chapter 1", "Backend API", "Literature Review")
- **Full Team Visibility**: Agents see complete team structure, all assigned sections, and dependencies
- **Real-Time Coordination**: WHITEBOARD shows live progress of all team members
- **Task-Specific Structure**: Section assignments adapt to task type (document, code, research, video, design)

**Section Assignment Examples:**
- **Document Tasks**: "1. Executive Summary & Introduction", "2. Main Content & Analysis", "3. Conclusions & Recommendations"
- **Code Tasks**: "Backend API & Business Logic", "Frontend UI & User Experience", "Database Schema & Data Layer"
- **Research Tasks**: "Literature Review & Background", "Methodology & Data Collection", "Results & Discussion"
- **Video Tasks**: "Script & Storyboard", "Visual Assets & Graphics", "Audio & Final Assembly"
- **Design Tasks**: "Visual Design & Branding", "Interaction Design & UX Flow", "Assets & Design System"

**Agent System Prompt Enhancements:**
1. **Project Structure Section**: Shows overall deliverable, project outline, assigned section, integration context
2. **Full Teammate Context**: Lists all teammates with their assigned sections, responsibilities, and deliverables
3. **WHITEBOARD Reference**: Explains how to use WHITEBOARD for coordination and when to check it

**Benefits:**
- ✅ Prevents fragmented deliverables (no more 3 separate reports when 1 cohesive report is needed)
- ✅ Clear boundaries between agent responsibilities
- ✅ Better coordination through shared visibility
- ✅ Cohesive final outputs that integrate seamlessly

**Implementation:** See `IMPLEMENTATION_SUMMARY.md` for complete technical details.

### Execution Flow
```
User Request → PM Analysis → Team Assembly → Task Distribution
    ↓
[Executors Work in Parallel] → Submit to QA
    ↓
[QA Validation Planning] → PM Approval → [QA Validates]
    ↓
    ├─→ ✅ Pass: Continue
    └─→ ❌ Fail: Return to Executor (max 3 retries)
    ↓
[QA Report] → [PM Final Acceptance] → Deliver to User
```

### Agent Lifecycle States

**Executor States**:
- `RUNNING` → `PENDING_VERIFICATION` → `UNDER_VERIFICATION` → `VERIFIED`
- `PAUSED` (when blocked) → `RUNNING` (after user decision)
- `RETURNED_FOR_FIX` (QA rejected) → `RUNNING` (with fix guidance)

**Note**: State transitions are tracked in agent-status.json but not enforced by a formal state machine.

**QA States**:
- `RUNNING` → `QA_PLANNING` → `QA_VALIDATING` → `QA_COMPLETED`

**Phase States** (NEW - Enforced by Phase State Machine):
- `skill_discovery` → `requirement` → `skill_research` → `plan_design` → `awaiting_approval` → `execution` → `completion`
- **Critical Checkpoint**: Agents CANNOT transition from `awaiting_approval` to `execution` without PM approval
- Runtime enforcement prevents phase skipping

**Implementation Status**: ✅ **FULLY INTEGRATED** - The phase state machine (`src/phase-state-machine.ts`) is actively enforcing workflow integrity:
- **whiteboard.js:107-166**: Validates and blocks invalid phase transitions when agents update status
- **pm-workflow.js:701-758**: Enforces approval checkpoint via `approveAgentPlan()` and `rejectAgentPlan()`
- **src/team.ts:458-479**: Detects agents waiting for approval and warns on message send
- **Atomic operations**: All phase transitions use file locking for consistency
- **Error handling**: Invalid transitions throw errors and prevent state corruption

## Critical Protocols

### Phase Transition Enforcement (NEW)

**Phase State Machine** enforces workflow integrity at runtime:

1. **7-Phase Workflow**: skill_discovery → requirement → skill_research → plan_design → awaiting_approval → execution → completion
2. **Approval Checkpoint**: Agents are BLOCKED at `awaiting_approval` until PM grants approval
3. **Runtime Validation**: All phase transitions validated before execution
4. **Atomic Operations**: State changes are atomic and consistent

**PM Approval Functions**:
```javascript
const { approveAgentPlan, rejectAgentPlan, getAgentsAwaitingApproval } = require('./pm-workflow');

// Approve agent plan
approveAgentPlan(projectDir, 'Frontend Developer', 'PM-001');

// Reject and request revision
rejectAgentPlan(projectDir, 'Backend Developer', '需要添加错误处理', 'PM-001');

// Check who's waiting
const waiting = getAgentsAwaitingApproval(projectDir);
```

**Key Features**:
- ✅ Task-agnostic: Works for any task type (code, design, research, video, etc.)
- ✅ Role-agnostic: Works for any agent role
- ✅ Environment-independent: No hardcoded paths
- ✅ Atomic transitions: Prevents race conditions
- ✅ Full audit trail: Complete transition history

### Sub-Agent Pause Protocol (MANDATORY)

When a sub-agent encounters an unresolvable blocker:

1. **Immediately send pause signal** to the agent
2. **Collect complete context**: progress, errors, attempted solutions
3. **Update project status** to `PAUSED` in `projects/{id}/agent-status.json`
4. **Report to user** with detailed escalation format (see SKILL.md lines 729-807)
5. **Wait for user decision** - DO NOT proceed without explicit approval

**Mandatory Escalation Triggers** (10 types):
- Tool/resource unavailable
- API/service rate limited
- Permission denied
- Dependency missing (user file/data)
- Requirement unclear
- Technical limitation
- Task scope needs major change
- Team disagreement >2 rounds
- Multiple failures/timeouts (>2 restarts)
- Budget/usage concerns

### Timeout Management

Each agent has a **30-minute timeout**. When timeout occurs:
1. PM detects timeout automatically
2. PM assists agent to stop gracefully
3. PM analyzes probable cause (scope too large, dependency blocked, technical difficulty)
4. PM provides guidance and restarts with adjusted scope
5. **Maximum 2 restarts** per agent (3 total attempts)
6. After max restarts: mark as failed, escalate to user

### QA Validation & Retry Mechanism

When QA rejects a deliverable:
- **1st failure**: Return to executor with fix guidance
- **2nd failure**: Return with detailed guidance + notify PM
- **3rd failure**: **PAUSE** - QA stops, reports to PM, user decision required

## Key Files & Modules

### Core Implementation
- `src/team.ts` (815 lines): Team spawning, messaging, timeout handling, dispute resolution
- `src/state.ts` (355 lines): **UPDATED** - Backward compatibility layer (delegates to state-manager)
- `src/deliverable.ts` (396 lines): Aggregation logic for different deliverable types
- `src/index.ts` (377 lines): Main entry point and workflow orchestration
- `src/phase-state-machine.ts` (450 lines): Generic phase transition enforcement engine

### State Management (NEW)
- `src/state-manager.ts` (450 lines): **NEW** - Unified state management with single source of truth
- `src/state-lock.ts` (120 lines): **NEW** - File locking for atomic operations (uses proper-lockfile)
- `src/state-sync.ts` (200 lines): **NEW** - Automatic synchronization to derived views
- `src/state-validator.ts` (280 lines): **NEW** - Consistency validation and recovery
- `src/concurrency-manager.ts` (420 lines): **NEW** - Execution slot management and resource control

### Workflow Scripts
- `pm-workflow.js` (1468 lines): **UPDATED** - PM coordination logic + approval management + section assignment (now uses state-manager)
- `agent-workflow.js` (290 lines): **UPDATED** - Sub-agent autonomous planning workflow with team context awareness
- `skill-aware-planning.js`: User-specified skill validation (dynamic discovery by agents)
- `timeout-monitor.js`: **UPDATED** - Timeout detection and recovery (now uses state-manager)
- `whiteboard.js` (610 lines): **UPDATED** - Shared state board with project structure display (now uses state-manager)

### Migration & Tools
- `scripts/migrate-state.js`: **NEW** - Automatic migration tool for existing projects
- `test-team-context.js`: **NEW** - Test suite for team context awareness and section assignment

### Documentation
- `SKILL.md` (1816 lines): Complete skill specification with all protocols
- `PM_QUICKREF.md`: Quick reference card for PM pause protocol
- `PM_CHECKLIST.md`: Detailed checklist for PM operations
- `README.md`: User-facing quick start guide
- `IMPLEMENTATION_SUMMARY.md`: **NEW** - Team context awareness implementation details

### Configuration
- `config/default-roles.yaml`: Default role templates for different task types (1711 lines, 41 roles, ~60KB)
  - **Performance**: File read <1ms, no bottleneck detected
  - **Purpose**: Reference documentation for role definitions (system uses dynamic generation at runtime)
  - **Structure**: Skill categories, role definitions, team templates
  - **Decision**: Keeping unified - excellent performance, well-organized, easy to search
  - **Evaluation**: See `doc/default-roles-evaluation.md` for detailed analysis
- `tsconfig.json`: **NEW** - TypeScript compiler configuration
- `package.json`: **UPDATED** - Added proper-lockfile and typescript dependencies

### TypeScript Migration Strategy

**Current Status**: Hybrid TypeScript/JavaScript codebase (as of 2026-02-04)

**Approach**: Gradual migration with strategic prioritization

**TypeScript Modules** (Core Infrastructure):
- `src/state-manager.ts` - Unified state management
- `src/state-lock.ts` - File locking primitives
- `src/state-sync.ts` - State synchronization
- `src/state-validator.ts` - Consistency validation
- `src/phase-state-machine.ts` - Phase transition enforcement
- `src/qa-queue.ts` - QA validation queue
- `src/qa-validation-plan.ts` - QA planning logic
- `src/concurrency-manager.ts` - Concurrency control
- `src/deliverable.ts` - Deliverable aggregation
- `src/team.ts` - Team coordination
- `src/state.ts` - Backward compatibility layer
- `src/index.ts` - Main entry point

**JavaScript Modules** (Workflow Scripts - Migration Pending):
- `pm-workflow.js` - PM coordination logic (1268 lines)
- `agent-workflow.js` - Sub-agent workflow (260 lines)
- `timeout-monitor.js` - Timeout detection (564 lines)
- `skill-aware-planning.js` - Skill discovery coordination
- `whiteboard.js` - Shared communication board
- `scripts/migrate-state.js` - Migration utility
- `config/validation-templates/*.js` - QA validation templates (5 files)

**Migration Priority**:
1. ✅ **Phase 1 Complete**: Core infrastructure (state management, phase machine, QA system)
2. 🔄 **Phase 2 In Progress**: Workflow orchestration (pm-workflow.js, agent-workflow.js)
3. ⏳ **Phase 3 Planned**: Utilities and templates (timeout-monitor.js, validation templates)

**Rationale**:
- **TypeScript first** for new modules requiring type safety (state management, concurrency)
- **JavaScript retained** for workflow scripts with heavy string templating and dynamic execution
- **Gradual migration** minimizes disruption while improving type safety incrementally

**For Contributors**:
- New core modules: Use TypeScript
- Workflow scripts: JavaScript acceptable, TypeScript preferred
- Bug fixes: Keep original language unless refactoring
- When migrating JS→TS: Update imports in dependent modules, add JSDoc types first for easier transition

### Documentation
- `SKILL.md` (1816 lines): Complete skill specification with all protocols
- `PM_QUICKREF.md`: Quick reference card for PM pause protocol
- `PM_CHECKLIST.md`: Detailed checklist for PM operations
- `README.md`: User-facing quick start guide

### Project Tracking
All projects are tracked in:
```
projects/
├── {project-id}/
│   ├── state.json            # NEW: Single source of truth
│   ├── {project-id}.md       # Derived: Human-readable project log
│   ├── agent-status.json     # Derived: Real-time agent states
│   ├── WHITEBOARD.md         # Derived: Team communication board
│   ├── deliverables/         # All output files
│   └── issues/               # Log of issues and resolutions
```

## Skill-Aware Planning

**NEW: Dynamic Agent-Side Skill Discovery**

Agents now discover and select skills dynamically at runtime instead of receiving pre-assigned skills from PM:

1. **User Intent Detection**: PM recognizes patterns like "使用 {skill-name} 技能" and marks as mandatory
2. **Agent Skill Discovery**: Each agent uses `find-skills` to discover available skills in their environment
3. **Agent Skill Selection**: Agents select 2-3 skills matching their role and expertise
4. **PM Approval**: PM reviews and approves agent skill selections before planning begins
5. **Execution**: Agents use approved skills during task execution

### Benefits of Dynamic Discovery
- **Generic & Portable**: Works on any computer with any set of skills
- **Always Up-to-Date**: No stale cache, agents see current environment
- **Environment-Aware**: Each agent discovers only what's available
- **User-Specific**: Different users with different skill sets work seamlessly

## Sub-Agent Autonomous Planning Workflow

Sub-agents MUST follow this workflow (cannot skip steps):

0. **技能发现 (5%)**: Discover skills using find-skills → Select 2-3 matching role → Report to PM → **Wait for approval**
1. **需求理解 (10%)**: Understand task → Report to PM → Wait for confirmation
2. **Skill 调研 (20%)**: Research approved skills → Report findings → Wait for confirmation
3. **方案规划 (30%)**: Create detailed plan → Report to PM → **Wait for approval**
4. **执行 (40%)**: Execute approved plan → Report progress at milestones
5. **完成**: Submit deliverable to QA (NOT directly to PM)

**Critical**: Sub-agents must get PM approval before executing their plan.

## Operating Modes

### FULL_AUTO Mode
- PM makes routine decisions autonomously
- Team works independently on clear tasks
- **Still pauses and escalates on blockers**
- Best for: Well-defined tasks with clear success criteria

### SUPERVISED Mode
- PM asks for user confirmation at key milestones:
  1. Understanding confirmation
  2. Team plan confirmation
  3. Draft/prototype review
  4. Final delivery acceptance
- Best for: Complex/critical tasks requiring user control

## Common Development Tasks

### Testing Skill-Aware Planning
```bash
node test-skill-aware.js
```

### Monitoring Agent Status
Check `projects/{project-id}/agent-status.json` for real-time agent states.

### Debugging Timeout Issues
- Check `AGENT_TIMEOUT_SECONDS` in `src/team.ts` (default: 1800s = 30 min)
- Review `timeoutHistory` in agent status
- See timeout recovery logic in `src/team.ts` lines 396-738

## Important Constraints

### PM Role Boundaries
**PM MUST**:
- Coordinate and monitor agents
- Pause agents when blocked
- Escalate to user with detailed context
- Wait for user decisions before resuming

**PM MUST NOT**:
- Execute tasks themselves
- Make major decisions without user approval
- Hide problems from user
- Allow paused agents to continue
- Skip QA validation for final delivery

### Quality Assurance
- All executor deliverables MUST go through QA validation
- QA must create validation plan and get PM approval before validating
- QA must be objective and independent (no lenient judgments)
- Failed items must be returned to executor with specific fix guidance
- Max 3 retry attempts before escalation

## State Management

**NEW: Unified State Management System** (Implemented 2026-02-04)

The project now uses a **unified state management system** with a single source of truth:

### Architecture

```
projects/{project-id}/
├── state.json              ← SINGLE SOURCE OF TRUTH (machine-readable)
├── {project-id}.md         ← Derived view (human-readable, auto-synced)
├── agent-status.json       ← Derived view (real-time status, auto-synced)
└── WHITEBOARD.md           ← Derived view (team communication, auto-synced)
```

### Key Features

- **Single Source of Truth**: `state.json` is the authoritative source
- **Automatic Synchronization**: All derived views auto-sync from `state.json`
- **Atomic Operations**: File locking prevents race conditions
- **Consistency Validation**: Automatic detection and repair of inconsistencies
- **Dynamic Project Directory**: No hardcoded paths, works on any computer

### Dynamic Project Directory Configuration

**Priority Order** (most specific to least specific):
1. Function parameter: `projectDir` passed explicitly
2. Environment variable: `process.env.CLAWD_PROJECTS_DIR`
3. Config file: `~/.claude/config.json` → `projectsDirectory`
4. Default: `path.join(process.cwd(), 'projects')`

**Improved Robustness** (as of 2026-02-04):
- `src/team.ts`: Uses `resolveProjectsDir()` helper with full fallback chain
- `src/qa-validation-plan.ts`: Multi-path template loading (source, dist, env var)
- `pm-workflow.js`: Uses state-manager's `resolveProjectsDir()` when available

**Environment Variables**:
- `CLAWD_PROJECTS_DIR`: Override projects directory location
- `VALIDATION_TEMPLATES_DIR`: Override validation templates location (optional)

**Fallback Behavior**:
When state-manager is unavailable, modules use intelligent fallbacks:
- Check environment variables first
- Try config file (`~/.claude/config.json`)
- Fall back to relative paths with warnings
- Provide clear error messages with searched paths

### Configuration File Format

Create `~/.claude/config.json` to customize project directory:

```json
{
  "projectsDirectory": "/path/to/your/projects"
}
```

**Example**:
```json
{
  "projectsDirectory": "/Users/username/Documents/multi-agent-projects"
}
```

**Note**: Use absolute paths. Relative paths are resolved from the current working directory.

### Agent Status File Schema

`projects/{project-id}/agent-status.json` structure:

```json
{
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
```

### Core Modules

- `src/state-manager.ts` - Unified state management layer (single entry point)
- `src/state-lock.ts` - File locking for atomicity (uses proper-lockfile)
- `src/state-sync.ts` - Automatic synchronization to derived views
- `src/state-validator.ts` - Consistency validation and recovery
- `src/state.ts` - Backward compatibility layer (delegates to state-manager)
- `src/concurrency-manager.ts` - Execution slot management and resource control

### Concurrency Management

**Purpose**: Prevents resource exhaustion by limiting concurrent agent execution.

**Key Features**:
- **Execution Slots**: Maximum 3 concurrent agents by default (configurable)
- **Wait Queue**: Agents queue when all slots occupied (max 10 waiting)
- **Automatic Timeout**: Slots auto-released after 30 minutes
- **Persistent State**: Survives process restarts via `concurrency-state.json`
- **Dynamic Configuration**: Via env var, config file, or explicit parameters

**Configuration Priority** (highest to lowest):
1. Explicit function parameter
2. Environment variable: `MULTI_AGENT_MAX_CONCURRENT`
3. Config file: `~/.claude/multi-agent-config.json`
4. Default: 3 concurrent agents

**Usage**:
```typescript
import { acquireSlot, releaseSlot, getAvailableSlots } from './src/concurrency-manager';

// Acquire execution slot
const slot = await acquireSlot(projectDir, 'Frontend Developer', 'agent-001');
if (!slot) {
  console.log('Added to wait queue - all slots occupied');
  return;
}

try {
  // Execute agent work
  await executeAgent();
} finally {
  // Always release slot
  await releaseSlot(projectDir, slot.slotId, 'completed');
}

// Check availability
const available = await getAvailableSlots(projectDir);
console.log(`${available} slots available`);
```

**Integration Points**:
- `src/team.ts`: Acquires slots before spawning agents
- `pm-workflow.js`: Checks availability before task distribution
- `timeout-monitor.js`: Releases slots on timeout detection

### Usage

```javascript
const stateManager = require('./src/state-manager');

// Create project
await stateManager.createProject(projectId, initialState, projectsDir);

// Read project
const state = await stateManager.readProject(projectId, projectsDir);

// Update project (partial update)
await stateManager.updateProject(projectId, { status: 'executing' }, projectsDir);

// Atomic transaction
await stateManager.transaction(projectId, (state) => {
  state.logs.push({ timestamp: new Date().toISOString(), event: 'Test' });
  return state;
}, projectsDir);

// Helper functions
await stateManager.addLogEntry(projectId, 'phase', 'event', 'details', projectsDir);
await stateManager.updateAgentStatus(projectId, agentId, statusUpdate, projectsDir);
await stateManager.updateTeamMemberStatus(projectId, agentId, 'completed', projectsDir);
```

### Migration

Existing projects are automatically migrated on first access. Manual migration tool:

```bash
# Migrate all projects
node scripts/migrate-state.js

# Migrate specific project
node scripts/migrate-state.js --project PROJECT_ID

# Dry run (validation only)
node scripts/migrate-state.js --dry-run
```

### Backward Compatibility

All existing code continues to work without changes:
- `src/state.ts` maintains the existing API
- Optional `projectsDir` parameter (defaults to current behavior)
- Automatic migration on first access

## Deliverable Aggregation

Based on task type, deliverables are aggregated differently:
- **Code Project**: Structured folder with README, package.json, source files
- **Document**: Compiled cohesive document with TOC
- **Research Report**: Synthesized findings with executive summary
- **Design Assets**: Packaged files with specifications document

## Error Handling

### Common Error Scenarios

1. **Project Directory Not Found**
   - Cause: Invalid `projectsDirectory` configuration
   - Solution: Verify path in `~/.claude/config.json` or set `CLAWD_PROJECTS_DIR`

2. **Agent Timeout**
   - Cause: Task too complex or agent blocked
   - Solution: PM automatically restarts agent (max 2 restarts). After 3 failures, escalates to user.

3. **QA Validation Failure**
   - Cause: Deliverable doesn't meet quality standards
   - Solution: Executor receives fix guidance and retries (max 3 attempts)

4. **State File Corruption**
   - Cause: Concurrent writes or system crash
   - Solution: Run `node scripts/migrate-state.js --project PROJECT_ID` to repair

5. **Skill Discovery Failure**
   - Cause: `find-skills` skill not available
   - Solution: Ensure Claude Code has access to skill discovery tools

**Note**: The system uses generic Error objects with descriptive messages. No standardized error codes are currently implemented.

## Anti-Patterns to Avoid

❌ **Don't**:
- Let PM execute tasks instead of coordinating
- Allow agents to continue when paused
- Skip user escalation when blocked
- Make assumptions about user preferences
- Let agents submit directly to PM (must go through QA)
- Skip QA validation plan approval

✅ **Do**:
- Pause immediately when blocked
- Provide detailed escalation reports
- Wait for explicit user decisions
- Track all state changes in project files
- Enforce QA validation for all deliverables
- Monitor agents proactively (every 3-5 minutes)

## Key Design Patterns

1. **Coordinator Pattern**: PM orchestrates but doesn't execute
2. **Pause-Escalate-Resume**: Structured handling of blockers
3. **Dual-Layer QA**: Independent QA validation + PM final acceptance
4. **Autonomous Planning**: Sub-agents plan → get approval → execute
5. **Skill-Aware Assignment**: Automatic discovery and distribution of relevant skills
6. **Unified State Management**: Single source of truth with automatic synchronization (NEW)
7. **Dynamic Configuration**: No hardcoded paths, works on any computer (NEW)

## Project Index

This project has a pre-generated index for quick codebase understanding.

- **Location:** `.claude-index/index.md`
- **Last Updated:** 2026-02-04
- **Index Version:** 2.0
- **Total Files:** 45 files (~10,553 lines of code)
- **Contents:** Project overview, architecture components, module dependencies, key exports, state schema

**Usage:** Read `.claude-index/index.md` to quickly understand the project structure before making changes. The index provides a comprehensive navigation map of the codebase without needing to explore every file.

**Key Updates (2026-02-04):**
- Removed skill-discovery/ directory (now using dynamic agent-side discovery)
- Added unified state management system documentation
- Added phase state machine documentation
- Updated file counts and line counts to reflect current state

**Regenerate:** Say "regenerate index" or "更新索引" to update the index after major changes.

## References

- Full specification: `SKILL.md`
- PM quick reference: `PM_QUICKREF.md`
- Example workflows: `examples/` directory
- Skill guides: `skill-guides/` directory

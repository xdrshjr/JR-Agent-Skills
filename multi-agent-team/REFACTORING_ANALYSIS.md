# Code Simplification Analysis Report

**Date**: 2026-02-08
**Tool**: code-simplifier (Anthropic Official)
**Target**: multi-agent-team project

## Executive Summary

The multi-agent-team project has grown to **~10,553 lines of code** across 45 files. The primary issue is **council-workflow.js** - a 2,234-line monolith containing **56 functions** that should be split into 7-10 focused modules.

## Critical Issues Found

### 1. Monolithic council-workflow.js (2,234 lines, 56 functions)

**Severity**: 🔴 Critical
**Violation**: Combines 8+ concerns in a single file

**Current Structure**:
```
council-workflow.js (2,234 lines)
├── Project initialization (6 functions)
├── Team assembly & section assignment (10 functions)
├── Agent monitoring (4 functions)
├── Approval management (4 functions)
├── QA queue management (5 functions)
├── Concurrency control (5 functions)
├── Resource lifecycle (5 functions)
├── Leadership Council operations (6 functions)
├── Requirement clarification (11 functions)
└── Utility functions (56 total)
```

**Refactoring Plan**: Split into focused modules

```
src/workflow/
├── project-initialization.ts     (~300 lines) - Project setup, ID generation
├── team-assembly.ts              (~400 lines) - Team suggestion, role generation, section assignment
├── agent-monitoring.ts           (~200 lines) - Periodic monitoring, status tracking
├── approval-management.ts        (~300 lines) - Plan approval, validation plan approval
├── qa-management.ts              (~250 lines) - QA queue, submission, completion
├── concurrency-control.ts        (~200 lines) - Execution slots, resource allocation
├── lifecycle-management.ts       (~200 lines) - Agent cleanup (completion/failure/timeout/abort)
├── leadership-operations.ts      (~300 lines) - Council operations, cross-check, disputes
└── council-orchestrator.ts       (~200 lines) - Main workflow orchestration (thin layer)
```

### 2. Redundant Import Fallback Pattern

**Severity**: 🟡 Medium
**Violation**: Code duplication (5× repeated try-catch pattern)

**Before** (lines 14-72):
```javascript
let stateManager;
try {
  stateManager = require('./src/state-manager');
} catch (error) {
  try {
    stateManager = require('./dist/state-manager');
  } catch (e) {
    console.warn('⚠️ State manager not available, using legacy file operations');
  }
}

let leadership;
try {
  leadership = require('./src/leadership');
} catch (error) {
  try {
    leadership = require('./dist/leadership');
  } catch (e) {
    console.warn('⚠️  Leadership module not available, falling back to single-PM mode');
  }
}

// ... 3 more identical patterns
```

**After**:
```javascript
// src/utils/module-loader.ts
function loadModule(moduleName: string, fallbackMessage: string) {
  try {
    return require(`./src/${moduleName}`);
  } catch (error) {
    try {
      return require(`./dist/${moduleName}`);
    } catch (e) {
      console.warn(`⚠️  ${fallbackMessage}`);
      return null;
    }
  }
}

// council-workflow.js
const stateManager = loadModule('state-manager', 'State manager not available');
const leadership = loadModule('leadership', 'Leadership module not available');
const crossCheck = loadModule('cross-check', 'Cross-check module not available');
// ...
```

### 3. Overly Long Function: initializeProject (176 lines)

**Severity**: 🟡 Medium
**Violation**: Single function doing too much (initialization + analysis + team assembly + logging)

**Current** (lines 124-300):
```javascript
async function initializeProject(userRequest, options = {}) {
  // 1. Requirement clarification (40 lines)
  // 2. Project setup (30 lines)
  // 3. Skill-aware planning (20 lines)
  // 4. Team analysis (30 lines)
  // 5. Leadership initialization (20 lines)
  // 6. Document generation (30 lines)
  // Total: 176 lines in one function
}
```

**After**: Split into pipeline
```javascript
async function initializeProject(userRequest, options = {}) {
  const clarified = await clarifyRequirements(userRequest, options);
  const projectId = await createProjectStructure(clarified);
  const analysis = await analyzeTaskAndAssembleTeam(clarified);
  const leadership = await initializeLeadership(projectId, analysis);
  await generateProjectDocumentation(projectId, analysis, leadership);
  return { projectId, analysis, leadership };
}
```

### 4. Nested Ternaries in Section Assignment

**Severity**: 🟢 Low
**Violation**: code-simplifier principle "avoid nested ternaries"

**Example** (lines 543-557):
```javascript
function detectTaskType(analysis) {
  const taskLower = (analysis.taskType || '').toLowerCase();
  return taskLower.includes('document') || taskLower.includes('report') ? 'document'
    : taskLower.includes('code') || taskLower.includes('software') ? 'code'
    : taskLower.includes('research') || taskLower.includes('analysis') ? 'research'
    : taskLower.includes('design') || taskLower.includes('ui') ? 'design'
    : taskLower.includes('video') || taskLower.includes('animation') ? 'video'
    : 'generic';
}
```

**After**:
```javascript
function detectTaskType(analysis: TaskAnalysis): TaskType {
  const taskLower = (analysis.taskType || '').toLowerCase();

  if (taskLower.includes('document') || taskLower.includes('report')) return 'document';
  if (taskLower.includes('code') || taskLower.includes('software')) return 'code';
  if (taskLower.includes('research') || taskLower.includes('analysis')) return 'research';
  if (taskLower.includes('design') || taskLower.includes('ui')) return 'design';
  if (taskLower.includes('video') || taskLower.includes('animation')) return 'video';
  return 'generic';
}
```

### 5. Magic Numbers and Strings

**Severity**: 🟢 Low
**Violation**: Hardcoded values throughout

**Examples**:
```javascript
// Line 904: Magic number
function startPeriodicMonitoring(projectDir, intervalMinutes = 3) { ... }

// Line 1564: Magic strings
async function cleanupAgent(projectDir, agentRole, agentId, slotId, reason, metadata = {}) {
  // reason: 'completed' | 'failed' | 'timeout' | 'aborted'
}
```

**After**:
```javascript
// src/constants.ts
export const MONITORING_INTERVAL_MINUTES = 3;
export const AGENT_CLEANUP_REASONS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
} as const;

export type CleanupReason = typeof AGENT_CLEANUP_REASONS[keyof typeof AGENT_CLEANUP_REASONS];
```

## Secondary Issues

### Other Large Files to Review

1. **agent-workflow.js** (493 lines)
   - Status: Acceptable size, but could benefit from TypeScript migration
   - Action: Low priority - migrate to TS after council-workflow refactor

2. **whiteboard.js** (393 lines)
   - Status: Acceptable size
   - Action: Review for code-simplifier violations only

3. **timeout-monitor.js** (564 lines - from git status)
   - Status: Not analyzed yet
   - Action: Review after council-workflow refactor

## TypeScript Migration Opportunities

### Files Ready for Migration
- `council-workflow.js` → Should be split into TS modules during refactor
- `agent-workflow.js` → Can migrate after testing new council modules
- `whiteboard.js` → Can remain JS for now (heavy string templating)

### Benefits
- Type safety for complex workflow orchestration
- Better IDE autocomplete for module APIs
- Catch errors at compile time vs runtime

## Recommendations

### Phase 1: Critical Refactoring (High Priority)
1. ✅ Split council-workflow.js into 9 focused modules
2. ✅ Extract redundant import pattern into utility
3. ✅ Break down initializeProject function
4. ✅ Fix nested ternaries in detectTaskType

### Phase 2: Code Cleanup (Medium Priority)
5. Replace magic numbers with named constants
6. Add TypeScript types to new modules
7. Review agent-workflow.js for simplification opportunities

### Phase 3: Documentation & Testing (Low Priority)
8. Add JSDoc to exported functions
9. Create integration tests for refactored modules
10. Update CLAUDE.md with new module structure

## Estimated Impact

### Before Refactoring
- **Largest file**: 2,234 lines (council-workflow.js)
- **Maintainability**: 🔴 Poor (God object anti-pattern)
- **Testability**: 🔴 Poor (56 functions in one file)
- **Onboarding time**: ~2 hours to understand council-workflow.js

### After Refactoring
- **Largest file**: ~400 lines (team-assembly.ts)
- **Maintainability**: 🟢 Good (single responsibility per module)
- **Testability**: 🟢 Good (isolated modules)
- **Onboarding time**: ~30 minutes (clear module boundaries)

## Code Quality Metrics

| Metric | Before | After (Projected) |
|--------|--------|-------------------|
| Max file size | 2,234 lines | ~400 lines |
| Functions per file | 56 | ~8-12 |
| Cyclomatic complexity | High | Medium |
| Test coverage potential | 20% | 80% |
| Module cohesion | Low | High |

## Next Steps

1. **Create backup branch**: `git checkout -b refactor/council-workflow-simplification`
2. **Implement Phase 1**: Split council-workflow.js (Task #2)
3. **Run verification**: Ensure functionality preserved (Task #5)
4. **Create PR**: Document all changes
5. **Proceed to Phase 2**: After Phase 1 validated

---

**Generated by**: code-simplifier skill (Anthropic Official)
**Analyst**: Claude Sonnet 4.5
**Contact**: See CLAUDE.md for project maintainers

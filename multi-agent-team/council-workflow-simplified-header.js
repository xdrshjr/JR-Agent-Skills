/**
 * Council Workflow Integration (Simplified)
 * Leadership Council (三权分立) workflow with separation of powers
 *
 * REFACTORING NOTE:
 * This file uses code-simplifier principles:
 * - Extracted constants to src/constants.ts
 * - Simplified module loading with src/utils/module-loader.ts
 * - Reduced redundant code patterns
 */

const fs = require('fs');
const path = require('path');
const { initializeSkillAwarePlanning } = require('./skill-aware-planning');

// Import module loader to eliminate redundant try-catch blocks
let loadCoreModules;
try {
  loadCoreModules = require('./dist/utils/module-loader').loadCoreModules;
} catch (error) {
  // Fallback: Use legacy import pattern if module-loader not available
  console.warn('⚠️  Module loader not available, using legacy imports');
  loadCoreModules = null;
}

// Load core modules
let stateManager, leadership, crossCheck, councilDecisions, requirementClarification;

if (loadCoreModules) {
  // NEW: Use simplified module loader (eliminates 5× try-catch blocks)
  const modules = loadCoreModules('./');
  stateManager = modules['state-manager'];
  leadership = modules.leadership;
  crossCheck = modules['cross-check'];
  councilDecisions = modules['council-decisions'];
  requirementClarification = modules['requirement-clarification'];
} else {
  // LEGACY: Fallback to old pattern if module-loader not compiled yet
  try {
    stateManager = require('./src/state-manager');
  } catch (e) {
    try {
      stateManager = require('./dist/state-manager');
    } catch (e2) {
      console.warn('⚠️ State manager not available');
    }
  }

  try {
    leadership = require('./src/leadership');
  } catch (e) {
    try {
      leadership = require('./dist/leadership');
    } catch (e2) {
      console.warn('⚠️  Leadership module not available');
    }
  }

  try {
    crossCheck = require('./src/cross-check');
  } catch (e) {
    try {
      crossCheck = require('./dist/cross-check');
    } catch (e2) {
      console.warn('⚠️  Cross-check module not available');
    }
  }

  try {
    councilDecisions = require('./src/council-decisions');
  } catch (e) {
    try {
      councilDecisions = require('./dist/council-decisions');
    } catch (e2) {
      console.warn('⚠️  Council decisions module not available');
    }
  }

  try {
    requirementClarification = require('./src/requirement-clarification');
  } catch (e) {
    try {
      requirementClarification = require('./dist/requirement-clarification');
    } catch (e2) {
      console.warn('⚠️  Requirement clarification not available');
    }
  }
}

// Import constants (NEW: extracted from inline definitions)
let DOMAIN_LABELS, DIMENSION_LABELS, CLARIFICATION_CONFIG, SIMILAR_PROJECT_CONFIG;
try {
  const constants = require('./dist/constants');
  DOMAIN_LABELS = constants.DOMAIN_LABELS;
  DIMENSION_LABELS = constants.DIMENSION_LABELS;
  CLARIFICATION_CONFIG = constants.CLARIFICATION_CONFIG;
  SIMILAR_PROJECT_CONFIG = constants.SIMILAR_PROJECT_CONFIG;
} catch (error) {
  // Fallback to inline definitions if constants not compiled
  DOMAIN_LABELS = { planning: '规划权', execution: '执行权', quality: '质量权' };
  DIMENSION_LABELS = {
    scope: 'Scope',
    technical: 'Technical',
    deliverables: 'Deliverable',
    constraints: 'Constraints',
    context: 'Context'
  };
  CLARIFICATION_CONFIG = {
    MIN_ROUNDS: 2,
    SOFT_MAX_ROUNDS: 3,
    CONFIDENCE_THRESHOLD: 75,
    QUESTIONS_PER_ROUND: 5,
  };
  SIMILAR_PROJECT_CONFIG = {
    CHECK_RECENT_COUNT: 10,
    MIN_KEYWORD_MATCHES: 3,
    MAX_RESULTS: 3,
  };
}

/**
 * Dynamic project directory resolution
 * Replaces hardcoded PROJECTS_DIR for portability
 */
function resolveProjectsDir(explicitDir) {
  if (stateManager && stateManager.resolveProjectsDir) {
    return stateManager.resolveProjectsDir(explicitDir);
  }
  // Fallback to legacy behavior
  return explicitDir || process.env.CLAWD_PROJECTS_DIR || path.join(__dirname, '..', '..', 'projects');
}

const PROJECTS_DIR = resolveProjectsDir();

// ============================================================================
// REST OF THE FILE CONTINUES BELOW
// (This is just the header refactoring)
// ============================================================================

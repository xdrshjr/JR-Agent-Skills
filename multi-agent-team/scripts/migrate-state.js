#!/usr/bin/env node
/**
 * Migration Tool - Migrate existing projects to unified state management
 *
 * Usage:
 *   node scripts/migrate-state.js                    # Migrate all projects
 *   node scripts/migrate-state.js --project proj-id  # Migrate specific project
 *   node scripts/migrate-state.js --dry-run          # Validation only
 */

const fs = require('fs');
const path = require('path');

// Import state manager and validator
let stateManager, stateValidator;
try {
  stateManager = require('../src/state-manager');
  stateValidator = require('../src/state-validator');
} catch (error) {
  try {
    stateManager = require('../dist/state-manager');
    stateValidator = require('../dist/state-validator');
  } catch (e) {
    console.error('❌ State manager modules not found. Please compile TypeScript first:');
    console.error('   npm run build');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  projectId: null,
  projectsDir: null
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    options.projectId = args[i + 1];
    i++;
  } else if (args[i] === '--projects-dir' && args[i + 1]) {
    options.projectsDir = args[i + 1];
    i++;
  }
}

/**
 * Check if a project needs migration
 */
function needsMigration(projectDir) {
  const stateFile = path.join(projectDir, 'state.json');
  return !fs.existsSync(stateFile);
}

/**
 * Extract project metadata from markdown file
 */
function extractFromMarkdown(projectDir, projectId) {
  const mdPath = path.join(projectDir, `${projectId}.md`);

  if (!fs.existsSync(mdPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(mdPath, 'utf-8');

    const metadata = {
      userRequest: '',
      mode: 'FULL_AUTO',
      status: 'init',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Extract user request
    const userRequestMatch = content.match(/## (?:User Request|原始需求)\s+(.+?)(?=\n##)/s);
    if (userRequestMatch) {
      metadata.userRequest = userRequestMatch[1].trim();
    }

    // Extract mode
    const modeMatch = content.match(/\*\*(?:Mode|模式)\*\*[:\s]*(?:\|\s*)?(.+?)(?:\s*\||$)/);
    if (modeMatch && (modeMatch[1].trim() === 'FULL_AUTO' || modeMatch[1].trim() === 'SUPERVISED')) {
      metadata.mode = modeMatch[1].trim();
    }

    // Extract status
    const statusMatch = content.match(/\*\*(?:Status|状态)\*\*[:\s]*(?:\|\s*)?(.+?)(?:\s*\||$)/);
    if (statusMatch) {
      const status = statusMatch[1].trim().toLowerCase();
      if (['init', 'executing', 'reviewing', 'completed', 'failed', 'terminated', 'paused'].includes(status)) {
        metadata.status = status;
      }
    }

    // Extract created date
    const createdMatch = content.match(/\*\*(?:Created|创建时间)\*\*[:\s]*(?:\|\s*)?(.+?)(?:\s*\||$)/);
    if (createdMatch) {
      try {
        metadata.createdAt = new Date(createdMatch[1].trim()).toISOString();
      } catch (e) {
        // Keep default
      }
    }

    return metadata;
  } catch (error) {
    console.error(`  ⚠️ Failed to parse markdown: ${error.message}`);
    return null;
  }
}

/**
 * Extract agent status from agent-status.json
 */
function extractFromAgentStatus(projectDir) {
  const statusPath = path.join(projectDir, 'agent-status.json');

  if (!fs.existsSync(statusPath)) {
    return { team: [], agentStatus: {} };
  }

  try {
    const content = fs.readFileSync(statusPath, 'utf-8');
    const data = JSON.parse(content);

    const team = [];
    const agentStatus = {};

    if (data.teamMembers && Array.isArray(data.teamMembers)) {
      data.teamMembers.forEach(member => {
        team.push({
          role: member.role || 'Unknown',
          agentId: member.agentId || member.role,
          status: member.status || 'active',
          deliverable: member.deliverable,
          reworkCount: member.reworkCount || 0
        });
      });
    }

    if (data.agents && typeof data.agents === 'object') {
      Object.keys(data.agents).forEach(agentId => {
        const agent = data.agents[agentId];
        agentStatus[agentId] = {
          agentId,
          role: agent.role || agentId,
          state: agent.status || agent.state || 'unknown',
          phase: agent.phase || 'init',
          progress: agent.progress || 0,
          lastUpdate: agent.lastUpdate || new Date().toISOString(),
          timeoutHistory: agent.timeoutHistory || [],
          restartCount: agent.restartCount || 0
        };
      });
    }

    return { team, agentStatus };
  } catch (error) {
    console.error(`  ⚠️ Failed to parse agent-status.json: ${error.message}`);
    return { team: [], agentStatus: {} };
  }
}

/**
 * Migrate a single project
 */
async function migrateProject(projectId, projectDir, dryRun = false) {
  console.log(`\n📦 Migrating project: ${projectId}`);
  console.log(`   Path: ${projectDir}`);

  // Check if migration is needed
  if (!needsMigration(projectDir)) {
    console.log(`   ✅ Already migrated (state.json exists)`);
    return { success: true, skipped: true };
  }

  // Extract data from existing files
  console.log(`   📖 Extracting data from existing files...`);

  const mdMetadata = extractFromMarkdown(projectDir, projectId);
  const { team, agentStatus } = extractFromAgentStatus(projectDir);

  if (!mdMetadata) {
    console.log(`   ⚠️ No markdown file found, using defaults`);
  }

  // Build initial state
  const initialState = {
    id: projectId,
    status: mdMetadata?.status || 'init',
    mode: mdMetadata?.mode || 'FULL_AUTO',
    userRequest: mdMetadata?.userRequest || '',
    createdAt: mdMetadata?.createdAt || new Date().toISOString(),
    updatedAt: mdMetadata?.updatedAt || new Date().toISOString(),
    team: team,
    milestones: [],
    disputes: [],
    logs: [{
      timestamp: new Date().toISOString(),
      phase: 'migration',
      event: 'Project migrated to unified state management',
      details: 'Automatically migrated from legacy file format'
    }],
    agentStatus: agentStatus,
    whiteboard: {
      teamMembers: team.map(m => ({ role: m.role, agentId: m.agentId, status: m.status })),
      currentPhase: 'init',
      blockers: [],
      decisions: [],
      lastUpdate: new Date().toISOString()
    }
  };

  console.log(`   📊 Extracted:`);
  console.log(`      - Team members: ${team.length}`);
  console.log(`      - Agent statuses: ${Object.keys(agentStatus).length}`);
  console.log(`      - Mode: ${initialState.mode}`);
  console.log(`      - Status: ${initialState.status}`);

  if (dryRun) {
    console.log(`   🔍 DRY RUN - Would create state.json with above data`);
    return { success: true, dryRun: true };
  }

  // Create state.json using state manager
  try {
    const projectsDir = path.dirname(projectDir);
    await stateManager.createProject(projectId, initialState, projectsDir);
    console.log(`   ✅ Migration successful`);

    // Validate consistency
    const validation = await stateValidator.validateConsistency(projectId, projectDir);
    if (validation.isValid) {
      console.log(`   ✅ Validation passed`);
    } else {
      console.log(`   ⚠️ Validation warnings: ${validation.warnings.length}`);
      validation.warnings.forEach(w => console.log(`      - ${w.message}`));
    }

    return { success: true, migrated: true };
  } catch (error) {
    console.error(`   ❌ Migration failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔄 State Migration Tool\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const projectsDir = stateManager.resolveProjectsDir(options.projectsDir);
  console.log(`📁 Projects directory: ${projectsDir}\n`);

  if (!fs.existsSync(projectsDir)) {
    console.error(`❌ Projects directory does not exist: ${projectsDir}`);
    process.exit(1);
  }

  // Get list of projects to migrate
  let projectsToMigrate = [];

  if (options.projectId) {
    // Migrate specific project
    const projectDir = path.join(projectsDir, options.projectId);
    if (!fs.existsSync(projectDir)) {
      console.error(`❌ Project not found: ${options.projectId}`);
      process.exit(1);
    }
    projectsToMigrate.push({ id: options.projectId, dir: projectDir });
  } else {
    // Migrate all projects
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    projectsToMigrate = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        id: entry.name,
        dir: path.join(projectsDir, entry.name)
      }));
  }

  console.log(`Found ${projectsToMigrate.length} project(s)\n`);

  // Migrate each project
  const results = {
    total: projectsToMigrate.length,
    migrated: 0,
    skipped: 0,
    failed: 0
  };

  for (const project of projectsToMigrate) {
    const result = await migrateProject(project.id, project.dir, options.dryRun);

    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else if (result.migrated || result.dryRun) {
        results.migrated++;
      }
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total projects:    ${results.total}`);
  console.log(`Migrated:          ${results.migrated}`);
  console.log(`Already migrated:  ${results.skipped}`);
  console.log(`Failed:            ${results.failed}`);
  console.log('='.repeat(60));

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to perform actual migration.');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run migration
main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});

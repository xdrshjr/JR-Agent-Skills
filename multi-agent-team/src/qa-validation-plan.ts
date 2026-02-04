/**
 * QA Validation Plan Module
 *
 * Provides functions for creating, reading, and managing QA validation plans.
 * Integrates with the existing state management system and follows the
 * phase-state-machine pattern for approval workflow.
 *
 * Key Features:
 * - Task-agnostic: Works for any deliverable type
 * - Role-agnostic: Works for any agent role
 * - Environment-independent: No hardcoded paths
 * - Atomic operations: Uses state-lock for consistency
 */

const fs = require('fs').promises;
const path = require('path');
const stateLock = require('./state-lock');

/**
 * Validation Plan Interface
 *
 * @typedef {Object} ValidationPlan
 * @property {string} qaAgentRole - Role of the QA agent
 * @property {string} templateId - ID of the template used
 * @property {Object} overview - High-level validation approach
 * @property {string} overview.validationObjective - What this validation aims to verify
 * @property {string} overview.validationScope - What will and will not be validated
 * @property {string} overview.estimatedEffort - Rough estimate of validation effort
 * @property {Array<Object>} executorPlans - Per-executor validation plans
 * @property {Array<string>} toolsAndResources - Tools and resources needed
 * @property {Array<Object>} riskAssessment - Potential risks and mitigation
 * @property {Array<Object>} validationSequence - Order of validation
 * @property {Object} approval - Approval status
 * @property {string} approval.status - 'pending' | 'approved' | 'rejected'
 * @property {string} approval.pmId - PM identifier who approved/rejected
 * @property {string} approval.timestamp - ISO timestamp of approval/rejection
 * @property {string} approval.reason - Reason for rejection (if rejected)
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Get project directory
 *
 * Priority order:
 * 1. Explicit projectsDir parameter
 * 2. Environment variable CLAWD_PROJECTS_DIR
 * 3. Config file ~/.claude/config.json
 * 4. Default: ./projects
 *
 * @param projectsDir - Optional explicit projects directory
 * @returns Projects directory path
 */
function getProjectsDir(projectsDir?: string): string {
  if (projectsDir) {
    return projectsDir;
  }

  if (process.env.CLAWD_PROJECTS_DIR) {
    return process.env.CLAWD_PROJECTS_DIR;
  }

  try {
    const configPath = path.join(require('os').homedir(), '.claude', 'config.json');
    const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
    if (config.projectsDirectory) {
      return config.projectsDirectory;
    }
  } catch (err) {
    // Config file doesn't exist or is invalid, use default
  }

  return path.join(process.cwd(), 'projects');
}

/**
 * Get validation plan file path
 *
 * @param projectDir - Project directory path
 * @param qaAgentRole - QA agent role
 * @returns Validation plan file path
 */
function getValidationPlanPath(projectDir: string, qaAgentRole: string): string {
  // Sanitize role name for filename
  const sanitizedRole = qaAgentRole.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  return path.join(projectDir, `validation-plan-${sanitizedRole}.json`);
}

/**
 * Load validation template
 *
 * Attempts to load from multiple locations for portability:
 * 1. Relative to current module (development/source)
 * 2. Relative to compiled output (production/dist)
 * 3. Absolute path from environment variable
 *
 * @param templateId - Template ID (e.g., 'generic', 'code-validation')
 * @returns Template module
 * @throws Error if template not found
 */
function loadValidationTemplate(templateId: string): any {
  const possiblePaths = [
    // 1. Relative to source (development)
    path.join(__dirname, '..', 'config', 'validation-templates', `${templateId}.js`),
    // 2. Relative to dist (compiled)
    path.join(__dirname, '..', '..', 'config', 'validation-templates', `${templateId}.js`),
    // 3. From environment variable
    process.env.VALIDATION_TEMPLATES_DIR
      ? path.join(process.env.VALIDATION_TEMPLATES_DIR, `${templateId}.js`)
      : null
  ].filter(Boolean) as string[];

  for (const templatePath of possiblePaths) {
    try {
      if (require('fs').existsSync(templatePath)) {
        return require(templatePath);
      }
    } catch (err: any) {
      // Try next path
      continue;
    }
  }

  throw new Error(
    `Failed to load validation template '${templateId}'. ` +
    `Searched paths: ${possiblePaths.join(', ')}. ` +
    `Set VALIDATION_TEMPLATES_DIR environment variable if templates are in a custom location.`
  );
}

/**
 * Select appropriate validation template based on task type
 *
 * @param taskType - Type of task (code, design, research, document, etc.)
 * @param executorRoles - Optional executor roles for additional context
 * @returns Template ID to use
 */
function selectValidationTemplate(taskType: string, executorRoles: string[] = []): string {
  const genericTemplate = loadValidationTemplate('generic');
  return genericTemplate.selectValidationTemplate(taskType);
}

/**
 * Create validation plan
 *
 * @param projectId - Project ID
 * @param qaAgentRole - QA agent role
 * @param plan - Validation plan data
 * @param projectsDir - Optional projects directory
 * @returns Created validation plan
 * @throws Error if plan already exists or creation fails
 */
async function createValidationPlan(projectId: string, qaAgentRole: string, plan: any, projectsDir?: string): Promise<any> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);
  const planPath = getValidationPlanPath(projectDir, qaAgentRole);

  // Use lock to ensure atomic operation
  return await stateLock.withLock(planPath, async () => {
    // Check if plan already exists
    try {
      await fs.access(planPath);
      throw new Error(`Validation plan for QA agent '${qaAgentRole}' already exists`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Create validation plan
    const validationPlan = {
      qaAgentRole,
      templateId: plan.templateId || 'generic',
      overview: plan.overview || {},
      executorPlans: plan.executorPlans || [],
      toolsAndResources: plan.toolsAndResources || [],
      riskAssessment: plan.riskAssessment || [],
      validationSequence: plan.validationSequence || [],
      approval: {
        status: 'pending',
        pmId: null,
        timestamp: null,
        reason: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Write to file
    await fs.writeFile(planPath, JSON.stringify(validationPlan, null, 2), 'utf8');

    return validationPlan;
  });
}

/**
 * Read validation plan
 *
 * @param projectId - Project ID
 * @param qaAgentRole - QA agent role
 * @param projectsDir - Optional projects directory
 * @returns Validation plan
 * @throws Error if plan not found
 */
async function readValidationPlan(projectId: string, qaAgentRole: string, projectsDir?: string): Promise<any> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);
  const planPath = getValidationPlanPath(projectDir, qaAgentRole);

  try {
    const content = await fs.readFile(planPath, 'utf8');
    return JSON.parse(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error(`Validation plan for QA agent '${qaAgentRole}' not found`);
    }
    throw new Error(`Failed to read validation plan: ${err.message}`);
  }
}

/**
 * Update validation plan approval status
 *
 * @param projectId - Project ID
 * @param qaAgentRole - QA agent role
 * @param status - Approval status ('approved' | 'rejected')
 * @param pmId - PM identifier
 * @param reason - Optional reason for rejection
 * @param projectsDir - Optional projects directory
 * @returns Updated validation plan
 * @throws Error if plan not found or update fails
 */
async function updateValidationPlanApproval(projectId: string, qaAgentRole: string, status: string, pmId: string, reason: string | null = null, projectsDir?: string): Promise<any> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);
  const planPath = getValidationPlanPath(projectDir, qaAgentRole);

  // Use lock to ensure atomic operation
  return await stateLock.withLock(planPath, async () => {
    // Read existing plan
    const plan = await readValidationPlan(projectId, qaAgentRole, projectsDir);

    // Update approval status
    plan.approval = {
      status,
      pmId,
      timestamp: new Date().toISOString(),
      reason: status === 'rejected' ? reason : null
    };
    plan.updatedAt = new Date().toISOString();

    // Write updated plan
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');

    return plan;
  });
}

/**
 * Get validation plans awaiting approval
 *
 * @param projectId - Project ID
 * @param projectsDir - Optional projects directory
 * @returns Array of pending validation plans
 */
async function getValidationPlansAwaitingApproval(projectId: string, projectsDir?: string): Promise<any[]> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);

  try {
    // Read all files in project directory
    const files = await fs.readdir(projectDir);

    // Filter for validation plan files
    const planFiles = files.filter((f: string) => f.startsWith('validation-plan-') && f.endsWith('.json'));

    // Read and filter for pending plans
    const pendingPlans = [];
    for (const file of planFiles) {
      try {
        const content = await fs.readFile(path.join(projectDir, file), 'utf8');
        const plan = JSON.parse(content);
        if (plan.approval && plan.approval.status === 'pending') {
          pendingPlans.push(plan);
        }
      } catch (err: any) {
        // Skip invalid files
        console.warn(`Warning: Failed to read validation plan file ${file}: ${err.message}`);
      }
    }

    return pendingPlans;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Failed to get validation plans: ${err.message}`);
  }
}

/**
 * Generate validation plan prompt for QA agent
 *
 * @param templateId - Template ID to use
 * @param projectContext - Project context
 * @returns Formatted prompt for QA agent
 */
function generateValidationPlanPrompt(templateId: string, projectContext: any): string {
  const template = loadValidationTemplate(templateId);
  return template.generateValidationPlanPrompt(projectContext);
}

/**
 * Update validation plan (partial update)
 *
 * @param projectId - Project ID
 * @param qaAgentRole - QA agent role
 * @param updates - Partial updates to apply
 * @param projectsDir - Optional projects directory
 * @returns Updated validation plan
 */
async function updateValidationPlan(projectId: string, qaAgentRole: string, updates: any, projectsDir?: string): Promise<any> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);
  const planPath = getValidationPlanPath(projectDir, qaAgentRole);

  return await stateLock.withLock(planPath, async () => {
    const plan = await readValidationPlan(projectId, qaAgentRole, projectsDir);

    // Apply updates
    Object.assign(plan, updates);
    plan.updatedAt = new Date().toISOString();

    // Write updated plan
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');

    return plan;
  });
}

/**
 * Delete validation plan
 *
 * @param projectId - Project ID
 * @param qaAgentRole - QA agent role
 * @param projectsDir - Optional projects directory
 */
async function deleteValidationPlan(projectId: string, qaAgentRole: string, projectsDir?: string): Promise<void> {
  const baseDir = getProjectsDir(projectsDir);
  const projectDir = path.join(baseDir, projectId);
  const planPath = getValidationPlanPath(projectDir, qaAgentRole);

  try {
    await fs.unlink(planPath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw new Error(`Failed to delete validation plan: ${err.message}`);
    }
  }
}

module.exports = {
  // Template functions
  loadValidationTemplate,
  selectValidationTemplate,
  generateValidationPlanPrompt,

  // CRUD functions
  createValidationPlan,
  readValidationPlan,
  updateValidationPlan,
  updateValidationPlanApproval,
  deleteValidationPlan,

  // Query functions
  getValidationPlansAwaitingApproval,

  // Utility functions
  getProjectsDir,
  getValidationPlanPath
};

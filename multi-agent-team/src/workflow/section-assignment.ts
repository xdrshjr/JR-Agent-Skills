/**
 * Section Assignment Module
 * Assigns specific sections/parts to team roles based on task type
 *
 * EXTRACTED: From council-workflow.js (~225 lines)
 * PURPOSE: Better modularity and single responsibility
 */

export interface Role {
  role: string;
  responsibility: string;
  skills?: string[];
  assignedSection?: string;
  sectionOrder?: number;
  dependencies?: string[];
}

export interface Analysis {
  detectedTypes?: string[];
  finalDeliverable?: string;
  [key: string]: any;
}

export type TaskType = 'document' | 'code' | 'research' | 'design' | 'video' | 'generic';

/**
 * Detect task type from analysis
 */
export function detectTaskType(analysis: Analysis): TaskType {
  const types = analysis.detectedTypes || [];

  if (types.includes('document') || types.includes('writing')) return 'document';
  if (types.includes('code') || types.includes('development')) return 'code';
  if (types.includes('research') || types.includes('analysis')) return 'research';
  if (types.includes('design') || types.includes('image')) return 'design';
  if (types.includes('video')) return 'video';

  return 'generic';
}

/**
 * Assign specific sections/parts to each role based on task type
 */
export function assignSectionsToRoles(roles: Role[], analysis: Analysis): Role[] {
  const taskType = detectTaskType(analysis);

  // Separate QA from executors - QA validates all sections, doesn't own one
  const executors = roles.filter(r => r.role !== 'QA Reviewer');
  const qa = roles.find(r => r.role === 'QA Reviewer');

  // Assign sections to executors only
  let assignedExecutors: Role[];
  switch (taskType) {
    case 'document':
      assignedExecutors = assignDocumentSections(executors, analysis);
      break;
    case 'code':
      assignedExecutors = assignCodeModules(executors, analysis);
      break;
    case 'research':
      assignedExecutors = assignResearchAreas(executors, analysis);
      break;
    case 'design':
      assignedExecutors = assignDesignComponents(executors, analysis);
      break;
    case 'video':
      assignedExecutors = assignVideoComponents(executors, analysis);
      break;
    default:
      assignedExecutors = assignGenericParts(executors, analysis);
  }

  // Add QA back with special section indicating they validate all sections
  if (qa) {
    assignedExecutors.push({
      ...qa,
      assignedSection: 'Quality Assurance & Validation (All Sections)',
      sectionOrder: 999, // After all executors
      dependencies: assignedExecutors.map(e => e.role) // Depends on all executors
    });
  }

  return assignedExecutors;
}

/**
 * Assign document sections (e.g., Chapter 1, Chapter 2, etc.)
 */
export function assignDocumentSections(roles: Role[], analysis: Analysis): Role[] {
  const sections = [
    { title: '1. Executive Summary & Introduction', order: 1 },
    { title: '2. Main Content & Analysis', order: 2 },
    { title: '3. Conclusions & Recommendations', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: sections[idx]?.title || `Section ${idx + 1}`,
    sectionOrder: sections[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Assign code modules (e.g., Backend API, Frontend UI, Database)
 */
export function assignCodeModules(roles: Role[], analysis: Analysis): Role[] {
  const modules = [
    { name: 'Backend API & Business Logic', order: 1 },
    { name: 'Frontend UI & User Experience', order: 2 },
    { name: 'Database Schema & Data Layer', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: modules[idx]?.name || `Module ${idx + 1}`,
    sectionOrder: modules[idx]?.order || idx + 1,
    dependencies: determineCodeDependencies(role, roles)
  }));
}

/**
 * Assign research areas (e.g., Literature Review, Methodology, Results)
 */
export function assignResearchAreas(roles: Role[], analysis: Analysis): Role[] {
  const areas = [
    { name: 'Literature Review & Background', order: 1 },
    { name: 'Methodology & Data Collection', order: 2 },
    { name: 'Results & Discussion', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: areas[idx]?.name || `Research Area ${idx + 1}`,
    sectionOrder: areas[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Assign design components (e.g., Visual Design, Interaction Design, Assets)
 */
export function assignDesignComponents(roles: Role[], analysis: Analysis): Role[] {
  const components = [
    { name: 'Visual Design & Branding', order: 1 },
    { name: 'Interaction Design & UX Flow', order: 2 },
    { name: 'Assets & Design System', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: components[idx]?.name || `Design Component ${idx + 1}`,
    sectionOrder: components[idx]?.order || idx + 1,
    dependencies: determineDesignDependencies(role, roles)
  }));
}

/**
 * Assign video production components
 */
export function assignVideoComponents(roles: Role[], analysis: Analysis): Role[] {
  const components = [
    { name: 'Script & Storyboard', order: 1 },
    { name: 'Visual Assets & Graphics', order: 2 },
    { name: 'Audio & Final Assembly', order: 3 }
  ];

  return roles.map((role, idx) => ({
    ...role,
    assignedSection: components[idx]?.name || `Video Component ${idx + 1}`,
    sectionOrder: components[idx]?.order || idx + 1,
    dependencies: idx > 0 ? [roles[idx - 1].role] : []
  }));
}

/**
 * Generic part assignment for mixed/unknown task types
 */
export function assignGenericParts(roles: Role[], analysis: Analysis): Role[] {
  return roles.map((role, idx) => ({
    ...role,
    assignedSection: `Part ${idx + 1}: ${role.responsibility}`,
    sectionOrder: idx + 1,
    dependencies: []
  }));
}

/**
 * Determine code dependencies between roles
 */
export function determineCodeDependencies(role: Role, allRoles: Role[]): string[] {
  const roleKeywords = {
    backend: ['backend', 'api', 'server', 'service'],
    frontend: ['frontend', 'ui', 'client', 'web', 'interface'],
    database: ['database', 'db', 'data', 'storage']
  };

  const roleLower = role.role.toLowerCase();

  // Backend has no dependencies
  if (roleKeywords.backend.some(kw => roleLower.includes(kw))) {
    return [];
  }

  // Frontend depends on Backend
  if (roleKeywords.frontend.some(kw => roleLower.includes(kw))) {
    const backend = allRoles.find(r =>
      roleKeywords.backend.some(kw => r.role.toLowerCase().includes(kw))
    );
    return backend ? [backend.role] : [];
  }

  // Database has no dependencies
  return [];
}

/**
 * Determine design dependencies between roles
 */
export function determineDesignDependencies(role: Role, allRoles: Role[]): string[] {
  const roleKeywords = {
    visual: ['visual', 'graphic', 'brand', 'style'],
    interaction: ['interaction', 'ux', 'experience', 'flow'],
    assets: ['asset', 'resource', 'component', 'system']
  };

  const roleLower = role.role.toLowerCase();

  // Visual design comes first
  if (roleKeywords.visual.some(kw => roleLower.includes(kw))) {
    return [];
  }

  // Interaction design depends on visual design
  if (roleKeywords.interaction.some(kw => roleLower.includes(kw))) {
    const visual = allRoles.find(r =>
      roleKeywords.visual.some(kw => r.role.toLowerCase().includes(kw))
    );
    return visual ? [visual.role] : [];
  }

  // Assets depend on both visual and interaction
  if (roleKeywords.assets.some(kw => roleLower.includes(kw))) {
    const deps = allRoles.filter(r => {
      const rLower = r.role.toLowerCase();
      return roleKeywords.visual.some(kw => rLower.includes(kw)) ||
             roleKeywords.interaction.some(kw => rLower.includes(kw));
    });
    return deps.map(d => d.role);
  }

  // Default: no dependencies
  return [];
}

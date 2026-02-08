/**
 * Module Loader Utility
 * Simplifies module loading with fallback from src/ to dist/
 * Eliminates redundant try-catch patterns in council-workflow.js
 */

/**
 * Load a module with fallback logic
 * Tries ./src/{moduleName} first, then ./dist/{moduleName}
 *
 * @param moduleName - Name of the module to load (without path or extension)
 * @param fallbackMessage - Warning message if module not found
 * @param basePath - Base path for module resolution (default: '../..')
 * @returns Loaded module or null if not found
 */
export function loadModule<T = any>(
  moduleName: string,
  fallbackMessage: string,
  basePath: string = '../..'
): T | null {
  const paths = [
    `${basePath}/src/${moduleName}`,
    `${basePath}/dist/${moduleName}`,
  ];

  for (const modulePath of paths) {
    try {
      return require(modulePath);
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  console.warn(`⚠️  ${fallbackMessage}`);
  return null;
}

/**
 * Load multiple modules at once
 * Simplifies module loading for council-workflow.js
 *
 * @param modules - Array of {name, fallbackMessage} objects
 * @param basePath - Base path for module resolution (default: '.')
 * @returns Record of loaded modules (null for not found)
 */
export function loadModules(
  modules: Array<{ name: string; fallbackMessage: string }>,
  basePath: string = '.'
): Record<string, any | null> {
  const result: Record<string, any | null> = {};

  for (const { name, fallbackMessage } of modules) {
    result[name] = loadModule(name, fallbackMessage, basePath);
  }

  return result;
}

/**
 * Load core modules used by council-workflow.js
 * Replaces 5× repeated try-catch blocks
 *
 * @param basePath - Base path for module resolution (default: '.')
 * @returns Object with all loaded modules
 */
export function loadCoreModules(basePath: string = '.') {
  return loadModules([
    { name: 'state-manager', fallbackMessage: 'State manager not available, using legacy file operations' },
    { name: 'leadership', fallbackMessage: 'Leadership module not available, falling back to single-PM mode' },
    { name: 'cross-check', fallbackMessage: 'Cross-check module not available' },
    { name: 'council-decisions', fallbackMessage: 'Council decisions module not available' },
    { name: 'requirement-clarification', fallbackMessage: 'Requirement clarification not available, skipping clarification phase' },
  ], basePath);
}

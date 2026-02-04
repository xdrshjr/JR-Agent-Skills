/**
 * File locking mechanism for atomic state operations
 * Prevents race conditions during concurrent state updates
 */

import * as path from 'path';
import * as fs from 'fs';
import * as lockfile from 'proper-lockfile';

const LOCK_TIMEOUT = 5000; // 5 seconds
const LOCK_RETRIES = 3;

/**
 * Execute a function with exclusive file lock
 * @param lockPath - Path to the lock file (typically projects/{id}/.state.lock)
 * @param fn - Function to execute while holding the lock
 * @returns Result of the function execution
 */
export async function withLock<T>(
  lockPath: string,
  fn: () => Promise<T>
): Promise<T> {
  // Ensure the directory exists
  const lockDir = path.dirname(lockPath);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }

  // Create lock file if it doesn't exist
  if (!fs.existsSync(lockPath)) {
    fs.writeFileSync(lockPath, '', 'utf8');
  }

  let release: (() => Promise<void>) | null = null;

  try {
    // Acquire lock with timeout and retries
    release = await lockfile.lock(lockPath, {
      retries: {
        retries: LOCK_RETRIES,
        minTimeout: 100,
        maxTimeout: LOCK_TIMEOUT,
      },
      stale: LOCK_TIMEOUT * 2, // Consider lock stale after 10 seconds
    });

    // Execute the function while holding the lock
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes('ELOCKED')) {
      throw new Error(
        `Failed to acquire lock on ${lockPath} after ${LOCK_RETRIES} retries. ` +
        `Another process may be holding the lock.`
      );
    }
    throw error;
  } finally {
    // Always release the lock
    if (release) {
      try {
        await release();
      } catch (error) {
        // Log but don't throw - we don't want to mask the original error
        console.error(`Warning: Failed to release lock on ${lockPath}:`, error);
      }
    }
  }
}

/**
 * Get the lock file path for a project
 * @param projectDir - Project directory path
 * @returns Path to the lock file
 */
export function getLockPath(projectDir: string): string {
  return path.join(projectDir, '.state.lock');
}

/**
 * Check if a lock file exists and is currently locked
 * @param lockPath - Path to the lock file
 * @returns True if the file is locked
 */
export async function isLocked(lockPath: string): Promise<boolean> {
  if (!fs.existsSync(lockPath)) {
    return false;
  }

  try {
    return await lockfile.check(lockPath);
  } catch (error) {
    // If we can't check, assume it's not locked
    return false;
  }
}

/**
 * Force unlock a lock file (use with caution)
 * @param lockPath - Path to the lock file
 */
export async function forceUnlock(lockPath: string): Promise<void> {
  if (!fs.existsSync(lockPath)) {
    return;
  }

  try {
    await lockfile.unlock(lockPath);
  } catch (error) {
    // If unlock fails, try to remove the lock file directly
    try {
      fs.unlinkSync(lockPath);
    } catch (unlinkError) {
      throw new Error(
        `Failed to force unlock ${lockPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// core/resolver/rootResolver.mjs

import fs from 'fs';
import path from 'path';

/**
 * Check if directory contains a pyltra project
 */
function isProjectRoot(dir: string): boolean {
  const configPath = path.join(dir, 'config.yaml');
  return fs.existsSync(configPath);
}

/**
 * Walk up the directory tree to find project root
 */
function findUp(startDir: string): string | null {
  let dir = path.resolve(startDir);

  while (true) {
    if (isProjectRoot(dir)) {
      return dir;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      return null;
    }

    dir = parent;
  }
}

/**
 * Resolve project root
 */
export function resolveProjectRoot(options: { cwd?: string; root?: string } = {}) {
  const cwd = options.cwd || process.cwd();

  // 1. Explicit override (highest priority)
  if (options.root) {
    const resolved = path.resolve(options.root);

    if (!isProjectRoot(resolved)) {
      throw new Error(
        `[pyltra] Invalid root: no config.yaml found in ${resolved}`
      );
    }

    return resolved;
  }

  // 2. Environment variable (nice addition)
  if (process.env.PYLTRA_ROOT) {
    const envRoot = path.resolve(process.env.PYLTRA_ROOT);

    if (!isProjectRoot(envRoot)) {
      throw new Error(
        `[pyltra] Invalid PYLTRA_ROOT: ${envRoot}`
      );
    }

    return envRoot;
  }

  // 3. Auto-discovery (main behavior)
  const found = findUp(cwd);

  if (found) {
    return found;
  }

  // 4. Failure
  throw new Error(
    `[pyltra] No project found. Run this inside a pyltra project.`
  );
}
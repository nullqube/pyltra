#!/usr/bin/env node
/**
 * Production build for the pyltra CLI.
 *
 * Pipeline:
 *   1. Type-check + compile the TypeScript sources to plain ESM JavaScript in
 *      dist/ via `tsc` (preserves the src/ + bin/ directory structure and
 *      rewrites relative `.ts` imports to `.js`).
 *   2. Minify every emitted file in place with esbuild.
 *   3. Copy the runtime assets the CLI needs at runtime (templates/, plus a
 *      package.json so dist/ is treated as ESM and `--version` keeps working).
 *
 * The directory structure is intentionally preserved (rather than producing a
 * single bundle) so that runtime path resolution that relies on a module's
 * location — e.g. ProjectScaffolder resolving `../../../templates` — keeps
 * pointing at dist/templates.
 */
import { execFileSync } from 'node:child_process';
import { rmSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import * as esbuild from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
// Run the locally installed tsc via Node directly (avoids cross-platform
// issues spawning the .cmd shim on Windows).
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

function step(msg) { console.log(`\n→ ${msg}`); }

// 1. Clean + compile ------------------------------------------------------
step('Cleaning dist/');
rmSync(DIST, { recursive: true, force: true });

step('Compiling TypeScript (tsc -p tsconfig.build.json)');
execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], { cwd: ROOT, stdio: 'inherit' });

// 2. Minify in place ------------------------------------------------------
step('Minifying emitted JavaScript with esbuild');
const files = await fg('**/*.js', { cwd: DIST, absolute: true });
await esbuild.build({
  entryPoints: files,
  outdir: DIST,
  outbase: DIST,
  bundle: false,
  minify: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  allowOverwrite: true,
  logLevel: 'warning',
});
console.log(`  minified ${files.length} files`);

// 3. Copy runtime assets --------------------------------------------------
step('Copying runtime assets (templates/, package.json)');
cpSync(join(ROOT, 'templates'), join(DIST, 'templates'), { recursive: true });
cpSync(join(ROOT, 'package.json'), join(DIST, 'package.json'));

// Ensure the CLI entry keeps its shebang after minification.
const entry = join(DIST, 'bin', 'cli.js');
if (existsSync(entry)) {
  let code = readFileSync(entry, 'utf8');
  if (!code.startsWith('#!')) {
    writeFileSync(entry, `#!/usr/bin/env node\n${code}`);
    console.log('  re-added shebang to dist/bin/cli.js');
  }
}

console.log('\n✓ Build complete → dist/');

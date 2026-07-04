#!/usr/bin/env node
/**
 * Production build for the pyltra CLI.
 *
 * Pipeline:
 *   1. Type-check + compile TypeScript sources to plain ESM in dist/ via tsc.
 *   2. Minify every emitted file in place with esbuild.
 *   3. Copy runtime assets (templates/, trimmed package.json).
 */
import { execFileSync } from 'node:child_process';
import { rmSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';
import * as esbuild from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const TSC  = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

const ESBUILD_BASE = {
  bundle: false,
  minify: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  allowOverwrite: true,
  logLevel: 'warning',
};

function step(msg) { console.log(`\n→ ${msg}`); }

// 1. Clean + compile -------------------------------------------------------
step('Cleaning dist/');
rmSync(DIST, { recursive: true, force: true });

step('Compiling TypeScript (tsc -p tsconfig.build.json)');
try {
  execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  process.exit(1); // tsc already printed diagnostics
}

// 2. Minify in place -------------------------------------------------------
step('Minifying emitted JavaScript with esbuild');
const allFiles = await Array.fromAsync(
  glob('**/*.js', { cwd: DIST })
).then(f => f.map(p => join(DIST, p)));

const entryFile = join(DIST, 'bin', 'cli.js');
const otherFiles = allFiles.filter(f => f !== entryFile);


// Before the CLI entry esbuild pass, strip whatever tsc emitted
const raw = readFileSync(entryFile, 'utf8');
writeFileSync(entryFile, raw.replace(/^.*\n?/, ''));  // strip first line

// Minify everything except the CLI entry
await esbuild.build({
  entryPoints: otherFiles,
  outdir: DIST,
  outbase: DIST,
  ...ESBUILD_BASE,
});

// Minify CLI entry separately to restore shebang cleanly
await esbuild.build({
  entryPoints: [entryFile],
  outdir: join(DIST, 'bin'),
  outbase: join(DIST, 'bin'),
  banner: { js: '#!/usr/bin/env node' },
  ...ESBUILD_BASE,
});

console.log(`  minified ${allFiles.length} files`);

// 3. Copy runtime assets ---------------------------------------------------
step('Copying runtime assets (templates/, package.json)');
cpSync(join(ROOT, 'templates'), join(DIST, 'templates'), { recursive: true });

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
writeFileSync(
  join(DIST, 'package.json'),
  JSON.stringify({
    name:         pkg.name,
    version:      pkg.version,
    type:         pkg.type,
    dependencies: pkg.dependencies,
  }, null, 2)
);

console.log('\n✓ Build complete → dist/');
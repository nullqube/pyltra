#!/usr/bin/env node
/** Type-check, bundle Pyltra's CLI, and copy starter templates. */
import { execFileSync } from 'node:child_process';
import { rmSync, cpSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

console.log('→ Type-checking TypeScript');
execFileSync(process.execPath, [TSC, '-p', 'tsconfig.build.json'], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.log('→ Bundling CLI');
rmSync(DIST, { recursive: true, force: true });
const entryFile = join(DIST, 'cli.js');
await esbuild.build({
  absWorkingDir: ROOT,
  entryPoints: ['bin/cli.ts'],
  outfile: entryFile,
  bundle: true,
  // Dependencies stay installed by npm, including native modules like sharp.
  packages: 'external',
  minify: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  logLevel: 'warning',
});
// esbuild preserves the source shebang; npm needs an executable CLI on Unix.
chmodSync(entryFile, 0o755);

console.log('→ Copying starter templates');
cpSync(join(ROOT, 'templates'), join(DIST, 'templates'), { recursive: true });
console.log('✓ Build complete → dist/cli.js + dist/templates/');

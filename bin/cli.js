#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  build,
  serve,
  watchTask,
  initialize
} from '../src/index.mjs';

import { handleError } from '../src/utils/handleError.mjs';

/* -------------------- */
/* Setup                */
/* -------------------- */

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program.option('--debug', 'Show full error output');

try {
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8')
  );

  program
    .name('pyltra')
    .version(
      packageJson.version,
      '-v, --version',
      'Output the current version'
    )
    .description('Your app description');
} catch (error) {
  console.error('Error reading package.json:', error.message);
  process.exit(1);
}

/* -------------------- */
/* Commands             */
/* -------------------- */

program
  .command('init')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .description('Initialize the project')
  .action((options) => {
    try {
      initialize(options);
    } catch (err) {
      handleError(err, program.opts());
    }
  });

program
  .command('build')
  .description('Build the project')
  .action(async () => {
    try {
      await new Promise((resolve, reject) =>
        build(err => (err ? reject(err) : resolve()))
      );
    } catch (err) {
      handleError(err, program.opts());
    }
  });

program
  .command('serve')
  .description('Start dev server and watch files')
  .action(() => {
    try {
      serve();
      watchTask();
    } catch (err) {
      handleError(err, program.opts());
    }
  });

program.parse(process.argv);
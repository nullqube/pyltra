#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setIsProd, loadConfig } from '../src/utils/config.mjs';
import { handleError } from '../src/utils/handleError.mjs';

/* -------------------- */
/* Setup                */
/* -------------------- */
const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

program
    .option('--debug', 'Show full error output')
    .option('--prod',  'Run in production mode')
    .option('--dev',   'Run in development mode (default)');

try {
    const packageJson = JSON.parse(
        fs.readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
    );
    program
        .name('pyltra')
        .version(packageJson.version, '-v, --version', 'Output the current version')
        .description(packageJson.description || 'Static site generator');
} catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
}

/* -------------------- */
/* Graceful shutdown    */
/* -------------------- */
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});

/* -------------------- */
/* Commands             */
/* -------------------- */
program
    .command('init')
    .option('-t, --template <template>', 'Template to use', 'basic')
    .description('Initialize a new project')
    .action(async (options) => {
        try {
            // Dynamically import so config.mjs module-level code doesn't
            // attempt to load config.yaml before it exists
            const { initialize } = await import('../src/index.mjs');
            await initialize(options);
        } catch (err) {
            handleError(err, program.opts());
        }
    });

program
    .command('build')
    .description('Build the project')
    .action(async () => {
        try {
            setIsProd(program.opts().prod);
            loadConfig();
            const { build } = await import('../src/index.mjs');
            // Gulp 4 series/parallel returns a function that accepts a callback
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
    .action(async () => {
        try {
            setIsProd(program.opts().prod);
            loadConfig();
            const { serve, watchTask } = await import('../src/index.mjs');
            serve();
            watchTask();
        } catch (err) {
            handleError(err, program.opts());
        }
    });

program.parse(process.argv);

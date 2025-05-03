#!/usr/bin/env node

// Use default import for CommonJS modules
import { Command } from 'commander';
const program = new Command();

import gulp from 'gulp';

// Import your existing Gulp tasks
import '../src/index.mjs'; // This loads your current Gulpfile

program
    .command('init')
    .description('Initialize the project')
    .action(() => {
        console.log('Initializing project...');
        gulp.series('init')();
    });

program
    .command('build')
    .description('Build the project')
    .action(() => {
        console.log('Building project...');
        gulp.series('build')();
    });

program
    .command('serve')
    .description('Start the development server')
    .action(() => {
        console.log('Starting development server...');
        gulp.series('default')();
    });

program.parse(process.argv);
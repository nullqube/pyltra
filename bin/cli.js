#!/usr/bin/env node

// Use default import for CommonJS modules
import { Command } from 'commander';
const program = new Command();

// import gulp from 'gulp';

// Import your existing Gulp tasks
import * as tasks from '../src/index.mjs'; // This loads your current Gulpfile
import { watch } from 'browser-sync';

program
    .command('init')
    .description('Initialize the project')
    .action(() => {
        console.log('Initializing project...');
        // gulp.series('init')();
        tasks.initialize();
    });

program
    .command('build')
    .description('Build the project')
    .action(() => {
        console.log('Building project...');
        // gulp.series('build')();
        tasks.build();
    });

program
    .command('serve')
    .description('Start the development server')
    .action(() => {
        console.log('Starting development server...');
        tasks.watch();
    });

program.parse(process.argv);
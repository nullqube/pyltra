#!/usr/bin/env node

// Use default import for CommonJS modules
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import * as tasks from '../src/index.mjs'; // This loads your current Gulpfile

const program = new Command();

const INITIALIZE = 0x1;
const COMMON = 0x2;
const INITCONFIG = 0x4;
// then we can have a single main function with config 
// in binary format to do them as necessary. like in c++


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add version information
program
    .version(packageJson.version, '-v, --version', 'Output the current version')
    .description('Your app description');

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
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


try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add version information
    program
        .version(packageJson.version, '-v, --version', 'Output the current version')
        .description('Your app description');
} catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
}

program
    .command('init')
    .option('-t, --template <template>', 'Template to use', 'basic') // Default to 'basic'
    .description('Initialize the project')
    .action(() => {
        tasks.initialize();
    });

program
    .command('build')
    .description('Build the project')
    .action(() => {
        tasks.build();
    });

program
    .command('serve')
    .description('Start the development server')
    .action(() => {
        tasks.watch();
    });

program.parse(process.argv);
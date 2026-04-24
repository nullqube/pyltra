//
// CLI
// ----
// Command-line interface for interacting with the Pyltra engine.
//
// Responsibilities:
// - Parse command-line arguments
// - Invoke appropriate engine methods based on commands
// - Provide user feedback and error messages
//
// This class does NOT:
// - Load projects
// - Build projects
// - Start servers
//
// It delegates all core functionality to the PyltraEngine class.
//

import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PyltraEngine } from '../../core/Engine.mjs';

export class CLI {

    constructor() {
        // don't need it here,, because preAction hook always running before
        // each command get executed...
        // this.engine = new PyltraEngine();
    }

    /**
     * Parses command-line arguments and executes corresponding actions.
     * @param {string[]} args - Command-line arguments (e.g., process.argv.slice(2))
     */
    async run(args) {
        const program = new Command();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname  = dirname(__filename);

        program
            .option('--debug', 'Show full error output')
            .option('--prod',  'Run in production mode')
            .option('--dev',   'Run in development mode (default)');

        try {
            const packageJson = JSON.parse(
                fs.readFileSync(join(__dirname, '../../..', 'package.json'), 'utf8')
            );
            program
                .name('pyltra')
                .version(packageJson.version, '-v, --version', 'Output the current version')
                .description(packageJson.description || 'A static site generator for multilingual projects')

        } catch (error) {
            console.error('Error reading package.json:', error.message);
            process.exit(1);
        }

        program.hook('preAction', (thisCommand) => {
            const opts = thisCommand.opts();

            this.engine = new PyltraEngine({
                mode: opts.prod ? 'prod' : 'dev'
            });
        });

        program
            .command('init')
            .option('-t, --template <template>', 'Template to use', 'basic')
            .description('Initialize a new project')
            .action(this.init);

        program
            .command('validate')
            .description('Validate the project')
            .action(async () => {
                try {
                    await this.engine.validate();
                    console.log('Project validated successfully!');
                } catch (err) {
                    console.error('Error validating project:', err.message);
                }
            });

        program
            .command('build')
            .description('Build the project')
            .action(async () => {
                try {
                    await this.engine.build();
                    console.log('Project built successfully!');
                } catch (err) {
                    console.error('Error building project:', err.message);
                }
            });

        program
            .command('serve')
            .description('Start dev server and watch files')
            .action(async () => {
                try {
                    await this.engine.start();
                    console.log('Dev server started successfully!');
                } catch (err) {
                    console.error('Error starting dev server:', err.message);
                }
            });

        program.parse(args);
    }

    async init(options) {
        try {
            const responses = await prompts(
                [
                    {
                        type: 'text',
                        name: 'projectName',
                        message: 'Enter the project name:',
                        validate: value => value.trim().length > 0 ? true : 'Project name is required'
                    },
                    {
                        type: 'text',
                        name: 'projectDescription',
                        message: 'Enter the project description:'
                    },
                    {
                        type: 'confirm',
                        name: 'createReadme',
                        message: 'Create README.md?',
                        initial: true
                    },
                    {
                        type: 'confirm',
                        name: 'createGitignore',
                        message: 'Create .gitignore?',
                        initial: true
                    }
                ],
                {
                    // Treat Ctrl+C as cancellation rather than a hard crash
                    onCancel: () => {
                        console.log('\nProject initialization cancelled.');
                        process.exit(0);
                    }
                }
            );

            console.log(options, responses)
            return;
            await this.engine.init(options, responses);
            console.log('Project initialized successfully!');
        } catch (err) {
            console.error('Error initializing project:', err.message);
        }
    }
}
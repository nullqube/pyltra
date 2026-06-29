// 
// ProjectScaffolder
// ----------------
// Scaffolds a new project with the given name and options

import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

export class ProjectScaffolder {
    constructor() {
        // any dependencies can be injected here
    }

    static async create(options, responses) {
        // 1. Create project directory
        // 2. Create config file (pyltra.yaml)
        // 3. Create content directory with sample content
        // 4. Create templates directory with sample templates
        // 5. Create output directory (empty)
        // 6. Optionally create README.md and .gitignore

        // const { projectName, projectDescription, createReadme, createGitignore } = responses;
        const __filename   = fileURLToPath(import.meta.url);
        const __dirname    = path.dirname(__filename);
        const TEMPLATE_DIR = path.resolve(__dirname, '../../../templates');
        const availableTemplates = fs.readdirSync(TEMPLATE_DIR)
            .filter(name => fs.statSync(path.join(TEMPLATE_DIR, name)).isDirectory());
        let { template = 'empty' } = options || {};

        if (availableTemplates.includes(template)) {
            console.log(`You entered template: "${template}"`);
        } else {
            console.log(`Template "${template}" not recognised, defaulting to "empty"`);
            console.log(`Available templates: ${availableTemplates.join(', ')}`);
            template = 'empty';
        }

        const templatePath = path.join(TEMPLATE_DIR, template);
        const projectName = options.name ;
        console.log('\nInitializing project...');
        console.log(`Creating project: ${projectName}`);

        const projectDir   = projectName.trim();
        const projectPath  = path.resolve(process.cwd(), projectDir);

        if (!fs.existsSync(templatePath)) {
            throw new Error(
                `Template "${template}" not found at: ${templatePath}\n` +
                `Available templates: ${fs.readdirSync(TEMPLATE_DIR).join(', ')}`
            );
        }

        // recursive: true is safe even if parents already exist
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
            console.log(`Created project directory: ${projectDir}`);
        } else {
            console.log(`Directory "${projectDir}" already exists, continuing...`);
        }

        this.#initWithTemplate(template, projectPath, templatePath);
        this.#createFoldersStructure(projectPath);
        this.#createDefaultConfig(projectPath);

        if (true) { // removed 'createReadme' option for now, always create README.md
            const readmeContent = [
                `# ${projectName}`,
                '',
                'YOUR PROJECT DESCRIPTION', // TODO: Allow user to provide description via CLI or prompts
                                            // removed 'projectDescription' option for now, always use placeholder text.
                '',
                '## Getting Started',
                '',
                'Run `npm install` to install dependencies.',
                'Run `pyltra serve` to start the development server.',
                'Run `pyltra build --prod` to build for production.',
            ].join('\n');
            fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent, 'utf8');
            console.log('Created README.md');
        }

        if (true) { // removed 'createGitignore' option for now, always create .gitignore
            const gitignoreContent = `node_modules/\ndist/\n.DS_Store\n.env\n`;
            fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent, 'utf8');
            console.log('Created .gitignore');
        }

        console.log('\n✅ Project initialized successfully!');
        console.log(`\nNext steps:\n  cd ${projectDir}\n  npm install\n  pyltra serve`);
    }

    /**
     * Creates the default config.yaml.
     * @param {string} projectPath
     */
    static #createDefaultConfig(projectPath) {
        const configPath = path.join(projectPath, 'config.yaml');
        // Don't overwrite if template already provided one
        if (fs.existsSync(configPath)) {
            console.log('config.yaml already exists from template, skipping.');
            return;
        }
    
        const config = {
            languages: [{ code: 'en', name: 'English' }],
            pages: {
                index: {
                    file: '${lang}.index.yaml',
                    fallback: {
                        title: 'Error',
                        heading: 'Page Not Found',
                        content: 'Index data missing.'
                    }
                }
            },
            bundles: ['404.html', '50x.html']
        };
    
        fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
        console.log('Created config.yaml');
    }
    
    /**
     * Creates the default folder structure.
     * @param {string} projectPath
     */
    static #createFoldersStructure(projectPath) {
        const defaultDirs = [
            'src',
            'src/assets',
            'src/assets/scss',
            'src/assets/js',
            'src/assets/img',
            'src/assets/fonts',
            'src/data',
            'src/templates',
            'dist'
        ];
    
        defaultDirs.forEach(dir => {
            const fullPath = path.join(projectPath, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }
    
    /**
     * Copies template files into the project directory.
     * @param {string} template
     * @param {string} projectPath
     * @param {string} templatePath - pre-validated path
     */
    static #initWithTemplate(template, projectPath, templatePath) {
        fs.cpSync(templatePath, projectPath, { recursive: true });
        console.log(`Initialized with "${template}" template.`);
    }
}

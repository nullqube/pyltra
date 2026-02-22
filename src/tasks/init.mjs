import fs from 'fs';
import yaml from 'js-yaml';
import prompts from 'prompts';
import path from 'path';
import { fileURLToPath } from 'url';

export const initProject = async (options = {}) => {
    let { template = 'empty' } = options || {};

    if (['empty', 'basic'].includes(template)) {
        console.log(`You entered template: "${template}"`);
    } else {
        console.log(`Template "${template}" not recognised, defaulting to "empty"`);
        template = 'empty';
    }

    const response = await prompts(
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

    const { projectName, projectDescription, createReadme, createGitignore } = response;

    console.log('\nInitializing project...');
    console.log(`Creating project: ${projectName}`);

    const projectDir   = projectName.trim();
    const projectPath  = path.resolve(process.cwd(), projectDir);

    // Guard: validate template exists before touching the filesystem
    const __filename   = fileURLToPath(import.meta.url);
    const __dirname    = path.dirname(__filename);
    const TEMPLATE_DIR = path.resolve(__dirname, '../../templates');
    const templatePath = path.join(TEMPLATE_DIR, template);

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

    initWithTemplate(template, projectPath, templatePath);
    createFoldersStructure(projectPath);
    createDefaultConfig(projectPath);

    if (createReadme) {
        const readmeContent = [
            `# ${projectName}`,
            '',
            projectDescription || '',
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

    if (createGitignore) {
        const gitignoreContent = `node_modules/\ndist/\n.DS_Store\n.env\n`;
        fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent, 'utf8');
        console.log('Created .gitignore');
    }

    console.log('\n✅ Project initialized successfully!');
    console.log(`\nNext steps:\n  cd ${projectDir}\n  npm install\n  pyltra serve`);
};

// ---------------------------------------------------------------------------

/**
 * Creates the default config.yaml.
 * @param {string} projectPath
 */
function createDefaultConfig(projectPath) {
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
function createFoldersStructure(projectPath) {
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
function initWithTemplate(template, projectPath, templatePath) {
    fs.cpSync(templatePath, projectPath, { recursive: true });
    console.log(`Initialized with "${template}" template.`);
}

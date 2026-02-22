import gulp from 'gulp';
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
        console.log(`Your entered template "${template}" is wrong, defaulting to "empty"`);
        template = 'empty';
    }

    const response = await prompts([
        {
            type: 'text',
            name: 'projectName',
            message: 'Enter the project name:',
            validate: value => value.length > 0 ? true : 'Project name is required'
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
    ]);

    // Handle cancellation
    if (Object.keys(response).length === 0) {
        console.log('Project initialization cancelled.');
        return;
    }

    // Removed dead `createConfig` — it was destructured but never defined in prompts
    const { projectName, projectDescription, createReadme, createGitignore } = response;

    console.log('Initializing project...');
    console.log(`\nCreating project: ${projectName}`);

    const projectDir = projectName;
    const projectPath = path.resolve(process.cwd(), projectDir);

    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
        console.log(`Created project directory: ${projectDir}`);
    }

    initWithTemplate(template, projectPath);
    createFoldersStructure(projectDir);
    createDefaultConfig(projectDir);

    if (createReadme) {
        const readmeContent = `# ${projectName}\n\n${projectDescription}\n\n## Getting Started\n\nRun \`npm install\` to install dependencies.`;
        fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent, 'utf8');
        console.log('Created README.md');
    }

    if (createGitignore) {
        const gitignoreContent = `node_modules/\ndist/\n.DS_Store\n.env\n`;
        fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent, 'utf8');
        console.log('Created .gitignore');
    }

    console.log('\n✅ Project initialized successfully!');
};

/**
 * Create the default config.yaml.
 */
function createDefaultConfig(projectDir) {
    const config = {
        languages: [
            { code: 'en', name: 'English' }
        ],
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
        bundles: [
            '404.html',
            '50x.html'
        ]
    };

    const yamlContent = yaml.dump(config);
    fs.writeFileSync(path.join(projectDir, 'config.yaml'), yamlContent, 'utf8');
    console.log('Created config.yaml');
}

/**
 * Creates the default folder structure for the project.
 */
function createFoldersStructure(projectDir) {
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
        const fullPath = path.join(projectDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${fullPath}`);
        }
    });
}

function initWithTemplate(template, projectPath) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const TEMPLATE_DIR = path.resolve(__dirname, '../../templates');
    const templatePath = path.join(TEMPLATE_DIR, template);

    fs.cpSync(templatePath, projectPath, { recursive: true });
    console.log(`Initialized project with "${template}" template.`);
}

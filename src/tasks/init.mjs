import gulp from 'gulp';
import fs from 'fs';
import yaml from 'js-yaml';
import { createInterface } from 'readline';

export const initProject = async () => {
    // Initialize the project
    console.log('Initializing project...');
    // You can use the readline module to prompt the user for input
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // Prompt the user for the project name
    rl.question('Enter the project name: ', (projectName) => {
        console.log(`Project name: ${projectName}`);
        rl.close();
    });
    // You can also use the readline module to prompt the user for other inputs
    // For example, you might want to ask for the project description
    rl.question('Enter the project description: ', (projectDescription) => {
        console.log(`Project description: ${projectDescription}`);
        rl.close();
    });
    // Add your initialization logic here
    // For example, you might want to create a default directory structure
    // below we create the default directory structure
    const defaultDirs = [
        'src',
        'src/assets',
        'src/scss',
        'src/js',
        'src/img',
        'src/fonts',
        'dist'
    ];
    defaultDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
    // You can also create a default config file or other necessary files
    const defaultConfig = {
        name: 'My Project',
        version: '1.0.0',
        description: 'A sample project',
    };
    // Write the default config to 'config.yaml'
    const yamlContent = yaml.dump(defaultConfig);
    fs.writeFileSync('config.yaml', yamlContent, 'utf8');
    console.log('Created default config file: config.yaml');
    // You can also create a default README file
    const readmeContent = `# ${defaultConfig.name}\n\n${defaultConfig.description}\n\n## Getting Started\n\nTo get started, run \`npm install\` to install the necessary dependencies.`;
    fs.writeFileSync('README.md', readmeContent, 'utf8');
    console.log('Created default README file: README.md');
    // You can also create a default .gitignore file
    const gitignoreContent = `node_modules/\ndist/\n.DS_Store\n.env\n`;
    fs.writeFileSync('.gitignore', gitignoreContent, 'utf8');
    console.log('Created default .gitignore file: .gitignore');
}
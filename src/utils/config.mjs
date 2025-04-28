import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import fs from 'fs';
import minimist from 'minimist';

// BrowserSync instance
import browserSync from 'browser-sync';
export const browserSyncInstance = browserSync.create();

// Shared configuration constants
export const PATHS = {
    templates: 'src/templates/*.html',
    data: 'src/data',
    assets: {
        scss: 'src/assets/scss/**/*.scss',
        css: 'src/assets/css/**/*.css',
        js: 'src/assets/js/**/*.js',
        img: 'src/assets/img/**/*',
        other: [
            'src/assets/**/*',
            '!src/assets/scss/**',
            '!src/assets/css/**/*.css',
            '!src/assets/js/**/*.js',
            '!src/assets/img/**/*'
        ]
    },
    dist: 'dist'
};

// CLI args
const args = minimist(process.argv.slice(2));
export const isProd = args.prod || false;
console.log(`Running in ${isProd ? 'production' : 'development'} mode`);
export const config = loadConfig();
export const languages = config.languages.map(lang => lang.code);

export function loadConfig() {
    // Load and validate config
    let config;
    try {
        if (fs.existsSync('./config.yaml')) {
            config = yaml.load(readFileSync('./config.yaml', 'utf8'));
            if (!config.languages) 
                throw new Error('Invalid config.yaml: Missing "languages"');
            if (!config.dataSources) 
                throw new Error('Invalid config.yaml: Missing "datsSources"');
        } else {
            console.log('config.yaml does not exist');
        }
    } catch (e) {
        console.error('Error loading config.yaml:', e.message);
        process.exit(1);
    }

    return config;
}
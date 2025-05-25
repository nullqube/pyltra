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

class ConfigLoader {
    constructor() {
        this.config = null;
        this.isProd = false;

        // Parse args and set mode
        const args = minimist(process.argv.slice(2));
        this.isProd = args.prod || false;
        console.log(`Running in ${this.isProd ? 'production' : 'development'} mode`);
    }

    loadConfig() {
        if (this.config) return this.config;

        try {
            if (fs.existsSync('./config.yaml')) {
                const fileContents = readFileSync('./config.yaml', 'utf8');
                const config = yaml.load(fileContents);

                // Validate required fields
                if (!config.languages) {
                    throw new Error('Missing "languages" field in config.yaml');
                }
                if (!config.dataSources) {
                    throw new Error('Missing "dataSources" field in config.yaml');
                }

                this.config = config;
                return config;
            } else {
                throw new Error('config.yaml does not exist');
            }
        } catch (e) {
            console.error('Error loading config.yaml:', e.message);
            process.exit(1);
        }
    }

    getConfig() {
        return this.config;
    }

    getLanguages() {
        return this.config.languages.map(lang => lang.code);
    }

    getIsProd() {
        return this.isProd;
    }
}

// Export methods that lazily initialize config
export const getConfigLoader = (() => {
    let instance = null;
    return () => {
        if (!instance) {
            instance = new ConfigLoader();
            instance.loadConfig();
        }
        return instance;
    };
})();

// Optional: export lazy getters for config values
export const IsProd = () => getConfigLoader().getIsProd();
export const Config = () => getConfigLoader().getConfig();
export const Languages = () => getConfigLoader().getLanguages();

import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import fs from 'fs';
import browserSync from 'browser-sync';

// BrowserSync instance
export const browserSyncInstance = browserSync.create();

// Shared configuration constants
const _PATHS = {
    templates: 'src/templates/*.html',
    data: 'src/data',
    assets: {
        scss: 'src/assets/scss/**/*.scss',
        css:  'src/assets/css/**/*.css',
        js:   'src/assets/js/**/*.js',
        img:  'src/assets/img/**/*',
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

export const PATHS = _PATHS;

class ConfigLoader {
    constructor() {
        this.config = null;
        // isProd is now set explicitly via setIsProd() rather than read from argv
        // at module load time, which races with Commander's arg parsing in cli.mjs
        this._isProd = false;
    }

    setIsProd(value) {
        this._isProd = !!value;
        console.log(`Running in ${this._isProd ? 'production' : 'development'} mode`);
    }

    loadConfig() {
        if (this.config) return this.config;
        try {
            if (!fs.existsSync('./config.yaml')) {
                throw new Error('config.yaml does not exist');
            }
            const fileContents = readFileSync('./config.yaml', 'utf8');
            const config = yaml.load(fileContents);

            if (!config.languages) {
                throw new Error('Missing "languages" field in config.yaml');
            }
            if (!config.pages) {
                throw new Error('Missing "pages" field in config.yaml');
            }

            this.config = config;
            return config;
        } catch (e) {
            console.error('Error loading config.yaml:', e.message);
            throw new Error(`Error loading config.yaml: ${e.message}`);
        }
    }

    getConfig() {
        return this.config;
    }

    getLanguages() {
        return this.config.languages.map(lang => lang.code);
    }

    getIsProd() {
        return this._isProd;
    }
}

// Singleton
export const getConfigLoader = (() => {
    let instance = null;
    return () => {
        if (!instance) {
            instance = new ConfigLoader();
        }
        return instance;
    };
})();

// Call this once from cli.mjs after Commander has parsed args,
// before build/serve are invoked
export const setIsProd = (value) => getConfigLoader().setIsProd(value);

// Lazy config loader — will throw if config.yaml is missing (expected during `init`)
export const loadConfig = () => getConfigLoader().loadConfig();

export const IsProd    = () => getConfigLoader().getIsProd();
export const Config    = () => getConfigLoader().getConfig();
export const Languages = () => getConfigLoader().getLanguages();

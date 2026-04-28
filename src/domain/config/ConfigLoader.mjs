// 
// ConfigLoader
// ------------
import fs, { readFileSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// helpers (keep outside)
import { CONFIG_DEFAULTS } from './defaults.mjs';
import { validateConfig, mergeWithDefaults, buildPaths } from './helpers.js';

export class ConfigLoader {
    constructor({ cwd = process.cwd() } = {}) {
        this.cwd = cwd;

        /** @type {SiteConfig|null} */
        this._config = null;
        /** @type {PathsConfig|null} */
        this._paths = null;
        /** @type {boolean} */
        this._isProd = false;
    }

    /** @param {boolean} value */
    setIsProd(value) {
        this._isProd = !!value;
    }

    /** @returns {boolean} */
    getIsProd() {
        return this._isProd;
    }

    /**
     * Load + validate + merge + build paths
     * Cached after first call
     * @returns {SiteConfig}
     */
    load() {
        if (this._config) return this._config;

        const configPath = path.join(this.cwd, 'config.yaml');

        if (!fs.existsSync(configPath)) {
            throw new Error(
                'config.yaml not found in the current directory.\n' +
                'Run "pyltra init" to scaffold a new project first.'
            );
        }

        let raw;
        try {
            raw = yaml.load(readFileSync(configPath, 'utf8'));
        } catch (e) {
            throw new Error(`Failed to parse config.yaml: ${e.message}`);
        }

        // restore old behavior
        // validateConfig(raw);

        // correct merge
        this._config = mergeWithDefaults(CONFIG_DEFAULTS, raw);

        // derived paths (respects overrides)
        this._paths = buildPaths(this._config);

        return this._config;
    }

    /** @returns {SiteConfig} */
    getConfig() {
        if (!this._config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this._config;
    }

    /** @returns {PathsConfig} */
    getPaths() {
        if (!this._paths) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this._paths;
    }

    /** @returns {string[]} */
    getLanguages() {
        return this._config.languages.map(l => l.code);
    }
}
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import fs from 'fs';
import browserSync from 'browser-sync';

// ---------------------------------------------------------------------------
// BrowserSync
// ---------------------------------------------------------------------------
export const browserSyncInstance = browserSync.create();

// ---------------------------------------------------------------------------
// JSDoc Types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LanguageConfig
 * @property {string} code - Language code e.g. 'en'
 * @property {string} name - Display name e.g. 'English'
 */

/**
 * @typedef {Object} PageConfig
 * @property {string} [file] - Data file pattern e.g. '${lang}.index.yaml'
 * @property {Object} [fallback] - Fallback data if file is missing
 */

/**
 * @typedef {Object} CollectionItemConfig
 * @property {string} slug
 * @property {string} file
 * @property {Object} [fallback]
 */

/**
 * @typedef {Object} CollectionConfig
 * @property {string} template
 * @property {string} item_template
 * @property {string} dataFile
 * @property {CollectionItemConfig[]} items
 */

/**
 * @typedef {Object} AssetsPathsConfig
 * @property {string} scss
 * @property {string} css
 * @property {string} js
 * @property {string} img
 * @property {string[]} other
 */

/**
 * @typedef {Object} PathsConfig
 * @property {string} src
 * @property {string} dist
 * @property {string} data
 * @property {string} templates
 * @property {AssetsPathsConfig} assets
 */

/**
 * @typedef {Object} SiteConfig
 * @property {LanguageConfig[]} languages
 * @property {Object.<string, PageConfig>} pages
 * @property {Object.<string, CollectionConfig>} collections
 * @property {string[]} bundles
 * @property {Partial<PathsConfig>} [paths]
 */

// ---------------------------------------------------------------------------
// Defaults — merged with user config so consumers never need || {}
// ---------------------------------------------------------------------------

/** @type {SiteConfig} */
const CONFIG_DEFAULTS = {
    languages:   [],
    pages:       {},
    collections: {},
    bundles:     [],
    paths:       {}
};

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/**
 * Validates the raw loaded config and throws with all errors listed at once.
 * @param {unknown} config
 * @returns {void}
 */
function validateConfig(config) {
    const errors = [];

    if (!config || typeof config !== 'object') {
        throw new Error('config.yaml must be a YAML object, got: ' + typeof config);
    }

    // languages
    if (!Array.isArray(config.languages) || config.languages.length === 0) {
        errors.push('"languages" must be a non-empty array');
    } else {
        config.languages.forEach((lang, i) => {
            if (!lang.code || typeof lang.code !== 'string')
                errors.push(`languages[${i}] is missing a valid "code" string`);
            if (!lang.name || typeof lang.name !== 'string')
                errors.push(`languages[${i}] is missing a valid "name" string`);
        });
    }

    // pages
    if (!config.pages || typeof config.pages !== 'object' || Array.isArray(config.pages)) {
        errors.push('"pages" must be an object');
    }

    // collections (optional)
    if (config.collections !== undefined) {
        if (typeof config.collections !== 'object' || Array.isArray(config.collections)) {
            errors.push('"collections" must be an object if defined');
        } else {
            Object.entries(config.collections).forEach(([name, col]) => {
                if (!col.template)
                    errors.push(`collections.${name} is missing "template"`);
                if (!col.item_template)
                    errors.push(`collections.${name} is missing "item_template"`);
                if (!col.dataFile)
                    errors.push(`collections.${name} is missing "dataFile"`);
                if (!Array.isArray(col.items)) {
                    errors.push(`collections.${name} "items" must be an array`);
                } else {
                    col.items.forEach((item, i) => {
                        if (!item.slug) errors.push(`collections.${name}.items[${i}] is missing "slug"`);
                        if (!item.file) errors.push(`collections.${name}.items[${i}] is missing "file"`);
                    });
                }
            });
        }
    }

    // bundles (optional)
    if (config.bundles !== undefined && !Array.isArray(config.bundles)) {
        errors.push('"bundles" must be an array if defined');
    }

    // paths (optional)
    if (config.paths !== undefined &&
        (typeof config.paths !== 'object' || Array.isArray(config.paths))) {
        errors.push('"paths" must be an object if defined');
    }

    if (errors.length > 0) {
        throw new Error(
            `config.yaml has ${errors.length} error(s):\n` +
            errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
        );
    }
}

// ---------------------------------------------------------------------------
// Merge & build paths
// ---------------------------------------------------------------------------

/**
 * Deep merges defaults with user config. User values always win.
 * @param {SiteConfig} defaults
 * @param {SiteConfig} userConfig
 * @returns {SiteConfig}
 */
function mergeWithDefaults(defaults, userConfig) {
    return {
        ...defaults,
        ...userConfig,
        paths:       { ...defaults.paths,       ...(userConfig.paths       || {}) },
        collections: { ...defaults.collections, ...(userConfig.collections || {}) }
    };
}

/**
 * Derives PATHS from the merged config so users can override
 * src, dist, data, or templates in config.yaml.
 * @param {SiteConfig} config
 * @returns {PathsConfig}
 */
function buildPaths(config) {
    const overrides = config.paths || {};
    const src  = overrides.src  || 'src';
    const dist = overrides.dist || 'dist';
    const data = overrides.data || `${src}/data`;

    return {
        src,
        dist,
        data,
        templates: overrides.templates || `${src}/templates/*.html`,
        assets: {
            scss:  `${src}/assets/scss/**/*.scss`,
            css:   `${src}/assets/css/**/*.css`,
            js:    `${src}/assets/js/**/*.js`,
            img:   `${src}/assets/img/**/*`,
            other: [
                `${src}/assets/**/*`,
                `!${src}/assets/scss/**`,
                `!${src}/assets/css/**/*.css`,
                `!${src}/assets/js/**/*.js`,
                `!${src}/assets/img/**/*`
            ],
            // Allow full per-key asset override if needed
            ...(overrides.assets || {})
        }
    };
}

// ---------------------------------------------------------------------------
// ConfigLoader
// ---------------------------------------------------------------------------

class ConfigLoader {
    constructor() {
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
        console.log(`Running in ${this._isProd ? 'production' : 'development'} mode`);
    }

    /**
     * Loads, validates, and merges config.yaml.
     * Safe to call multiple times — returns cached result after first load.
     * @returns {SiteConfig}
     */
    loadConfig() {
        if (this._config) return this._config;

        if (!fs.existsSync('./config.yaml')) {
            throw new Error(
                'config.yaml not found in the current directory.\n' +
                'Run "pyltra init" to scaffold a new project first.'
            );
        }

        let raw;
        try {
            raw = yaml.load(readFileSync('./config.yaml', 'utf8'));
        } catch (e) {
            throw new Error(`Failed to parse config.yaml: ${e.message}`);
        }

        // Throws listing ALL validation errors at once — no more silent surprises
        validateConfig(raw);

        // Merge with defaults — consumers can trust collections/bundles are always present
        this._config = mergeWithDefaults(CONFIG_DEFAULTS, raw);

        // Build PATHS derived from config so overrides in config.yaml are respected
        this._paths = buildPaths(this._config);

        return this._config;
    }

    /** @returns {SiteConfig} */
    getConfig() {
        if (!this._config) throw new Error('Config not loaded. Call loadConfig() first.');
        return this._config;
    }

    /** @returns {PathsConfig} */
    getPaths() {
        if (!this._paths) throw new Error('Config not loaded. Call loadConfig() first.');
        return this._paths;
    }

    /** @returns {string[]} */
    getLanguages() {
        return this.getConfig().languages.map(lang => lang.code);
    }

    /** @returns {boolean} */
    getIsProd() {
        return this._isProd;
    }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const getConfigLoader = (() => {
    let instance = null;
    return () => {
        if (!instance) instance = new ConfigLoader();
        return instance;
    };
})();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Call once from cli.mjs after Commander has parsed args */
export const setIsProd  = (value) => getConfigLoader().setIsProd(value);

/** Call once before build/serve. Safe to skip during `init` */
export const loadConfig = () => getConfigLoader().loadConfig();

/** @returns {boolean} */
export const IsProd     = () => getConfigLoader().getIsProd();

/** @returns {SiteConfig} */
export const Config     = () => getConfigLoader().getConfig();

/** @returns {string[]} */
export const Languages  = () => getConfigLoader().getLanguages();

/**
 * PATHS is now a function derived from config at load time.
 * Always reflects any path overrides defined in config.yaml.
 * 
 * NOTE: All consumers (html.mjs, scss.mjs, assets.mjs, serve.mjs, data.mjs)
 * must update their import from:
 *   import { PATHS } from '../utils/config.mjs'
 * to call it as a function:
 *   PATHS().dist  PATHS().templates  PATHS().data  etc.
 * 
 * @returns {PathsConfig}
 */
export const PATHS = () => getConfigLoader().getPaths();

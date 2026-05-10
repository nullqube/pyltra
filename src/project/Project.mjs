import path from 'path';

import { DataLoader } from '../data/DataLoader.mjs';
import { ConfigLoader } from '../domain/config/ConfigLoader.mjs';

const DEVELOPMENT_MODE = 'development';
const PRODUCTION_MODE = 'production';

const MODE_ALIASES = new Map([
    ['dev', DEVELOPMENT_MODE],
    ['development', DEVELOPMENT_MODE],
    ['prod', PRODUCTION_MODE],
    ['production', PRODUCTION_MODE]
]);

function normalizeMode(mode) {
    const normalized = MODE_ALIASES.get(String(mode || '').toLowerCase());

    if (!normalized) {
        throw new Error(
            `Invalid project mode "${mode}". Expected "development" or "production".`
        );
    }

    return normalized;
}

function clonePlainValue(value) {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
}

function joinProjectPath(root, projectPath) {
    if (!projectPath) return root;
    return path.isAbsolute(projectPath)
        ? projectPath
        : path.join(root, projectPath);
}

/**
 * Project
 * -------
 * Structured runtime state for a Pyltra project.
 *
 * Project owns loaded configuration, derived paths, root metadata, and lifecycle
 * state. Work such as rendering, building, serving, watching, content discovery,
 * and broad validation belongs to systems or adapters that receive a Project.
 */
export class Project {
    /**
     * @param {Object} options
     * @param {string} [options.cwd]
     * @param {string} [options.root]
     * @param {'development'|'production'|'dev'|'prod'} [options.mode]
     * @param {ConfigLoader} [options.configLoader]
     */
    constructor(options = {}) {
        const root = options.root || options.cwd || process.cwd();
        const mode = normalizeMode(options.mode || DEVELOPMENT_MODE);

        this.root = path.resolve(root);
        this.cwd = this.root;
        this.mode = mode;
        this.isProd = mode === PRODUCTION_MODE;

        this.configLoader = options.configLoader || new ConfigLoader({
            cwd: this.root,
            isProd: this.isProd
        });

        /** @type {SiteConfig|null} */
        this.config = null;

        /** @type {PathsConfig|null} */
        this.paths = null;

        /** @type {DataLoader|null} */
        this.data = null;

        this._loaded = false;
        this._metadata = null;
    }

    /**
     * Loads project configuration and derives runtime paths.
     * Idempotent after the first successful load.
     *
     * @returns {Promise<Project>}
     */
    async load() {
        if (this._loaded) return this;

        if (typeof this.configLoader.setIsProd === 'function') {
            this.configLoader.setIsProd(this.isProd);
        }

        this.config = this.configLoader.load();
        this.paths = this.configLoader.getPaths();
        this.data = new DataLoader(this);
        this._metadata = this._buildMetadata();
        this._loaded = true;

        return this;
    }

    /**
     * @returns {boolean}
     */
    isLoaded() {
        return this._loaded;
    }

    /**
     * @returns {boolean}
     */
    getIsProd() {
        return this.isProd;
    }

    /**
     * @returns {'development'|'production'}
     */
    getMode() {
        return this.mode;
    }

    /**
     * @returns {string}
     */
    getRoot() {
        return this.root;
    }

    /**
     * Returns a defensive copy of the loaded config.
     *
     * @returns {SiteConfig}
     */
    getConfig() {
        this._assertLoaded();
        return clonePlainValue(this.config);
    }

    /**
     * Returns a defensive copy of derived project paths.
     *
     * @returns {PathsConfig}
     */
    getPaths() {
        this._assertLoaded();
        return clonePlainValue(this.paths);
    }

    /**
     * Returns an absolute path for a standard derived path key.
     *
     * @param {'src'|'dist'|'data'} key
     * @returns {string}
     */
    getPath(key) {
        this._assertLoaded();

        if (!Object.hasOwn(this.paths, key)) {
            throw new Error(`Unknown project path "${key}".`);
        }

        return joinProjectPath(this.root, this.paths[key]);
    }

    /**
     * @returns {string}
     */
    getSourcePath() {
        return this.getPath('src');
    }

    /**
     * @returns {string}
     */
    getDataPath() {
        return this.getPath('data');
    }

    /**
     * @returns {string}
     */
    getDistPath() {
        return this.getPath('dist');
    }

    /**
     * @returns {string[]}
     */
    getLanguages() {
        this._assertLoaded();
        return this.config.languages.map(language => language.code);
    }

    /**
     * Returns the Project-owned data loader.
     *
     * @returns {DataLoader}
     */
    getData() {
        this._assertLoaded();
        return this.data;
    }

    /**
     * Alias with a more explicit v2 name.
     *
     * @returns {DataLoader}
     */
    getDataLoader() {
        return this.getData();
    }

    /**
     * @returns {Object}
     */
    getMetadata() {
        this._assertLoaded();
        return clonePlainValue(this._metadata);
    }

    /**
     * Minimal runtime snapshot for inspection and future adapters/graph hydration.
     *
     * @returns {Object}
     */
    toJSON() {
        this._assertLoaded();

        return {
            root: this.root,
            cwd: this.cwd,
            mode: this.mode,
            isProd: this.isProd,
            metadata: this.getMetadata(),
            paths: this.getPaths(),
            config: this.getConfig()
        };
    }

    _assertLoaded() {
        if (!this._loaded) {
            throw new Error('Project not loaded. Call project.load() first.');
        }
    }

    _buildMetadata() {
        const site = this.config.site || {};

        return {
            root: this.root,
            mode: this.mode,
            isProd: this.isProd,
            title: site.title || 'Pyltra Site',
            languageCodes: this.config.languages.map(language => language.code)
        };
    }
}

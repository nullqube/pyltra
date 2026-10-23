import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import { CONFIG_DEFAULTS } from './defaults.ts';
import { validateConfig, mergeWithDefaults, buildPaths } from './helpers.ts';

import { RuntimeAware } from '../../core/runtime/RuntimeAware.ts';
import type { SiteConfig, PathsConfig } from './types.ts';
import type { Runtime } from '../../core/runtime/Runtime.ts';

export interface ConfigLoaderOptions {
    runtime?: Runtime;
    cwd?: string;
    configFile?: string;
    isProd?: boolean;
    validate?: boolean;
}

function clonePlainValue<T>(value: T): T {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
}

function assertPlainObject(value: unknown, label: string) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be a YAML object.`);
    }
}

/**
 * ConfigLoader
 * ------------
 * Loads config.yaml, validates the user-facing shape, applies defaults, and
 * derives normalized project paths. It owns config loading only; runtime work
 * belongs to Project, systems, and data/rendering classes.
 */
export class ConfigLoader extends RuntimeAware {
  _config: SiteConfig | null;
  _paths: PathsConfig | null;
  _rawConfig: unknown;
  configFile: string;
  configPath: string;
  cwd: string;
  validate: boolean;
    /**
     * @param {Object} options
     * @param {string} [options.cwd]
     * @param {string} [options.configFile]
     * @param {boolean} [options.isProd]
     * @param {boolean} [options.validate]
     */
    constructor(options: ConfigLoaderOptions = {}) {
        super({ runtime: options.runtime });
        
        const {
            cwd = process.cwd(),
            configFile = 'config.yaml',
            validate = true
        } = options;

        this.cwd = path.resolve(cwd);
        this.configFile = configFile;
        this.configPath = path.isAbsolute(configFile)
            ? configFile
            : path.join(this.cwd, configFile);
        this.validate = validate;

        /** @type {SiteConfig|null} */
        this._config = null;

        /** @type {PathsConfig|null} */
        this._paths = null;


        /** @type {unknown|null} */
        this._rawConfig = null;
    }

    /**
     * Loads, validates, merges, and normalizes project configuration.
     * Cached after the first successful call.
     *
     * @returns {SiteConfig}
     */
    load() {
        if (this._config) return this._config;

        if (!fs.existsSync(this.configPath)) {
            throw new Error(
                `${this.configFile} not found in ${this.cwd}.\n` +
                'Run "pyltra init" to scaffold a new project first.'
            );
        }

        let raw;
        try {
            raw = yaml.load(fs.readFileSync(this.configPath, 'utf8'));
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to parse ${this.configFile}: ${message}`);
        }

        assertPlainObject(raw, this.configFile);

        if (this.validate) {
            validateConfig(raw);
        }

        this._rawConfig = clonePlainValue(raw);
        this._config = this._normalizeConfig(mergeWithDefaults(CONFIG_DEFAULTS, raw));
        this._paths = buildPaths(this._config);

        return this._config;
    }

    /**
     * Backward-compatible alias for old modular callers.
     *
     * @returns {SiteConfig}
     */
    loadConfig() {
        return this.load();
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

    /** @returns {unknown} */
    getRawConfig() {
        if (!this._rawConfig) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return clonePlainValue(this._rawConfig);
    }

    /** @returns {string[]} */
    getLanguages() {
        return this.getConfig().languages.map(language => language.code);
    }

    /**
     * @returns {string}
     */
    getConfigPath() {
        return this.configPath;
    }

    _normalizeConfig(config: SiteConfig): SiteConfig {
        return {
            ...config,
            site: config.site || CONFIG_DEFAULTS.site || {},
            languages: Array.isArray(config.languages) ? config.languages : [],
            pages: config.pages || {},
            collections: config.collections || {},
            bundles: Array.isArray(config.bundles) ? config.bundles : [],
            paths: config.paths || {}
        };
    }
}

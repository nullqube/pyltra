import path from 'path';

import { DataLoader } from '../data/DataLoader.mjs';
import { ConfigLoader } from '../domain/config/ConfigLoader.mjs';
import { ProjectPaths } from './ProjectPaths.mjs';

function clonePlainValue(value) {
    if (value === null || value === undefined) return value;
    return structuredClone(value);
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
     * @param {Object} [options.config]
     * @param {Object} [options.data]
     * @param {Object} [options.paths]
     */
    constructor(options = {}) {
        const root = options.root || options.cwd || process.cwd();
        this.root = path.resolve(root);
        this.cwd = this.root;

        if( options.config == null ) {
            throw new Error('Project requires a config object or configLoader instance.');
        }
        if( options.data == null ) {
            throw new Error('Project requires a data instance to derive from.');
        }
        if( options.paths == null ) {
            throw new Error('Project requires a paths object.');
        }
        
        /** @type {SiteConfig|null} */
        this.config = options.config;

        /** @type {PathsConfig|null} */
        this.paths = new ProjectPaths({
            root: this.root,
            paths: options.paths
        });

        /** @type {DataLoader|null} */
        this.data = options.data;

        this._metadata = this._buildMetadata();
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
        return clonePlainValue(this.config);
    }

    /**
     * Returns a defensive copy of derived project paths.
     *
     * @returns {PathsConfig}
     */
    getPaths() {
        return this.paths;
    }

    /**
     * Returns an absolute path for a standard derived path key.
     *
     * @param {'src'|'dist'|'data'} key
     * @returns {string}
     */
    getPath(key) {
        // if (!Object.hasOwn(this.paths, key)) {
        //     throw new Error(`Unknown project path "${key}".`);
        // }

        return this.paths.resolve(key);
    }

    /**
     * @returns {string}
     */
    getSourcePath() {
        return this.paths.getSourcePath();
    }

    /**
     * @returns {string}
     */
    getDataPath() {
        return this.paths.getDataPath();
    }

    /**
     * @returns {string}
     */
    getDistPath() {
        return this.paths.getDistPath();
    }

    /**
     * @returns {string[]}
     */
    getLanguages() {
        return this.config.languages.map(language => language.code);
    }

    /**
     * Returns the Project-owned data loader.
     *
     * @returns {DataLoader}
     */
    getData() {
        // TODO: maybe immutable later using structuredClone 
        // or a library like immer if we want to allow nested 
        // mutation in some places but not others.
        // For now, we can rely on convention and documentation 
        // to prevent accidental mutation of the data object 
        // returned by getData().

        return this.data;
    }

    /**
     * @returns {Object}
     */
    getMetadata() {
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
            metadata: this.getMetadata(),
            paths: this.getPaths(),
            config: this.getConfig()
        };
    }

    _buildMetadata() {
        const site = this.config.site || {};

        return {
            root: this.root,
            title: site.title || 'Pyltra Site',
            languageCodes: this.config.languages.map(language => language.code)
        };
    }
}
